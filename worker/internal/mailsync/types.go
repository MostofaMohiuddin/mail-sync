package mailsync

import "go.mongodb.org/mongo-driver/bson/primitive"

type SendScheduledMailIdsBody struct {
	ScheduledMailIds []primitive.ObjectID `json:"schedule_mail_ids"`
}
