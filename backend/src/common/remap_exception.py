import functools
from typing import Type


def remap_exception(old: Type[Exception], new: Type[Exception], msg: str):
    """catch instances of old and rethrow them as new"""

    def decorator(unwrapped_fn):
        """the actual decorator"""

        @functools.wraps(unwrapped_fn)
        def wrapper(*args, **kwargs):
            try:
                return unwrapped_fn(*args, **kwargs)
            except old as exc:
                raise new(msg) from exc

        return wrapper

    return decorator


def async_remap_exception(old: Type[Exception], new: Type[Exception], msg: str):
    """catch instances of old and rethrow them as new"""

    def decorator(unwrapped_fn):
        """the actual decorator"""

        @functools.wraps(unwrapped_fn)
        async def wrapper(*args, **kwargs):
            try:
                return await unwrapped_fn(*args, **kwargs)
            except old as exc:
                raise new(msg) from exc

        return wrapper

    return decorator
