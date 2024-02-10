from enum import Enum

from pydantic import BaseModel


class MailRequestBody(BaseModel):
    sender: str
    receiver: str
    subject: str
    message: str


class ProcessMailWithAIRequestType(Enum):
    SUMMARY = "SUMMARY"
    REPLY = "REPLY"


class ProcessMailWithAIRequestBody(BaseModel):
    message: str
    request_type: ProcessMailWithAIRequestType
