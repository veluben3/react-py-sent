import { useEffect, useState } from 'react';
import { deletePost, getPost } from '../api';
import type { Post } from '../types';
import { TopBar } from './TopBar';

interface PostDetailProps {
  postId: number;
  initialPost?: Post;
  onBack: () => void;
  onDeleted: (id: number) => void;
}

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; post: Post }
  | { kind: 'error'; message: string };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function PostDetail({
  postId,
  initialPost,
  onBack,
  onDeleted,
}: PostDetailProps) {
  const [state, setState] = useState<State>(
    initialPost ? { kind: 'ready', post: initialPost } : { kind: 'loading' },
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const post = await getPost(postId);
        if (!cancelled) setState({ kind: 'ready', post });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load';
        setState({ kind: 'error', message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const handleDelete = async () => {
    if (state.kind !== 'ready') return;
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await deletePost(state.post.id);
      onDeleted(state.post.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      window.alert(message);
      setDeleting(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  return (
    <>
      <TopBar
        title={state.kind === 'ready' ? state.post.title : 'Post'}
        subtitle={
          state.kind === 'ready'
            ? `#${state.post.id} · created ${formatDate(state.post.created_at)}`
            : undefined
        }
        actions={
          <>
            <button type="button" className="btn ghost" onClick={onBack}>
              ← Back
            </button>
            {state.kind === 'ready' && (
              <button
                type="button"
                className="btn danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </>
        }
      />

      {state.kind === 'loading' && (
        <div className="empty">
          <div className="spinner" /> Loading post…
        </div>
      )}

      {state.kind === 'error' && (
        <div className="alert error">
          <strong>Error:</strong> {state.message}
        </div>
      )}

      {state.kind === 'ready' && (
        <>
          <section className="card">
            <div className="card-header">
              <h2>Metadata</h2>
              <span className="pill success">Saved in PostgreSQL</span>
            </div>
            <div className="meta-grid">
              <div>
                <div className="detail-label">ID</div>
                <div className="mono">#{state.post.id}</div>
              </div>
              <div>
                <div className="detail-label">Title</div>
                <div>{state.post.title}</div>
              </div>
              <div>
                <div className="detail-label">Words (converted)</div>
                <div>{state.post.word_count}</div>
              </div>
              <div>
                <div className="detail-label">Original chars</div>
                <div>{state.post.original_content.length}</div>
              </div>
              <div>
                <div className="detail-label">Created</div>
                <div>{formatDate(state.post.created_at)}</div>
              </div>
            </div>
          </section>

          <section className="grid-2">
            <div className="card">
              <div className="card-header">
                <h2>Original content</h2>
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => handleCopy(state.post.original_content)}
                >
                  Copy
                </button>
              </div>
              <div className="detail-text">{state.post.original_content}</div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Converted content</h2>
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => handleCopy(state.post.converted_content)}
                >
                  Copy
                </button>
              </div>
              <div className="detail-text converted">
                {state.post.converted_content}
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
