package repositories

import (
	"nothing-community-backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MediaRepository struct {
	db *gorm.DB
}

func NewMediaRepository(db *gorm.DB) *MediaRepository {
	return &MediaRepository{db: db}
}

func (r *MediaRepository) Create(media *models.Media) error {
	return r.db.Create(media).Error
}

func (r *MediaRepository) GetByID(id uuid.UUID) (*models.Media, error) {
	var media models.Media
	err := r.db.Where("id = ?", id).First(&media).Error
	return &media, err
}

func (r *MediaRepository) GetByPostID(postID uuid.UUID) ([]models.Media, error) {
	var media []models.Media
	err := r.db.Where("post_id = ?", postID).Find(&media).Error
	return media, err
}

func (r *MediaRepository) Update(media *models.Media) error {
	return r.db.Save(media).Error
}

func (r *MediaRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Media{}, id).Error
}

func (r *MediaRepository) GetByUserID(userID uuid.UUID) ([]models.Media, error) {
	var media []models.Media
	err := r.db.Where("user_id = ?", userID).Find(&media).Error
	return media, err
}