from enum import Enum

from pydantic import BaseModel


class PaginationData(BaseModel):
    page_no: int
    page_size: int


class SortData(BaseModel):
    key: str
    value: int


class SortOrder(Enum):
    ASC = 1
    DESC = -1
