package important_mail_notification

import (
	"context"
	"errors"
	"sync"
	"testing"

	"github.com/MostofaMohiuddin/mail-sync/internal/linked_mail_address"
	"github.com/MostofaMohiuddin/mail-sync/internal/mailsync"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var errBoom = errors.New("boom")

func newServiceForTest(api API, lock Locker, addrs []linked_mail_address.LinkedMailAddress) *ImportantMailNotificationService {
	return &ImportantMailNotificationService{
		api:         api,
		lock:        lock,
		listAddrs:   func() []linked_mail_address.LinkedMailAddress { return addrs },
		concurrency: 4,
	}
}

type fakeAPI struct {
	mu          sync.Mutex
	histories   map[primitive.ObjectID][]mailsync.MailMetaData
	classify    map[string]bool
	notifyCalls [][]mailsync.ImportantMailNotification
	updateCalls []primitive.ObjectID
	classifyErr error
}

func (f *fakeAPI) GetHistory(_ string, addr primitive.ObjectID) mailsync.GetHistoryApiResponse {
	return mailsync.GetHistoryApiResponse{Mails: f.histories[addr]}
}

func (f *fakeAPI) ClassifyBatch(mails []mailsync.MailMetaData) (map[string]bool, error) {
	if f.classifyErr != nil {
		return nil, f.classifyErr
	}
	out := map[string]bool{}
	for _, m := range mails {
		out[m.ID] = f.classify[m.ID]
	}
	return out, nil
}

func (f *fakeAPI) AddImportantMailNotification(notifs []mailsync.ImportantMailNotification) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	cp := make([]mailsync.ImportantMailNotification, len(notifs))
	copy(cp, notifs)
	f.notifyCalls = append(f.notifyCalls, cp)
	return nil
}

func (f *fakeAPI) UpdateLinkedMailAddress(_, _ string, addr primitive.ObjectID) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.updateCalls = append(f.updateCalls, addr)
	return nil
}

type alwaysOpenLock struct{}

func (alwaysOpenLock) Acquire(_ context.Context, _ string) (string, bool, error) { return "tok", true, nil }
func (alwaysOpenLock) Release(_ context.Context, _, _ string) error              { return nil }

type neverOpenLock struct{}

func (neverOpenLock) Acquire(_ context.Context, _ string) (string, bool, error) { return "", false, nil }
func (neverOpenLock) Release(_ context.Context, _, _ string) error              { return nil }

func mail(id, _addr string) mailsync.MailMetaData {
	return mailsync.MailMetaData{
		ID: id, HistoryId: "100",
		Sender:   mailsync.MailUser{Email: "alice@example.com"},
		Receiver: mailsync.MailUser{Email: "me@example.com"},
		Subject:  "s", Snippet: "x", Date: "Fri, 26 Apr 2026 10:00:00 +0000",
	}
}

func TestNoCumulativeSliceAcrossAddresses(t *testing.T) {
	a := primitive.NewObjectID()
	b := primitive.NewObjectID()
	api := &fakeAPI{
		histories: map[primitive.ObjectID][]mailsync.MailMetaData{
			a: {mail("m_a", a.Hex())},
			b: {mail("m_b", b.Hex())},
		},
		classify: map[string]bool{"m_a": true, "m_b": true},
	}

	hist := "h0"
	addrs := []linked_mail_address.LinkedMailAddress{
		{ID: a, LastMailHistoryId: &hist},
		{ID: b, LastMailHistoryId: &hist},
	}

	svc := newServiceForTest(api, alwaysOpenLock{}, addrs)
	svc.AddNotification()

	if len(api.notifyCalls) != 2 {
		t.Fatalf("expected 2 notify calls (one per address), got %d", len(api.notifyCalls))
	}
	for _, call := range api.notifyCalls {
		if len(call) != 1 {
			t.Fatalf("each call should contain exactly 1 notification, got %d", len(call))
		}
	}
}

func TestClassifyErrorSkipsAddressAndDoesNotAdvance(t *testing.T) {
	addr := primitive.NewObjectID()
	hist := "h0"
	api := &fakeAPI{
		histories:   map[primitive.ObjectID][]mailsync.MailMetaData{addr: {mail("m1", addr.Hex())}},
		classifyErr: errBoom,
	}
	svc := newServiceForTest(api, alwaysOpenLock{}, []linked_mail_address.LinkedMailAddress{{ID: addr, LastMailHistoryId: &hist}})
	svc.AddNotification()

	if len(api.updateCalls) != 0 {
		t.Fatalf("LastMailHistoryId should not advance on classify failure; got %v", api.updateCalls)
	}
	if len(api.notifyCalls) != 0 {
		t.Fatalf("no notifications should be sent on classify failure; got %v", api.notifyCalls)
	}
}

func TestNonImportantMailDoesNotProduceNotificationButStillAdvancesHistory(t *testing.T) {
	addr := primitive.NewObjectID()
	hist := "h0"
	api := &fakeAPI{
		histories: map[primitive.ObjectID][]mailsync.MailMetaData{addr: {mail("m1", addr.Hex())}},
		classify:  map[string]bool{"m1": false},
	}
	svc := newServiceForTest(api, alwaysOpenLock{}, []linked_mail_address.LinkedMailAddress{{ID: addr, LastMailHistoryId: &hist}})
	svc.AddNotification()

	if len(api.notifyCalls) != 0 {
		t.Fatalf("no important mail → no notify call; got %v", api.notifyCalls)
	}
	if len(api.updateCalls) != 1 {
		t.Fatalf("history should still advance; got %v", api.updateCalls)
	}
}

func TestAddressLockedSkipsProcessing(t *testing.T) {
	addr := primitive.NewObjectID()
	hist := "h0"
	api := &fakeAPI{
		histories: map[primitive.ObjectID][]mailsync.MailMetaData{addr: {mail("m1", addr.Hex())}},
		classify:  map[string]bool{"m1": true},
	}
	svc := newServiceForTest(api, neverOpenLock{}, []linked_mail_address.LinkedMailAddress{{ID: addr, LastMailHistoryId: &hist}})
	svc.AddNotification()

	if len(api.notifyCalls) != 0 || len(api.updateCalls) != 0 {
		t.Fatalf("locked address should be skipped entirely")
	}
}
