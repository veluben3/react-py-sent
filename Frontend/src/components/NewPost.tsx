import { useState, type FormEvent } from 'react';
import { createPost } from '../api';
import type { Post } from '../types';
import { TopBar } from './TopBar';

interface NewPostProps {
  onCreated: (post: Post) => void;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'success'; post: Post }
  | { kind: 'error'; message: string };

export function NewPost({ onCreated }: NewPostProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const isSaving = status.kind === 'saving';
  const canSubmit =
    title.trim().length > 0 && content.trim().length > 0 && !isSaving;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setStatus({ kind: 'saving' });
    try {
      const post = await createPost({
        title: title.trim(),
        content: content.trim(),
      });
      setStatus({ kind: 'success', post });
      onCreated(post);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setStatus({ kind: 'error', message });
    }
  };

  const handleReset = () => {
    setTitle('');
    setContent('');
    setStatus({ kind: 'idle' });
  };

  return (
    <>
      <TopBar
        title="New Post"
        subtitle="Write raw content. The backend will convert it with Azure OpenAI and save the result to PostgreSQL."
      />

      <section className="grid-2">
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-header">
            <h2>Compose</h2>
            <span className="pill">{content.length} chars</span>
          </div>

          <div className="field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving}
              placeholder="e.g. Launch announcement draft"
              maxLength={255}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="content">Content</label>
            <textarea
              id="content"
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSaving}
              placeholder="Paste or write the raw content here…"
              required
            />
            <small>
              Saved as-is to the <code>original_content</code> column; the
              AI-converted version is stored in <code>converted_content</code>.
            </small>
          </div>

          <div className="actions">
            <button
              type="submit"
              className="btn primary"
              disabled={!canSubmit}
            >
              {isSaving ? 'Converting & saving…' : 'Save post'}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={handleReset}
              disabled={isSaving}
            >
              Reset
            </button>
          </div>

          {status.kind === 'error' && (
            <div className="alert error">
              <strong>Error:</strong> {status.message}
            </div>
          )}
        </form>

        <div className="card">
          <div className="card-header">
            <h2>Converted output</h2>
            {status.kind === 'success' && (
              <span className="pill success">
                Saved · #{status.post.id}
              </span>
            )}
          </div>

          {status.kind === 'success' ? (
            <>
              <div className="kv-row">
                <span>Title</span>
                <strong>{status.post.title}</strong>
              </div>
              <div className="kv-row">
                <span>Words</span>
                <strong>{status.post.word_count}</strong>
              </div>
              <div className="converted">{status.post.converted_content}</div>
            </>
          ) : isSaving ? (
            <div className="empty">
              <div className="spinner" /> Sending content to Azure OpenAI…
            </div>
          ) : (
            <div className="empty">
              The AI-converted version of your post will appear here after you
              click <strong>Save post</strong>.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
