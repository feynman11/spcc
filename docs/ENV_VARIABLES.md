# Environment Variables

This document describes all environment variables required for the South Peaks Cycle Club application.

## Required Variables

### Database
```env
DATABASE_URL="postgresql://user:password@localhost:5432/spcc?schema=public"
```
PostgreSQL connection string. Format: `postgresql://[user]:[password]@[host]:[port]/[database]?schema=[schema]`

### Authentication
```env
NEXTAUTH_URL="http://localhost:3000"
```
The base URL of your application. Used for OAuth callbacks and session management.

```env
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
```
Secret key for JWT signing and encryption. Generate a secure random string for production.

### MinIO (File Storage)
```env
MINIO_ENDPOINT="localhost"
```
MinIO server hostname or IP address.

```env
MINIO_PORT="9000"
```
MinIO server port (default: 9000).

```env
MINIO_USE_SSL="false"
```
Whether to use SSL/TLS for MinIO connections. Set to `"true"` for production with SSL.

```env
MINIO_ACCESS_KEY="minioadmin"
```
MinIO access key (username).

```env
MINIO_SECRET_KEY="minioadmin"
```
MinIO secret key (password).

```env
MINIO_BUCKET_NAME="gpx-files"
```
Name of the MinIO bucket where GPX files will be stored. The bucket will be created automatically if it doesn't exist.

### Zoho Mail (Email Notifications)

```env
ZOHO_CLIENT_ID="your-client-id"
```
OAuth client ID obtained from Zoho Developer Console. Required for sending email notifications to admins.

```env
ZOHO_CLIENT_SECRET="your-client-secret"
```
OAuth client secret obtained from Zoho Developer Console. Required for sending email notifications to admins.

```env
ZOHO_REFRESH_TOKEN="your-refresh-token"
```
OAuth refresh token obtained from the initial OAuth authorization flow. This is used to automatically refresh access tokens. Required for sending email notifications to admins.

```env
ZOHO_ACCOUNT_ID="123456789"
```
Zoho Mail account ID for sending emails. This can be obtained from the Get All User Accounts API. Required for sending email notifications to admins.

```env
ZOHO_FROM_ADDRESS="noreply@yourdomain.com"
```
Email address to send notifications from. Must match an email address associated with the authenticated Zoho account. Required for sending email notifications to admins.

```env
ZOHO_REDIRECT_URI="http://localhost:3000/api/zoho/callback"
```
OAuth redirect URI for the authorization callback. Defaults to `{NEXTAUTH_URL}/api/zoho/callback` if not set. Must match the redirect URI configured in Zoho Developer Console.

**Note:** All Zoho Mail variables are optional. If not configured, email notifications will be skipped (with a warning logged).

**Automatic Setup:** The application can handle OAuth authorization automatically. After setting `ZOHO_CLIENT_ID` and `ZOHO_CLIENT_SECRET`, visit `/api/zoho/authorize` to get the authorization URL, or use the automatic setup flow. 

For detailed setup instructions, including how to obtain the refresh token, see [Zoho Mail Setup Guide](../docs/ZOHO_SETUP.md).

Quick setup:
1. Register your application in [Zoho Developer Console](https://accounts.zoho.com/developerconsole)
2. Get authorization code and exchange it for refresh token using: `npm run zoho:get-refresh-token`
3. Get your account ID using: `npm run zoho:get-account-id`

## Optional Variables

```env
APP_URL="http://localhost:3000"
```
Application URL (can be used for generating absolute URLs).

## Generating Secrets

### NEXTAUTH_SECRET

You can generate a secure secret using:

**Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**OpenSSL:**
```bash
openssl rand -base64 32
```

**Online:**
Use a secure random string generator or password manager.

## Example .env File

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/spcc?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"

# MinIO
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET_NAME="gpx-files"

# Optional
APP_URL="http://localhost:3000"

# Zoho Mail (Optional - for admin email notifications)
# ZOHO_CLIENT_ID="your-client-id"
# ZOHO_CLIENT_SECRET="your-client-secret"
# ZOHO_REFRESH_TOKEN="your-refresh-token"
# ZOHO_ACCOUNT_ID="123456789"
# ZOHO_FROM_ADDRESS="noreply@yourdomain.com"
```

## Production Considerations

1. **Never commit `.env` files** to version control
2. **Use strong secrets** for `NEXTAUTH_SECRET` in production
3. **Enable SSL** for MinIO in production (`MINIO_USE_SSL="true"`)
4. **Use secure credentials** for MinIO (change from default `minioadmin`)
5. **Use environment-specific values** for different deployment environments
6. **Consider using a secrets manager** (AWS Secrets Manager, HashiCorp Vault, etc.) for production
7. **Secure Zoho credentials** - Store `ZOHO_CLIENT_SECRET` and `ZOHO_REFRESH_TOKEN` securely, never expose them in client-side code
8. **Zoho Mail setup** - Complete the OAuth 2.0 flow once to obtain the refresh token, then store it securely in your environment variables

