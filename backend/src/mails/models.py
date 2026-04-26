from enum import Enum

from pydantic import BaseModel


class MailBody(BaseModel):
    html: str
    plain: str


class MailRequestBody(BaseModel):
    sender: str
    receiver: str
    subject: str
    body: MailBody


class ProcessMailWithAIRequestType(Enum):
    SUMMARY = "SUMMARY"
    REPLY = "REPLY"
    GENERATE = "GENERATE"


class ProcessMailWithAIRequestTone(str, Enum):
    FRIENDLY = "FRIENDLY"
    CONCISE = "CONCISE"
    FORMAL = "FORMAL"
    DECLINE = "DECLINE"
    ENTHUSIASTIC = "ENTHUSIASTIC"


class ProcessMailWithAIRequestBody(BaseModel):
    message: str
    request_type: ProcessMailWithAIRequestType
    tone: ProcessMailWithAIRequestTone | None = None
