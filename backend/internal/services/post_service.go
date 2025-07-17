package services

import (
	"encoding/json"
	"fmt"
	"nothing-community-backend/internal/database"
	"nothing-community-backend/internal/models"
)

type PostService struct {
	appwriteClient *database.AppwriteClient
	userService    *UserService
	mediaService   *MediaService
}

func NewPostService(appwriteClient *database.AppwriteClient, userService *UserService, mediaService *MediaService) *PostService {
	return &PostService{
		appwriteClient: appwriteClient,
		userService:    userService,
		mediaService:   mediaService,
	}
}

func (s *PostService) CreatePost(userID string, req models.CreatePostRequest) (*models.PostResponse, error) {
	// Get user info
	user, err := s.userService.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %v", err)
	}

	// Create post data
	postData := map[string]interface{}{
		"title":           req.Title,
		"content":         req.Content,
		"category":        string(req.Category),
		"tags":            req.Tags,
		"author_id":       userID,
		"author_name":     user.Name,
		"author_avatar":   user.Avatar,
		"author_admin":    user.IsAdmin,
		"author_verified": user.IsVerified,
		"views":           0,
		"likes_count":     0,
		"comments_count":  0,
		"shares_count":    0,
		"is_pinned":       false,
		"is_hot":          false,
		"location":        req.Location,
		"media_ids":       req.MediaIDs,
	}

	doc, err := s.appwriteClient.Database.CreateDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwritePostsCollectionID,
		"unique()",
		postData,
	)
	if err != nil {
		return nil, err
	}

	// Convert to response
	return s.documentToPostResponse(doc, doc.Id, userID)
}

func (s *PostService) GetPost(postID, userID string) (*models.PostResponse, error) {
	doc, err := s.appwriteClient.Database.GetDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwritePostsCollectionID,
		postID,
	)
	if err != nil {
		return nil, err
	}

	// Increment views
	s.incrementViews(postID)

	return s.documentToPostResponse(doc, doc.Id, userID)
}

func (s *PostService) GetPosts(limit, offset int, userID string) ([]models.PostResponse, error) {
	queries := []string{
		fmt.Sprintf("limit(%d)", limit),
		fmt.Sprintf("offset(%d)", offset),
		"orderDesc(\"$createdAt\")",
	}

	docs, err := s.appwriteClient.Database.ListDocuments(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwritePostsCollectionID,
		s.appwriteClient.Database.WithListDocumentsQueries(queries),
	)
	if err != nil {
		return nil, err
	}

	var posts []models.PostResponse
	for _, doc := range docs.Documents {
		post, err := s.documentToPostResponse(doc, doc.Id, userID)
		if err != nil {
			continue
		}
		posts = append(posts, *post)
	}

	return posts, nil
}

func (s *PostService) GetPostsByCategory(category models.PostCategory, limit, offset int, userID string) ([]models.PostResponse, error) {
	queries := []string{
		fmt.Sprintf("equal(\"category\", \"%s\")", string(category)),
		fmt.Sprintf("limit(%d)", limit),
		fmt.Sprintf("offset(%d)", offset),
		"orderDesc(\"$createdAt\")",
	}

	docs, err := s.appwriteClient.Database.ListDocuments(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwritePostsCollectionID,
		s.appwriteClient.Database.WithListDocumentsQueries(queries),
	)
	if err != nil {
		return nil, err
	}

	var posts []models.PostResponse
	for _, doc := range docs.Documents {
		post, err := s.documentToPostResponse(doc, doc.Id, userID)
		if err != nil {
			continue
		}
		posts = append(posts, *post)
	}

	return posts, nil
}

func (s *PostService) GetPostsByUser(targetUserID string, limit, offset int, userID string) ([]models.PostResponse, error) {
	queries := []string{
		fmt.Sprintf("equal(\"author_id\", \"%s\")", targetUserID),
		fmt.Sprintf("limit(%d)", limit),
		fmt.Sprintf("offset(%d)", offset),
		"orderDesc(\"$createdAt\")",
	}

	docs, err := s.appwriteClient.Database.ListDocuments(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwritePostsCollectionID,
		s.appwriteClient.Database.WithListDocumentsQueries(queries),
	)
	if err != nil {
		return nil, err
	}

	var posts []models.PostResponse
	for _, doc := range docs.Documents {
		post, err := s.documentToPostResponse(doc, doc.Id, userID)
		if err != nil {
			continue
		}
		posts = append(posts, *post)
	}

	return posts, nil
}

func (s *PostService) UpdatePost(postID, userID string, req models.UpdatePostRequest) (*models.PostResponse, error) {
	// Check if user owns the post
	post, err := s.GetPost(postID, userID)
	if err != nil {
		return nil, err
	}

	if post.Author.ID != userID {
		return nil, fmt.Errorf("unauthorized")
	}

	// Create update data
	updateData := make(map[string]interface{})
	if req.Title != "" {
		updateData["title"] = req.Title
	}
	if req.Content != "" {
		updateData["content"] = req.Content
	}
	if req.Category != "" {
		updateData["category"] = string(req.Category)
	}
	if req.Tags != nil {
		updateData["tags"] = req.Tags
	}
	if req.Location != "" {
		updateData["location"] = req.Location
	}

	doc, err := s.appwriteClient.Database.UpdateDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwritePostsCollectionID,
		postID,
		s.appwriteClient.Database.WithUpdateDocumentData(updateData),
	)
	if err != nil {
		return nil, err
	}

	return s.documentToPostResponse(doc, doc.Id, userID)
}

func (s *PostService) DeletePost(postID, userID string) error {
	// Check if user owns the post
	post, err := s.GetPost(postID, userID)
	if err != nil {
		return err
	}

	if post.Author.ID != userID {
		return fmt.Errorf("unauthorized")
	}

	_, err = s.appwriteClient.Database.DeleteDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwritePostsCollectionID,
		postID,
	)

	return err
}

func (s *PostService) incrementViews(postID string) {
	// Get current post
	doc, err := s.appwriteClient.Database.GetDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwritePostsCollectionID,
		postID,
	)
	if err != nil {
		return
	}

	// Get current views
	var post models.Post
	s.mapDocumentToPost(doc, &post)

	// Increment views
	newViews := post.Views + 1

	// Update post
	updateData := map[string]interface{}{
		"views": newViews,
	}

	s.appwriteClient.Database.UpdateDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwritePostsCollectionID,
		postID,
		s.appwriteClient.Database.WithUpdateDocumentData(updateData),
	)
}

func (s *PostService) documentToPostResponse(data interface{}, id, userID string) (*models.PostResponse, error) {
	var post models.Post
	if err := s.mapDocumentToPost(data, &post); err != nil {
		return nil, err
	}

	post.ID = id

	// Create author user
	author := models.User{
		ID:         post.AuthorID,
		Name:       post.AuthorName,
		Avatar:     post.AuthorAvatar,
		IsAdmin:    post.AuthorAdmin,
		IsVerified: post.AuthorVerified,
	}

	// Check if user liked the post (implement this based on your like service)
	isLiked := false // TODO: Implement like check

	return &models.PostResponse{
		ID:            post.ID,
		Title:         post.Title,
		Content:       post.Content,
		Category:      post.Category,
		Tags:          post.Tags,
		Author:        author,
		Views:         post.Views,
		LikesCount:    post.LikesCount,
		CommentsCount: post.CommentsCount,
		SharesCount:   post.SharesCount,
		IsPinned:      post.IsPinned,
		IsHot:         post.IsHot,
		Location:      post.Location,
		Media:         []models.Media{}, // TODO: Load media from MediaIDs
		IsLiked:       isLiked,
		CreatedAt:     post.CreatedAt,
		UpdatedAt:     post.UpdatedAt,
	}, nil
}

func (s *PostService) mapDocumentToPost(data interface{}, post *models.Post) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	return json.Unmarshal(jsonData, post)
}
