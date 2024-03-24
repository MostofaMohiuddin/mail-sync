import asyncio
from typing import Annotated

from bson import ObjectId
from fastapi import Depends

from backend.src.mails.models import MailBody, MailRequestBody
from backend.src.mails.service import MailSyncService
from backend.src.common.models import ObjectIdPydanticAnnotation
from backend.src.common.fastapi_http_exceptions import BadRequestException
from backend.src.schedule_mail.models import (
    ScheduleMail,
    ScheduleMailRequestBody,
    ScheduleMailStatus,
    ScheduleMailWithSenderDetails,
)
from backend.src.link_mail_address.service import LinkMailAddressService

from backend.src.schedule_mail.repositories import ScheduleMailRepository


class ScheduleMailService:
    def __init__(
        self,
        schedule_mail_repository: Annotated[ScheduleMailRepository, Depends()],
        link_mail_address_service: LinkMailAddressService = Depends(),
        mail_sync_service: MailSyncService = Depends(),
    ):
        self.schedule_mail_repository = schedule_mail_repository
        self.link_mail_address_service = link_mail_address_service
        self.mail_sync_service = mail_sync_service

    async def get_scheduled_mails(
        self,
        username: str,
    ) -> list[ScheduleMailWithSenderDetails]:
        link_mail_addresses = await self.link_mail_address_service.get_all_linked_mail_address(username)
        return await self.schedule_mail_repository.get_scheduled_mails_by_user(
            [link_address.id for link_address in link_mail_addresses]
        )

    async def schedule_mail(self, username, request_body: ScheduleMailRequestBody) -> any:
        link_mail_address = await self.link_mail_address_service.get_by_email(username, request_body.sender)
        if not link_mail_address:
            raise BadRequestException(detail="Email not linked")
        link_mail_address_id = str(link_mail_address.get("_id", None))

        schedule_mail_data = ScheduleMail(
            **{
                **request_body.dict(),
                "sender_link_mail_address_id": link_mail_address_id,
                "status": ScheduleMailStatus.PENDING,
            }
        )
        return await self.schedule_mail_repository.schedule_mail(schedule_mail_data)

    async def send_scheduled_mails(
        self,
        scheduled_mail_ids: list[Annotated[ObjectId, ObjectIdPydanticAnnotation]],
    ):
        print(scheduled_mail_ids)
        scheduled_mails = await self.schedule_mail_repository.get_scheduled_mails(scheduled_mail_ids)

        send_mail_tasks = [self._send_mail_and_update_status(mail) for mail in scheduled_mails]

        await asyncio.gather(*send_mail_tasks)

    async def _send_mail_and_update_status(self, mail: ScheduleMailWithSenderDetails) -> None:
        try:
            await self.mail_sync_service.send_mail(
                mail.sender_details.username,
                MailRequestBody(
                    sender=mail.sender_details.email,
                    receiver=mail.receiver,
                    subject=mail.subject,
                    body=MailBody(**mail.body.model_dump()),
                ),
            )
            await self.schedule_mail_repository.update_status(mail.id, ScheduleMailStatus.SENT)
            print(f"Mail sent: {mail.id}")
        except Exception as e:
            await self.schedule_mail_repository.update_status(mail.id, ScheduleMailStatus.FAILED)
            print(f"Mail failed: {mail.id}")
            print(e)

    async def update_schedule_mail(
        self, schedule_mail_id: Annotated[ObjectId, ObjectIdPydanticAnnotation], request_body: ScheduleMailRequestBody
    ) -> None:
        await self.schedule_mail_repository.update_schedule_mail(schedule_mail_id, request_body)
