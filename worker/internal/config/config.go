package config

import (
	"os"

	"github.com/joho/godotenv"
)

// Config holds the application configuration
type Config struct {
	MongoDBURI     string
	MailSyncApiUrl string
	ApiKey         string
}

// New returns a new Config instance
func New() *Config {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		panic(err)
	}

	return &Config{
		MongoDBURI:     getEnv("MONGODB_URI", "mongodb://admin:password@localhost:27017"),
		MailSyncApiUrl: getEnv("MAIL_SYNC_API_URL", "http://localhost:7900/api"),
		ApiKey:         getEnv("API_KEY", "557573f1-471a-4de0-99f1-626cb4848e11"),
	}
}

// getEnv retrieves the value of an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
