package models

import (
	"time"
)

type UserRole string

const (
	RoleUser       UserRole = "user"
	RoleAdmin      UserRole = "admin"
	RoleSuperAdmin UserRole = "super_admin"
)

type User struct {
	ID         string    `json:"$id,omitempty"`
	Name       string    `json:"name" validate:"required,min=2,max=50"`
	Email      string    `json:"email" validate:"required,email"`
	Avatar     string    `json:"avatar"`
	Bio        string    `json:"bio"`
	Location   string    `json:"location"`
	Website    string    `json:"website"`
	IsAdmin    bool      `json:"is_admin"`
	IsVerified bool      `json:"is_verified"`
	IsActive   bool      `json:"is_active"`
	Role       UserRole  `json:"role"`
	Provider   string    `json:"provider"` // email, google, github
	Password   string    `json:"password,omitempty"` // Only for email auth
	CreatedAt  time.Time `json:"$createdAt,omitempty"`
	UpdatedAt  time.Time `json:"$updatedAt,omitempty"`
}

type CreateUserRequest struct {
	Name     string `json:"name" validate:"required,min=2,max=50"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type UpdateUserRequest struct {
	Name     string `json:"name,omitempty" validate:"omitempty,min=2,max=50"`
	Bio      string `json:"bio,omitempty" validate:"omitempty,max=500"`
	Location string `json:"location,omitempty" validate:"omitempty,max=100"`
	Website  string `json:"website,omitempty" validate:"omitempty,url"`
	Avatar   string `json:"avatar,omitempty" validate:"omitempty,url"`
}

type CreateAdminRequest struct {
	Name     string   `json:"name" validate:"required,min=2,max=50"`
	Email    string   `json:"email" validate:"required,email"`
	Password string   `json:"password" validate:"required,min=6"`
	Role     UserRole `json:"role" validate:"required"`
}

type AuthResponse struct {
	User    User   `json:"user"`
	Session string `json:"session"`
}