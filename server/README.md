# Tech Bant Community - Backend API

A high-performance Go backend for the Tech Bant Community platform, built with Firebase Authentication and Firestore.

## Architecture

This backend follows clean architecture principles with clear separation of concerns:

- **Models**: Data structures and request/response types
- **Services**: Business logic layer
- **Handlers**: HTTP request handlers
- **Middleware**: Authentication, CORS, and other cross-cutting concerns
- **Firebase**: Firebase initialization and client management

## Features

- 🔐 Firebase Authentication integration
- 💾 Firestore database operations
- 📁 Firebase Storage for media uploads
- 📝 Posts CRUD operations
- 👤 User profile management
- 💬 Comments system
- ❤️ Likes and bookmarks
- 👑 Admin dashboard and management
- 🚀 High performance with Go's concurrency

## Prerequisites

- Go 1.21 or higher
- Firebase project with:
  - Authentication enabled
  - Firestore database
  - Storage bucket
- Firebase service account key JSON file

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   go mod download
   ```

2. **Configure environment variables:**
   ```bash
   export PORT=8080
   export FIREBASE_PROJECT_ID=tech-bant-community
   export FIREBASE_KEY_PATH=../tech-bant-community-firebase.json
   export STORAGE_BUCKET=tech-bant-community.appspot.com
   export ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
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

All protected endpoints require a Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

The frontend should obtain this token from Firebase Auth and include it in all authenticated requests.

## Firestore Collections

- `users` - User profiles
- `posts` - Posts
- `comments` - Comments on posts
- `likes` - Likes on posts and comments
- `bookmarks` - User bookmarks
- `media` - Media attachments metadata

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
├── firebase/         # Firebase initialization
├── handlers/         # HTTP handlers
├── middleware/       # Middleware (auth, CORS)
├── models/           # Data models
├── services/         # Business logic
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
- Firestore queries are optimized with indexes
- Media files are stored in Firebase Storage for CDN delivery
- Connection pooling for Firebase clients

## Security

- All user input is validated
- Firebase Auth tokens are verified on every protected request
- Admin endpoints require additional admin role check
- CORS is configured to allow only specified origins
- File uploads are validated for type and size

## License

Proprietary - Tech Bant Community

