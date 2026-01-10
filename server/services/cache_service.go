package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"tech-bant-community/server/config"
	"tech-bant-community/server/models"

	"github.com/redis/go-redis/v9"
)

type CacheService struct {
	client *redis.Client
	cfg    *config.Config
}

func NewCacheService(cfg *config.Config) (*CacheService, error) {
	if cfg.RedisAddr == "" {
		return nil, fmt.Errorf("redis not configured")
	}

	client := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to redis: %w", err)
	}

	return &CacheService{
		client: client,
		cfg:    cfg,
	}, nil
}

// GetUser gets user from cache or returns nil if not found
func (s *CacheService) GetUser(ctx context.Context, userID string) (*models.User, error) {
	if s.client == nil {
		return nil, nil
	}

	key := fmt.Sprintf("user:%s", userID)
	val, err := s.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil, nil // Not in cache
	}
	if err != nil {
		return nil, err
	}

	var user models.User
	if err := json.Unmarshal([]byte(val), &user); err != nil {
		return nil, err
	}

	return &user, nil
}

// SetUser sets user in cache
func (s *CacheService) SetUser(ctx context.Context, userID string, user *models.User, ttl time.Duration) error {
	if s.client == nil {
		return nil
	}

	key := fmt.Sprintf("user:%s", userID)
	data, err := json.Marshal(user)
	if err != nil {
		return err
	}

	return s.client.Set(ctx, key, data, ttl).Err()
}

// InvalidateUser invalidates user cache
func (s *CacheService) InvalidateUser(ctx context.Context, userID string) error {
	if s.client == nil {
		return nil
	}

	key := fmt.Sprintf("user:%s", userID)
	return s.client.Del(ctx, key).Err()
}

// GetPosts gets posts from cache
func (s *CacheService) GetPosts(ctx context.Context, cacheKey string) ([]*models.Post, error) {
	if s.client == nil {
		return nil, nil
	}

	val, err := s.client.Get(ctx, cacheKey).Result()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	var posts []*models.Post
	if err := json.Unmarshal([]byte(val), &posts); err != nil {
		return nil, err
	}

	return posts, nil
}

// SetPosts sets posts in cache
func (s *CacheService) SetPosts(ctx context.Context, cacheKey string, posts []*models.Post, ttl time.Duration) error {
	if s.client == nil {
		return nil
	}

	data, err := json.Marshal(posts)
	if err != nil {
		return err
	}

	return s.client.Set(ctx, cacheKey, data, ttl).Err()
}

// GetStats gets admin stats from cache
func (s *CacheService) GetStats(ctx context.Context) (*models.AdminStats, error) {
	if s.client == nil {
		return nil, nil
	}

	val, err := s.client.Get(ctx, "admin:stats").Result()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	var stats models.AdminStats
	if err := json.Unmarshal([]byte(val), &stats); err != nil {
		return nil, err
	}

	return &stats, nil
}

// SetStats sets admin stats in cache
func (s *CacheService) SetStats(ctx context.Context, stats *models.AdminStats, ttl time.Duration) error {
	if s.client == nil {
		return nil
	}

	data, err := json.Marshal(stats)
	if err != nil {
		return err
	}

	return s.client.Set(ctx, "admin:stats", data, ttl).Err()
}

// InvalidateStats invalidates admin stats cache
func (s *CacheService) InvalidateStats(ctx context.Context) error {
	if s.client == nil {
		return nil
	}

	return s.client.Del(ctx, "admin:stats").Err()
}

// Close closes the cache connection
func (s *CacheService) Close() error {
	if s.client != nil {
		return s.client.Close()
	}
	return nil
}

