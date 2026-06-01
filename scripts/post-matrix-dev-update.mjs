#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.MATRIX_BASE_URL || 'https://matrix-v2.kodiak-connect.com';
const roomAlias = process.env.MATRIX_ROOM_ALIAS || '#dev-updates:v2.kodiak-connect.com';
const accessToken = process.env.MATRIX_ACCESS_TOKEN;

function encodePathValue(value) {
  return encodeURIComponent(value);
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('\n', '<br />');
}

async function matrixRequest(pathValue, init = {}) {
  const response = await fetch(`${baseUrl}${pathValue}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.error || `Matrix request failed with status ${response.status}`);
  }

  return data;
}

function getGithubEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;

  if (!eventPath || !fs.existsSync(eventPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  } catch {
    return null;
  }
}

function getReleaseFromGithubEvent() {
  return getGithubEvent()?.release || null;
}

function getManualInput(name) {
  const event = getGithubEvent();
  return event?.inputs?.[name] || null;
}

function resolveChangelogFilePath() {
  const release = getReleaseFromGithubEvent();
  const explicitFile = process.env.CHANGELOG_FILE || getManualInput('changelog_file');
  const releaseTag = release?.tag_name;

  if (explicitFile) {
    return explicitFile;
  }

  if (releaseTag) {
    return `docs/changelogs/${releaseTag}.md`;
  }

  return null;
}

function readChangelogFile() {
  const filePath = resolveChangelogFilePath();

  if (!filePath) {
    return null;
  }

  const absolutePath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  return fs.readFileSync(absolutePath, 'utf8').trim();
}

function getUpdateTitle(fileBody) {
  const release = getReleaseFromGithubEvent();
  const manualTitle = process.env.DEV_UPDATE_TITLE || getManualInput('title');
  const markdownHeading = fileBody?.match(/^#\s+(.+)$/m)?.[1];

  return (
    manualTitle ||
    markdownHeading ||
    release?.name ||
    release?.tag_name ||
    'Kodiak Connect Dev Update'
  );
}

function stripDuplicateHeading(title, body) {
  const firstHeadingPattern = /^#\s+(.+)\n+/;
  const match = body.match(firstHeadingPattern);

  if (!match) {
    return body;
  }

  if (match[1].trim() === title.trim()) {
    return body.replace(firstHeadingPattern, '').trim();
  }

  return body;
}

function getUpdateBody(title) {
  const fileBody = readChangelogFile();
  const manualBody = process.env.DEV_UPDATE_BODY || getManualInput('changelog');
  const release = getReleaseFromGithubEvent();
  const body = fileBody || manualBody || release?.body || 'No changelog body provided.';

  return stripDuplicateHeading(title, body.trim());
}

async function main() {
  if (!accessToken) {
    throw new Error('Missing MATRIX_ACCESS_TOKEN.');
  }

  const fileBody = readChangelogFile();
  const title = getUpdateTitle(fileBody).trim();
  const body = getUpdateBody(title).trim();

  if (!title || !body) {
    throw new Error('Update title and body are required.');
  }

  const message = `${title}\n\n${body}`;
  const formattedMessage = `<strong>${escapeHtml(title)}</strong><br /><br />${escapeHtml(body)}`;

  console.log(`Joining ${roomAlias}...`);

  const join = await matrixRequest(`/_matrix/client/v3/join/${encodePathValue(roomAlias)}`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  const txnId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  console.log('Publishing dev update...');

  await matrixRequest(
    `/_matrix/client/v3/rooms/${encodePathValue(join.room_id)}/send/m.room.message/${encodePathValue(txnId)}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        msgtype: 'm.text',
        body: message,
        format: 'org.matrix.custom.html',
        formatted_body: formattedMessage,
      }),
    },
  );

  console.log(`Published to ${roomAlias}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
