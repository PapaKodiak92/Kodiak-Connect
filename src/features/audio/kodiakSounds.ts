export type KodiakSoundName =
  | 'messageSent'
  | 'messageReceived'
  | 'notify'
  | 'ringingSendCall'
  | 'ringingReceiveCall';

const SOUND_PATHS: Record<KodiakSoundName, string[]> = {
  messageSent: ['/sounds/message_sent.wav', '/sounds/message_sent.mp3'],
  messageReceived: ['/sounds/message_received.wav', '/sounds/message_received.mp3'],
  notify: ['/sounds/notify.wav', '/sounds/notify.mp3'],
  ringingSendCall: ['/sounds/ringing_send_call.wav', '/sounds/ringing_send_call.mp3'],
  ringingReceiveCall: ['/sounds/ringing_receive_call.wav', '/sounds/ringing_receive_call.mp3'],
};

const SOUND_COOLDOWNS_MS: Partial<Record<KodiakSoundName, number>> = {
  messageReceived: 1400,
  notify: 2400,
  messageSent: 180,
};

type KodiakAudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

const lastPlayedAtBySound = new Map<KodiakSoundName, number>();
const htmlAudioPool = new Map<string, HTMLAudioElement>();
const activeSoundStops = new Map<KodiakSoundName, Set<() => void>>();
const decodedAudioBuffers = new Map<string, AudioBuffer>();

let sharedAudioContext: AudioContext | null = null;

function registerActiveSoundStop(soundName: KodiakSoundName, stop: () => void) {
  const stops = activeSoundStops.get(soundName) ?? new Set<() => void>();
  stops.add(stop);
  activeSoundStops.set(soundName, stops);

  return () => {
    stops.delete(stop);

    if (stops.size === 0) {
      activeSoundStops.delete(soundName);
    }
  };
}

export function stopKodiakSound(soundName: KodiakSoundName) {
  const stops = activeSoundStops.get(soundName);

  if (!stops) {
    return;
  }

  for (const stop of [...stops]) {
    try {
      stop();
    } catch {
      // Already stopped.
    }
  }

  activeSoundStops.delete(soundName);
}

export function stopKodiakCallSounds() {
  stopKodiakSound('ringingSendCall');
  stopKodiakSound('ringingReceiveCall');
}

function getAudioContext() {
  if (sharedAudioContext) {
    return sharedAudioContext;
  }

  const AudioContextConstructor =
    window.AudioContext ?? (window as KodiakAudioWindow).webkitAudioContext;

  if (!AudioContextConstructor) {
    return null;
  }

  sharedAudioContext = new AudioContextConstructor();
  return sharedAudioContext;
}

async function resumeAudioContext(audioContext: AudioContext) {
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
}

async function getDecodedAudioBuffer(path: string) {
  const cachedBuffer = decodedAudioBuffers.get(path);

  if (cachedBuffer) {
    return cachedBuffer;
  }

  const audioContext = getAudioContext();

  if (!audioContext) {
    throw new Error('WebAudio is not available.');
  }

  await resumeAudioContext(audioContext);

  const response = await fetch(path, {
    cache: 'force-cache',
  });

  if (!response.ok) {
    throw new Error(`Sound asset failed to load: ${path} (${response.status})`);
  }

  const audioData = await response.arrayBuffer();
  const decodedBuffer = await audioContext.decodeAudioData(audioData.slice(0));

  decodedAudioBuffers.set(path, decodedBuffer);
  return decodedBuffer;
}

async function playWebAudioPath(soundName: KodiakSoundName, path: string, volume: number) {
  const audioContext = getAudioContext();

  if (!audioContext) {
    return false;
  }

  await resumeAudioContext(audioContext);

  const decodedBuffer = await getDecodedAudioBuffer(path);
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();

  gain.gain.value = Math.min(Math.max(volume, 0), 1);
  source.buffer = decodedBuffer;
  source.connect(gain);
  gain.connect(audioContext.destination);
  source.start();

  let removeStop: (() => void) | null = null;
  const stopPlayback = () => {
    try {
      source.stop();
    } catch {
      // Already stopped.
    }

    try {
      source.disconnect();
      gain.disconnect();
      removeStop?.();
      removeStop = null;
    } catch {
      // Already disconnected.
    }

    removeStop?.();
    removeStop = null;
  };

  removeStop = registerActiveSoundStop(soundName, stopPlayback);

  window.setTimeout(() => {
    try {
      source.disconnect();
      gain.disconnect();
    } catch {
      // Already disconnected.
    }
  }, Math.ceil(decodedBuffer.duration * 1000) + 250);

  return true;
}

function getHtmlAudio(path: string) {
  const existingAudio = htmlAudioPool.get(path);

  if (existingAudio) {
    return existingAudio;
  }

  const audio = new Audio(path);
  audio.preload = 'auto';
  htmlAudioPool.set(path, audio);
  return audio;
}

async function playHtmlAudioPath(soundName: KodiakSoundName, path: string, volume: number) {
  const audio = getHtmlAudio(path);
  audio.pause();
  audio.currentTime = 0;
  audio.volume = Math.min(Math.max(volume, 0), 1);

  let removeStop: (() => void) | null = null;
  const stopPlayback = () => {
    audio.pause();
    audio.currentTime = 0;
    removeStop?.();
    removeStop = null;
  };

  removeStop = registerActiveSoundStop(soundName, stopPlayback);

  audio.addEventListener(
    'ended',
    () => {
      removeStop?.();
      removeStop = null;
    },
    { once: true },
  );

  await audio.play();
  return true;
}

export function unlockKodiakSounds() {
  const audioContext = getAudioContext();

  if (audioContext) {
    void resumeAudioContext(audioContext).catch((error) => {
      console.warn('[Kodiak Connect] audio context unlock failed', error);
    });
  }

  for (const paths of Object.values(SOUND_PATHS)) {
    for (const path of paths) {
      try {
        getHtmlAudio(path).load();
      } catch (error) {
        console.warn('[Kodiak Connect] sound preload failed', path, error);
      }

      void getDecodedAudioBuffer(path).catch(() => {
        // Decode failures are handled again during playback with the next source fallback.
      });
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

  const paths = SOUND_PATHS[soundName];

  for (const path of paths) {
    try {
      const played = await playWebAudioPath(soundName, path, volume);

      if (played) {
        return true;
      }
    } catch (error) {
      console.warn('[Kodiak Connect] WebAudio sound failed; trying next path', path, error);
    }
  }

  for (const path of paths) {
    try {
      await playHtmlAudioPath(soundName, path, volume);
      return true;
    } catch (error) {
      console.warn('[Kodiak Connect] HTML audio sound failed; trying next path', path, error);
    }
  }

  console.warn('[Kodiak Connect] all sound playback routes failed', soundName, paths);
  return false;
}
