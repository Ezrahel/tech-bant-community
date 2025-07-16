package appwrite

import (
	"nothing-community-backend/internal/config"

	"github.com/appwrite/sdk-for-go/account"
	"github.com/appwrite/sdk-for-go/appwrite"
	"github.com/appwrite/sdk-for-go/client"
	"github.com/appwrite/sdk-for-go/databases"
	"github.com/appwrite/sdk-for-go/storage"
	"github.com/appwrite/sdk-for-go/teams"
	"github.com/appwrite/sdk-for-go/users"
)

type AppwriteClient struct {
	Client   client.Client
	Account  *account.Account
	Teams    *teams.Teams
	Database *databases.Databases
	Storage  *storage.Storage
	Users    *users.Users
	Config   *config.Config
}

func NewAppwriteClient(cfg *config.Config) *AppwriteClient {
	client := appwrite.NewClient(
		appwrite.WithEndpoint(cfg.AppwriteEndpoint),
		appwrite.WithProject(cfg.AppwriteProjectID),
		appwrite.WithKey(cfg.AppwriteAPIKey),
	)

	return &AppwriteClient{
		Client:   client,
		Account:  appwrite.NewAccount(client),
		Database: appwrite.NewDatabases(client),
		Storage:  appwrite.NewStorage(client),
		Users:    appwrite.NewUsers(client),
		Config:   cfg,
	}
}
