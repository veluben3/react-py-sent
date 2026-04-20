import type { Post } from '../types';
import type { ViewKey } from '../App';
import { TopBar } from './TopBar';

interface DashboardProps {
  posts: Post[];
  loading: boolean;
  onNavigate: (view: ViewKey) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function Dashboard({ posts, loading, onNavigate }: DashboardProps) {
  const totalPosts = posts.length;
  const totalWords = posts.reduce((sum, p) => sum + (p.word_count ?? 0), 0);
  const avgWords = totalPosts > 0 ? Math.round(totalWords / totalPosts) : 0;
  const recent = posts.slice(0, 5);

  return (
    <>
      <TopBar
        title="Dashboard"
        subtitle="Overview of posts processed through the AI pipeline."
        actions={
          <button
            type="button"
            className="btn primary"
            onClick={() => onNavigate('new-post')}
          >
            + New Post
          </button>
        }
      />

      <section className="stats">
        <div className="stat-card">
          <div className="stat-label">Total posts</div>
          <div className="stat-value">{totalPosts}</div>
          <div className="stat-hint">All submissions stored in Postgres</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Words generated</div>
          <div className="stat-value">{totalWords}</div>
          <div className="stat-hint">Across all converted replies</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg. words / post</div>
          <div className="stat-value">{avgWords}</div>
          <div className="stat-hint">Capped at 250 by the backend</div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Recent posts</h2>
          <button
            type="button"
            className="btn ghost"
            onClick={() => onNavigate('posts')}
          >
            View all
          </button>
        </div>

        {loading ? (
          <div className="empty">Loading…</div>
        ) : recent.length === 0 ? (
          <div className="empty">
            No posts yet. Create your first post to see it here.
          </div>
        ) : (
          <ul className="recent-list">
            {recent.map((p) => (
              <li key={p.id} className="recent-item">
                <div className="recent-main">
                  <div className="recent-title">{p.title}</div>
                  <div className="recent-meta">
                    #{p.id} · {formatDate(p.created_at)} · {p.word_count} words
                  </div>
                </div>
                <div className="recent-preview">
                  {p.converted_content.slice(0, 140)}
                  {p.converted_content.length > 140 ? '…' : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
