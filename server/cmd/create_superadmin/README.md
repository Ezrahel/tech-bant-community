# Create Super Admin Script

This script creates or updates a super admin account in the Tech Bant Community platform.

## Usage

```bash
cd server
go run cmd/create_superadmin/main.go
```

## What it does

1. Checks if a user with the email `adelakinisrael024@gmail.com` already exists in PostgreSQL
2. If exists: Updates the user to super admin role in both PostgreSQL and Supabase Auth
3. If not exists: Creates a new super admin account in Supabase Auth and PostgreSQL

## Credentials

- **Email:** adelakinisrael024@gmail.com
- **Password:** Taepryung024
- **Role:** super_admin

## Requirements

- Supabase project must be configured
- Environment variables must be set (see `env.example`):
  - `SUPABASE_URL` - Your Supabase project URL
  - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
  - `SUPABASE_DB_URL` - PostgreSQL connection string
- Go 1.21+ installed
- **Email/Password authentication must be enabled in Supabase Dashboard**

## Supabase Dashboard Setup

**IMPORTANT:** Before running this script, ensure Email/Password authentication is enabled:

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Enable **Email** provider
5. Save changes

## Troubleshooting

### Error: "Failed to create admin user in Supabase Auth"

This error means Email/Password authentication is not enabled or the service role key is invalid.

**Solution:**
1. Enable Email provider in Supabase Dashboard (see above)
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
3. Run the script again

### Error: "EMAIL_EXISTS"

The user already exists in Supabase Auth but may not be a super admin.

**Solution:**
- The script will automatically update existing users to super admin
- If the script fails, manually update the user in PostgreSQL:
  ```sql
  UPDATE public.users 
  SET is_admin = true, role = 'super_admin', updated_at = NOW()
  WHERE email = 'adelakinisrael024@gmail.com';
  ```

## Notes

- The script will update an existing user if found
- If user exists in PostgreSQL but not in Supabase Auth, the script will attempt to create in Auth
- The user will have full super admin privileges
- Script is idempotent (safe to run multiple times)
- Uses Supabase Auth Admin API for user creation
