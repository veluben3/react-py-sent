export interface ContentPayload {
  content: string;
}

export interface SubmitResponse {
  id: number;
  message: string;
  received_chars: number;
  ai_reply: string;
  word_count: number;
}

export interface PostPayload {
  title: string;
  content: string;
}

export interface Post {
  id: number;
  title: string;
  original_content: string;
  converted_content: string;
  word_count: number;
  created_at: string;
}
