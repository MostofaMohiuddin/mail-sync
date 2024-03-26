package linked_mail_address

import (
	"context"

	"github.com/MostofaMohiuddin/mail-sync/internal/db/mongodb"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type LinkedMailAddressRepository struct {
	collection *mongo.Collection
}

func NewLinkedMailAddressRepository() *LinkedMailAddressRepository {
	collection := mongodb.NewClient().GetDatabase().Collection("link_mail_address")
	return &LinkedMailAddressRepository{
		collection: collection,
	}
}

// GetAutoReplyBeforeCurrentTime reads auto replies from the auto reply service
func (autoReplyRepository *LinkedMailAddressRepository) GetAllLinkedMailAddress() []LinkedMailAddress {
	cursor, err := autoReplyRepository.collection.Find(context.TODO(), bson.D{})
	if err != nil {
		panic(err)
	}
	var results []LinkedMailAddress
	if err = cursor.All(context.TODO(), &results); err != nil {
		panic(err)
	}
	return results
}
