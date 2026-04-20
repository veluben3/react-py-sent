import { Fragment, useMemo, useState } from 'react';
import type { Post } from '../types';
import { deletePost } from '../api';
import { TopBar } from './TopBar';

interface PostsListProps {
  posts: Post[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onDeleted: (id: number) => void;
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
}: PostsListProps) {
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
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

  const handleDelete = async (id: number) => {
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
        subtitle="Posts stored in PostgreSQL. The converted column shows the AI-transformed version."
        actions={
          <button type="button" className="btn ghost" onClick={onRefresh}>
            ⟳ Refresh
          </button>
        }
      />

      <section className="card">
        <div className="card-header">
          <h2>{filtered.length} post{filtered.length === 1 ? '' : 's'}</h2>
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
                {filtered.map((p) => {
                  const expanded = expandedId === p.id;
                  return (
                    <Fragment key={p.id}>
                      <tr className={expanded ? 'row-open' : undefined}>
                        <td className="mono">{p.id}</td>
                        <td>
                          <button
                            type="button"
                            className="link"
                            onClick={() =>
                              setExpandedId(expanded ? null : p.id)
                            }
                          >
                            {p.title}
                          </button>
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
                            onClick={() => handleDelete(p.id)}
                          >
                            {deletingId === p.id ? '…' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="row-detail">
                          <td colSpan={6}>
                            <div className="detail-grid">
                              <div>
                                <div className="detail-label">
                                  Original content
                                </div>
                                <div className="detail-text">
                                  {p.original_content}
                                </div>
                              </div>
                              <div>
                                <div className="detail-label">
                                  Converted content
                                </div>
                                <div className="detail-text converted">
                                  {p.converted_content}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
