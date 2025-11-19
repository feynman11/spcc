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
```

## Production Considerations

1. **Never commit `.env` files** to version control
2. **Use strong secrets** for `NEXTAUTH_SECRET` in production
3. **Enable SSL** for MinIO in production (`MINIO_USE_SSL="true"`)
4. **Use secure credentials** for MinIO (change from default `minioadmin`)
5. **Use environment-specific values** for different deployment environments
6. **Consider using a secrets manager** (AWS Secrets Manager, HashiCorp Vault, etc.) for production

