import { isKodiakMicrophoneSecureContext } from './callPermissions';
import type { MatrixCallKind } from '../matrix/matrixRestClient';

export interface KodiakVoiceCallPeerOptions {
  callKind: MatrixCallKind;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceCandidate?: (candidate: RTCIceCandidateInit) => void;
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
}

function getKodiakMediaErrorMessage(error: unknown, callKind: MatrixCallKind) {
  const errorName = error instanceof DOMException ? error.name : '';

  if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
    return callKind === 'video'
      ? 'No usable camera or microphone was found. Check Windows Sound/Input and Camera settings.'
      : 'No usable microphone was found. Check Windows Sound > Input, browser microphone settings, or plug in a mic.';
  }

  if (errorName === 'NotAllowedError') {
    return callKind === 'video'
      ? 'Camera or microphone permission was denied. Enable it in site/app settings to use video calls.'
      : 'Microphone permission was denied. Enable it in site/app settings to use voice calls.';
  }

  return error instanceof Error ? error.message : 'Media access failed.';
}

const KODIAK_RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export class KodiakVoiceCallPeer {
  private readonly peerConnection: RTCPeerConnection;
  private readonly pendingIceCandidates: RTCIceCandidateInit[] = [];
  private localStream: MediaStream | null = null;

  constructor(private readonly options: KodiakVoiceCallPeerOptions) {
    this.peerConnection = new RTCPeerConnection(KODIAK_RTC_CONFIGURATION);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.options.onIceCandidate?.(event.candidate.toJSON());
      }
    };

    this.peerConnection.ontrack = (event) => {
      const [stream] = event.streams;

      if (stream) {
        this.options.onRemoteStream?.(stream);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      this.options.onConnectionStateChange?.(this.peerConnection.connectionState);
    };
  }

  async createOffer() {
    await this.attachLocalMedia();

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: this.options.callKind === 'video',
    });

    await this.peerConnection.setLocalDescription(offer);

    if (!offer.sdp) {
      throw new Error('WebRTC offer did not include SDP.');
    }

    return offer.sdp;
  }

  async createAnswer(offerSdp: string) {
    await this.attachLocalMedia();
    await this.peerConnection.setRemoteDescription({ type: 'offer', sdp: offerSdp });
    await this.flushPendingIceCandidates();

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    if (!answer.sdp) {
      throw new Error('WebRTC answer did not include SDP.');
    }

    return answer.sdp;
  }

  async applyAnswer(answerSdp: string) {
    if (this.peerConnection.signalingState === 'closed') {
      return;
    }

    await this.peerConnection.setRemoteDescription({ type: 'answer', sdp: answerSdp });
    await this.flushPendingIceCandidates();
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (this.peerConnection.signalingState === 'closed') {
      return;
    }

    if (!this.peerConnection.remoteDescription) {
      this.pendingIceCandidates.push(candidate);
      return;
    }

    await this.peerConnection.addIceCandidate(candidate);
  }

  setMuted(isMuted: boolean) {
    for (const track of this.localStream?.getAudioTracks() ?? []) {
      track.enabled = !isMuted;
    }
  }

  close() {
    for (const track of this.localStream?.getTracks() ?? []) {
      track.stop();
    }

    this.localStream = null;
    this.pendingIceCandidates.length = 0;
    this.peerConnection.close();
  }

  private async attachLocalMedia() {
    if (this.localStream) {
      return;
    }

    if (!isKodiakMicrophoneSecureContext()) {
      throw new Error('Media access requires HTTPS, localhost, or the installed Kodiak Connect app.');
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Media access is not available in this browser or app container.');
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
        video:
          this.options.callKind === 'video'
            ? {
                facingMode: 'user',
                height: { ideal: 720 },
                width: { ideal: 1280 },
              }
            : false,
      });
    } catch (error) {
      throw new Error(getKodiakMediaErrorMessage(error, this.options.callKind));
    }

    for (const track of this.localStream.getTracks()) {
      this.peerConnection.addTrack(track, this.localStream);
    }

    this.options.onLocalStream?.(this.localStream);
  }

  private async flushPendingIceCandidates() {
    while (this.pendingIceCandidates.length > 0) {
      const candidate = this.pendingIceCandidates.shift();

      if (candidate) {
        await this.peerConnection.addIceCandidate(candidate);
      }
    }
  }
}
