import { useEffect, useState } from 'react';
import {
  dismissKodiakMicrophonePermissionPrompt,
  readKodiakMicrophonePermission,
  requestKodiakMicrophonePermission,
  type KodiakMicrophonePermissionState,
} from './callPermissions';

export function KodiakCallPermissionPrompt() {
  const [permissionState, setPermissionState] = useState<KodiakMicrophonePermissionState>(() => readKodiakMicrophonePermission());
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    setPermissionState(readKodiakMicrophonePermission());
  }, []);

  if (permissionState.status !== 'unknown') {
    return null;
  }

  async function handleEnableMicrophone() {
    setIsRequesting(true);

    try {
      setPermissionState(await requestKodiakMicrophonePermission());
    } finally {
      setIsRequesting(false);
    }
  }

  function handleLater() {
    dismissKodiakMicrophonePermissionPrompt();
    setPermissionState(readKodiakMicrophonePermission());
  }

  return (
    <div className="kodiak-call-permission-backdrop" role="presentation">
      <section className="kodiak-call-permission-card" role="dialog" aria-modal="true" aria-labelledby="call-permission-title">
        <p className="eyebrow eyebrow--ember">Voice Calls</p>
        <h2 id="call-permission-title">Enable your microphone?</h2>
        <p>
          Kodiak Connect needs microphone access for voice calls. You can skip this now, but calls will not connect until microphone access is allowed.
        </p>

        {permissionState.message ? <p className="kodiak-call-permission-card__status">{permissionState.message}</p> : null}

        <div className="kodiak-call-permission-card__actions">
          <button type="button" onClick={handleLater} disabled={isRequesting}>
            Later
          </button>
          <button type="button" onClick={() => void handleEnableMicrophone()} disabled={isRequesting}>
            {isRequesting ? 'Checking...' : 'Enable Microphone'}
          </button>
        </div>
      </section>
    </div>
  );
}
