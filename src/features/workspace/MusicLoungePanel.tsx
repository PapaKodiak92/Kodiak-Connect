import { useEffect, useState } from 'react';
import type { MatrixLoginIdentity } from '../auth/matrixLoginService';

interface MusicLoungePanelProps {
  identity: MatrixLoginIdentity;
}

const MUSIC_VIBES = [
  {
    title: 'Random Hits',
    subtitle: 'A little bit of everything.',
    description: 'The default room vibe when nobody knows what to play.',
    spotifyUrl: 'https://open.spotify.com/search/top%20hits',
  },
  {
    title: 'Dev Focus',
    subtitle: 'Low-distraction background energy.',
    description: 'For coding, patching, shipping, and late-night debugging.',
    spotifyUrl: 'https://open.spotify.com/search/focus%20coding',
  },
  {
    title: 'Throwbacks',
    subtitle: 'Old favorites and memory-lane tracks.',
    description: 'For when the server needs nostalgia instead of chaos.',
    spotifyUrl: 'https://open.spotify.com/search/throwback%20hits',
  },
  {
    title: 'Rock',
    subtitle: 'Guitars, drums, and momentum.',
    description: 'For lock-in mode, queue crushing, and build nights.',
    spotifyUrl: 'https://open.spotify.com/search/rock%20hits',
  },
  {
    title: 'Rap',
    subtitle: 'Bars, beats, and energy.',
    description: 'For higher-energy dev sessions and community hangouts.',
    spotifyUrl: 'https://open.spotify.com/search/rap%20hits',
  },
  {
    title: 'Country',
    subtitle: 'Relaxed, familiar, and easygoing.',
    description: 'For winding down and keeping the room human.',
    spotifyUrl: 'https://open.spotify.com/search/country%20hits',
  },
  {
    title: 'Chill',
    subtitle: 'Calm, smooth, and steady.',
    description: 'For low-stress background listening while people chat.',
    spotifyUrl: 'https://open.spotify.com/search/chill%20hits',
  },
];

function getDisplayName(userId: string) {
  const withoutPrefix = userId.startsWith('@') ? userId.slice(1) : userId;
  return withoutPrefix.split(':')[0] || userId;
}

function getRotatingVibeIndex() {
  const thirtyMinutes = 30 * 60 * 1000;
  return Math.floor(Date.now() / thirtyMinutes) % MUSIC_VIBES.length;
}

export function MusicLoungePanel({ identity }: MusicLoungePanelProps) {
  const [activeVibeIndex, setActiveVibeIndex] = useState(getRotatingVibeIndex);
  const [localVote, setLocalVote] = useState<'up' | 'down' | null>(null);
  const activeVibe = MUSIC_VIBES[activeVibeIndex];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveVibeIndex(getRotatingVibeIndex());
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="music-lounge-panel">
      <section className="music-lounge-hero">
        <div>
          <p className="eyebrow eyebrow--ember">Kodiak Music Lounge</p>
          <h2>Set the room vibe.</h2>
          <p>
            A dedicated place to chill, work, build, and listen together. Spotify playback opens on each user&apos;s own
            account/device so the community can share the vibe without rebroadcasting audio.
          </p>
        </div>

        <div className="music-lounge-now">
          <span>Now rotating</span>
          <strong>{activeVibe.title}</strong>
          <small>{activeVibe.subtitle}</small>
        </div>
      </section>

      <section className="music-lounge-current" aria-label="Current music vibe">
        <div>
          <span className="music-lounge-orb" aria-hidden="true">♪</span>
          <div>
            <p className="eyebrow">Current vibe</p>
            <h3>{activeVibe.title}</h3>
            <p>{activeVibe.description}</p>
          </div>
        </div>

        <div className="music-lounge-actions">
          <a href={activeVibe.spotifyUrl} target="_blank" rel="noreferrer">
            Open in Spotify
          </a>
          <button
            type="button"
            className={localVote === 'up' ? 'music-lounge-vote music-lounge-vote--active' : 'music-lounge-vote'}
            onClick={() => setLocalVote(localVote === 'up' ? null : 'up')}
          >
            👍 Like vibe
          </button>
          <button
            type="button"
            className={localVote === 'down' ? 'music-lounge-vote music-lounge-vote--active' : 'music-lounge-vote'}
            onClick={() => setLocalVote(localVote === 'down' ? null : 'down')}
          >
            👎 Not it
          </button>
        </div>
      </section>

      <section className="music-lounge-grid" aria-label="Music vibe options">
        {MUSIC_VIBES.map((vibe, index) => (
          <button
            key={vibe.title}
            type="button"
            className={index === activeVibeIndex ? 'music-lounge-card music-lounge-card--active' : 'music-lounge-card'}
            onClick={() => {
              setActiveVibeIndex(index);
              setLocalVote(null);
            }}
          >
            <span>{index === activeVibeIndex ? 'Playing vibe' : 'Queue vibe'}</span>
            <strong>{vibe.title}</strong>
            <small>{vibe.subtitle}</small>
            <p>{vibe.description}</p>
          </button>
        ))}
      </section>

      <footer className="music-lounge-footer">
        <span>Tuned in as {getDisplayName(identity.userId)}</span>
        <span>Spotify account linking and synced listening come next.</span>
      </footer>
    </div>
  );
}
