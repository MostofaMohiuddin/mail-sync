package scheduled_mails

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Body struct {
	HTML  string `bson:"html,omitempty"`
	Plain string `bson:"plain,omitempty"`
}

type ScheduledMail struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"`
	Subject     string             `bson:"subject,omitempty"`
	Body        Body               `bson:"body,omitempty"`
	From        string             `bson:"sender_link_mail_address_id,omitempty"`
	To          string             `bson:"receiver,omitempty"`
	ScheduledAt time.Time          `bson:"scheduled_at,omitempty"`
	Status      string             `bson:"status,omitempty"`
}
