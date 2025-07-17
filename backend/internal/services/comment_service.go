package services

import (
	"encoding/json"
	"fmt"
	"nothing-community-backend/internal/database"
	"nothing-community-backend/internal/models"
)

type CommentService struct {
	appwriteClient *database.AppwriteClient
	userService    *UserService
}

func NewCommentService(appwriteClient *database.AppwriteClient, userService *UserService) *CommentService {
	return &CommentService{
		appwriteClient: appwriteClient,
		userService:    userService,
	}
}

func (s *CommentService) CreateComment(userID string, req models.CreateCommentRequest) (*models.CommentResponse, error) {
	// Get user info
	user, err := s.userService.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %v", err)
	}

	// Create comment data
	commentData := map[string]interface{}{
		"content":         req.Content,
		"post_id":         req.PostID,
		"author_id":       userID,
		"author_name":     user.Name,
		"author_avatar":   user.Avatar,
		"author_admin":    user.IsAdmin,
		"author_verified": user.IsVerified,
		"parent_id":       req.ParentID,
		"likes_count":     0,
	}

	doc, err := s.appwriteClient.Database.CreateDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteCommentsCollectionID,
		"unique()",
		commentData,
	)
	if err != nil {
		return nil, err
	}

	// Update post comments count
	s.updatePostCommentsCount(req.PostID)

	return s.documentToCommentResponse(doc, doc.Id, userID)
}

func (s *CommentService) GetComments(postID, userID string) ([]models.CommentResponse, error) {
	queries := []string{
		fmt.Sprintf("equal(\"post_id\", \"%s\")", postID),
		"orderAsc(\"$createdAt\")",
	}

	docs, err := s.appwriteClient.Database.ListDocuments(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteCommentsCollectionID,
		s.appwriteClient.Database.WithListDocumentsQueries(queries),
	)
	if err != nil {
		return nil, err
	}

	var comments []models.CommentResponse
	for _, doc := range docs.Documents {
		comment, err := s.documentToCommentResponse(doc, doc.Id, userID)
		if err != nil {
			continue
		}
		comments = append(comments, *comment)
	}

	return comments, nil
}

func (s *CommentService) UpdateComment(commentID, userID string, req models.UpdateCommentRequest) (*models.CommentResponse, error) {
	// Check if user owns the comment
	comment, err := s.GetComment(commentID, userID)
	if err != nil {
		return nil, err
	}

	if comment.Author.ID != userID {
		return nil, fmt.Errorf("unauthorized")
	}

	updateData := map[string]interface{}{
		"content": req.Content,
	}

	doc, err := s.appwriteClient.Database.UpdateDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteCommentsCollectionID,
		commentID,
		s.appwriteClient.Database.WithUpdateDocumentData(updateData),
	)
	if err != nil {
		return nil, err
	}

	return s.documentToCommentResponse(doc, doc.Id, userID)
}

func (s *CommentService) DeleteComment(commentID, userID string) error {
	// Check if user owns the comment
	comment, err := s.GetComment(commentID, userID)
	if err != nil {
		return err
	}

	if comment.Author.ID != userID {
		return fmt.Errorf("unauthorized")
	}

	_, err = s.appwriteClient.Database.DeleteDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteCommentsCollectionID,
		commentID,
	)
	if err != nil {
		return err
	}

	// Update post comments count
	s.updatePostCommentsCount(comment.PostID)

	return nil
}

func (s *CommentService) GetComment(commentID, userID string) (*models.CommentResponse, error) {
	doc, err := s.appwriteClient.Database.GetDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteCommentsCollectionID,
		commentID,
	)
	if err != nil {
		return nil, err
	}

	return s.documentToCommentResponse(doc, doc.Id, userID)
}

func (s *CommentService) updatePostCommentsCount(postID string) {
	queries := []string{
		fmt.Sprintf("equal(\"post_id\", \"%s\")", postID),
	}

	docs, err := s.appwriteClient.Database.ListDocuments(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteCommentsCollectionID,
		s.appwriteClient.Database.WithListDocumentsQueries(queries),
	)
	if err != nil {
		return
	}

	count := len(docs.Documents)

	// Update post
	updateData := map[string]interface{}{
		"comments_count": count,
	}

	s.appwriteClient.Database.UpdateDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwritePostsCollectionID,
		postID,
		s.appwriteClient.Database.WithUpdateDocumentData(updateData),
	)
}

func (s *CommentService) documentToCommentResponse(data interface{}, id, userID string) (*models.CommentResponse, error) {
	var comment models.Comment
	if err := s.mapDocumentToComment(data, &comment); err != nil {
		return nil, err
	}

	comment.ID = id

	// Create author user
	author := models.User{
		ID:         comment.AuthorID,
		Name:       comment.AuthorName,
		Avatar:     comment.AuthorAvatar,
		IsAdmin:    comment.AuthorAdmin,
		IsVerified: comment.AuthorVerified,
	}

	// Check if user liked the comment (implement this based on your like service)
	isLiked := false // TODO: Implement like check

	return &models.CommentResponse{
		ID:         comment.ID,
		Content:    comment.Content,
		PostID:     comment.PostID,
		ParentID:   comment.ParentID,
		Author:     author,
		LikesCount: comment.LikesCount,
		IsLiked:    isLiked,
		CreatedAt:  comment.CreatedAt,
		UpdatedAt:  comment.UpdatedAt,
	}, nil
}

func (s *CommentService) mapDocumentToComment(data interface{}, comment *models.Comment) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	return json.Unmarshal(jsonData, comment)
}
