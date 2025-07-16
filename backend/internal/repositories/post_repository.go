package repositories

import (
	"nothing-community-backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostRepository struct {
	db *gorm.DB
}

func NewPostRepository(db *gorm.DB) *PostRepository {
	return &PostRepository{db: db}
}

func (r *PostRepository) Create(post *models.Post) error {
	return r.db.Create(post).Error
}

func (r *PostRepository) GetByID(id uuid.UUID) (*models.Post, error) {
	var post models.Post
	err := r.db.Preload("Author").Preload("Media").Where("id = ?", id).First(&post).Error
	return &post, err
}

func (r *PostRepository) GetAll(limit, offset int) ([]models.Post, error) {
	var posts []models.Post
	err := r.db.Preload("Author").Preload("Media").
		Order("is_pinned DESC, created_at DESC").
		Limit(limit).Offset(offset).Find(&posts).Error
	return posts, err
}

func (r *PostRepository) GetByCategory(category models.PostCategory, limit, offset int) ([]models.Post, error) {
	var posts []models.Post
	err := r.db.Preload("Author").Preload("Media").
		Where("category = ?", category).
		Order("is_pinned DESC, created_at DESC").
		Limit(limit).Offset(offset).Find(&posts).Error
	return posts, err
}

func (r *PostRepository) GetByUserID(userID uuid.UUID, limit, offset int) ([]models.Post, error) {
	var posts []models.Post
	err := r.db.Preload("Author").Preload("Media").
		Where("author_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).Offset(offset).Find(&posts).Error
	return posts, err
}

func (r *PostRepository) Update(post *models.Post) error {
	return r.db.Save(post).Error
}

func (r *PostRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Post{}, id).Error
}

func (r *PostRepository) IncrementViews(id uuid.UUID) error {
	return r.db.Model(&models.Post{}).Where("id = ?", id).Update("views", gorm.Expr("views + 1")).Error
}

func (r *PostRepository) UpdateLikesCount(id uuid.UUID, count int64) error {
	return r.db.Model(&models.Post{}).Where("id = ?", id).Update("likes_count", count).Error
}

func (r *PostRepository) UpdateCommentsCount(id uuid.UUID, count int64) error {
	return r.db.Model(&models.Post{}).Where("id = ?", id).Update("comments_count", count).Error
}

func (r *PostRepository) IncrementShares(id uuid.UUID) error {
	return r.db.Model(&models.Post{}).Where("id = ?", id).Update("shares_count", gorm.Expr("shares_count + 1")).Error
}

func (r *PostRepository) Search(query string, limit, offset int) ([]models.Post, error) {
	var posts []models.Post
	err := r.db.Preload("Author").Preload("Media").
		Where("title ILIKE ? OR content ILIKE ? OR ? = ANY(tags)", "%"+query+"%", "%"+query+"%", query).
		Order("created_at DESC").
		Limit(limit).Offset(offset).Find(&posts).Error
	return posts, err
}