# Nothing Community Backend - Appwrite Edition

A robust Golang backend API for the Nothing Community platform built with Appwrite integration and clean architecture principles.

## Features

- **Appwrite Integration**: Full integration with Appwrite for authentication, database, and storage
- **Authentication & Authorization**: Session-based auth with Appwrite Auth service
- **User Management**: Profile management with admin verification system
- **Post Management**: Create, read, update, delete posts with categories
- **Social Features**: Likes, comments, shares with real-time counts
- **Media Upload**: Appwrite Storage integration for images, videos, and GIFs
- **Clean Architecture**: Repository pattern, dependency injection
- **Database**: Appwrite Database with document-based storage
- **Validation**: Request validation with go-playground/validator
- **CORS**: Configured for frontend integration

## Architecture

```
backend/
├── cmd/
│   └── main.go                 # Application entry point
├── internal/
│   ├── appwrite/               # Appwrite client configuration
│   ├── config/                 # Configuration management
│   ├── handlers/               # HTTP request handlers
│   ├── middleware/             # HTTP middleware (auth, CORS, etc.)
│   ├── models/                 # Data models and structs
│   └── services/               # Business logic layer
├── .env.example               # Environment variables template
├── go.mod                     # Go module dependencies
└── README.md                  # This file
```

## Quick Start

### Prerequisites

- Go 1.21+
- Appwrite Cloud account or self-hosted instance
- Appwrite project with configured database and storage

### Installation

1. **Clone and setup**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your Appwrite configuration
   ```

2. **Install dependencies**:
   ```bash
   go mod download
   ```

3. **Configure environment variables**:
   ```bash
   # Required variables in .env
   PORT=8080
   APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=687554510016ab1d992a
   APPWRITE_API_KEY=techbant
   APPWRITE_DATABASE_ID=nothing-community-db
   ```

4. **Setup Appwrite Collections**:
   Create the following collections in your Appwrite database:
   - `users` - User profiles
   - `posts` - Community posts
   - `comments` - Post comments
   - `likes` - Like records
   - `media` - Media attachments

5. **Run the server**:
   ```bash
   go run cmd/main.go
   ```

The server will start on `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

### Users
- `GET /api/v1/users/profile` - Get current user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/:id` - Get user by ID
- `GET /api/v1/users/list` - List users (with pagination)

### Posts
- `GET /api/v1/posts` - Get all posts (with pagination)
- `GET /api/v1/posts/:id` - Get specific post
- `POST /api/v1/posts` - Create new post
- `PUT /api/v1/posts/:id` - Update post
- `DELETE /api/v1/posts/:id` - Delete post
- `GET /api/v1/posts/category/:category` - Get posts by category
- `GET /api/v1/posts/user/:userId` - Get posts by user

### Comments
- `GET /api/v1/comments/post/:postId` - Get comments for post
- `POST /api/v1/comments` - Create comment
- `PUT /api/v1/comments/:id` - Update comment
- `DELETE /api/v1/comments/:id` - Delete comment

### Likes
- `POST /api/v1/likes/post/:postId` - Toggle post like
- `POST /api/v1/likes/comment/:commentId` - Toggle comment like
- `GET /api/v1/likes/post/:postId` - Get post likes

### Media
- `POST /api/v1/media/upload` - Upload media file
- `DELETE /api/v1/media/:id` - Delete media file
- `GET /api/v1/media/user` - Get user's media files

## Appwrite Configuration

### Database Collections

#### Users Collection
```json
{
  "name": "string",
  "email": "string",
  "avatar": "string",
  "bio": "string",
  "location": "string",
  "website": "string",
  "is_admin": "boolean",
  "is_verified": "boolean",
  "is_active": "boolean"
}
```

#### Posts Collection
```json
{
  "title": "string",
  "content": "string",
  "category": "string",
  "tags": "array",
  "author_id": "string",
  "author_name": "string",
  "author_avatar": "string",
  "author_admin": "boolean",
  "author_verified": "boolean",
  "views": "integer",
  "likes_count": "integer",
  "comments_count": "integer",
  "shares_count": "integer",
  "is_pinned": "boolean",
  "is_hot": "boolean",
  "location": "string",
  "media_ids": "array"
}
```

#### Comments Collection
```json
{
  "content": "string",
  "post_id": "string",
  "author_id": "string",
  "author_name": "string",
  "author_avatar": "string",
  "author_admin": "boolean",
  "author_verified": "boolean",
  "parent_id": "string",
  "likes_count": "integer"
}
```

#### Likes Collection
```json
{
  "user_id": "string",
  "post_id": "string",
  "comment_id": "string",
  "type": "string"
}
```

#### Media Collection
```json
{
  "user_id": "string",
  "post_id": "string",
  "type": "string",
  "url": "string",
  "name": "string",
  "size": "integer",
  "mime_type": "string",
  "file_id": "string"
}
```

### Storage Bucket

Create a storage bucket named `media-bucket` for file uploads with appropriate permissions.

## Features

### Authentication
- Session-based authentication with Appwrite Auth
- User registration and login
- Protected routes with middleware
- Session management

### Post Management
- Rich text content with 2000 character limit
- Category system (general, tech, reviews, updates, gists, banter)
- Tag system for better organization
- View tracking and engagement metrics
- Media attachments support

### Social Features
- Like/unlike posts and comments
- Nested comment system
- Share tracking
- Real-time count updates

### Media Handling
- Appwrite Storage integration
- Support for images, videos, and GIFs
- File type validation and size limits
- Automatic URL generation

### Admin System
- Admin user designation
- Verification badges
- Post pinning capabilities

## Development

### Adding New Features

1. **Models**: Define data structures in `internal/models/`
2. **Service**: Implement business logic in `internal/services/`
3. **Handler**: Create HTTP handlers in `internal/handlers/`
4. **Routes**: Register routes in `cmd/main.go`

### Appwrite Integration

The application uses the Appwrite Go SDK for all database and storage operations:

```go
// Example: Creating a document
doc, err := appwriteClient.Database.CreateDocument(
    databaseID,
    collectionID,
    documentID,
    data,
    permissions,
)
```

### Testing

```bash
# Run tests
go test ./...

# Run tests with coverage
go test -cover ./...
```

## Production Deployment

### Environment Setup
- Use production Appwrite endpoint
- Configure proper API keys
- Set up Appwrite collections with proper permissions
- Configure storage bucket permissions
- Enable HTTPS
- Configure proper CORS origins

### Security Considerations
- Session token management
- Rate limiting (implement with middleware)
- Input validation and sanitization
- File upload security
- Appwrite permissions and security rules

### Performance
- Appwrite database indexing
- Connection pooling
- Caching layer for frequently accessed data
- CDN for media files

## Contributing

1. Follow Go best practices and conventions
2. Write tests for new features
3. Update documentation
4. Use meaningful commit messages
5. Follow the existing code structure

## License

This project is licensed under the MIT License.