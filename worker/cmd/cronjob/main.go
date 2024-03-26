package main

import (
	"fmt"

	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/MostofaMohiuddin/mail-sync/internal/cron"
	"github.com/MostofaMohiuddin/mail-sync/internal/db/mongodb"
	"github.com/MostofaMohiuddin/mail-sync/internal/important_mail_notification"
)

func main() {
	fmt.Println("Starting cron job...")
	// Initialize MongoDB client
	mongodb.NewClient()

	// Initialize Schedule Mail Service
	// scheduleMailService := scheduled_mails.NewMailService()
	// ScheduledAutoReplyService := scheduled_auto_replies.NewScheduledAutoReplyService()
	NewImportantMailNotificationService := important_mail_notification.NewImportantMailNotificationService()

	// Initialize Jobs
	jobs := []cron.Job{
		// {
		// 	Title:          "SendScheduledMail",
		// 	CronFunction:   scheduleMailService.SendScheduledMail,
		// 	CronExpression: "*/20 * * * * *",
		// },
		// {
		// 	Title:          "ScheduledAutoReplyService",
		// 	CronFunction:   ScheduledAutoReplyService.SendScheduledReplies,
		// 	CronExpression: "*/20 * * * * *",
		// },
		{
			Title:          "GetAllLinkedMailAddress",
			CronFunction:   NewImportantMailNotificationService.AddNotification,
			CronExpression: "*/20 * * * * *",
		},
	}

	// Initialize CronJob
	c := cron.NewCronJob(jobs)

	// Start the cron job
	c.Start()

	// Graceful shutdown
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)
	<-shutdown

	log.Println("Shutting down...")
	c.Stop()
	log.Println("Shutdown complete")
}
