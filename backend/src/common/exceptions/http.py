from http import HTTPStatus
from typing import Any

from fastapi import HTTPException


class HTTPClientErrorStatusException(Exception):
    """
    The response had an error HTTP status of 4xx.

    May be raised when calling `response.raise_for_status()`
    """

    def __init__(
        self,
        status_code: int,
    ):
        super().__init__(f"HTTP request status {status_code}")
        self.status_code = status_code


class RequestTimeoutException(HTTPException):
    def __init__(
        self,
        status_code: int = HTTPStatus.GATEWAY_TIMEOUT.value,
        detail: Any = "Response timeout from upstream server. Please try again",
    ):
        super().__init__(status_code, detail)
        self.status_code = status_code
        self.detail = detail


class BadRequestException(HTTPException):
    def __init__(
        self,
        status_code: int = HTTPStatus.BAD_REQUEST.value,
        detail: Any = "Bad request",
    ):
        super().__init__(status_code, detail)
        self.status_code = status_code
        self.detail = detail


class ConflictException(HTTPException):
    def __init__(self, status_code: int = HTTPStatus.CONFLICT.value, detail: Any = "Conflict"):
        super().__init__(status_code, detail)
        self.status_code = status_code
        self.detail = detail


class NotFoundException(HTTPException):
    def __init__(self, status_code: int = HTTPStatus.NOT_FOUND.value, detail: Any = "Not found"):
        super().__init__(status_code, detail)
        self.status_code = status_code
        self.detail = detail


class UnauthorizedException(HTTPException):
    def __init__(self, status_code: int = HTTPStatus.UNAUTHORIZED.value, detail: Any = "Unauthorized acceess"):
        super().__init__(status_code, detail)
        self.status_code = status_code
        self.detail = detail


class ForbiddenException(HTTPException):
    def __init__(self, status_code: int = HTTPStatus.FORBIDDEN.value, detail: Any = "Not enough permissions"):
        super().__init__(status_code, detail)
        self.status_code = status_code
        self.detail = detail


class InternalServerErrorException(HTTPException):
    def __init__(
        self, status_code: int = HTTPStatus.INTERNAL_SERVER_ERROR.value, detail: Any = "Internal server error"
    ):
        super().__init__(status_code, detail)
        self.status_code = status_code
        self.detail = detail
