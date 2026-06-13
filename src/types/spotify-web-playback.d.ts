export {};

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify: typeof Spotify;
  }

  namespace Spotify {
    interface Error {
      message: string;
    }

    interface ReadyEvent {
      device_id: string;
    }

    interface PlaybackState {
      paused: boolean;
      position: number;
      duration: number;
      track_window: {
        current_track: {
          album: {
            images: Array<{ height: number; url: string; width: number }>;
            name: string;
          };
          artists: Array<{ name: string; uri: string }>;
          duration_ms: number;
          id: string;
          name: string;
          uri: string;
        };
      };
    }

    interface PlayerInit {
      getOAuthToken: (callback: (accessToken: string) => void) => void;
      name: string;
      volume?: number;
    }

    class Player {
      constructor(options: PlayerInit);
      addListener(event: 'ready' | 'not_ready', callback: (event: ReadyEvent) => void): boolean;
      addListener(event: 'player_state_changed', callback: (state: PlaybackState | null) => void): boolean;
      addListener(
        event: 'initialization_error' | 'authentication_error' | 'account_error' | 'playback_error',
        callback: (error: Error) => void,
      ): boolean;
      connect(): Promise<boolean>;
      disconnect(): void;
      togglePlay(): Promise<void>;
    }
  }
}
