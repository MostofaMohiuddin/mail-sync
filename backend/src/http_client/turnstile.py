import base64
import hashlib
import hmac
import time
import uuid
from functools import partial

from httpx import Request

from .base import AsyncHttpClient, HttpClient


def get_signature(app_key: str, secret: str, method: str, target: str, body: bytes, timestamp: int, nonce: str) -> str:
    # Base64 encoded MD5 hash of request body
    body_md5_bytes = hashlib.md5(body).digest()
    body_md5_base64 = base64.b64encode(body_md5_bytes).decode("ascii")

    # Generate a signature from the relevant request parts
    message = (app_key + method + target + str(timestamp) + nonce + body_md5_base64).encode("utf-8")
    secret_bytes = base64.b64decode(secret)
    message_hash = hmac.new(secret_bytes, message, hashlib.sha256).digest()
    return base64.b64encode(message_hash).decode("ascii")


def construct_turnstile_hmac_headers(
    app_key: str, secret: str, method: str, target: str, body: bytes | str | None
) -> dict:
    timestamp = int(time.time() * 1000)
    nonce = uuid.uuid4().hex

    if body is None:
        encoded_body = b""
    elif isinstance(body, str):
        encoded_body = body.encode("utf-8")
    else:
        encoded_body = body

    signature = get_signature(
        app_key=app_key,
        secret=secret,
        method=method,
        target=target,
        body=encoded_body,
        timestamp=timestamp,
        nonce=nonce,
    )

    return {
        "Authorization": "epi-hmac " + app_key + ":" + str(timestamp) + ":" + nonce + ":" + signature,
        "Turnstile-Version": "2.0",
    }


def add_turnstile_hmac_headers(request: Request, app_key: str, secret: str) -> Request:
    turnstile_hmac_headers = construct_turnstile_hmac_headers(
        app_key=app_key,
        secret=secret,
        method=request.method,
        target=request.url.raw_path.decode("ascii"),
        body=request.content,
    )
    request.headers.update(turnstile_hmac_headers)
    return request


class TurnstileHmacHttpClient(HttpClient):
    """
    This client can be used to communicate with any API that is secured with Turnstile Hmac.
    """

    def __init__(self, app_key: str, secret: str) -> None:
        super().__init__(auth=partial(add_turnstile_hmac_headers, app_key=app_key, secret=secret))


class TurnstileHmacAsyncHttpClient(AsyncHttpClient):
    """
    This client can be used to communicate with any API that is secured with Turnstile Hmac.
    """

    def __init__(self, app_key: str, secret: str) -> None:
        super().__init__(auth=partial(add_turnstile_hmac_headers, app_key=app_key, secret=secret))
