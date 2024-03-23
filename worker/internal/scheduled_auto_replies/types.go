package scheduled_auto_replies

import (
	"time"

	"github.com/MostofaMohiuddin/mail-sync/internal/common"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ScheduledAutoReply struct {
	ID                  primitive.ObjectID `bson:"_id,omitempty"`
	Subject             string             `bson:"subject,omitempty"`
	Body                common.Body        `bson:"body,omitempty"`
	StartTime           time.Time          `bson:"start_time,omitempty"`
	EndTime             time.Time          `bson:"end_time,omitempty"`
	LastMailId          *string            `bson:"last_mail_id,omitempty"`
	LastMailHistoryId   *string            `bson:"last_mail_history_id,omitempty"`
	LinkedMailAddressId primitive.ObjectID `bson:"linked_mail_address_id,omitempty"`
}
