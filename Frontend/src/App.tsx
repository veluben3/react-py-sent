import { useState, type FormEvent } from 'react';
import { submitContent } from './api';
import type { SubmitResponse } from './types';

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; data: SubmitResponse }
  | { kind: 'error'; message: string };

export default function App() {
  const [content, setContent] = useState<string>('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ kind: 'loading' });
    try {
      const data = await submitContent({ content });
      setStatus({ kind: 'success', data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setStatus({ kind: 'error', message });
    }
  };

  const handleReset = () => {
    setContent('');
    setStatus({ kind: 'idle' });
  };

  const isLoading = status.kind === 'loading';
  const canSubmit = content.trim().length > 0 && !isLoading;

  return (
    <main className="container">
      <header>
        <h1>Submit Content for AI Review</h1>
        <p className="subtitle">
          Paste your text below and submit. The backend sends it to Azure OpenAI
          (via LangChain) and returns a response limited to 250 words.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="form">
        <div className="field">
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            name="content"
            rows={14}
            placeholder="Enter the content you want analyzed / summarized / rewritten..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isLoading}
            required
          />
          <small>{content.length} characters</small>
        </div>

        <div className="actions">
          <button type="submit" disabled={!canSubmit}>
            {isLoading ? 'Submitting…' : 'Submit'}
          </button>
          <button type="button" onClick={handleReset} disabled={isLoading}>
            Reset
          </button>
        </div>
      </form>

      {status.kind === 'success' && (
        <div className="alert success">
          <strong>AI reply</strong> (entry #{status.data.id},{' '}
          {status.data.word_count} words, {status.data.received_chars} chars in):
          <pre className="ai-reply">{status.data.ai_reply}</pre>
        </div>
      )}

      {status.kind === 'error' && (
        <div className="alert error">
          <strong>Error:</strong> {status.message}
        </div>
      )}
    </main>
  );
}
