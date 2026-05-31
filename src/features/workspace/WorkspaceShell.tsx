import type { MatrixLoginIdentity } from '../auth/matrixLoginService';

interface WorkspaceShellProps {
  identity: MatrixLoginIdentity;
  onLogout: () => void;
}

function getDisplayName(userId: string) {
  const withoutPrefix = userId.startsWith('@') ? userId.slice(1) : userId;
  return withoutPrefix.split(':')[0] || userId;
}

export function WorkspaceShell({ identity, onLogout }: WorkspaceShellProps) {
  const displayName = getDisplayName(identity.userId);

  return (
    <main className="workspace-shell">
      <section className="workspace-card" aria-label="Kodiak Connect workspace">
        <div className="workspace-card__header">
          <div className="brand-orb">
            <img src="/kodiak-connect-icon.png" alt="" />
          </div>

          <div>
            <p className="eyebrow eyebrow--ember">Kodiak Connect</p>
            <h1>Workspace ready.</h1>
            <p className="lede">Signed in as {displayName}. Chat, rooms, and direct messages come next.</p>
          </div>
        </div>

        <div className="workspace-card__grid">
          <div className="workspace-status-panel">
            <span className="status-light status-light--online" aria-hidden="true" />
            <div>
              <strong>Matrix staging online</strong>
              <p>{identity.serverName}</p>
            </div>
          </div>

          <div className="workspace-status-panel">
            <span className="status-light status-light--online" aria-hidden="true" />
            <div>
              <strong>Signed in</strong>
              <p>{identity.userId}</p>
            </div>
          </div>

          <div className="workspace-status-panel workspace-status-panel--muted">
            <span className="status-light status-light--offline" aria-hidden="true" />
            <div>
              <strong>Chat shell pending</strong>
              <p>Next milestone: session handling, logout cleanup, then room sync.</p>
            </div>
          </div>
        </div>

        <div className="workspace-card__actions">
          <button type="button" className="button-primary" disabled>
            Open Chat Soon
          </button>

          <button type="button" onClick={onLogout}>
            Log Out
          </button>
        </div>
      </section>
    </main>
  );
}
