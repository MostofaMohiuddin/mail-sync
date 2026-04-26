package lock

import (
	"context"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	goredis "github.com/redis/go-redis/v9"
)

func newTestClient(t *testing.T) *goredis.Client {
	t.Helper()
	mr, err := miniredis.Run()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(mr.Close)
	return goredis.NewClient(&goredis.Options{Addr: mr.Addr()})
}

func TestAcquireAndRelease(t *testing.T) {
	c := newTestClient(t)
	l := New(c)

	token, ok, err := l.Acquire(context.Background(), "k", time.Minute)
	if err != nil || !ok || token == "" {
		t.Fatalf("acquire 1: token=%q ok=%v err=%v", token, ok, err)
	}

	_, ok, err = l.Acquire(context.Background(), "k", time.Minute)
	if err != nil {
		t.Fatalf("acquire 2 err: %v", err)
	}
	if ok {
		t.Fatal("acquire 2 should have failed (still locked)")
	}

	if err := l.Release(context.Background(), "k", token); err != nil {
		t.Fatalf("release: %v", err)
	}

	_, ok, err = l.Acquire(context.Background(), "k", time.Minute)
	if err != nil || !ok {
		t.Fatalf("acquire 3: ok=%v err=%v", ok, err)
	}
}

func TestReleaseWithMismatchedTokenIsNoOp(t *testing.T) {
	c := newTestClient(t)
	l := New(c)

	tok, _, _ := l.Acquire(context.Background(), "k", time.Minute)
	// Stranger tries to release with the wrong token.
	if err := l.Release(context.Background(), "k", "wrong"); err != nil {
		t.Fatalf("release with wrong token: %v", err)
	}

	// Original holder still cannot re-acquire because their lock is intact.
	_, ok, _ := l.Acquire(context.Background(), "k", time.Minute)
	if ok {
		t.Fatal("expected lock to still be held by original token")
	}
	_ = tok
}
