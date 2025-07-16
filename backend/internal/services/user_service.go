package services

import (
	"encoding/json"
	"fmt"
	"nothing-community-backend/internal/database"
	"nothing-community-backend/internal/models"

	"github.com/appwrite/sdk-for-go/appwrite"
)

type UserService struct {
	appwriteClient *database.AppwriteClient
}

	return &UserService{
		appwriteClient: appwriteClient,
	}
}

func (s *UserService) CreateUser(user models.User) error {
	// Convert user to map for Appwrite
	userData := map[string]interface{}{
		"name":        user.Name,
		"email":       user.Email,
		"avatar":      user.Avatar,
		"bio":         user.Bio,
		"location":    user.Location,
		"website":     user.Website,
		"is_admin":    user.IsAdmin,
		"is_verified": user.IsVerified,
		"is_active":   user.IsActive,
	}

	_, err := s.appwriteClient.Database.CreateDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteUsersCollectionID,
		user.ID,
		userData,
		nil,
	)

	return err
}

func (s *UserService) GetUserByID(userID string) (*models.User, error) {
	doc, err := s.appwriteClient.Database.GetDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteUsersCollectionID,
		userID,
		nil,
	)
	if err != nil {
		return nil, err
	}

	var user models.User
	if err := s.mapDocumentToUser(doc.Data, &user); err != nil {
		return nil, err
	}

	user.ID = doc.Id
	return &user, nil
}

func (s *UserService) UpdateUser(userID string, req models.UpdateUserRequest) (*models.User, error) {
	// Convert update request to map
	updateData := make(map[string]interface{})
	
	if req.Name != "" {
		updateData["name"] = req.Name
	}
	if req.Bio != "" {
		updateData["bio"] = req.Bio
	}
	if req.Location != "" {
		updateData["location"] = req.Location
	}
	if req.Website != "" {
		updateData["website"] = req.Website
	}
	if req.Avatar != "" {
		updateData["avatar"] = req.Avatar
	}

	doc, err := s.appwriteClient.Database.UpdateDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteUsersCollectionID,
		userID,
		updateData,
		nil,
	)
	if err != nil {
		return nil, err
	}

	var user models.User
	if err := s.mapDocumentToUser(doc.Data, &user); err != nil {
		return nil, err
	}

	user.ID = doc.Id
	return &user, nil
}

func (s *UserService) ListUsers(limit, offset int) ([]models.User, error) {
	queries := []string{
		fmt.Sprintf("limit(%d)", limit),
		fmt.Sprintf("offset(%d)", offset),
	}

	docs, err := s.appwriteClient.Database.ListDocuments(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteUsersCollectionID,
		queries,
	)
	if err != nil {
		return nil, err
	}

	var users []models.User
	for _, doc := range docs.Documents {
		var user models.User
		if err := s.mapDocumentToUser(doc.Data, &user); err != nil {
			continue
		}
		user.ID = doc.Id
		users = append(users, user)
	}

	return users, nil
}

func (s *UserService) mapDocumentToUser(data interface{}, user *models.User) error {
	// Convert to JSON and back to properly map the data
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	return json.Unmarshal(jsonData, user)
}