export type KodiakSoundName =
  | 'messageSent'
  | 'messageReceived'
  | 'notify'
  | 'ringingSendCall'
  | 'ringingReceiveCall';

interface KodiakSoundSource {
  mp3: string;
  wav: string;
}

const SOUND_PATHS: Record<KodiakSoundName, KodiakSoundSource> = {
  messageSent: {
    mp3: '/sounds/message_sent.mp3',
    wav: '/sounds/message_sent.wav',
  },
  messageReceived: {
    mp3: '/sounds/message_received.mp3',
    wav: '/sounds/message_received.wav',
  },
  notify: {
    mp3: '/sounds/notify.mp3',
    wav: '/sounds/notify.wav',
  },
  ringingSendCall: {
    mp3: '/sounds/ringing_send_call.mp3',
    wav: '/sounds/ringing_send_call.wav',
  },
  ringingReceiveCall: {
    mp3: '/sounds/ringing_receive_call.mp3',
    wav: '/sounds/ringing_receive_call.wav',
  },
};

const SOUND_COOLDOWNS_MS: Partial<Record<KodiakSoundName, number>> = {
  messageReceived: 1400,
  notify: 2400,
  messageSent: 180,
};

const lastPlayedAtBySound = new Map<KodiakSoundName, number>();
const audioPool = new Map<KodiakSoundName, HTMLAudioElement>();

function getBestSoundPath(soundName: KodiakSoundName) {
  const testAudio = document.createElement('audio');
  const paths = SOUND_PATHS[soundName];

  if (testAudio.canPlayType('audio/wav') || testAudio.canPlayType('audio/wave') || testAudio.canPlayType('audio/x-wav')) {
    return paths.wav;
  }

  return paths.mp3;
}

function getAudio(soundName: KodiakSoundName) {
  const existingAudio = audioPool.get(soundName);

  if (existingAudio) {
    return existingAudio;
  }

  const audio = new Audio(getBestSoundPath(soundName));
  audio.preload = 'auto';
  audioPool.set(soundName, audio);
  return audio;
}

export function unlockKodiakSounds() {
  for (const soundName of Object.keys(SOUND_PATHS) as KodiakSoundName[]) {
    try {
      getAudio(soundName).load();
    } catch (error) {
      console.warn('[Kodiak Connect] sound preload failed', soundName, error);
    }
  }
}

export async function playKodiakSound(soundName: KodiakSoundName, volume = 0.65, options?: { force?: boolean }) {
  const now = Date.now();
  const cooldownMs = SOUND_COOLDOWNS_MS[soundName] ?? 0;
  const lastPlayedAt = lastPlayedAtBySound.get(soundName) ?? 0;

  if (!options?.force && cooldownMs && now - lastPlayedAt < cooldownMs) {
    return false;
  }

  lastPlayedAtBySound.set(soundName, now);

  try {
    const audio = getAudio(soundName);
    audio.pause();
    audio.currentTime = 0;
    audio.volume = Math.min(Math.max(volume, 0), 1);

    await audio.play();
    return true;
  } catch (error) {
    console.warn('[Kodiak Connect] sound failed', soundName, error);
    return false;
  }
}
