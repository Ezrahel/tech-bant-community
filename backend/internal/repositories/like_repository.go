package repositories

import (
	"nothing-community-backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type LikeRepository struct {
	db *gorm.DB
}

func NewLikeRepository(db *gorm.DB) *LikeRepository {
	return &LikeRepository{db: db}
}

func (r *LikeRepository) Create(like *models.Like) error {
	return r.db.Create(like).Error
}

func (r *LikeRepository) Delete(like *models.Like) error {
	return r.db.Delete(like).Error
}

func (r *LikeRepository) GetPostLike(userID, postID uuid.UUID) (*models.Like, error) {
	var like models.Like
	err := r.db.Where("user_id = ? AND post_id = ?", userID, postID).First(&like).Error
	return &like, err
}

func (r *LikeRepository) GetCommentLike(userID, commentID uuid.UUID) (*models.Like, error) {
	var like models.Like
	err := r.db.Where("user_id = ? AND comment_id = ?", userID, commentID).First(&like).Error
	return &like, err
}

func (r *LikeRepository) CountPostLikes(postID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.Like{}).Where("post_id = ?", postID).Count(&count).Error
	return count, err
}

func (r *LikeRepository) CountCommentLikes(commentID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.Like{}).Where("comment_id = ?", commentID).Count(&count).Error
	return count, err
}

func (r *LikeRepository) GetPostLikes(postID uuid.UUID) ([]models.Like, error) {
	var likes []models.Like
	err := r.db.Preload("User").Where("post_id = ?", postID).Find(&likes).Error
	return likes, err
}

func (r *LikeRepository) IsPostLikedByUser(userID, postID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&models.Like{}).Where("user_id = ? AND post_id = ?", userID, postID).Count(&count).Error
	return count > 0, err
}

func (r *LikeRepository) IsCommentLikedByUser(userID, commentID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&models.Like{}).Where("user_id = ? AND comment_id = ?", userID, commentID).Count(&count).Error
	return count > 0, err
}