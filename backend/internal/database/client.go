package database

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
	// Create the base client
	c := appwrite.NewClient(
		appwrite.WithProject(cfg.AppwriteProjectID),
		appwrite.WithKey(cfg.AppwriteAPIKey),
		appwrite.WithEndpoint(cfg.AppwriteEndpoint),
	)

	// Create service instances
	return &AppwriteClient{
		Client:   c,
		Account:  appwrite.NewAccount(c),
		Teams:    appwrite.NewTeams(c),
		Database: appwrite.NewDatabases(c),
		Storage:  appwrite.NewStorage(c),
		Users:    appwrite.NewUsers(c),
		Config:   cfg,
	}
}
