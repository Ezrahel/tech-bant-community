# New Features Implementation

## Overview

This document describes the newly implemented features: Email-based 2FA, Google OAuth, and Advanced Rate Limiting.

## 1. Email-Based 2FA

### Features
- **OTP Generation**: 6-digit codes generated securely
- **Email Delivery**: OTP codes sent via SMTP
- **Code Expiration**: Codes expire after 10 minutes
- **One-Time Use**: Codes are marked as used after verification
- **Enable/Disable**: Users can enable or disable 2FA

### Endpoints
- `POST /api/v1/auth/2fa/send-otp` - Send OTP to email (public)
- `POST /api/v1/auth/2fa/enable` - Enable 2FA (protected)
- `POST /api/v1/auth/2fa/verify` - Verify OTP code (protected)
- `POST /api/v1/auth/2fa/disable` - Disable 2FA (protected)

### Configuration
Set these environment variables:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@techbant.com
```

### Usage Flow
1. User requests OTP: `POST /api/v1/auth/2fa/send-otp` with email
2. User receives OTP via email
3. User enables 2FA: `POST /api/v1/auth/2fa/enable`
4. User verifies OTP: `POST /api/v1/auth/2fa/verify` with code
5. 2FA is now enabled for the user

## 2. Google OAuth

### Features
- **OAuth 2.0 Flow**: Standard OAuth 2.0 implementation
- **State Verification**: CSRF protection via state tokens
- **User Creation**: Automatically creates users from OAuth
- **Account Linking**: Can link OAuth to existing accounts
- **Token Generation**: Creates Firebase custom tokens

### Endpoints
- `GET /api/v1/auth/oauth/google` - Initiate OAuth flow
- `GET /api/v1/auth/oauth/google/callback` - OAuth callback handler

### Configuration
Set these environment variables:
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OAUTH_REDIRECT_URL=http://localhost:8080/api/v1/auth/oauth/google/callback
```

### Usage Flow
1. Frontend calls: `GET /api/v1/auth/oauth/google?redirect_url=http://localhost:5173`
2. Backend returns `auth_url` with state
3. Frontend redirects user to `auth_url`
4. User authorizes on Google
5. Google redirects to callback URL with code
6. Backend exchanges code for token and creates/updates user
7. Backend redirects to frontend with token

## 3. Advanced Rate Limiting

### Features
- **Redis-Based**: Uses Redis for distributed rate limiting
- **Per-Endpoint Limits**: Different limits for different endpoints
- **Adaptive Rate Limiting**: Adjusts limits based on user behavior
- **Sliding Window**: Uses sliding window log algorithm
- **Behavior Scoring**: Tracks user behavior (good/bad)
- **Rate Limit Headers**: Returns rate limit info in headers

### Configuration
Set these environment variables:
```bash
REDIS_ADDR=localhost:6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
```

### Default Limits
- `/api/v1/auth/login`: 5 requests per 15 minutes
- `/api/v1/auth/signup`: 3 requests per hour
- `/api/v1/auth/refresh`: 10 requests per minute
- `/api/v1/posts`: 100 requests per minute
- `/api/v1/posts/{id}/like`: 30 requests per minute
- `/api/v1/media/upload`: 10 requests per minute
- `/api/v1/admin/*`: 200 requests per minute

### Adaptive Behavior
- **Good Behavior** (score > 150): +25% limit increase
- **Normal Behavior** (score 50-150): Standard limits
- **Bad Behavior** (score < 50): -50% limit reduction, 2x window

### Rate Limit Headers
All responses include:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp when limit resets

### Error Response
When rate limit exceeded:
```json
{
  "error": "Rate limit exceeded",
  "retry_after": 900
}
```
Status: `429 Too Many Requests`

## Implementation Details

### Files Created
- `services/twofa_service.go` - 2FA service implementation
- `services/oauth_service.go` - OAuth service implementation
- `services/ratelimit_service.go` - Rate limiting service
- `handlers/twofa_handler.go` - 2FA HTTP handlers
- `handlers/oauth_handler.go` - OAuth HTTP handlers
- `middleware/ratelimit.go` - Rate limiting middleware
- `models/twofa_models.go` - 2FA data models
- `models/oauth_models.go` - OAuth data models

### Dependencies Added
- `github.com/redis/go-redis/v9` - Redis client
- `golang.org/x/oauth2` - OAuth2 library
- Standard library `net/smtp` - Email sending

### Firestore Collections
- `otp_codes` - Stores OTP codes
- `two_factor_auth` - Stores 2FA status
- `oauth_states` - Stores OAuth state tokens

### Redis Keys
- `ratelimit:{key}:{timestamp}` - Rate limit counters
- `behavior:{key}` - Behavior scores

## Testing

### Test 2FA
```bash
# Send OTP
curl -X POST http://localhost:8080/api/v1/auth/2fa/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# Verify OTP (after receiving email)
curl -X POST http://localhost:8080/api/v1/auth/2fa/verify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"code":"123456"}'
```

### Test OAuth
```bash
# Initiate OAuth
curl http://localhost:8080/api/v1/auth/oauth/google?redirect_url=http://localhost:5173

# Follow the auth_url in response
```

### Test Rate Limiting
```bash
# Make multiple requests quickly
for i in {1..10}; do
  curl http://localhost:8080/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}'
done

# Check rate limit headers in response
```

## Security Considerations

### 2FA
- OTP codes expire after 10 minutes
- Codes are single-use
- Codes are stored securely in Firestore
- Email delivery uses SMTP authentication

### OAuth
- State tokens prevent CSRF attacks
- State tokens expire after 10 minutes
- Tokens are deleted after use
- OAuth flow follows OAuth 2.0 best practices

### Rate Limiting
- Redis provides distributed rate limiting
- Adaptive limits prevent abuse
- Behavior scoring tracks suspicious activity
- IP and user-based limiting

## Production Checklist

- [ ] Configure SMTP credentials
- [ ] Set up Google OAuth credentials
- [ ] Configure Redis instance
- [ ] Set up Redis persistence
- [ ] Configure rate limit thresholds
- [ ] Test 2FA email delivery
- [ ] Test OAuth flow end-to-end
- [ ] Monitor rate limit metrics
- [ ] Set up alerts for rate limit violations
- [ ] Review and adjust default limits

