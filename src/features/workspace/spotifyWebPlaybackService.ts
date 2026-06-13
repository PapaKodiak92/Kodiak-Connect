import type { MatrixLoginIdentity } from '../auth/matrixLoginService';
import { loadKodiakSpotifyPlaybackToken } from '../backend/kodiakApiClient';

type SpotifyPlayer = Spotify.Player;
type SpotifyPlaybackState = Spotify.PlaybackState;

interface KodiakSpotifyPlaybackCallbacks {
  onDeviceReady?: (deviceId: string) => void;
  onDeviceOffline?: () => void;
  onError?: (message: string) => void;
  onPlaybackState?: (state: SpotifyPlaybackState | null) => void;
}

export interface KodiakSpotifyPlaybackSession {
  deviceId: string;
  player: SpotifyPlayer;
}

let spotifySdkPromise: Promise<void> | null = null;

export function getSpotifyTrackUriFromUrl(value: string | undefined) {
  const rawValue = String(value ?? '').trim();

  if (!rawValue) {
    return '';
  }

  if (/^spotify:track:[a-zA-Z0-9]+$/.test(rawValue)) {
    return rawValue;
  }

  try {
    const url = new URL(rawValue);
    const parts = url.pathname.split('/').filter(Boolean);
    const trackIndex = parts.indexOf('track');
    const trackId = trackIndex >= 0 ? parts[trackIndex + 1] : '';

    if (url.hostname.includes('spotify.com') && trackId && /^[a-zA-Z0-9]+$/.test(trackId)) {
      return `spotify:track:${trackId}`;
    }
  } catch {
    return '';
  }

  return '';
}

export function isSpotifyTrackUrl(value: string | undefined) {
  return Boolean(getSpotifyTrackUriFromUrl(value));
}

function loadSpotifySdk() {
  if (window.Spotify?.Player) {
    return Promise.resolve();
  }

  if (spotifySdkPromise) {
    return spotifySdkPromise;
  }

  spotifySdkPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-kodiak-spotify-sdk="true"]');

    window.onSpotifyWebPlaybackSDKReady = () => {
      resolve();
    };

    if (existingScript) {
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.dataset.kodiakSpotifySdk = 'true';
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.onerror = () => reject(new Error('Spotify Web Playback SDK failed to load.'));

    document.head.appendChild(script);
  });

  return spotifySdkPromise;
}

async function getPlaybackAccessToken(identity: MatrixLoginIdentity) {
  const token = await loadKodiakSpotifyPlaybackToken(identity);
  return token.accessToken;
}

export async function createKodiakSpotifyPlaybackSession(
  identity: MatrixLoginIdentity,
  callbacks: KodiakSpotifyPlaybackCallbacks = {},
): Promise<KodiakSpotifyPlaybackSession> {
  await loadSpotifySdk();

  return await new Promise<KodiakSpotifyPlaybackSession>((resolve, reject) => {
    let resolved = false;

    const player = new window.Spotify.Player({
      getOAuthToken: async (callback) => {
        try {
          callback(await getPlaybackAccessToken(identity));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Could not load Spotify playback token.';
          callbacks.onError?.(message);
        }
      },
      name: 'Kodiak Connect Lounge',
      volume: 0.65,
    });

    player.addListener('ready', ({ device_id }) => {
      callbacks.onDeviceReady?.(device_id);

      if (!resolved) {
        resolved = true;
        resolve({
          deviceId: device_id,
          player,
        });
      }
    });

    player.addListener('not_ready', () => {
      callbacks.onDeviceOffline?.();
    });

    player.addListener('player_state_changed', (state) => {
      callbacks.onPlaybackState?.(state);
    });

    player.addListener('initialization_error', ({ message }) => {
      callbacks.onError?.(message);

      if (!resolved) {
        resolved = true;
        reject(new Error(message));
      }
    });

    player.addListener('authentication_error', ({ message }) => {
      callbacks.onError?.(message);

      if (!resolved) {
        resolved = true;
        reject(new Error(message));
      }
    });

    player.addListener('account_error', ({ message }) => {
      callbacks.onError?.(message);

      if (!resolved) {
        resolved = true;
        reject(new Error(message));
      }
    });

    player.addListener('playback_error', ({ message }) => {
      callbacks.onError?.(message);
    });

    player.connect().then((connected) => {
      if (!connected && !resolved) {
        resolved = true;
        reject(new Error('Spotify player did not connect.'));
      }
    }).catch((error) => {
      if (!resolved) {
        resolved = true;
        reject(error instanceof Error ? error : new Error('Spotify player connection failed.'));
      }
    });
  });
}

export async function startKodiakSpotifyTrack(
  identity: MatrixLoginIdentity,
  deviceId: string,
  spotifyUri: string,
) {
  const accessToken = await getPlaybackAccessToken(identity);
  const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
    body: JSON.stringify({
      uris: [spotifyUri],
    }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    method: 'PUT',
  });

  if (!response.ok && response.status !== 204) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error?.message || 'Spotify playback request failed.');
  }
}
