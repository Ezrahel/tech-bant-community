package main

import (
	"context"
	"log"

	"tech-bant-community/server/config"
	"tech-bant-community/server/models"
	"tech-bant-community/server/services"
	"tech-bant-community/server/supabase"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize Supabase
	if err := supabase.Initialize(cfg); err != nil {
		log.Fatalf("Failed to initialize Supabase: %v", err)
	}
	defer supabase.Close()

	ctx := context.Background()

	// Superadmin credentials
	email := "adelakinisrael024@gmail.com"
	password := "Taepryung024"
	name := "Super Admin"
	role := models.RoleSuperAdmin

	// Create super admin using Supabase Auth Admin API + Postgres profile
	adminService := services.NewAdminService(supabase.GetDB())
	createdUser, err := adminService.CreateAdmin(ctx, &models.CreateAdminRequest{
		Name:     name,
		Email:    email,
		Password: password,
		Role:     role,
	}, cfg)
	if err != nil {
		log.Fatalf("Failed to create super admin: %v", err)
	}

	log.Printf("✅ Super admin account created successfully!")
	log.Printf("   Email: %s", email)
	log.Printf("   Password: %s", password)
	log.Printf("   Role: %s", role)
	log.Printf("   User ID: %s", createdUser.ID)
}
