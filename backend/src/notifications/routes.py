from fastapi import APIRouter, Depends, Query, Request, Security, status
from fastapi.responses import StreamingResponse
from fastapi_jwt import JwtAuthorizationCredentials

from src.authentication.service import access_security
from src.notifications.service import NotificationStreamService

router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"],
)


@router.post("/stream/ticket", status_code=status.HTTP_200_OK)
async def issue_stream_ticket(
    service: NotificationStreamService = Depends(),
    jwt_credentials: JwtAuthorizationCredentials = Security(access_security),
) -> dict:
    return await service.issue_ticket(jwt_credentials.subject.get("username"))


@router.get("/stream")
async def stream(
    request: Request,
    ticket: str = Query(...),
    service: NotificationStreamService = Depends(),
):
    username = await service.consume_ticket(ticket)
    return StreamingResponse(
        service.event_generator(request, username),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
