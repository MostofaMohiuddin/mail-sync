package scheduled_auto_replies

import (
	"log"

	"github.com/MostofaMohiuddin/mail-sync/internal/mailsync"
)

type ScheduledAutoReplyService struct {
	repository *ScheduledAutoReplyRepository
}

// NewMailService creates a new MailService instance
func NewScheduledAutoReplyService() *ScheduledAutoReplyService {
	repository := NewScheduledAutoReplyRepository()
	return &ScheduledAutoReplyService{
		repository: repository,
	}
}

func (scheduled_auto_reply_service *ScheduledAutoReplyService) GetScheduledReplies() {
	data := scheduled_auto_reply_service.repository.GetScheduledReplies()
	log.Println("Scheduled replies", data)
	for _, schedule := range data {
		if schedule.LastMailHistoryId == nil {
			read_mail_data := mailsync.ReadMailByLinkedMailAddressId(schedule.LinkedMailAddressId)
			mailsync.UpdateScheduleAutoReply(schedule.ID, read_mail_data.Mails[0].ID, read_mail_data.Mails[0].HistoryId)
		}
	}
}
