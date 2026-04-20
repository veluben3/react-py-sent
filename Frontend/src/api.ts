import type { ContentPayload, SubmitResponse } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export async function submitContent(payload: ContentPayload): Promise<SubmitResponse> {
  const response = await fetch(`${API_URL}/api/pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Submission failed (${response.status} ${response.statusText})${text ? `: ${text}` : ''}`,
    );
  }

  return (await response.json()) as SubmitResponse;
}
