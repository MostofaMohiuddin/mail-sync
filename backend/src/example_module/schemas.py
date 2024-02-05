from typing import Union

from pydantic import BaseModel


# Pydantic model can be used as an attribute of another model
class NestedModel(BaseModel):
    field: str


class RequestBody(BaseModel):
    required_field: str
    optional_field: Union[str, None] = None
    list_of_strings: list[str]
    nested_model: NestedModel
