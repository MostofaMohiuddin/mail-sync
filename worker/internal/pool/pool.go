package pool

import "sync"

// Run dispatches items to `concurrency` worker goroutines that each call fn.
// Returns once every item has been processed.
func Run[T any](concurrency int, items []T, fn func(T)) {
	if concurrency < 1 {
		concurrency = 1
	}
	ch := make(chan T)
	var wg sync.WaitGroup
	wg.Add(concurrency)
	for i := 0; i < concurrency; i++ {
		go func() {
			defer wg.Done()
			for item := range ch {
				fn(item)
			}
		}()
	}
	for _, item := range items {
		ch <- item
	}
	close(ch)
	wg.Wait()
}
