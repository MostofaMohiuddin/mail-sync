package scheduled_auto_replies

import (
	"context"
	"time"

	"github.com/MostofaMohiuddin/mail-sync/internal/db/mongodb"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type ScheduledAutoReplyRepository struct {
	collection *mongo.Collection
}

func NewScheduledAutoReplyRepository() *ScheduledAutoReplyRepository {
	collection := mongodb.NewClient().GetDatabase().Collection("schedule_auto_reply")
	return &ScheduledAutoReplyRepository{
		collection: collection,
	}
}

// GetAutoReplyBeforeCurrentTime reads auto replies from the auto reply service
func (autoReplyRepository *ScheduledAutoReplyRepository) GetScheduledReplies() []ScheduledAutoReply {
	filter := bson.M{"start_time": bson.M{"$lte": time.Now()}, "end_time": bson.M{"$gte": time.Now()}}
	cursor, err := autoReplyRepository.collection.Find(context.TODO(), filter)
	if err != nil {
		panic(err)
	}
	var results []ScheduledAutoReply
	if err = cursor.All(context.TODO(), &results); err != nil {
		panic(err)
	}
	return results
}
