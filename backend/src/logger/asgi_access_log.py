import time
from logging import ERROR, INFO

import structlog
from asgi_correlation_id import correlation_id
from starlette.datastructures import URL, Headers
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from .default_logger import LOGGER

# inspired by https://github.com/Kludex/asgi-logger/blob/main/asgi_logger/middleware.py and
# https://github.com/snok/asgi-correlation-id/blob/main/asgi_correlation_id/middleware.py


def get_client_addr(scope: Scope):
    if scope["client"] is None:
        return "-"  # pragma: no cover
    return f"{scope['client'][0]}:{scope['client'][1]}"


class AsgiAccessLogMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        request_id = correlation_id.get()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        response: Message = {}

        async def inner_send(message: Message) -> None:
            if message["type"] == "http.response.start":
                nonlocal response
                response = message
            await send(message)

        start_time = time.perf_counter_ns()
        try:
            await self.app(scope, receive, inner_send)
        except Exception as exc:
            response["status"] = 500
            raise exc
        finally:
            duration = time.perf_counter_ns() - start_time
            protocol = f"HTTP/{scope['http_version']}"
            status_code = response["status"]
            request_url = URL(scope=scope)
            request_headers = Headers(scope=scope)
            full_path = request_url.path + ("?" + request_url.query if request_url.query else "")
            request_line = f"{scope['method']} {full_path} {protocol}"
            client_addr = get_client_addr(scope)
            LOGGER.log(
                ERROR if status_code >= 400 else INFO,
                f'{client_addr} - "{request_line}" {status_code}',
                duration=duration,
                http={
                    # https://docs.datadoghq.com/logs/log_configuration/attributes_naming_convention/#http-requests
                    "url": str(request_url),
                    "status_code": status_code,
                    "method": scope["method"],
                    "referer": request_headers.get("referer"),
                    "request_id": request_id,
                    "useragent": request_headers.get("user-agent"),
                    "version": scope["http_version"],
                },
            )
