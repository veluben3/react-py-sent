from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ContentPayload(BaseModel):
    content: str = Field(..., min_length=1)


class SubmitResponse(BaseModel):
    id: int
    message: str
    received_chars: int
    ai_reply: str
    word_count: int


class ContentSubmissionOut(BaseModel):
    id: int
    content: str
    ai_reply: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
