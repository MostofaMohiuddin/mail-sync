package lock

import (
	"context"
	"time"

	"github.com/google/uuid"
	goredis "github.com/redis/go-redis/v9"
)

const releaseScript = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
	return redis.call("DEL", KEYS[1])
else
	return 0
end
`

type Lock struct {
	c *goredis.Client
}

func New(c *goredis.Client) *Lock {
	return &Lock{c: c}
}

// Acquire tries to set key with a unique token. If the key already exists, returns ok=false.
// On success, the caller MUST call Release with the returned token to free it early; otherwise
// the TTL will expire it.
func (l *Lock) Acquire(ctx context.Context, key string, ttl time.Duration) (string, bool, error) {
	token := uuid.NewString()
	ok, err := l.c.SetNX(ctx, key, token, ttl).Result()
	if err != nil {
		return "", false, err
	}
	if !ok {
		return "", false, nil
	}
	return token, true, nil
}

// Release deletes the key only if the stored value matches the provided token.
// Mismatched tokens are silent no-ops, which prevents a slow tick from releasing
// a lock the next tick now owns.
func (l *Lock) Release(ctx context.Context, key, token string) error {
	return l.c.Eval(ctx, releaseScript, []string{key}, token).Err()
}
