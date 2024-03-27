package scheduled_auto_replies

import (
	"log"

	"github.com/MostofaMohiuddin/mail-sync/internal/mailsync"
	"github.com/araddon/dateparse"
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

func (scheduled_auto_reply_service *ScheduledAutoReplyService) SendScheduledReplies() {
	log.Println("Sending Scheduled Auto Replies")
	data := scheduled_auto_reply_service.repository.GetScheduledReplies()
	for _, schedule := range data {
		if schedule.LastMailHistoryId == nil {
			log.Println("No LastMailHistoryId, Updating LastMailHistoryId")
			read_mail_data := mailsync.ReadMailByLinkedMailAddressId(schedule.LinkedMailAddressId)
			mailsync.UpdateScheduleAutoReply(schedule.ID, read_mail_data.Mails[0].ID, read_mail_data.Mails[0].HistoryId)
		} else {
			log.Println("Getting New Mails")
			history := mailsync.GetHistory(*schedule.LastMailHistoryId, schedule.LinkedMailAddressId)
			recent_mail := mailsync.MailMetaData{}
			log.Printf("New Mails: %d", len(history.Mails))
			for index, mail := range history.Mails {
				data := mailsync.SendMailBody{
					Receiver: mail.Sender.Email,
					Sender:   mail.Receiver.Email,
					Subject:  "Re: " + mail.Subject,
					MailBody: schedule.Body,
				}
				mailsync.SendMail(schedule.LinkedMailAddressId, data)
				date, _ := dateparse.ParseAny(mail.Date)
				if index == 0 {
					recent_mail = mail
				} else {
					recent_mail_date, _ := dateparse.ParseAny(recent_mail.Date)
					if date.After(recent_mail_date) {
						recent_mail = mail
					}
				}

			}
			if len(history.Mails) > 0 {
				log.Println("Updating LastMailHistoryId")
				mailsync.UpdateScheduleAutoReply(schedule.ID, recent_mail.ID, recent_mail.HistoryId)
			}

		}
	}
}
