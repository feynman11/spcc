# Podman Usage Guide

This guide explains how to run the application using Podman with a `.env` file.

## Prerequisites

1. Podman installed (`podman --version`)
2. Podman Compose installed (optional, for compose support):
   ```bash
   # On Fedora/RHEL
   sudo dnf install podman-compose
   
   # On Ubuntu/Debian
   pip install podman-compose
   
   # Or use podman play kube (built-in)
   ```
3. A `.env` file in the project root (see `docs/ENV_VARIABLES.md` for required variables)

## Method 1: Using Podman Compose (Recommended)

Podman Compose automatically loads environment variables from your `.env` file.

### Build and run all services (app, database, MinIO):

```bash
podman-compose up --build
```

### Run in detached mode (background):

```bash
podman-compose up -d --build
```

### View logs:

```bash
podman-compose logs -f app
```

### Stop services:

```bash
podman-compose down
```

### Stop and remove volumes (clears database and MinIO data):

```bash
podman-compose down -v
```

## Method 2: Using Podman Run with --env-file

If you prefer to run the container manually:

### Build the image:

```bash
podman build -t spcc .
```

### Run with .env file:

```bash
podman run -p 3000:3000 --env-file .env spcc
```

### Run in detached mode:

```bash
podman run -d -p 3000:3000 --env-file .env --name spcc-app spcc
```

### View logs:

```bash
podman logs -f spcc-app
```

### Stop container:

```bash
podman stop spcc-app
```

### Remove container:

```bash
podman rm spcc-app
```

## Environment Variables

Make sure your `.env` file includes all required variables. For Podman Compose, you may also want to add:

```env
# Database (for podman-compose postgres service)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=spcc

# Application
DATABASE_URL="postgresql://postgres:your-secure-password@db:5432/spcc?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"

# MinIO
MINIO_ENDPOINT="minio"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET_NAME="gpx-files"

# Zoho Mail (Optional - for admin email notifications)
# ZOHO_CLIENT_ID="your-client-id"
# ZOHO_CLIENT_SECRET="your-client-secret"
# ZOHO_REFRESH_TOKEN="your-refresh-token"
# ZOHO_ACCOUNT_ID="123456789"
# ZOHO_FROM_ADDRESS="noreply@yourdomain.com"
```

**Note:** 
- When running **all services together** with Podman Compose, you can uncomment the override lines in `docker-compose.yml` to automatically use service names (`db` and `minio`).
- When connecting to **external Docker services**, you need to use the host's gateway IP or `host.containers.internal` in your `.env` file (see "Database connection issues" section below).
- For **local development** (not in containers), use `localhost` in your `.env` file.

## Database Migrations

After starting the containers, you may need to run Prisma migrations:

```bash
# Using podman-compose
podman-compose exec app bunx prisma migrate deploy

# Or using podman run
podman exec -it spcc-app bunx prisma migrate deploy
```

## Podman-Specific Notes

### Rootless Operation
Podman runs rootless by default, which is more secure. If you encounter permission issues:

```bash
# Check if running rootless
podman info | grep rootless

# If you need to run as root (not recommended)
sudo podman build -t spcc .
```

### Network Configuration
Podman creates its own network namespace. Containers can communicate using service names when using `podman-compose`.

### Volume Management
Podman volumes are stored in `~/.local/share/containers/storage/volumes/` for rootless mode.

## Troubleshooting

### Container won't start
- Check that all required environment variables are set in `.env`
- Verify the database is accessible (if using external database)
- Check logs: `podman-compose logs app` or `podman logs spcc-app`

### Database connection issues

#### Connecting to External Docker Services

If you have the database and MinIO running in Docker (separate from Podman), you need to configure your `.env` file to access the host:

1. **Find your host's gateway IP** (the IP Podman uses to reach the host):
   ```bash
   # Get the default gateway IP
   ip route show default | awk '/default/ {print $3}'
   # Or for WSL2, you can use:
   cat /etc/resolv.conf | grep nameserver | awk '{print $2}'
   ```

2. **Update your `.env` file** to use the gateway IP or `host.containers.internal`:
   ```env
   # Use the gateway IP you found above, or try host.containers.internal
   DATABASE_URL="postgresql://postgres:password@<GATEWAY_IP>:5432/spcc?schema=public"
   MINIO_ENDPOINT="<GATEWAY_IP>"
   # Or try:
   # DATABASE_URL="postgresql://postgres:password@host.containers.internal:5432/spcc?schema=public"
   # MINIO_ENDPOINT="host.containers.internal"
   ```

3. **Alternative: Use host network mode** (if you don't need port isolation):
   ```bash
   podman run --network=host -p 3000:3000 --env-file .env spcc
   ```
   Then use `localhost` in your `.env` file.

#### Running All Services Together

- **Note:** The `docker-compose.yml` can automatically override `DATABASE_URL` and `MINIO_ENDPOINT` to use service names (`db` and `minio`) when running all services together. Uncomment the override lines in `docker-compose.yml` if you want this behavior.
- If you're running the app container separately (not with podman-compose), ensure the `DATABASE_URL` uses the correct hostname (`db` for podman-compose, gateway IP for external Docker)
- Wait for the database to be ready before starting the app (podman-compose handles this with `depends_on`)
- If you see connection errors with `0.0.0.0`, make sure your `.env` uses the correct hostname (gateway IP or `host.containers.internal` for external services)

### MinIO connection issues
- Ensure `MINIO_ENDPOINT` matches the service name (`minio` for podman-compose)
- Check that MinIO is running: `podman-compose ps minio`

### Permission issues
- Podman runs rootless by default. If you need to bind to privileged ports (< 1024), use:
  ```bash
  sudo podman run -p 3000:3000 --env-file .env spcc
  ```
  Or configure port forwarding with `sudo setcap` or use a reverse proxy.

### Image name resolution errors
If you see errors like "short-name did not resolve to an alias":
- The Dockerfile has been updated to use fully qualified names (`docker.io/oven/bun:1.3.1`)
- Alternatively, configure Podman to search Docker Hub by default:
  ```bash
  # Edit ~/.config/containers/registries.conf or /etc/containers/registries.conf
  # Add Docker Hub to unqualified-search-registries:
  unqualified-search-registries = ["docker.io"]
  ```

### SELinux issues (if applicable)
If you encounter SELinux permission errors:
```bash
# Allow container to access volumes
sudo setsebool -P container_manage_cgroup on
```

### Shared mount warning
If you see "is not a shared mount" warning:
- This is usually harmless for rootless Podman
- To fix, you can remount with shared option (requires root):
  ```bash
  sudo mount --make-shared /
  ```
  Or ignore the warning - it typically doesn't affect functionality.

