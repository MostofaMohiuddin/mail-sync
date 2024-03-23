package mailsync

import "go.mongodb.org/mongo-driver/bson/primitive"

type SendScheduledMailIdsBody struct {
	ScheduledMailIds []primitive.ObjectID `json:"schedule_mail_ids"`
}

type MailUser struct {
	Email   string `json:"email"`
	Picture string `json:"picture"`
	Name    string `json:"name"`
}

type MailMetaData struct {
	Sender    MailUser `json:"sender"`
	Receiver  MailUser `json:"receiver"`
	ID        string   `json:"id"`
	HistoryId string   `json:"history_id"`
}

type ReadMailApiResponse struct {
	Mails []MailMetaData `json:"mails"`
}

type UpdateScheduleAutoReplyBody struct {
	LastMailId        string `json:"last_mail_id"`
	LastMailHistoryId string `json:"last_mail_history_id"`
}
