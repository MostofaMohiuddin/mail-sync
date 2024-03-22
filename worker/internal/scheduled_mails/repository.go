package scheduled_mails

import (
	"context"
	"time"

	"github.com/MostofaMohiuddin/mail-sync/internal/db/mongodb"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// MailService represents a mail service
type MailRepository struct {
	collection *mongo.Collection
}

// NewMailService creates a new MailService instance
func NewMailRepository() *MailRepository {
	collection := mongodb.NewClient().GetDatabase().Collection("scheduled_mail")
	return &MailRepository{
		collection: collection,
	}
}

// ReadMail reads mail from the mail service
func (mailRepository *MailRepository) GetMailBeforeCurrentTime() []ScheduledMail {
	filter := bson.M{"scheduled_at": bson.M{"$lte": time.Now()}, "status": "pending"}
	cursor, err := mailRepository.collection.Find(context.TODO(), filter)
	if err != nil {
		panic(err)
	}
	var results []ScheduledMail
	if err = cursor.All(context.TODO(), &results); err != nil {
		panic(err)
	}
	return results
}
