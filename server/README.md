# Tech Bant Community - Backend API

> Status: legacy reference backend. The canonical active backend for this repository is the Next.js API under `/app/api`.

A high-performance Go backend for the Tech Bant Community platform, built with Supabase (PostgreSQL, Authentication, and Storage).

## Architecture

This backend follows clean architecture principles with clear separation of concerns:

- **Models**: Data structures and request/response types
- **Services**: Business logic layer
- **Handlers**: HTTP request handlers
- **Middleware**: Authentication, CORS, and other cross-cutting concerns
- **Supabase**: Supabase initialization and client management (PostgreSQL, Auth, Storage)

## Features

- 🔐 Supabase Authentication integration
- 💾 PostgreSQL database operations
- 📁 Supabase Storage for media uploads
- 📝 Posts CRUD operations
- 👤 User profile management
- 💬 Comments system
- ❤️ Likes and bookmarks
- 👑 Admin dashboard and management
- 🚀 High performance with Go's concurrency
- 🔄 Redis rate limiting and caching
- 🔒 Two-factor authentication (2FA)
- 🔐 OAuth integration (Google)

## Prerequisites

- Go 1.21 or higher
- Supabase project with:
  - Authentication enabled
  - PostgreSQL database
  - Storage bucket configured
- Redis (optional, for rate limiting and caching)

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   go mod download
   ```

2. **Configure environment variables:**
   ```bash
   export PORT=8080
   export SUPABASE_URL=https://your-project.supabase.co
   export SUPABASE_ANON_KEY=your-anon-key
   export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   export SUPABASE_JWT_SECRET=your-jwt-secret
   export SUPABASE_DB_URL=postgresql://user:password@host:port/dbname
   export STORAGE_BUCKET=your-storage-bucket
   export ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   export REDIS_ADDR=localhost:6379
   export GOOGLE_CLIENT_ID=your-google-client-id
   export GOOGLE_CLIENT_SECRET=your-google-client-secret
   export RESEND_API_KEY=your-resend-api-key
   ```

3. **Run the server:**
   ```bash
   go run main.go
   ```

   Or build and run:
   ```bash
   go build -o server main.go
   ./server
   ```

## API Endpoints

### Posts

- `GET /api/v1/posts` - Get all posts (with pagination and category filter)
- `GET /api/v1/posts/{id}` - Get a specific post
- `POST /api/v1/posts` - Create a new post (auth required)
- `POST /api/v1/posts/{id}/like` - Like/unlike a post (auth required)
- `POST /api/v1/posts/{id}/bookmark` - Bookmark/unbookmark a post (auth required)

### Comments

- `GET /api/v1/posts/{id}/comments` - Get comments for a post
- `POST /api/v1/posts/{id}/comments` - Create a comment (auth required)
- `POST /api/v1/comments/{id}/like` - Like/unlike a comment (auth required)

### Users

- `GET /api/v1/users/me` - Get current user profile (auth required)
- `PUT /api/v1/users/me` - Update current user profile (auth required)
- `GET /api/v1/users/{id}` - Get user by ID
- `GET /api/v1/users/{id}/posts` - Get posts by user
- `GET /api/v1/users/search?q={query}` - Search users

### Media

- `POST /api/v1/media/upload` - Upload media file (auth required)

### Admin

- `GET /api/v1/admin/stats` - Get dashboard statistics (admin required)
- `GET /api/v1/admin/admins` - Get all admins (admin required)
- `POST /api/v1/admin/admins` - Create new admin (admin required)
- `PUT /api/v1/admin/admins/{id}/role` - Update admin role (admin required)
- `DELETE /api/v1/admin/admins/{id}` - Delete admin (admin required)

### Health

- `GET /health` - Health check endpoint

## Authentication

All protected endpoints require a Supabase JWT token in the Authorization header:

```
Authorization: Bearer <supabase-jwt-token>
```

The frontend should obtain this token from Supabase Auth and include it in all authenticated requests.

## Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User profiles
- `posts` - Posts
- `comments` - Comments on posts
- `likes` - Likes on posts and comments
- `bookmarks` - User bookmarks
- `media_attachments` - Media attachments metadata
- `reports` - Content reports
- `follows` - User follow relationships
- `otp_codes` - Two-factor authentication codes
- `sessions` - User sessions

## Error Handling

All errors are returned in JSON format:

```json
{
  "error": "Error message"
}
```

## Development

### Project Structure

```
server/
├── config/          # Configuration management
├── supabase/        # Supabase initialization
├── database/        # Database utilities and schema
├── handlers/         # HTTP handlers
├── middleware/       # Middleware (auth, CORS, RBAC)
├── models/           # Data models
├── services/         # Business logic
├── utils/            # Utility functions
├── main.go          # Application entry point
└── go.mod           # Go dependencies
```

### Adding New Features

1. Define models in `models/`
2. Implement business logic in `services/`
3. Create handlers in `handlers/`
4. Register routes in `main.go`

## Performance Considerations

- Uses Go's native concurrency for handling multiple requests
- PostgreSQL queries are optimized with indexes
- Media files are stored in Supabase Storage for CDN delivery
- Connection pooling for PostgreSQL database
- Redis caching for frequently accessed data
- Rate limiting to prevent abuse

## Security

- All user input is validated and sanitized
- Supabase JWT tokens are verified on every protected request
- Role-based access control (RBAC) for admin endpoints
- CORS is configured to allow only specified origins
- File uploads are validated for type and size
- Two-factor authentication (2FA) support
- CSRF protection
- Security headers middleware
- Request body size limits

## License

Proprietary - Tech Bant Community
