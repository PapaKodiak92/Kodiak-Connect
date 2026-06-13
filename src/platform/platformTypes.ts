export type KodiakPlatformKind = 'web' | 'android' | 'desktop';

export type KodiakDesktopOs = 'windows' | 'linux' | 'macos' | 'unknown';

export type KodiakRuntime = 'browser' | 'capacitor-android' | 'tauri-desktop';

export interface KodiakPlatformInfo {
  kind: KodiakPlatformKind;
  runtime: KodiakRuntime;
  isNativeShell: boolean;
  desktopOs?: KodiakDesktopOs;
}
