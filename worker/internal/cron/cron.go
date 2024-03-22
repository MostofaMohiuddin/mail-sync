package cron

import (
	"log"

	"github.com/robfig/cron"
)

type Job struct {
	CronFunction   func()
	CronExpression string
	Title          string
}

// CronJob represents a cron job
type CronJob struct {
	c    *cron.Cron
	jobs []Job
}

// NewCronJob creates a new CronJob instance
func NewCronJob(jobs []Job) *CronJob {
	return &CronJob{
		c:    cron.New(),
		jobs: jobs,
	}
}

// Start starts the cron job
func (c *CronJob) Start() {
	// Add cron job schedule here
	for _, job := range c.jobs {
		log.Println("Adding job", job.Title, "with schedule", job.CronExpression)
		c.c.AddFunc(job.CronExpression, job.CronFunction)
	}

	c.c.Start()
}

// Stop stops the cron job
func (c *CronJob) Stop() {
	c.c.Stop()
}
