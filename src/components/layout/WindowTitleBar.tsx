import { closeWindow, minimizeWindow, toggleMaximizeWindow } from '../../platform/desktop/windowControls';
import type { PlatformKind } from '../../platform/usePlatformInfo';

interface WindowTitleBarProps {
  platformKind: PlatformKind;
}

export function WindowTitleBar({ platformKind }: WindowTitleBarProps) {
  if (platformKind !== 'desktop') {
    return null;
  }

  return (
    <header className="window-titlebar" data-tauri-drag-region>
      <div className="window-titlebar__brand" data-tauri-drag-region>
        <img src="/kodiak-connect-icon.png" alt="" data-tauri-drag-region />
        <span data-tauri-drag-region>Kodiak Connect</span>
      </div>

      <div className="window-titlebar__controls">
        <button type="button" aria-label="Minimize window" onClick={() => void minimizeWindow()}>
          −
        </button>
        <button type="button" aria-label="Maximize window" onClick={() => void toggleMaximizeWindow()}>
          □
        </button>
        <button type="button" className="window-titlebar__close" aria-label="Close window" onClick={() => void closeWindow()}>
          ×
        </button>
      </div>
    </header>
  );
}
