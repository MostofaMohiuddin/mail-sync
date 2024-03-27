package important_mail_notification

import (
	"log"

	"github.com/MostofaMohiuddin/mail-sync/internal/linked_mail_address"
	"github.com/MostofaMohiuddin/mail-sync/internal/mailsync"
	"github.com/araddon/dateparse"
)

type ImportantMailNotificationService struct {
	linked_mail_address_service *linked_mail_address.LinkedMailAddressService
}

func NewImportantMailNotificationService() *ImportantMailNotificationService {
	linked_mail_address_service := linked_mail_address.NewLinkedMailAddressService()
	return &ImportantMailNotificationService{
		linked_mail_address_service: linked_mail_address_service,
	}
}

func (important_mail_notification_service *ImportantMailNotificationService) AddNotification() {
	linked_mail_addresses := important_mail_notification_service.linked_mail_address_service.GetAllLinkedMailAddress()
	important_mail_notifications := []mailsync.ImportantMailNotification{}
	for _, linked_mail_address := range linked_mail_addresses {
		if linked_mail_address.LastMailHistoryId == nil {
			log.Println("No LastMailHistoryId, Updating LastMailHistoryId")
			mailsync.ReadMailByLinkedMailAddressId(linked_mail_address.ID)
		} else {
			log.Println("Getting New Mails")
			history := mailsync.GetHistory(*linked_mail_address.LastMailHistoryId, linked_mail_address.ID)
			recent_mail := mailsync.MailMetaData{}
			log.Printf("New Mails: %d", len(history.Mails))
			for index, mail := range history.Mails {
				detect_important_response := mailsync.DetectImportantMail(mail)
				log.Printf("Mail %d is important: %t", index, detect_important_response.IsImportant)
				if detect_important_response.IsImportant {
					important_mail_notifications = append(important_mail_notifications, mailsync.ImportantMailNotification{
						LinkedMailAddressId: linked_mail_address.ID, MailMetaData: mail,
					})
				}
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
				// mailsync.UpdateLinkedMailAddress(recent_mail.ID, recent_mail.HistoryId, linked_mail_address.ID)
			}
			if len(important_mail_notifications) > 0 {
				log.Println("Adding Important Mail Notifications")
				mailsync.AddImportantMailNotification(important_mail_notifications)
			}
		}
	}
}
