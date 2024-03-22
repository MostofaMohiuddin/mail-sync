package mongodb

import (
	"context"
	"log"
	"sync"

	"github.com/MostofaMohiuddin/mail-sync/internal/config"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	once   sync.Once
	client *Client
)

// NewDB creates a new MongoDB client
func NewClient() *Client {
	once.Do(func() {
		uri := config.New().MongoDBURI

		mongoClient, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(uri))
		if err != nil {
			panic(err)
		}

		client = &Client{
			client: mongoClient,
		}
	})

	return client
}

// Client represents a MongoDB client
type Client struct {
	client *mongo.Client
}

// GetClient returns the MongoDB client
func (c *Client) GetClient() *mongo.Client {
	return c.client
}

// GetDatabase returns a MongoDB database
func (c *Client) GetDatabase() *mongo.Database {
	return c.client.Database("admin")
}

// Disconnect disconnects the MongoDB client
func (c *Client) Disconnect() {
	// Disconnect MongoDB client here
	log.Println("Disconnecting MongoDB client...")
	c.client.Disconnect(context.Background())
}
