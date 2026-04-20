import type {
  ContentPayload,
  Post,
  PostPayload,
  SubmitResponse,
} from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Request failed (${response.status} ${response.statusText})${
        text ? `: ${text}` : ''
      }`,
    );
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export async function submitContent(
  payload: ContentPayload,
): Promise<SubmitResponse> {
  const response = await fetch(`${API_URL}/api/pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle<SubmitResponse>(response);
}

export async function createPost(payload: PostPayload): Promise<Post> {
  const response = await fetch(`${API_URL}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle<Post>(response);
}

export async function listPosts(): Promise<Post[]> {
  const response = await fetch(`${API_URL}/api/posts`);
  return handle<Post[]>(response);
}

export async function deletePost(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/posts/${id}`, {
    method: 'DELETE',
  });
  return handle<void>(response);
}
