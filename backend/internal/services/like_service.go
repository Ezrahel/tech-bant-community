package services

import (
	"encoding/json"
	"fmt"
	"nothing-community-backend/internal/database"
	"nothing-community-backend/internal/models"

	"github.com/appwrite/sdk-for-go/appwrite"
)

type LikeService struct {
	appwriteClient *database.AppwriteClient
}

	return &LikeService{
		appwriteClient: appwriteClient,
	}
}

func (s *LikeService) TogglePostLike(userID, postID string) (bool, error) {
	// Check if like already exists
	existingLike, err := s.getPostLike(userID, postID)
	if err == nil && existingLike != nil {
		// Unlike - remove the like
		_, err := s.appwriteClient.Database.DeleteDocument(
			s.appwriteClient.Config.AppwriteDatabaseID,
			s.appwriteClient.Config.AppwriteLikesCollectionID,
			existingLike.ID,
		)
		if err != nil {
			return false, err
		}

		// Update post likes count
		s.updatePostLikesCount(postID)
		return false, nil
	}

	// Like - create new like
	likeData := map[string]interface{}{
		"user_id": userID,
		"post_id": postID,
		"type":    string(models.LikeTypePost),
	}

	_, err = s.appwriteClient.Database.CreateDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteLikesCollectionID,
		appwrite.ID.Unique(),
		likeData,
		nil,
	)
	if err != nil {
		return false, err
	}

	// Update post likes count
	s.updatePostLikesCount(postID)
	return true, nil
}

func (s *LikeService) ToggleCommentLike(userID, commentID string) (bool, error) {
	// Check if like already exists
	existingLike, err := s.getCommentLike(userID, commentID)
	if err == nil && existingLike != nil {
		// Unlike - remove the like
		_, err := s.appwriteClient.Database.DeleteDocument(
			s.appwriteClient.Config.AppwriteDatabaseID,
			s.appwriteClient.Config.AppwriteLikesCollectionID,
			existingLike.ID,
		)
		if err != nil {
			return false, err
		}

		// Update comment likes count
		s.updateCommentLikesCount(commentID)
		return false, nil
	}

	// Like - create new like
	likeData := map[string]interface{}{
		"user_id":    userID,
		"comment_id": commentID,
		"type":       string(models.LikeTypeComment),
	}

	_, err = s.appwriteClient.Database.CreateDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteLikesCollectionID,
		appwrite.ID.Unique(),
		likeData,
		nil,
	)
	if err != nil {
		return false, err
	}

	// Update comment likes count
	s.updateCommentLikesCount(commentID)
	return true, nil
}

func (s *LikeService) GetPostLikes(postID string) ([]models.User, error) {
	queries := []string{
		fmt.Sprintf("equal(\"post_id\", \"%s\")", postID),
		fmt.Sprintf("equal(\"type\", \"%s\")", string(models.LikeTypePost)),
	}

	docs, err := s.appwriteClient.Database.ListDocuments(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteLikesCollectionID,
		queries,
	)
	if err != nil {
		return nil, err
	}

	var users []models.User
	for _, doc := range docs.Documents {
		var like models.Like
		if err := s.mapDocumentToLike(doc.Data, &like); err != nil {
			continue
		}

		// Get user info (you might want to cache this)
		user, err := s.getUserByID(like.UserID)
		if err != nil {
			continue
		}

		users = append(users, *user)
	}

	return users, nil
}

func (s *LikeService) IsPostLikedByUser(userID, postID string) (bool, error) {
	like, err := s.getPostLike(userID, postID)
	return like != nil && err == nil, nil
}

func (s *LikeService) IsCommentLikedByUser(userID, commentID string) (bool, error) {
	like, err := s.getCommentLike(userID, commentID)
	return like != nil && err == nil, nil
}

func (s *LikeService) getPostLike(userID, postID string) (*models.Like, error) {
	queries := []string{
		fmt.Sprintf("equal(\"user_id\", \"%s\")", userID),
		fmt.Sprintf("equal(\"post_id\", \"%s\")", postID),
		fmt.Sprintf("equal(\"type\", \"%s\")", string(models.LikeTypePost)),
	}

	docs, err := s.appwriteClient.Database.ListDocuments(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteLikesCollectionID,
		queries,
	)
	if err != nil {
		return nil, err
	}

	if len(docs.Documents) == 0 {
		return nil, fmt.Errorf("like not found")
	}

	var like models.Like
	if err := s.mapDocumentToLike(docs.Documents[0].Data, &like); err != nil {
		return nil, err
	}

	like.ID = docs.Documents[0].Id
	return &like, nil
}

func (s *LikeService) getCommentLike(userID, commentID string) (*models.Like, error) {
	queries := []string{
		fmt.Sprintf("equal(\"user_id\", \"%s\")", userID),
		fmt.Sprintf("equal(\"comment_id\", \"%s\")", commentID),
		fmt.Sprintf("equal(\"type\", \"%s\")", string(models.LikeTypeComment)),
	}

	docs, err := s.appwriteClient.Database.ListDocuments(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteLikesCollectionID,
		queries,
	)
	if err != nil {
		return nil, err
	}

	if len(docs.Documents) == 0 {
		return nil, fmt.Errorf("like not found")
	}

	var like models.Like
	if err := s.mapDocumentToLike(docs.Documents[0].Data, &like); err != nil {
		return nil, err
	}

	like.ID = docs.Documents[0].Id
	return &like, nil
}

func (s *LikeService) updatePostLikesCount(postID string) {
	queries := []string{
		fmt.Sprintf("equal(\"post_id\", \"%s\")", postID),
		fmt.Sprintf("equal(\"type\", \"%s\")", string(models.LikeTypePost)),
	}

	docs, err := s.appwriteClient.Database.ListDocuments(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteLikesCollectionID,
		queries,
	)
	if err != nil {
		return
	}

	count := len(docs.Documents)

	// Update post
	updateData := map[string]interface{}{
		"likes_count": count,
	}

	s.appwriteClient.Database.UpdateDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwritePostsCollectionID,
		postID,
		updateData,
		nil,
	)
}

func (s *LikeService) updateCommentLikesCount(commentID string) {
	queries := []string{
		fmt.Sprintf("equal(\"comment_id\", \"%s\")", commentID),
		fmt.Sprintf("equal(\"type\", \"%s\")", string(models.LikeTypeComment)),
	}

	docs, err := s.appwriteClient.Database.ListDocuments(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteLikesCollectionID,
		queries,
	)
	if err != nil {
		return
	}

	count := len(docs.Documents)

	// Update comment
	updateData := map[string]interface{}{
		"likes_count": count,
	}

	s.appwriteClient.Database.UpdateDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteCommentsCollectionID,
		commentID,
		updateData,
		nil,
	)
}

func (s *LikeService) getUserByID(userID string) (*models.User, error) {
	doc, err := s.appwriteClient.Database.GetDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteUsersCollectionID,
		userID,
		nil,
	)
	if err != nil {
		return nil, err
	}

	var user models.User
	if err := s.mapDocumentToUser(doc.Data, &user); err != nil {
		return nil, err
	}

	user.ID = doc.Id
	return &user, nil
}

func (s *LikeService) mapDocumentToLike(data interface{}, like *models.Like) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	return json.Unmarshal(jsonData, like)
}

func (s *LikeService) mapDocumentToUser(data interface{}, user *models.User) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	return json.Unmarshal(jsonData, user)
}