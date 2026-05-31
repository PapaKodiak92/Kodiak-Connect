export interface AndroidUpdateManifest {
  version: string;
  notes: string;
  url: string;
  pub_date: string;
}

const ANDROID_UPDATE_MANIFEST_URL = 'https://updates.kodiak-connect.com/android/latest.json';

export async function getAndroidUpdateManifest(): Promise<AndroidUpdateManifest> {
  const response = await fetch(ANDROID_UPDATE_MANIFEST_URL, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Android update manifest request failed: ${response.status}`);
  }

  return (await response.json()) as AndroidUpdateManifest;
}

export function openAndroidApkDownload(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}
