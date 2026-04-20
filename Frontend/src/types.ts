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
