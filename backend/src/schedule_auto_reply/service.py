import asyncio
from typing import Annotated

from fastapi import Depends

from backend.src.mails.service import MailSyncService
from backend.src.common.fastapi_http_exceptions import BadRequestException
from backend.src.schedule_auto_reply.models import (
    ScheduleAutoReplyRequestBody,
    ScheduleAutoReply,
    ScheduleAutoReplyResponse,
    ScheduleAutoReplyUpdateRequestBody,
)
from backend.src.schedule_auto_reply.repositories import ScheduleAutoReplyRepository
from backend.src.link_mail_address.service import LinkMailAddressService


class ScheduleAutoReplyService:
    def __init__(
        self,
        schedule_auto_reply_repository: Annotated[ScheduleAutoReplyRepository, Depends()],
        link_mail_address_service: LinkMailAddressService = Depends(),
        mail_sync_service: MailSyncService = Depends(),
    ):
        self.schedule_auto_reply_repository = schedule_auto_reply_repository
        self.link_mail_address_service = link_mail_address_service
        self.mail_sync_service = mail_sync_service

    async def get_scheduled_auto_replies(self, username: str) -> list[ScheduleAutoReplyResponse]:
        link_mail_addresses = await self.link_mail_address_service.get_all_linked_mail_address(username)
        return await self.schedule_auto_reply_repository.get_scheduled_auto_replies(
            [link_address.id for link_address in link_mail_addresses]
        )

    async def schedule_auto_reply(self, username: str, request_body: ScheduleAutoReplyRequestBody) -> None:
        tasks = [
            self._get_link_and_save_schedule_auto_reply(username, mail_address, request_body)
            for mail_address in request_body.mail_addresses
        ]
        await asyncio.gather(*tasks)

    async def _get_link_and_save_schedule_auto_reply(
        self, username: str, mail_address: str, request_body: ScheduleAutoReplyRequestBody
    ):
        link_mail_address = await self.link_mail_address_service.get_by_email(username, mail_address)
        if not link_mail_address:
            raise BadRequestException(detail="Email not linked")
        link_mail_address_id = link_mail_address.get("_id", None)

        schedule_auto_reply_data = ScheduleAutoReply(
            **{
                **request_body.dict(),
                "linked_mail_address_id": link_mail_address_id,
            }
        )
        await self.schedule_auto_reply_repository.add_schedule_auto_reply(schedule_auto_reply_data)

    async def update_schedule_auto_reply(self, _id: str, request_body: ScheduleAutoReplyUpdateRequestBody) -> None:
        await self.schedule_auto_reply_repository.update_schedule_auto_reply(_id, request_body)
