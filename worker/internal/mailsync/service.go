package mailsync

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/MostofaMohiuddin/mail-sync/internal/config"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// CallAPI makes an HTTP POST request to the specified URL with the given body and headers
func callAPI(endPoint string, method string, body interface{}) (*http.Response, error) {
	config := config.New()
	apiKey := config.ApiKey
	url := config.MailSyncApiUrl + endPoint
	// Convert body to JSON
	jsonData, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}

	// Create the request
	req, err := http.NewRequest(method, url, bytes.NewReader(jsonData))
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

func SendScheduledMails(IDs []primitive.ObjectID) {
	body := SendScheduledMailIdsBody{
		ScheduledMailIds: IDs,
	}
	resp, err := callAPI("/schedule-mail/send", http.MethodPost, body)
	if resp.StatusCode == 200 {
		log.Println("Scheduled Mail sent successfully")
	} else {
		log.Println(resp.StatusCode)
		log.Panicln(err)
	}
}

func ReadMailByLinkedMailAddressId(linkedMailAddressId primitive.ObjectID) ReadMailApiResponse {

	resp, _ := callAPI(fmt.Sprintf("/mails/link-mail-address/%s/mails?number_of_mails=1", linkedMailAddressId.Hex()), http.MethodGet, nil)
	if resp.StatusCode == 200 {
		var result ReadMailApiResponse

		body, _ := io.ReadAll(resp.Body)
		if err := json.Unmarshal(body, &result); err != nil {
			fmt.Println("Can not unmarshal JSON")
		}
		return result
	} else {
		log.Println(resp.StatusCode)
	}
	return ReadMailApiResponse{Mails: []MailMetaData{}}
}

func UpdateScheduleAutoReply(ScheduleAutoReplyId primitive.ObjectID, LastMailId string, LastMailHistoryId string) {
	body := UpdateScheduleAutoReplyBody{
		LastMailId:        LastMailId,
		LastMailHistoryId: LastMailHistoryId,
	}
	resp, _ := callAPI(fmt.Sprintf("/schedule-auto-reply/%s", ScheduleAutoReplyId.Hex()), http.MethodPut, body)
	if resp.StatusCode == 200 {
		log.Printf("Updated LastMailId %s and LastMailHistory %s successfully for ScheduleAutoReplyId: %s", LastMailId, LastMailHistoryId, ScheduleAutoReplyId)
	} else {
		log.Println(resp.StatusCode)
	}
}

func GetHistory(MailHistoryId string, LinkMailAddressId primitive.ObjectID) GetHistoryApiResponse {
	resp, _ := callAPI(fmt.Sprintf("/mails/link-mail-address/%s/history/%s", LinkMailAddressId.Hex(), MailHistoryId), http.MethodGet, nil)
	if resp.StatusCode == 200 {
		var result GetHistoryApiResponse
		body, _ := io.ReadAll(resp.Body)
		if err := json.Unmarshal(body, &result); err != nil {
			fmt.Println("Can not unmarshal JSON")
		}
		return result
	} else {
		log.Println(resp.StatusCode)
	}
	return GetHistoryApiResponse{Mails: []MailMetaData{}}
}

func SendMail(LinkedMailAddressId primitive.ObjectID, MailData SendMailBody) {
	resp, _ := callAPI(fmt.Sprintf("/mails/link-mail-address/%s/send", LinkedMailAddressId.Hex()), http.MethodPost, MailData)
	if resp.StatusCode == 200 {
		log.Printf("Mail sent successfully LinkedMailAddressId: %s, to: %s", LinkedMailAddressId.Hex(), MailData.Receiver)
	} else {
		log.Println(resp.StatusCode)
	}
}
