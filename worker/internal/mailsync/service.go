package mailsync

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"

	"github.com/MostofaMohiuddin/mail-sync/internal/config"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// CallAPI makes an HTTP POST request to the specified URL with the given body and headers
func callAPI(endPoint string, body interface{}) (*http.Response, error) {
	config := config.New()
	apiKey := config.ApiKey
	url := config.MailSyncApiUrl + endPoint
	// Convert body to JSON
	jsonData, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}

	// Create the request
	req, err := http.NewRequest("POST", url, bytes.NewReader(jsonData))
	if err != nil {
		return nil, err
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", apiKey)

	// Send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}

	return resp, nil
}

func SendMail(IDs []primitive.ObjectID) {
	body := SendScheduledMailIdsBody{
		ScheduledMailIds: IDs,
	}
	resp, err := callAPI("/schedule-mail/send", body)
	if resp.StatusCode == 200 {
		log.Println("Mail sent successfully")
	} else {
		log.Println(resp.StatusCode)
		log.Panicln(err)
	}
}
