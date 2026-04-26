package important_mail_notification

import (
	"context"
	"log"
	"time"

	"github.com/MostofaMohiuddin/mail-sync/internal/linked_mail_address"
	lockpkg "github.com/MostofaMohiuddin/mail-sync/internal/lock"
	"github.com/MostofaMohiuddin/mail-sync/internal/mailsync"
	"github.com/MostofaMohiuddin/mail-sync/internal/pool"
	redisclient "github.com/MostofaMohiuddin/mail-sync/internal/redis"

	"github.com/araddon/dateparse"
	goredis "github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	defaultConcurrency = 8
	lockTTL            = 60 * time.Second
)

// API is the subset of mailsync the service needs (for testability).
type API interface {
	GetHistory(historyID string, addr primitive.ObjectID) mailsync.GetHistoryApiResponse
	ClassifyBatch(mails []mailsync.MailMetaData) (map[string]bool, error)
	AddImportantMailNotification(notifs []mailsync.ImportantMailNotification) error
	UpdateLinkedMailAddress(lastMailID, lastHistoryID string, addr primitive.ObjectID) error
}

// Locker is the lock interface used by the service.
type Locker interface {
	Acquire(ctx context.Context, key string) (string, bool, error)
	Release(ctx context.Context, key, token string) error
}

// realAPI wraps the package-level mailsync functions.
type realAPI struct{}

func (realAPI) GetHistory(historyID string, addr primitive.ObjectID) mailsync.GetHistoryApiResponse {
	return mailsync.GetHistory(historyID, addr)
}
func (realAPI) ClassifyBatch(mails []mailsync.MailMetaData) (map[string]bool, error) {
	return mailsync.ClassifyBatch(mails)
}
func (realAPI) AddImportantMailNotification(notifs []mailsync.ImportantMailNotification) error {
	return mailsync.AddImportantMailNotification(notifs)
}
func (realAPI) UpdateLinkedMailAddress(lastMailID, lastHistoryID string, addr primitive.ObjectID) error {
	return mailsync.UpdateLinkedMailAddress(lastMailID, lastHistoryID, addr)
}

// realLock wraps lock.Lock to bind a fixed TTL.
type realLock struct{ inner *lockpkg.Lock }

func (l realLock) Acquire(ctx context.Context, key string) (string, bool, error) {
	return l.inner.Acquire(ctx, key, lockTTL)
}
func (l realLock) Release(ctx context.Context, key, token string) error {
	return l.inner.Release(ctx, key, token)
}

type ImportantMailNotificationService struct {
	api         API
	lock        Locker
	listAddrs   func() []linked_mail_address.LinkedMailAddress
	concurrency int
}

func NewImportantMailNotificationService(redis *goredis.Client) *ImportantMailNotificationService {
	if redis == nil {
		redis = redisclient.Client()
	}
	addrSvc := linked_mail_address.NewLinkedMailAddressService()
	return &ImportantMailNotificationService{
		api:         realAPI{},
		lock:        realLock{inner: lockpkg.New(redis)},
		listAddrs:   addrSvc.GetAllLinkedMailAddress,
		concurrency: defaultConcurrency,
	}
}

func (s *ImportantMailNotificationService) AddNotification() {
	addrs := s.listAddrs()
	log.Printf("ImportantMailNotification tick: %d addresses", len(addrs))
	pool.Run(s.concurrency, addrs, s.processOne)
}

func (s *ImportantMailNotificationService) processOne(addr linked_mail_address.LinkedMailAddress) {
	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Second)
	defer cancel()

	key := "lock:poll:" + addr.ID.Hex()
	token, ok, err := s.lock.Acquire(ctx, key)
	if err != nil {
		log.Printf("processOne(%s): lock acquire error: %v", addr.ID.Hex(), err)
		return
	}
	if !ok {
		log.Printf("processOne(%s): skip — already locked", addr.ID.Hex())
		return
	}
	defer func() { _ = s.lock.Release(ctx, key, token) }()

	if addr.LastMailHistoryId == nil {
		log.Printf("processOne(%s): no LastMailHistoryId, bootstrapping", addr.ID.Hex())
		mailsync.ReadMailByLinkedMailAddressId(addr.ID)
		return
	}

	history := s.api.GetHistory(*addr.LastMailHistoryId, addr.ID)
	if len(history.Mails) == 0 {
		return
	}

	classified, err := s.api.ClassifyBatch(history.Mails)
	if err != nil {
		log.Printf("processOne(%s): ClassifyBatch failed: %v", addr.ID.Hex(), err)
		return
	}

	// Per-address notification slice — declared INSIDE this function so it
	// cannot leak across addresses (the historical bug).
	notifications := make([]mailsync.ImportantMailNotification, 0, len(history.Mails))
	var recent mailsync.MailMetaData
	for i, m := range history.Mails {
		if classified[m.ID] {
			notifications = append(notifications, mailsync.ImportantMailNotification{
				LinkedMailAddressId: addr.ID,
				MailMetaData:        m,
			})
		}
		if i == 0 {
			recent = m
			continue
		}
		newDate, err1 := dateparse.ParseAny(m.Date)
		curDate, err2 := dateparse.ParseAny(recent.Date)
		if err1 == nil && err2 == nil && newDate.After(curDate) {
			recent = m
		}
	}

	if len(notifications) > 0 {
		if err := s.api.AddImportantMailNotification(notifications); err != nil {
			log.Printf("processOne(%s): AddImportantMailNotification failed: %v", addr.ID.Hex(), err)
			return
		}
	}

	if recent.HistoryId != "" {
		if err := s.api.UpdateLinkedMailAddress(recent.ID, recent.HistoryId, addr.ID); err != nil {
			log.Printf("processOne(%s): UpdateLinkedMailAddress failed: %v", addr.ID.Hex(), err)
		}
	}
}
