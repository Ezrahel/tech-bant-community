package services

import (
	"encoding/json"
	"fmt"
	"nothing-community-backend/internal/database"
	"nothing-community-backend/internal/models"

	"github.com/appwrite/sdk-for-go/appwrite"
	"golang.org/x/crypto/bcrypt"
)

type AdminService struct {
	appwriteClient *database.AppwriteClient
	userService    *UserService
}

type AdminStats struct {
	TotalUsers    int64 `json:"total_users"`
	TotalPosts    int64 `json:"total_posts"`
	TotalComments int64 `json:"total_comments"`
	TotalAdmins   int64 `json:"total_admins"`
}

	return &AdminService{
		appwriteClient: appwriteClient,
		userService:    userService,
	}
}

func (s *AdminService) CreateSuperAdmin(email, password, name string) error {
	// Check if super admin already exists
	existingUser, err := s.getUserByEmail(email)
	if err == nil && existingUser != nil {
		// Update existing user to super admin
		return s.updateUserRole(existingUser.ID, models.RoleSuperAdmin)
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %v", err)
	}

	// Create account in Appwrite Auth
	account, err := s.appwriteClient.Account.Create(
		appwrite.ID.Unique(),
		email,
		password,
		&name,
	)
	if err != nil {
		return fmt.Errorf("failed to create account: %v", err)
	}

	// Create user profile in database
	user := models.User{
		ID:         account.Id,
		Name:       name,
		Email:      email,
		Avatar:     "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop",
		IsAdmin:    true,
		IsVerified: true,
		IsActive:   true,
		Role:       models.RoleSuperAdmin,
		Provider:   "email",
	}

	userData := map[string]interface{}{
		"name":        user.Name,
		"email":       user.Email,
		"avatar":      user.Avatar,
		"bio":         "Super Administrator",
		"location":    "",
		"website":     "",
		"is_admin":    user.IsAdmin,
		"is_verified": user.IsVerified,
		"is_active":   user.IsActive,
		"role":        string(user.Role),
		"provider":    user.Provider,
		"password":    string(hashedPassword),
	}

	_, err = s.appwriteClient.Database.CreateDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteUsersCollectionID,
		user.ID,
		userData,
		nil,
	)

	return err
}

func (s *AdminService) CreateAdmin(req models.CreateAdminRequest, creatorID string) (*models.User, error) {
	// Verify creator is super admin
	creator, err := s.userService.GetUserByID(creatorID)
	if err != nil {
		return nil, fmt.Errorf("creator not found: %v", err)
	}

	if creator.Role != models.RoleSuperAdmin {
		return nil, fmt.Errorf("only super admins can create admin accounts")
	}

	// Check if user already exists
	existingUser, err := s.getUserByEmail(req.Email)
	if err == nil && existingUser != nil {
		return nil, fmt.Errorf("user with this email already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %v", err)
	}

	// Create account in Appwrite Auth
	account, err := s.appwriteClient.Account.Create(
		appwrite.ID.Unique(),
		req.Email,
		req.Password,
		&req.Name,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create account: %v", err)
	}

	// Create user profile in database
	user := models.User{
		ID:         account.Id,
		Name:       req.Name,
		Email:      req.Email,
		Avatar:     "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop",
		IsAdmin:    true,
		IsVerified: true,
		IsActive:   true,
		Role:       req.Role,
		Provider:   "email",
	}

	userData := map[string]interface{}{
		"name":        user.Name,
		"email":       user.Email,
		"avatar":      user.Avatar,
		"bio":         fmt.Sprintf("%s Administrator", string(req.Role)),
		"location":    "",
		"website":     "",
		"is_admin":    user.IsAdmin,
		"is_verified": user.IsVerified,
		"is_active":   user.IsActive,
		"role":        string(user.Role),
		"provider":    user.Provider,
		"password":    string(hashedPassword),
	}

	_, err = s.appwriteClient.Database.CreateDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteUsersCollectionID,
		user.ID,
		userData,
		nil,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create user profile: %v", err)
	}

	return &user, nil
}

func (s *AdminService) GetAdmins() ([]models.User, error) {
	queries := []string{
		"equal(\"is_admin\", true)",
		"orderDesc(\"$createdAt\")",
	}

	docs, err := s.appwriteClient.Database.ListDocuments(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteUsersCollectionID,
		queries,
	)
	if err != nil {
		return nil, err
	}

	var admins []models.User
	for _, doc := range docs.Documents {
		var user models.User
		if err := s.mapDocumentToUser(doc.Data, &user); err != nil {
			continue
		}
		user.ID = doc.Id
		admins = append(admins, user)
	}

	return admins, nil
}

func (s *AdminService) UpdateAdminRole(adminID string, newRole models.UserRole, updaterID string) (*models.User, error) {
	// Verify updater is super admin
	updater, err := s.userService.GetUserByID(updaterID)
	if err != nil {
		return nil, fmt.Errorf("updater not found: %v", err)
	}

	if updater.Role != models.RoleSuperAdmin {
		return nil, fmt.Errorf("only super admins can update admin roles")
	}

	// Get admin to update
	admin, err := s.userService.GetUserByID(adminID)
	if err != nil {
		return nil, fmt.Errorf("admin not found: %v", err)
	}

	// Prevent updating super admin role (except by themselves)
	if admin.Role == models.RoleSuperAdmin && updaterID != adminID {
		return nil, fmt.Errorf("cannot update super admin role")
	}

	// Update role
	updateData := map[string]interface{}{
		"role":     string(newRole),
		"is_admin": newRole == models.RoleAdmin || newRole == models.RoleSuperAdmin,
	}

	doc, err := s.appwriteClient.Database.UpdateDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteUsersCollectionID,
		adminID,
		updateData,
		nil,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update admin role: %v", err)
	}

	var updatedUser models.User
	if err := s.mapDocumentToUser(doc.Data, &updatedUser); err != nil {
		return nil, err
	}

	updatedUser.ID = doc.Id
	return &updatedUser, nil
}

func (s *AdminService) DeleteAdmin(adminID string, deleterID string) error {
	// Verify deleter is super admin
	deleter, err := s.userService.GetUserByID(deleterID)
	if err != nil {
		return fmt.Errorf("deleter not found: %v", err)
	}

	if deleter.Role != models.RoleSuperAdmin {
		return fmt.Errorf("only super admins can delete admin accounts")
	}

	// Get admin to delete
	admin, err := s.userService.GetUserByID(adminID)
	if err != nil {
		return fmt.Errorf("admin not found: %v", err)
	}

	// Prevent deleting super admin
	if admin.Role == models.RoleSuperAdmin {
		return fmt.Errorf("cannot delete super admin account")
	}

	// Prevent self-deletion
	if adminID == deleterID {
		return fmt.Errorf("cannot delete your own account")
	}

	// Delete from database
	_, err = s.appwriteClient.Database.DeleteDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteUsersCollectionID,
		adminID,
	)
	if err != nil {
		return fmt.Errorf("failed to delete admin: %v", err)
	}

	return nil
}

func (s *AdminService) GetDashboardStats() (*AdminStats, error) {
	// Get total users
	userDocs, err := s.appwriteClient.Database.ListDocuments(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteUsersCollectionID,
		[]string{"limit(1000)"},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get users count: %v", err)
	}

	// Get total posts
	postDocs, err := s.appwriteClient.Database.ListDocuments(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwritePostsCollectionID,
		[]string{"limit(1000)"},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get posts count: %v", err)
	}

	// Get total comments
	commentDocs, err := s.appwriteClient.Database.ListDocuments(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteCommentsCollectionID,
		[]string{"limit(1000)"},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get comments count: %v", err)
	}

	// Count admins
	adminCount := int64(0)
	for _, doc := range userDocs.Documents {
		var user models.User
		if err := s.mapDocumentToUser(doc.Data, &user); err != nil {
			continue
		}
		if user.IsAdmin {
			adminCount++
		}
	}

	return &AdminStats{
		TotalUsers:    int64(len(userDocs.Documents)),
		TotalPosts:    int64(len(postDocs.Documents)),
		TotalComments: int64(len(commentDocs.Documents)),
		TotalAdmins:   adminCount,
	}, nil
}

func (s *AdminService) getUserByEmail(email string) (*models.User, error) {
	queries := []string{
		fmt.Sprintf("equal(\"email\", \"%s\")", email),
	}

	docs, err := s.appwriteClient.Database.ListDocuments(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteUsersCollectionID,
		queries,
	)
	if err != nil {
		return nil, err
	}

	if len(docs.Documents) == 0 {
		return nil, fmt.Errorf("user not found")
	}

	var user models.User
	if err := s.mapDocumentToUser(docs.Documents[0].Data, &user); err != nil {
		return nil, err
	}

	user.ID = docs.Documents[0].Id
	return &user, nil
}

func (s *AdminService) updateUserRole(userID string, role models.UserRole) error {
	updateData := map[string]interface{}{
		"role":     string(role),
		"is_admin": role == models.RoleAdmin || role == models.RoleSuperAdmin,
	}

	_, err := s.appwriteClient.Database.UpdateDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteUsersCollectionID,
		userID,
		updateData,
		nil,
	)

	return err
}

func (s *AdminService) mapDocumentToUser(data interface{}, user *models.User) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	return json.Unmarshal(jsonData, user)
}