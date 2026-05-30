export type KodiakPlatformKind = 'web' | 'android' | 'desktop';

export interface KodiakPlatformInfo {
  kind: KodiakPlatformKind;
  isNativeShell: boolean;
}

export function usePlatformInfo(): KodiakPlatformInfo {
  const userAgent = navigator.userAgent.toLowerCase();
  const isAndroid = userAgent.includes('android');
  const isTauri = '__TAURI_INTERNALS__' in window;

  if (isTauri) {
    return { kind: 'desktop', isNativeShell: true };
  }

  if (isAndroid) {
    return { kind: 'android', isNativeShell: true };
  }

  return { kind: 'web', isNativeShell: false };
}
