# Create Super Admin Script

This script creates or updates a super admin account in the Tech Bant Community platform.

## Usage

```bash
cd server
go run cmd/create_superadmin/main.go
```

## What it does

1. Checks if a user with the email `adelakinisrael024@gmail.com` already exists in Firestore
2. If exists: Updates the user to super admin role in both Firestore and Firebase Auth
3. If not exists: Creates a new super admin account in Firebase Auth and Firestore

## Credentials

- **Email:** adelakinisrael024@gmail.com
- **Password:** Taepryung024
- **Role:** super_admin

## Requirements

- Firebase credentials file must be configured
- Environment variables must be set (see `env.example`)
- Go 1.24+ installed
- **Email/Password authentication must be enabled in Firebase Console**

## Firebase Console Setup

**IMPORTANT:** Before running this script, ensure Email/Password authentication is enabled:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** > **Sign-in method**
4. Enable **Email/Password** provider
5. Save changes

## Troubleshooting

### Error: "no IdP configuration corresponding to the provided identifier"

This error means Email/Password authentication is not enabled in Firebase Console.

**Solution:**
1. Enable Email/Password in Firebase Console (see above)
2. Run the script again

### Error: "EMAIL_EXISTS"

The user already exists in Firebase Auth but may not be a super admin.

**Solution:**
- The script will automatically update existing users to super admin
- If the script fails, manually update the user in Firestore:
  ```javascript
  // In Firestore console or via script
  db.collection('users').doc('USER_ID').update({
    is_admin: true,
    role: 'super_admin'
  })
  ```

## Notes

- The script will update an existing user if found
- If user exists in Firestore but not in Firebase Auth, the script will attempt to create in Auth
- The user will have full super admin privileges
- Script is idempotent (safe to run multiple times)

