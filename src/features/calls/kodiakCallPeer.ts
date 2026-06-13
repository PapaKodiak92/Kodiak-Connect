import type { MatrixCallKind } from '../matrix/matrixRestClient';
import {
  isKodiakWebRtcSupported,
  KodiakVoiceCallPeer,
  type KodiakVoiceCallPeerOptions,
} from './kodiakWebRtcCall';
import { kodiakPlatform } from '../../platform/currentPlatform';
import { KodiakNativeLinuxRtcCallPeer } from '../../platform/calls/kodiakNativeLinuxRtcCall';

export interface KodiakCallPeer {
  createOffer(): Promise<string>;
  createAnswer(offerSdp: string): Promise<string>;
  applyAnswer(answerSdp: string): Promise<void>;
  addIceCandidate(candidate: RTCIceCandidateInit): Promise<void>;
  setCameraEnabled(isEnabled: boolean): Promise<string | null>;
  hasCameraEnabled(): boolean;
  setMuted(isMuted: boolean): void;
  close(): void;
}

export function shouldUseKodiakNativeLinuxRtcPeer() {
  return (
    kodiakPlatform.info.runtime === 'tauri-desktop' &&
    kodiakPlatform.info.desktopOs === 'linux' &&
    !isKodiakWebRtcSupported()
  );
}

export function createKodiakCallPeer(options: KodiakVoiceCallPeerOptions): KodiakCallPeer {
  if (options.callKind === 'voice' && shouldUseKodiakNativeLinuxRtcPeer()) {
    return new KodiakNativeLinuxRtcCallPeer(options);
  }

  if (!isKodiakWebRtcSupported()) {
    throw new Error('Kodiak Connect WebRTC is not available in this app runtime.');
  }

  return new KodiakVoiceCallPeer(options);
}

export type { MatrixCallKind };
