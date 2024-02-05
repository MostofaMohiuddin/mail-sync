from functools import wraps
from typing import Any, Awaitable, Callable

import httpx
from httpx import URL, Auth, Request, Response
from overrides import override

from src.constants import USER_AGENT
from src.env_config import RUNTIME_ENVIRONMENT
from src.logger import LOGGER


class AsyncHttpClient(httpx.AsyncClient):
    def __init__(self, *, auth: Auth | Callable[[Request], Request] | None = None, base_url: URL | str = "") -> None:
        super().__init__(
            headers={"User-Agent": USER_AGENT},  # Set useful User-Agent, default is python-httpx/version
            verify=(RUNTIME_ENVIRONMENT != "local"),
            auth=auth,
            base_url=base_url,
        )

    @staticmethod
    def log_request_response(func: Callable[[Any, Request], Awaitable[Response]]):
        @wraps(func)
        async def wrapper(self, request: Request, **kwargs) -> Response:
            LOGGER.info("|%s| -> %s %s", self.__class__.__name__, request.method, request.url)
            response = await func(self, request, **kwargs)
            LOGGER.info(
                "|%s| <- %s %s %d",
                self.__class__.__name__,
                request.method,
                request.url,
                response.status_code,
                duration=response.elapsed.total_seconds() * 1e9,  # datadog expects nanoseconds
            )
            return response

        return wrapper

    @log_request_response
    @override
    async def send(self, request: Request, **kwargs) -> Response:
        return await super().send(request, **kwargs)


class HttpClient(httpx.Client):
    def __init__(self, *, auth: Auth | Callable[[Request], Request] | None = None, base_url: URL | str = "") -> None:
        super().__init__(
            headers={"User-Agent": USER_AGENT},  # Set useful User-Agent, default is python-httpx/version
            verify=(RUNTIME_ENVIRONMENT != "local"),
            auth=auth,
            base_url=base_url,
        )

    @staticmethod
    def log_request_response(func: Callable[[Any, Request], Response]):
        @wraps(func)
        def wrapper(self, request: Request, **kwargs) -> Response:
            LOGGER.info("|%s| -> %s %s", self.__class__.__name__, request.method, request.url)
            response = func(self, request, **kwargs)
            LOGGER.info(
                "|%s| <- %s %s %d",
                self.__class__.__name__,
                request.method,
                request.url,
                response.status_code,
                duration=response.elapsed.total_seconds() * 1e9,  # datadog expects nanoseconds
            )
            return response

        return wrapper

    @log_request_response
    @override
    def send(self, request: Request, **kwargs) -> Response:
        return super().send(request, **kwargs)
