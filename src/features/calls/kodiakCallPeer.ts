import type { MatrixCallKind } from '../matrix/matrixRestClient';
import type { KodiakVoiceCallPeerOptions } from './kodiakWebRtcCall';
import {
  createPlatformCallPeer,
  shouldUsePlatformNativeCallPeer,
} from '../../platform/calls/platformCallAdapter';

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
  return shouldUsePlatformNativeCallPeer();
}

export function createKodiakCallPeer(options: KodiakVoiceCallPeerOptions): KodiakCallPeer {
  return createPlatformCallPeer(options);
}

export type { MatrixCallKind };
