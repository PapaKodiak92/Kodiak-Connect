import { kodiakPlatform } from './currentPlatform';
import { invokeTauri } from './tauri/tauriCore';


export async function getStartMinimizedSetting(): Promise<boolean> {
  if (kodiakPlatform.info.runtime !== 'tauri-desktop') {
    return false;
  }

  return Boolean(await invokeTauri<boolean>('get_start_minimized'));
}

export async function setStartMinimizedSetting(enabled: boolean): Promise<boolean> {
  if (kodiakPlatform.info.runtime !== 'tauri-desktop') {
    return false;
  }

  return Boolean(await invokeTauri<boolean>('set_start_minimized', { enabled }));
}