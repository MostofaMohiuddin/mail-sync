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
	redisclient "github.com/MostofaMohiuddin/mail-sync/internal/redis"
	"github.com/MostofaMohiuddin/mail-sync/internal/scheduled_auto_replies"
	"github.com/MostofaMohiuddin/mail-sync/internal/scheduled_mails"
)

func main() {
	fmt.Println("Starting cron job...")

	mongodb.NewClient()
	redisClient := redisclient.Client()

	scheduleMailService := scheduled_mails.NewMailService()
	scheduledAutoReplyService := scheduled_auto_replies.NewScheduledAutoReplyService()
	importantMailNotificationService := important_mail_notification.NewImportantMailNotificationService(redisClient)

	jobs := []cron.Job{
		{
			Title:          "SendScheduledMail",
			CronFunction:   scheduleMailService.SendScheduledMail,
			CronExpression: "@every 1m",
		},
		{
			Title:          "ScheduledAutoReplyService",
			CronFunction:   scheduledAutoReplyService.SendScheduledReplies,
			CronExpression: "@every 1m",
		},
		{
			Title:          "AddImportantMailNotification",
			CronFunction:   importantMailNotificationService.AddNotification,
			CronExpression: "@every 30s",
		},
	}

	c := cron.NewCronJob(jobs)
	c.Start()

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)
	<-shutdown

	log.Println("Shutting down...")
	c.Stop()
	log.Println("Shutdown complete")
}
