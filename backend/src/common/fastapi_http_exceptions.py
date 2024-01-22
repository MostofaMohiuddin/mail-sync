from http import HTTPStatus

from fastapi import HTTPException


class BadRequestException(HTTPException):
    def __init__(
        self,
        detail: str = HTTPStatus.BAD_REQUEST.phrase,
    ):
        super().__init__(HTTPStatus.BAD_REQUEST.value, detail)


class ForbiddendException(HTTPException):
    def __init__(self, detail: str = HTTPStatus.FORBIDDEN.phrase):
        super().__init__(HTTPStatus.FORBIDDEN.value, detail)


class NotFoundException(HTTPException):
    def __init__(self, detail: str = HTTPStatus.NOT_FOUND.phrase):
        super().__init__(HTTPStatus.NOT_FOUND.value, detail)


class BadGatewayException(HTTPException):
    def __init__(
        self,
        detail: str = HTTPStatus.BAD_GATEWAY.phrase,
    ):
        super().__init__(HTTPStatus.BAD_GATEWAY.value, detail)


class GatewayTimeoutException(HTTPException):
    def __init__(
        self,
        detail: str = HTTPStatus.GATEWAY_TIMEOUT.phrase,
    ):
        super().__init__(HTTPStatus.GATEWAY_TIMEOUT.value, detail)
