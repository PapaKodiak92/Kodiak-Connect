import type { MatrixLoginIdentity } from '../auth/matrixLoginService';
import type { WorkspaceChannel, WorkspaceSpace } from './workspaceTypes';

interface ChatPlaceholderProps {
  activeChannel: WorkspaceChannel;
  activeSpace: WorkspaceSpace;
  identity: MatrixLoginIdentity;
}

function getDisplayName(userId: string) {
  const withoutPrefix = userId.startsWith('@') ? userId.slice(1) : userId;
  return withoutPrefix.split(':')[0] || userId;
}

export function ChatPlaceholder({ activeChannel, activeSpace, identity }: ChatPlaceholderProps) {
  const displayName = getDisplayName(identity.userId);

  return (
    <section className="chat-placeholder" aria-label={`${activeChannel.name} channel`}>
      <header className="chat-placeholder__header">
        <div>
          <p className="eyebrow eyebrow--ember">{activeSpace.name}</p>
          <h1>#{activeChannel.name}</h1>
          <p>{activeChannel.description}</p>
        </div>

        <div className="chat-placeholder__user">
          <span className="status-light status-light--online" aria-hidden="true" />
          <span>{displayName}</span>
        </div>
      </header>

      <div className="chat-placeholder__body">
        <article className="welcome-message">
          <div className="brand-orb">
            <img src="/kodiak-connect-icon.png" alt="" />
          </div>

          <div>
            <h2>Welcome to Kodiak Connect.</h2>
            <p>
              This is the first Official Space shell. Real Matrix room sync, message history, sending,
              and moderation hooks come next.
            </p>
          </div>
        </article>

        <div className="workspace-pill-grid" aria-label="Product pillars">
          <div>
            <strong>Individual</strong>
            <span>Private, secure communication.</span>
          </div>
          <div>
            <strong>Family</strong>
            <span>Parent/guardian tools with clear limits.</span>
          </div>
          <div>
            <strong>Business</strong>
            <span>Owned spaces, channels, roles, and safety.</span>
          </div>
          <div>
            <strong>Trust & Safety</strong>
            <span>Platform-level review. No role gives immunity.</span>
          </div>
        </div>
      </div>

      <footer className="message-composer-placeholder">
        <input type="text" placeholder="Message composer coming soon" disabled />
        <button type="button" disabled>
          Send
        </button>
      </footer>
    </section>
  );
}
