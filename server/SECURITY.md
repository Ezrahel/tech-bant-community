# Security Documentation

## Overview

This authentication system implements enterprise-grade security following industry best practices and compliance standards (OWASP Top 10, GDPR, SOC 2).

## Security Features

### 1. Authentication

#### Token-Based Authentication
- **Firebase ID Tokens**: All authenticated requests use Firebase ID tokens
- **Custom Tokens**: Generated server-side for secure authentication
- **Token Expiration**: Tokens expire after 24 hours
- **Refresh Tokens**: Long-lived refresh tokens (7 days) for seamless re-authentication
- **Session Management**: All sessions tracked in Firestore with IP and User-Agent

#### Password Security
- **Minimum Length**: 8 characters (configurable)
- **Complexity Requirements**: Can be extended with additional rules
- **Password Hashing**: Handled by Firebase Auth (bcrypt)
- **Password Change**: Requires current password verification
- **Password Reset**: Secure token-based reset flow

### 2. Authorization (RBAC)

#### Role-Based Access Control
- **Roles**: `user`, `moderator`, `admin`, `super_admin`
- **Permissions**: Granular permission system
- **Hierarchical Roles**: Super admin has all permissions
- **Permission Checks**: Middleware validates permissions on every request

#### Permission Matrix

| Permission | User | Moderator | Admin | Super Admin |
|------------|------|-----------|-------|-------------|
| posts:read | ✅ | ✅ | ✅ | ✅ |
| posts:write | ✅ | ✅ | ✅ | ✅ |
| posts:delete | ❌ | ❌ | ✅ | ✅ |
| posts:moderate | ❌ | ✅ | ✅ | ✅ |
| users:read | ✅ | ✅ | ✅ | ✅ |
| users:write | ❌ | ❌ | ✅ | ✅ |
| users:delete | ❌ | ❌ | ✅ | ✅ |
| comments:read | ✅ | ✅ | ✅ | ✅ |
| comments:write | ✅ | ✅ | ✅ | ✅ |
| comments:delete | ❌ | ❌ | ✅ | ✅ |
| comments:moderate | ❌ | ✅ | ✅ | ✅ |
| admin:read | ❌ | ❌ | ✅ | ✅ |
| admin:write | ❌ | ❌ | ✅ | ✅ |
| admin:delete | ❌ | ❌ | ❌ | ✅ |
| admins:manage | ❌ | ❌ | ❌ | ✅ |

### 3. Account Security

#### Account Lockout
- **Failed Login Attempts**: Maximum 5 attempts
- **Lockout Duration**: 15 minutes
- **Automatic Unlock**: Account unlocks after lockout period
- **Tracking**: All failed attempts logged in security events

#### Account Status
- **Active/Inactive**: Accounts can be deactivated
- **Email Verification**: Email verification required (optional)
- **Account Recovery**: Secure recovery process

### 4. Security Headers

All responses include security headers:
- **X-Frame-Options**: DENY (prevents clickjacking)
- **X-Content-Type-Options**: nosniff (prevents MIME sniffing)
- **X-XSS-Protection**: 1; mode=block (XSS protection)
- **Strict-Transport-Security**: HSTS for HTTPS
- **Content-Security-Policy**: Restricts resource loading
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: Restricts browser features

### 5. Audit Logging

#### Security Events Tracked
- Login attempts (successful and failed)
- Logout events
- Signup events
- Password changes
- Account lockouts
- Token refresh
- Permission denials

#### Event Information
- User ID
- IP Address
- User Agent
- Timestamp
- Success/Failure status
- Reason (for failures)

### 6. Error Handling

#### Secure Error Messages
- **No Information Leakage**: Generic error messages for security
- **No Stack Traces**: Stack traces never exposed to clients
- **Sanitized Errors**: Internal errors sanitized before response
- **Consistent Format**: All errors follow same format

#### Error Response Format
```json
{
  "error": "Generic error message"
}
```

### 7. Input Validation

#### Validation Rules
- **Email**: Format validation, case-insensitive
- **Password**: Length and complexity checks
- **Token**: Format and expiration validation
- **Request Body**: JSON schema validation

### 8. Session Management

#### Session Properties
- **Unique Session IDs**: Cryptographically secure random IDs
- **IP Tracking**: Sessions tied to IP addresses
- **User Agent Tracking**: User agent stored for security
- **Activity Tracking**: Last activity timestamp
- **Expiration**: Automatic session expiration
- **Revocation**: Sessions can be invalidated

### 9. Rate Limiting

#### Protection Against
- Brute force attacks
- DDoS attacks
- API abuse

#### Implementation
- Placeholder for rate limiting middleware
- Can be extended with Redis-based rate limiting
- Recommended: Use `golang.org/x/time/rate` or `github.com/didip/tollbooth`

### 10. CORS Configuration

#### Security Settings
- **Allowed Origins**: Configurable whitelist
- **Credentials**: Enabled for authenticated requests
- **Methods**: Restricted to necessary HTTP methods
- **Headers**: Restricted to required headers

## Security Best Practices

### Development
1. **Never commit secrets**: Use environment variables
2. **Use HTTPS**: Always use HTTPS in production
3. **Regular updates**: Keep dependencies updated
4. **Code reviews**: Review all security-sensitive code
5. **Testing**: Test security features regularly

### Deployment
1. **Environment variables**: Store secrets in environment variables
2. **Firewall rules**: Restrict access to admin endpoints
3. **Monitoring**: Monitor security events
4. **Backups**: Regular backups of security logs
5. **Incident response**: Have an incident response plan

### Compliance

#### GDPR
- User data encryption
- Right to deletion
- Data portability
- Consent management

#### SOC 2
- Access controls
- Audit logging
- Security monitoring
- Incident response

#### OWASP Top 10
- Injection prevention
- Authentication failures
- Sensitive data exposure
- XML external entities
- Broken access control
- Security misconfiguration
- XSS prevention
- Insecure deserialization
- Using components with known vulnerabilities
- Insufficient logging

## Security Checklist

- [x] Token-based authentication
- [x] Role-based access control
- [x] Account lockout mechanism
- [x] Password policies
- [x] Security headers
- [x] Audit logging
- [x] Secure error handling
- [x] Input validation
- [x] Session management
- [x] CORS configuration
- [ ] Rate limiting (placeholder)
- [ ] Two-factor authentication (future)
- [ ] IP whitelisting (optional)
- [ ] Webhook security (future)

## Security Incident Response

1. **Detect**: Monitor security events
2. **Assess**: Evaluate severity
3. **Contain**: Isolate affected systems
4. **Eradicate**: Remove threat
5. **Recover**: Restore services
6. **Learn**: Post-incident review

## Contact

For security issues, contact the security team immediately.

