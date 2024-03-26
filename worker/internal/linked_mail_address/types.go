package linked_mail_address

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type LinkedMailAddress struct {
	ID                primitive.ObjectID `bson:"_id,omitempty"`
	Email             string             `bson:"email,omitempty"`
	Username          string             `bson:"username,omitempty"`
	LastMailId        *string            `bson:"last_read_mail_id,omitempty"`
	LastMailHistoryId *string            `bson:"last_read_mail_history_id,omitempty"`
}
