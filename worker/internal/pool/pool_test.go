package pool

import (
	"sync/atomic"
	"testing"
)

func TestPoolProcessesEveryItem(t *testing.T) {
	var processed int64
	items := make([]int, 100)
	for i := range items {
		items[i] = i
	}

	Run(8, items, func(_ int) {
		atomic.AddInt64(&processed, 1)
	})

	if processed != 100 {
		t.Fatalf("processed = %d, want 100", processed)
	}
}

func TestPoolRespectsConcurrency(t *testing.T) {
	var inFlight, peak int64
	items := make([]int, 50)

	Run(4, items, func(_ int) {
		cur := atomic.AddInt64(&inFlight, 1)
		for {
			old := atomic.LoadInt64(&peak)
			if cur <= old || atomic.CompareAndSwapInt64(&peak, old, cur) {
				break
			}
		}
		atomic.AddInt64(&inFlight, -1)
	})

	if peak > 4 {
		t.Fatalf("peak in-flight = %d, want <= 4", peak)
	}
}
