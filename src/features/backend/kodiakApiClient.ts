import type { MatrixLoginIdentity } from '../auth/matrixLoginService';

export type KodiakPresenceState = 'online' | 'idle' | 'offline';

interface KodiakPresenceUser {
  avatarUrl?: string;
  displayName?: string;
  lastSeenAt?: number;
  presence: KodiakPresenceState;
  userId: string;
}

interface KodiakPresenceUsersResponse {
  users?: Record<string, KodiakPresenceUser>;
}

const KODIAK_API_BASE_URL =
  (import.meta.env.VITE_KODIAK_API_BASE_URL as string | undefined)?.trim() || 'http://localhost:8787';

function getHeaders(identity: MatrixLoginIdentity) {
  return {
    'Content-Type': 'application/json',
    'X-Kodiak-User-Id': identity.userId,
  };
}

export async function sendKodiakPresenceHeartbeat(
  identity: MatrixLoginIdentity,
  displayName: string,
  avatarUrl?: string | null,
) {
  await fetch(`${KODIAK_API_BASE_URL}/api/presence/heartbeat`, {
    method: 'POST',
    headers: getHeaders(identity),
    body: JSON.stringify({
      avatarUrl: avatarUrl ?? '',
      displayName,
      status: 'online',
      userId: identity.userId,
    }),
  });
}

export async function loadKodiakPresence(identity: MatrixLoginIdentity, userIds: string[]) {
  const uniqueUserIds = [...new Set(userIds)].filter(Boolean);

  if (!uniqueUserIds.length) {
    return {};
  }

  const response = await fetch(
    `${KODIAK_API_BASE_URL}/api/presence/users?ids=${encodeURIComponent(uniqueUserIds.join(','))}`,
    {
      headers: getHeaders(identity),
    },
  );

  if (!response.ok) {
    throw new Error('Kodiak presence request failed.');
  }

  const data = (await response.json()) as KodiakPresenceUsersResponse;

  return Object.fromEntries(
    Object.entries(data.users ?? {}).map(([userId, user]) => [userId, user.presence ?? 'offline']),
  ) as Record<string, KodiakPresenceState>;
}
