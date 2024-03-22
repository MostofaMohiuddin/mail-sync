package scheduled_mails

import (
	"log"

	"github.com/MostofaMohiuddin/mail-sync/internal/mailsync"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// MailService represents a mail service
type MailService struct {
	repository *MailRepository
}

// // NewMailService creates a new MailService instance
func NewMailService() *MailService {
	repository := NewMailRepository()
	return &MailService{
		repository: repository,
	}
}

func (mail_service *MailService) getScheduledMailIDs() []primitive.ObjectID {
	// Read mail from the mail service here
	mails_to_send := mail_service.repository.GetMailBeforeCurrentTime()

	IDs := []primitive.ObjectID{} // Declare IDs as a slice of primitive.ObjectID
	for _, mail := range mails_to_send {
		IDs = append(IDs, mail.ID) // Use append to add mail.ID to IDs
	}

	return IDs
}

func (mail_service *MailService) SendScheduledMail() {
	log.Println("Sending scheduled mail")
	IDs := mail_service.getScheduledMailIDs()
	log.Println("Mails to send", len(IDs))
	mailsync.SendMail(IDs)
	log.Println("Scheduled mail sent")
}
