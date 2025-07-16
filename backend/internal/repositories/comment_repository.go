package repositories

import (
	"nothing-community-backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CommentRepository struct {
	db *gorm.DB
}

func NewCommentRepository(db *gorm.DB) *CommentRepository {
	return &CommentRepository{db: db}
}

func (r *CommentRepository) Create(comment *models.Comment) error {
	return r.db.Create(comment).Error
}

func (r *CommentRepository) GetByID(id uuid.UUID) (*models.Comment, error) {
	var comment models.Comment
	err := r.db.Preload("Author").Where("id = ?", id).First(&comment).Error
	return &comment, err
}

func (r *CommentRepository) GetByPostID(postID uuid.UUID) ([]models.Comment, error) {
	var comments []models.Comment
	err := r.db.Preload("Author").Preload("Replies.Author").
		Where("post_id = ? AND parent_id IS NULL", postID).
		Order("created_at ASC").Find(&comments).Error
	return comments, err
}

func (r *CommentRepository) Update(comment *models.Comment) error {
	return r.db.Save(comment).Error
}

func (r *CommentRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Comment{}, id).Error
}

func (r *CommentRepository) UpdateLikesCount(id uuid.UUID, count int64) error {
	return r.db.Model(&models.Comment{}).Where("id = ?", id).Update("likes_count", count).Error
}

func (r *CommentRepository) CountByPostID(postID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.Comment{}).Where("post_id = ?", postID).Count(&count).Error
	return count, err
}