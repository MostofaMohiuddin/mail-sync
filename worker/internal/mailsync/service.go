package mailsync

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/MostofaMohiuddin/mail-sync/internal/config"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// callAPI makes an HTTP request to the backend with API-key auth.
// Always returns a non-nil error on transport failure.
func callAPI(endPoint string, method string, body interface{}) (*http.Response, error) {
	cfg := config.New()
	url := cfg.MailSyncApiUrl + endPoint

	var reader io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reader = bytes.NewReader(jsonData)
	}

	req, err := http.NewRequest(method, url, reader)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", cfg.ApiKey)

	client := &http.Client{}
	return client.Do(req)
}

func SendScheduledMails(IDs []primitive.ObjectID) {
	body := SendScheduledMailIdsBody{ScheduledMailIds: IDs}
	resp, err := callAPI("/schedule-mail/send", http.MethodPost, body)
	if err != nil {
		log.Printf("SendScheduledMails: transport error: %v", err)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode == 200 {
		log.Println("Scheduled Mail sent successfully")
	} else {
		log.Printf("SendScheduledMails: unexpected status %d", resp.StatusCode)
	}
}

func ReadMailByLinkedMailAddressId(linkedMailAddressId primitive.ObjectID) ReadMailApiResponse {
	resp, err := callAPI(
		fmt.Sprintf("/mails/link-mail-address/%s/mails?number_of_mails=1", linkedMailAddressId.Hex()),
		http.MethodGet, nil,
	)
	if err != nil {
		log.Printf("ReadMailByLinkedMailAddressId(%s): transport error: %v", linkedMailAddressId.Hex(), err)
		return ReadMailApiResponse{Mails: []MailMetaData{}}
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		log.Printf("ReadMailByLinkedMailAddressId(%s): unexpected status %d", linkedMailAddressId.Hex(), resp.StatusCode)
		return ReadMailApiResponse{Mails: []MailMetaData{}}
	}
	var result ReadMailApiResponse
	bodyBytes, _ := io.ReadAll(resp.Body)
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		log.Printf("ReadMailByLinkedMailAddressId(%s): unmarshal failed: %v", linkedMailAddressId.Hex(), err)
		return ReadMailApiResponse{Mails: []MailMetaData{}}
	}
	return result
}

func UpdateLinkedMailAddress(LastMailId string, LastMailHistoryId string, LinkedMailAddressId primitive.ObjectID) error {
	body := UpdateLinkedMailAddressBody{
		LastMailId:        LastMailId,
		LastMailHistoryId: LastMailHistoryId,
	}
	resp, err := callAPI(fmt.Sprintf("/link-mail-address/%s", LinkedMailAddressId.Hex()), http.MethodPut, body)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return fmt.Errorf("UpdateLinkedMailAddress: status %d", resp.StatusCode)
	}
	log.Printf("Updated LastMailId %s and LastMailHistory %s for LinkedMailAddressId %s",
		LastMailId, LastMailHistoryId, LinkedMailAddressId.Hex())
	return nil
}

func UpdateScheduleAutoReply(ScheduleAutoReplyId primitive.ObjectID, LastMailId string, LastMailHistoryId string) {
	body := UpdateScheduleAutoReplyBody{
		LastMailId:        LastMailId,
		LastMailHistoryId: LastMailHistoryId,
	}
	resp, err := callAPI(fmt.Sprintf("/schedule-auto-reply/%s", ScheduleAutoReplyId.Hex()), http.MethodPut, body)
	if err != nil {
		log.Printf("UpdateScheduleAutoReply: transport error: %v", err)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode == 200 {
		log.Printf("Updated ScheduleAutoReplyId %s", ScheduleAutoReplyId.Hex())
	} else {
		log.Printf("UpdateScheduleAutoReply: unexpected status %d", resp.StatusCode)
	}
}

func GetHistory(MailHistoryId string, LinkMailAddressId primitive.ObjectID) GetHistoryApiResponse {
	resp, err := callAPI(
		fmt.Sprintf("/mails/link-mail-address/%s/history/%s", LinkMailAddressId.Hex(), MailHistoryId),
		http.MethodGet, nil,
	)
	if err != nil {
		log.Printf("GetHistory(%s): transport error: %v", LinkMailAddressId.Hex(), err)
		return GetHistoryApiResponse{Mails: []MailMetaData{}}
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		log.Printf("GetHistory(%s): unexpected status %d", LinkMailAddressId.Hex(), resp.StatusCode)
		return GetHistoryApiResponse{Mails: []MailMetaData{}}
	}
	var result GetHistoryApiResponse
	bodyBytes, _ := io.ReadAll(resp.Body)
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		log.Printf("GetHistory(%s): unmarshal failed: %v", LinkMailAddressId.Hex(), err)
		return GetHistoryApiResponse{Mails: []MailMetaData{}}
	}
	return result
}

func SendMail(LinkedMailAddressId primitive.ObjectID, MailData SendMailBody) {
	resp, err := callAPI(
		fmt.Sprintf("/mails/link-mail-address/%s/send", LinkedMailAddressId.Hex()),
		http.MethodPost, MailData,
	)
	if err != nil {
		log.Printf("SendMail: transport error: %v", err)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode == 200 {
		log.Printf("Mail sent: linkedMailAddressId=%s to=%s", LinkedMailAddressId.Hex(), MailData.Receiver)
	} else {
		log.Printf("SendMail: unexpected status %d", resp.StatusCode)
	}
}

// Deprecated: use ClassifyBatch via the worker's notification cron path.
func DetectImportantMail(MailData MailMetaData) DetectImportantMailApiResponse {
	body := DetectImportantMailApiRequest{
		Subject: MailData.Subject, Snippet: MailData.Snippet, Sender: MailData.Sender.Email,
	}
	resp, err := callAPI("/important-mail/detect", http.MethodPost, body)
	if err != nil {
		return DetectImportantMailApiResponse{IsImportant: false}
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return DetectImportantMailApiResponse{IsImportant: false}
	}
	var result DetectImportantMailApiResponse
	bodyBytes, _ := io.ReadAll(resp.Body)
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		return DetectImportantMailApiResponse{IsImportant: false}
	}
	return result
}

func AddImportantMailNotification(notifications []ImportantMailNotification) error {
	if len(notifications) == 0 {
		return nil
	}
	body := ImportantMailNotificationApiRequest{Notifications: notifications}
	resp, err := callAPI("/important-mail/notifications", http.MethodPost, body)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return fmt.Errorf("AddImportantMailNotification: status %d", resp.StatusCode)
	}
	log.Printf("Important Mail Notification: added %d", len(notifications))
	return nil
}

// ClassifyBatch sends a batch of mails to the backend and returns the per-mail importance map.
func ClassifyBatch(mails []MailMetaData) (map[string]bool, error) {
	if len(mails) == 0 {
		return map[string]bool{}, nil
	}
	body := ClassifyBatchRequest{Mails: mails}
	resp, err := callAPI("/important-mail/classify-batch", http.MethodPost, body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("ClassifyBatch: status %d", resp.StatusCode)
	}
	bodyBytes, _ := io.ReadAll(resp.Body)
	var parsed ClassifyBatchResponse
	if err := json.Unmarshal(bodyBytes, &parsed); err != nil {
		return nil, err
	}
	if len(parsed.Results) == 0 {
		return nil, errors.New("ClassifyBatch: empty results")
	}
	out := make(map[string]bool, len(parsed.Results))
	for _, r := range parsed.Results {
		out[r.MailID] = r.IsImportant
	}
	return out, nil
}
