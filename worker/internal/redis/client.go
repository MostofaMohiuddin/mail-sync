package redis

import (
	"context"
	"sync"

	"github.com/MostofaMohiuddin/mail-sync/internal/config"
	goredis "github.com/redis/go-redis/v9"
)

var (
	once   sync.Once
	client *goredis.Client
)

// Client returns a process-wide singleton redis client.
func Client() *goredis.Client {
	once.Do(func() {
		opt, err := goredis.ParseURL(config.New().RedisURL)
		if err != nil {
			panic(err)
		}
		client = goredis.NewClient(opt)
		// Eager ping so misconfiguration is loud at startup.
		if err := client.Ping(context.Background()).Err(); err != nil {
			panic(err)
		}
	})
	return client
}
