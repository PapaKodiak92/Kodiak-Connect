import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KodiakStatusCard } from '../../components/ui/KodiakStatusCard';
import { updateManifest } from './updateManifest';
import {
  checkForDesktopUpdate,
  installDesktopUpdate,
  type DesktopUpdateInfo,
  type DesktopUpdaterStatus,
} from '../../platform/desktop/desktopUpdaterService';

function formatUpdaterStatus(status: DesktopUpdaterStatus, updateInfo: DesktopUpdateInfo | null) {
  if (status === 'checking') {
    return 'Checking secure release channel...';
  }

  if (status === 'available' && updateInfo) {
    return `Update ready: ${updateInfo.currentVersion} → ${updateInfo.version}`;
  }

  if (status === 'not-available') {
    return 'Kodiak Connect is up to date.';
  }

  if (status === 'installing') {
    return 'Preparing trusted update...';
  }

  if (status === 'installed') {
    return 'Update installed. Restart to enter the newest build.';
  }

  if (status === 'error') {
    return 'Update check failed.';
  }

  return 'Ready to check for secure desktop updates.';
}

function getStatusTone(status: DesktopUpdaterStatus) {
  if (status === 'available') {
    return 'available';
  }

  if (status === 'checking' || status === 'installing') {
    return 'working';
  }

  if (status === 'error') {
    return 'error';
  }

  return 'ready';
}

export function UpdaterPanel() {
  const [status, setStatus] = useState<DesktopUpdaterStatus>('checking');
  const [updateInfo, setUpdateInfo] = useState<DesktopUpdateInfo | null>(null);
  const [progressText, setProgressText] = useState('Auto-checking on startup...');
  const hasAutoChecked = useRef(false);

  const checkForUpdate = useCallback(async (source: 'auto' | 'manual') => {
    setStatus('checking');
    setProgressText(source === 'auto' ? 'Auto-checking on startup...' : 'Contacting update server...');

    try {
      const update = await checkForDesktopUpdate();
      setUpdateInfo(update);
      setStatus(update ? 'available' : 'not-available');
      setProgressText(update ? 'A signed desktop update is ready to install.' : 'Latest desktop release is already installed.');
    } catch (error) {
      console.error('[Kodiak Connect] Updater check failed', error);
      setStatus('error');
      setProgressText('Could not reach or verify the update channel. Manual retry is available.');
    }
  }, []);

  useEffect(() => {
    if (hasAutoChecked.current) {
      return;
    }

    hasAutoChecked.current = true;
    void checkForUpdate('auto');
  }, [checkForUpdate]);

  async function handleInstallUpdate() {
    setStatus('installing');
    setProgressText('Starting secure download...');

    try {
      await installDesktopUpdate((progress) => {
        if (progress.event === 'Started') {
          setProgressText('Download started. Keep Kodiak Connect open.');
        }

        if (progress.event === 'Progress' && progress.totalBytes) {
          const percent = Math.round((progress.downloadedBytes / progress.totalBytes) * 100);
          setProgressText(`Downloading signed update... ${percent}%`);
        }

        if (progress.event === 'Finished') {
          setProgressText('Download verified. Handing off to the system installer...');
        }
      });

      setStatus('installed');
      setProgressText('Restart Kodiak Connect after the installer completes.');
    } catch (error) {
      console.error('[Kodiak Connect] Update install failed', error);
      setStatus('error');
      setProgressText('The update could not be installed. Try again or download the installer manually.');
    }
  }

  const tone = useMemo(() => getStatusTone(status), [status]);

  return (
    <KodiakStatusCard
      eyebrow="Official release channel"
      title="Kodiak updater"
      description="Signed desktop releases for Windows and Linux. Built to keep the app current before chat features ship."
      statusText={formatUpdaterStatus(status, updateInfo)}
      detailText={progressText}
      badgeText={`v${updateManifest.currentVersion}`}
      tone={tone}
    >
      <div className="button-row">
        <button type="button" onClick={() => void checkForUpdate('manual')} disabled={status === 'checking' || status === 'installing'}>
          Check again
        </button>
        <button type="button" className="button-primary" onClick={handleInstallUpdate} disabled={status !== 'available'}>
          Download & install
        </button>
      </div>
    </KodiakStatusCard>
  );
}
