from typing import Any

from fastapi import APIRouter, Depends, status

from src.calendars.services import CalendarSyncService

from .dtos import CalendarEventResponse

router = APIRouter(
    prefix="/api/calendars",
    tags=["Calendar Sync"],
)


@router.get("/events", status_code=status.HTTP_200_OK)
async def get_calendar_events(
    time_min: str = None,
    time_max: str = None,
    mail_sync_service: CalendarSyncService = Depends(),
) -> list[CalendarEventResponse]:
    return await mail_sync_service.get_events(time_min, time_max)
