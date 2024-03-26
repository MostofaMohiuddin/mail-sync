from typing import Any
from fastapi import APIRouter, Depends, status

from backend.src.web_socket.service import WebSocketService


router = APIRouter(
    prefix="/ws",
    tags=["Web Socket"],
)


@router.get("/user/{username}", status_code=status.HTTP_200_OK)
async def get_scheduled_mails(
    username: str,
    web_socket_service: WebSocketService = Depends(),
) -> Any:
    return await web_socket_service.set_item("user", username)
