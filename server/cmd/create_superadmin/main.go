package main

import (
	"context"
	"log"
	"strings"
	"time"

	"tech-bant-community/server/config"
	"tech-bant-community/server/firebase"
	"tech-bant-community/server/models"

	"cloud.google.com/go/firestore"
	"firebase.google.com/go/v4/auth"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize Firebase
	if err := firebase.Initialize(cfg); err != nil {
		log.Fatalf("Failed to initialize Firebase: %v", err)
	}
	defer firebase.Close()

	ctx := context.Background()

	// Superadmin credentials
	email := "adelakinisrael024@gmail.com"
	password := "Taepryung024"
	name := "Super Admin"

	// First, check if user exists in Firestore by email
	iter := firebase.DB.Collection("users").Where("email", "==", email).Limit(1).Documents(ctx)
	doc, err := iter.Next()

	var existingUserID string
	if err == nil && doc != nil && doc.Exists() {
		existingUserID = doc.Ref.ID
		log.Printf("User with email %s found in Firestore. Checking Firebase Auth...", email)

		// Try to get user from Firebase Auth
		authUser, authErr := firebase.AuthClient.GetUser(ctx, existingUserID)
		if authErr == nil && authUser != nil {
			log.Printf("User exists in Firebase Auth. Updating to super admin...")

			// Update user in Firebase Auth (try to set password if not set)
			updateParams := (&auth.UserToUpdate{}).
				Email(email).
				DisplayName(name).
				EmailVerified(true)

			// Try to update password (may fail if password auth not enabled, but that's ok)
			updateParams = updateParams.Password(password)

			_, err = firebase.AuthClient.UpdateUser(ctx, existingUserID, updateParams)
			if err != nil {
				log.Printf("Warning: Could not update user in Firebase Auth (this is ok if Email/Password auth is not enabled): %v", err)
				log.Printf("Continuing with Firestore update...")
			}

			// Update user in Firestore
			now := time.Now().UTC()
			userRef := firebase.DB.Collection("users").Doc(existingUserID)
			updates := []firestore.Update{
				{Path: "name", Value: name},
				{Path: "is_admin", Value: true},
				{Path: "is_verified", Value: true},
				{Path: "is_active", Value: true},
				{Path: "role", Value: models.RoleSuperAdmin},
				{Path: "updated_at", Value: now},
			}
			_, err = userRef.Update(ctx, updates)
			if err != nil {
				log.Fatalf("Failed to update user in Firestore: %v", err)
			}

			log.Printf("✅ Super admin account updated successfully!")
			log.Printf("   Email: %s", email)
			log.Printf("   User ID: %s", existingUserID)
			log.Printf("   Role: %s", models.RoleSuperAdmin)
			log.Printf("")
			log.Printf("Note: If Email/Password auth is not enabled in Firebase Console,")
			log.Printf("      you may need to enable it or use OAuth to login.")
			return
		}
	}

	// User doesn't exist, create new user in Firebase Auth
	log.Printf("Creating new super admin account...")
	userParams := (&auth.UserToCreate{}).
		Email(email).
		Password(password).
		DisplayName(name).
		EmailVerified(true)

	authUser, err := firebase.AuthClient.CreateUser(ctx, userParams)
	if err != nil {
		errMsg := err.Error()
		// Check if error is about IdP configuration
		if strings.Contains(errMsg, "no IdP configuration") ||
			strings.Contains(errMsg, "IdP configuration") ||
			strings.Contains(errMsg, "EMAIL_EXISTS") {
			log.Printf("")
			log.Printf("❌ ERROR: Failed to create user in Firebase Auth")
			log.Printf("")
			log.Printf("Error: %v", err)
			log.Printf("")
			log.Printf("Possible causes:")
			log.Printf("1. Email/Password authentication is not enabled in Firebase Console")
			log.Printf("   → Go to Firebase Console > Authentication > Sign-in method")
			log.Printf("   → Enable 'Email/Password' provider")
			log.Printf("   → Click 'Save'")
			log.Printf("")
			log.Printf("2. User already exists with different provider")
			log.Printf("   → Check Firebase Console > Authentication > Users")
			log.Printf("")
			log.Printf("Solution:")
			log.Printf("1. Enable Email/Password auth in Firebase Console (see above)")
			log.Printf("2. Run this script again: go run cmd/create_superadmin/main.go")
			log.Printf("")
			log.Printf("For detailed instructions, see: FIREBASE_SETUP_GUIDE.md")
			log.Printf("")
			log.Fatalf("Please enable Email/Password authentication and try again.")
		}
		log.Fatalf("Failed to create user in Firebase Auth: %v", err)
	}

	// Create user profile in Firestore
	now := time.Now().UTC()
	user := models.User{
		ID:             authUser.UID,
		Name:           name,
		Email:          email,
		Avatar:         "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop",
		IsAdmin:        true,
		IsVerified:     true,
		IsActive:       true,
		Role:           models.RoleSuperAdmin,
		Provider:       "email",
		PostsCount:     0,
		FollowersCount: 0,
		FollowingCount: 0,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	_, err = firebase.DB.Collection("users").Doc(authUser.UID).Set(ctx, user)
	if err != nil {
		// Rollback: delete from Firebase Auth
		if delErr := firebase.AuthClient.DeleteUser(ctx, authUser.UID); delErr != nil {
			log.Fatalf("Failed to create user in Firestore and rollback failed: %v, %v", err, delErr)
		}
		log.Fatalf("Failed to create user in Firestore: %v", err)
	}

	log.Printf("✅ Super admin account created successfully!")
	log.Printf("   Email: %s", email)
	log.Printf("   Password: %s", password)
	log.Printf("   Role: %s", models.RoleSuperAdmin)
	log.Printf("   User ID: %s", authUser.UID)
}
