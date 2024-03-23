package scheduled_mails

import (
	"time"

	"github.com/MostofaMohiuddin/mail-sync/internal/common"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ScheduledMail struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"`
	Subject     string             `bson:"subject,omitempty"`
	Body        common.Body        `bson:"body,omitempty"`
	From        string             `bson:"sender_link_mail_address_id,omitempty"`
	To          string             `bson:"receiver,omitempty"`
	ScheduledAt time.Time          `bson:"scheduled_at,omitempty"`
	Status      string             `bson:"status,omitempty"`
}
