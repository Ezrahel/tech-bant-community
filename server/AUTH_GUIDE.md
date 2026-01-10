# Authentication System Guide

## Overview

The authentication system provides secure, role-based access control for the Tech Bant Community platform.

## Authentication Flow

### 1. Signup

```http
POST /api/v1/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "token": "firebase-custom-token",
  "refreshToken": "session-id",
  "expiresIn": 86400,
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user",
    "isAdmin": false,
    "isVerified": false
  },
  "roles": ["user"],
  "permissions": ["posts:read", "posts:write", "users:read", "comments:read", "comments:write"]
}
```

### 2. Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** Same as signup

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account locked (too many failed attempts)

### 3. Token Verification

```http
GET /api/v1/auth/verify
Authorization: Bearer <firebase-id-token>
```

**Response:**
```json
{
  "valid": true,
  "user": { ... },
  "roles": ["user"],
  "permissions": ["posts:read", ...],
  "expiresAt": 1234567890
}
```

### 4. Refresh Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "session-id"
}
```

**Response:** Same as login

### 5. Logout

```http
POST /api/v1/auth/logout
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "refreshToken": "session-id"
}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### 6. Change Password

```http
POST /api/v1/auth/change-password
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

## Using Authentication

### Frontend Integration

1. **Signup/Login**: Call the auth endpoints to get tokens
2. **Store Tokens**: Store tokens securely (httpOnly cookies recommended)
3. **Include in Requests**: Add to Authorization header:
   ```
   Authorization: Bearer <firebase-id-token>
   ```
4. **Refresh Tokens**: Use refresh token before expiration
5. **Handle Errors**: Handle 401/403 errors appropriately

### Example (JavaScript/TypeScript)

```typescript
// Login
const response = await fetch('http://localhost:8080/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { token, refreshToken, user } = await response.json();

// Store tokens securely
localStorage.setItem('token', token);
localStorage.setItem('refreshToken', refreshToken);

// Use in requests
const apiCall = await fetch('http://localhost:8080/api/v1/posts', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Roles and Permissions

### Roles

- **user**: Regular user (default)
- **moderator**: Can moderate content
- **admin**: Can manage users and content
- **super_admin**: Full system access

### Permissions

Permissions are automatically assigned based on role. Check permissions in the auth response.

## Security Features

### Account Lockout
After 5 failed login attempts, account is locked for 15 minutes.

### Session Management
- Sessions tracked with IP and User-Agent
- Sessions expire after 24 hours
- Sessions can be revoked

### Audit Logging
All authentication events are logged:
- Login attempts
- Logout events
- Password changes
- Account lockouts

## Error Handling

All errors follow this format:
```json
{
  "error": "Error message"
}
```

Common errors:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions
- `400 Bad Request`: Invalid request data

## Best Practices

1. **Never expose tokens**: Don't log or expose tokens
2. **Use HTTPS**: Always use HTTPS in production
3. **Refresh tokens**: Refresh before expiration
4. **Handle errors**: Properly handle auth errors
5. **Secure storage**: Store tokens securely
6. **Logout**: Always logout on client-side logout

## Troubleshooting

### Token Expired
- Use refresh token to get new token
- If refresh token expired, re-login

### Invalid Credentials
- Check email/password
- Check if account is locked
- Check account status (active/inactive)

### Permission Denied
- Check user role
- Check required permissions
- Contact admin if needed

