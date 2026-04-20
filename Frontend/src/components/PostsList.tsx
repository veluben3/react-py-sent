import { useMemo, useState } from 'react';
import type { Post } from '../types';
import { deletePost } from '../api';
import { TopBar } from './TopBar';

interface PostsListProps {
  posts: Post[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onDeleted: (id: number) => void;
  onOpenPost: (id: number) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function PostsList({
  posts,
  loading,
  error,
  onRefresh,
  onDeleted,
  onOpenPost,
}: PostsListProps) {
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.original_content.toLowerCase().includes(q) ||
        p.converted_content.toLowerCase().includes(q),
    );
  }, [posts, query]);

  const handleDelete = async (
    e: React.MouseEvent<HTMLButtonElement>,
    id: number,
  ) => {
    e.stopPropagation();
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await deletePost(id);
      onDeleted(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      window.alert(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <TopBar
        title="All Posts"
        subtitle="Click a post to view its details. The converted column shows the AI-transformed version."
        actions={
          <button type="button" className="btn ghost" onClick={onRefresh}>
            ⟳ Refresh
          </button>
        }
      />

      <section className="card">
        <div className="card-header">
          <h2>
            {filtered.length} post{filtered.length === 1 ? '' : 's'}
          </h2>
          <input
            type="search"
            className="search"
            placeholder="Search by title or content…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {error && (
          <div className="alert error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading ? (
          <div className="empty">Loading posts…</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            {query ? 'No posts match your search.' : 'No posts yet.'}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 56 }}>#</th>
                  <th>Title</th>
                  <th>Converted preview</th>
                  <th style={{ width: 90 }}>Words</th>
                  <th style={{ width: 170 }}>Created</th>
                  <th style={{ width: 110 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="row-clickable"
                    onClick={() => onOpenPost(p.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenPost(p.id);
                      }
                    }}
                  >
                    <td className="mono">{p.id}</td>
                    <td>
                      <span className="row-title">{p.title}</span>
                    </td>
                    <td className="preview-cell">
                      {p.converted_content.slice(0, 120)}
                      {p.converted_content.length > 120 ? '…' : ''}
                    </td>
                    <td>{p.word_count}</td>
                    <td className="muted">{formatDate(p.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn danger small"
                        disabled={deletingId === p.id}
                        onClick={(e) => handleDelete(e, p.id)}
                      >
                        {deletingId === p.id ? '…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
