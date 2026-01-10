package services

import (
	"context"
	"fmt"
	"time"

	"tech-bant-community/server/config"

	"github.com/redis/go-redis/v9"
)

type RateLimitService struct {
	client *redis.Client
	cfg    *config.Config
}

func NewRateLimitService(cfg *config.Config) (*RateLimitService, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &RateLimitService{
		client: rdb,
		cfg:    cfg,
	}, nil
}

// EndpointLimit represents rate limit configuration for an endpoint
type EndpointLimit struct {
	Requests int           // Number of requests
	Window   time.Duration // Time window
	Burst    int           // Burst limit
}

// Default endpoint limits
var DefaultLimits = map[string]EndpointLimit{
	"/api/v1/auth/login":           {Requests: 5, Window: 15 * time.Minute, Burst: 3},
	"/api/v1/auth/signup":          {Requests: 3, Window: 1 * time.Hour, Burst: 2},
	"/api/v1/auth/refresh":         {Requests: 10, Window: 1 * time.Minute, Burst: 5},
	"/api/v1/auth/change-password": {Requests: 5, Window: 1 * time.Hour, Burst: 2}, // FIXED: Issue #21
	"/api/v1/posts":                {Requests: 100, Window: 1 * time.Minute, Burst: 20},
	"/api/v1/posts/{id}/like":      {Requests: 30, Window: 1 * time.Minute, Burst: 10},
	"/api/v1/media/upload":         {Requests: 10, Window: 1 * time.Minute, Burst: 3},
	"/api/v1/admin":                {Requests: 200, Window: 1 * time.Minute, Burst: 50},
}

// CheckRateLimit checks if request is within rate limit
func (s *RateLimitService) CheckRateLimit(ctx context.Context, key string, limit EndpointLimit) (bool, int, time.Duration, error) {
	now := time.Now()
	windowStart := now.Truncate(limit.Window)

	// Use sliding window log algorithm
	redisKey := fmt.Sprintf("ratelimit:%s:%d", key, windowStart.Unix())

	// Get current count
	count, err := s.client.Get(ctx, redisKey).Int()
	if err != nil && err != redis.Nil {
		return false, 0, 0, err
	}

	// Check if limit exceeded
	if count >= limit.Requests {
		// Get TTL to know when limit resets
		ttl, _ := s.client.TTL(ctx, redisKey).Result()
		return false, count, ttl, nil
	}

	// Increment counter
	pipe := s.client.Pipeline()
	pipe.Incr(ctx, redisKey)
	pipe.Expire(ctx, redisKey, limit.Window)
	_, err = pipe.Exec(ctx)
	if err != nil {
		return false, 0, 0, err
	}

	return true, count + 1, limit.Window, nil
}

// CheckAdaptiveRateLimit implements adaptive rate limiting
func (s *RateLimitService) CheckAdaptiveRateLimit(ctx context.Context, key string, baseLimit EndpointLimit) (bool, int, time.Duration, error) {
	// Get user behavior score
	behaviorKey := fmt.Sprintf("behavior:%s", key)
	behaviorScore, err := s.client.Get(ctx, behaviorKey).Int()
	if err != nil && err != redis.Nil {
		behaviorScore = 100 // Default score
	}

	// Adjust limit based on behavior
	// Lower score = more restrictive limits
	adjustedLimit := baseLimit
	if behaviorScore < 50 {
		// Suspicious behavior - reduce limit by 50%
		adjustedLimit.Requests = baseLimit.Requests / 2
		adjustedLimit.Window = baseLimit.Window * 2
	} else if behaviorScore > 150 {
		// Good behavior - increase limit by 25%
		adjustedLimit.Requests = int(float64(baseLimit.Requests) * 1.25)
	}

	return s.CheckRateLimit(ctx, key, adjustedLimit)
}

// RecordBehavior records user behavior for adaptive rate limiting
func (s *RateLimitService) RecordBehavior(ctx context.Context, key string, isGood bool) error {
	behaviorKey := fmt.Sprintf("behavior:%s", key)

	var delta int
	if isGood {
		delta = 1
	} else {
		delta = -2 // Penalize bad behavior more
	}

	// Update behavior score
	score, err := s.client.IncrBy(ctx, behaviorKey, int64(delta)).Result()
	if err != nil {
		return err
	}

	// Clamp score between 0 and 200
	if score < 0 {
		s.client.Set(ctx, behaviorKey, 0, 24*time.Hour)
	} else if score > 200 {
		s.client.Set(ctx, behaviorKey, 200, 24*time.Hour)
	} else {
		s.client.Expire(ctx, behaviorKey, 24*time.Hour)
	}

	return nil
}

// GetRateLimitInfo gets current rate limit information
func (s *RateLimitService) GetRateLimitInfo(ctx context.Context, key string, limit EndpointLimit) (int, int, time.Duration, error) {
	now := time.Now()
	windowStart := now.Truncate(limit.Window)
	redisKey := fmt.Sprintf("ratelimit:%s:%d", key, windowStart.Unix())

	count, err := s.client.Get(ctx, redisKey).Int()
	if err != nil && err != redis.Nil {
		return 0, limit.Requests, limit.Window, err
	}

	ttl, _ := s.client.TTL(ctx, redisKey).Result()
	if ttl < 0 {
		ttl = limit.Window
	}

	return count, limit.Requests, ttl, nil
}

// ResetRateLimit resets rate limit for a key (admin function)
func (s *RateLimitService) ResetRateLimit(ctx context.Context, key string) error {
	pattern := fmt.Sprintf("ratelimit:%s:*", key)
	iter := s.client.Scan(ctx, 0, pattern, 0).Iterator()

	for iter.Next(ctx) {
		if err := s.client.Del(ctx, iter.Val()).Err(); err != nil {
			return err
		}
	}

	return iter.Err()
}

// Ping checks Redis connection health
// FIXED: Issue #43 - Health check support
func (s *RateLimitService) Ping(ctx context.Context) error {
	return s.client.Ping(ctx).Err()
}

// Close closes Redis connection
func (s *RateLimitService) Close() error {
	return s.client.Close()
}
