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

function getChannelEmptyState(channel: WorkspaceChannel) {
  if (channel.id === 'general') {
    return {
      title: 'Welcome to Kodiak Connect.',
      body: 'This is the first Official Space shell. Real Matrix room sync, message history, sending, and moderation hooks come next.',
      showPillGrid: true,
    };
  }

  if (channel.id === 'announcements') {
    return {
      title: 'No announcements yet.',
      body: 'Official launch notes, product updates, and platform notices will appear here.',
      showPillGrid: false,
    };
  }

  if (channel.id === 'dev-updates') {
    return {
      title: 'Development updates will live here.',
      body: 'This channel will track build progress, release notes, and roadmap checkpoints.',
      showPillGrid: false,
    };
  }

  if (channel.id === 'safety-center') {
    return {
      title: 'Safety Center is being prepared.',
      body: 'Reports, safety guidance, family protection, business moderation, and Trust & Safety resources will be organized here.',
      showPillGrid: true,
    };
  }

  return {
    title: `#${channel.name} is not connected yet.`,
    body: 'This channel exists in the app shell, but Matrix room sync has not been wired yet.',
    showPillGrid: false,
  };
}

export function ChatPlaceholder({ activeChannel, activeSpace, identity }: ChatPlaceholderProps) {
  const displayName = getDisplayName(identity.userId);
  const emptyState = getChannelEmptyState(activeChannel);

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
        <article className={`welcome-message ${activeChannel.id === 'general' ? '' : 'welcome-message--compact'}`}>
          <div className="brand-orb">
            <img src="/kodiak-connect-icon.png" alt="" />
          </div>

          <div>
            <h2>{emptyState.title}</h2>
            <p>{emptyState.body}</p>
          </div>
        </article>

        {emptyState.showPillGrid ? (
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
        ) : null}
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
