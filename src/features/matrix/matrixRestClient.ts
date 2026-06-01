import type { MatrixLoginIdentity } from '../auth/matrixLoginService';

export interface MatrixReactionSummary {
  count: number;
  key: string;
  senders: string[];
}

export interface MatrixTextMessage {
  body: string;
  eventId: string;
  originServerTs: number;
  reactions?: MatrixReactionSummary[];
  replyToEventId?: string;
  sender: string;
}

interface MatrixErrorResponse {
  errcode?: string;
  error?: string;
}

interface MatrixResolveAliasResponse {
  room_id: string;
}

interface MatrixJoinRoomResponse {
  room_id: string;
}

interface MatrixMessagesResponse {
  chunk?: MatrixEvent[];
}

interface MatrixEvent {
  content?: {
    body?: string;
    msgtype?: string;
    'm.relates_to'?: MatrixRelation;
  };
  event_id?: string;
  origin_server_ts?: number;
  sender?: string;
  type?: string;
}

interface MatrixRelation {
  event_id?: string;
  key?: string;
  rel_type?: string;
  'm.in_reply_to'?: {
    event_id?: string;
  };
}

export class MatrixRestError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly errcode?: string,
  ) {
    super(message);
    this.name = 'MatrixRestError';
  }
}

function encodePathValue(value: string) {
  return encodeURIComponent(value);
}

async function readMatrixError(response: Response) {
  try {
    return (await response.json()) as MatrixErrorResponse;
  } catch {
    return {};
  }
}

async function matrixRequest<T>(identity: MatrixLoginIdentity, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${identity.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${identity.accessToken}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const matrixError = await readMatrixError(response);
    throw new MatrixRestError(matrixError.error || 'Matrix request failed.', response.status, matrixError.errcode);
  }

  return (await response.json()) as T;
}

function buildReactionSummary(
  reactionsByEventId: Map<string, Map<string, Set<string>>>,
  eventId: string,
): MatrixReactionSummary[] {
  const reactionsForMessage = reactionsByEventId.get(eventId);

  if (!reactionsForMessage) {
    return [];
  }

  return [...reactionsForMessage.entries()]
    .filter(([key]) => key !== '??')
    .map(([key, senders]) => ({
      count: senders.size,
      key,
      senders: [...senders],
    }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export async function resolveRoomAlias(identity: MatrixLoginIdentity, alias: string) {
  const data = await matrixRequest<MatrixResolveAliasResponse>(
    identity,
    `/_matrix/client/v3/directory/room/${encodePathValue(alias)}`,
  );

  return data.room_id;
}

export async function joinRoomByAlias(identity: MatrixLoginIdentity, alias: string) {
  const data = await matrixRequest<MatrixJoinRoomResponse>(
    identity,
    `/_matrix/client/v3/join/${encodePathValue(alias)}`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  );

  return data.room_id;
}

export async function loadRecentMessages(identity: MatrixLoginIdentity, roomId: string, limit = 80) {
  const data = await matrixRequest<MatrixMessagesResponse>(
    identity,
    `/_matrix/client/v3/rooms/${encodePathValue(roomId)}/messages?dir=b&limit=${limit}`,
  );

  const events = data.chunk ?? [];
  const reactionsByEventId = new Map<string, Map<string, Set<string>>>();

  for (const event of events) {
    const relation = event.content?.['m.relates_to'];

    if (
      event.type !== 'm.reaction' ||
      relation?.rel_type !== 'm.annotation' ||
      !relation.event_id ||
      !relation.key ||
      !event.sender
    ) {
      continue;
    }

    const reactionsForMessage = reactionsByEventId.get(relation.event_id) ?? new Map<string, Set<string>>();
    const sendersForReaction = reactionsForMessage.get(relation.key) ?? new Set<string>();

    sendersForReaction.add(event.sender);
    reactionsForMessage.set(relation.key, sendersForReaction);
    reactionsByEventId.set(relation.event_id, reactionsForMessage);
  }

  return events
    .filter((event) => event.type === 'm.room.message' && event.content?.msgtype === 'm.text' && event.content.body && event.event_id)
    .map<MatrixTextMessage>((event) => ({
      body: event.content?.body ?? '',
      eventId: event.event_id ?? '',
      originServerTs: event.origin_server_ts ?? 0,
      reactions: buildReactionSummary(reactionsByEventId, event.event_id ?? ''),
      replyToEventId: event.content?.['m.relates_to']?.['m.in_reply_to']?.event_id,
      sender: event.sender ?? 'unknown',
    }))
    .reverse();
}

export async function sendTextMessage(identity: MatrixLoginIdentity, roomId: string, body: string, replyToEventId?: string) {
  const txnId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  await matrixRequest<{ event_id: string }>(
    identity,
    `/_matrix/client/v3/rooms/${encodePathValue(roomId)}/send/m.room.message/${encodePathValue(txnId)}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        body,
        msgtype: 'm.text',
        ...(replyToEventId
          ? {
              'm.relates_to': {
                'm.in_reply_to': {
                  event_id: replyToEventId,
                },
              },
            }
          : {}),
      }),
    },
  );
}

export async function sendReaction(identity: MatrixLoginIdentity, roomId: string, targetEventId: string, key: string) {
  const txnId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  await matrixRequest<{ event_id: string }>(
    identity,
    `/_matrix/client/v3/rooms/${encodePathValue(roomId)}/send/m.reaction/${encodePathValue(txnId)}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        'm.relates_to': {
          rel_type: 'm.annotation',
          event_id: targetEventId,
          key,
        },
      }),
    },
  );
}
