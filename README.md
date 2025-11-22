# South Peaks Cycle Club

A comprehensive cycling club management application for South Peaks Cycle Club, based in Borrowash, Derbyshire. This application helps manage members, events, routes, and provides a platform for the cycling community to connect and organize rides.

## Overview

South Peaks Cycle Club is a web application designed to help manage all aspects of a cycling club, from member registration and profiles to event planning and route sharing. The application features interactive maps, GPX file handling, event registration, and member management capabilities.

## Features

### Public Features
- **Home Page**: Information about the club, contact details, and links to social media
- **Club Information**: Details about the club's location and mission
- **Social Links**: Integration with Strava, Instagram, and email contact

### Member Features
- **Dashboard**: Overview of upcoming events, routes, and member statistics
- **Events Management**: 
  - View upcoming and past events
  - Register for events
  - View event details including routes, meeting points, and participants
  - Event waiting lists for full events
- **Routes Library**:
  - Browse cycling routes with interactive maps
  - View route details (distance, elevation, difficulty)
  - Upload GPX files for route sharing
  - Elevation profiles and route visualization
- **Calendar**: Visual calendar view of all club events
- **Members Directory**: View and manage member profiles (admin only)

### Admin Features
- Full member management
- Event creation and management
- Route approval and management
- User role management

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **API**: tRPC (type-safe API layer)
- **Authentication**: NextAuth.js v5 (Credentials & Google OAuth)
- **File Storage**: MinIO (S3-compatible object storage)
- **Styling**: Tailwind CSS
- **Maps**: Leaflet & React Leaflet
- **State Management**: TanStack Query (React Query)
- **UI Components**: Custom components with shadcn/ui patterns
- **Notifications**: Sonner (toast notifications)

## Prerequisites

- **Node.js** 18+ 
- **PostgreSQL** database (14+)
- **MinIO** server (for GPX file storage)
- **npm** or **yarn** package manager
- **Docker** and **Docker Compose** (optional, for containerized setup)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd spcc
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/spcc?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

# Google OAuth (optional, for Google sign-in)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# MinIO Configuration (for GPX file storage)
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET_NAME="gpx-files"
```

**Note**: Generate a secure `NEXTAUTH_SECRET` using:
```bash
openssl rand -base64 32
```

### 4. Set Up Services

#### Option A: Using Docker Compose (Recommended)

The project includes a `docker-compose.yml` file for easy setup:

```bash
# Start all services (PostgreSQL, MinIO, and the app)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This will start:
- PostgreSQL on port 5432
- MinIO on ports 9000 (API) and 9001 (Console)
- The Next.js app on port 3000

#### Option B: Manual Setup

**PostgreSQL:**
```bash
# Create database
createdb spcc

# Or using Docker
docker run --name postgres-spcc \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=spcc \
  -p 5432:5432 \
  -d postgres:16-alpine
```

**MinIO:**
```bash
# Using Docker
docker run -p 9000:9000 -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  -v minio-data:/data \
  minio/minio server /data --console-address ":9001"
```

Access MinIO Console at http://localhost:9001 (default credentials: minioadmin/minioadmin)

### 5. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates database schema)
npm run db:migrate

# Or push schema directly (for development - faster but no migration history)
npm run db:push
```

### 6. Initialize MinIO Bucket

The bucket will be created automatically on first GPX file upload, or you can create it manually through the MinIO console at http://localhost:9001.

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
spcc/
├── app/                      # Next.js App Router directory
│   ├── api/                  # API routes
│   │   ├── auth/            # NextAuth authentication endpoints
│   │   ├── trpc/            # tRPC API endpoint
│   │   └── upload/          # File upload endpoints
│   ├── calendar/            # Calendar view page
│   ├── dashboard/           # Member dashboard
│   ├── events/              # Events management pages
│   ├── members/             # Members directory
│   ├── routes/              # Routes library
│   ├── signin/              # Sign in page
│   ├── welcome/             # Welcome page for new users
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── providers.tsx        # React Query & tRPC providers
├── components/               # React components
│   ├── DashboardLayout.tsx  # Main dashboard layout with navigation
│   ├── ElevationProfile.tsx # Route elevation visualization
│   └── ...                  # Other UI components
├── lib/                      # Utility libraries
│   ├── prisma.ts            # Prisma client singleton
│   ├── minio.ts             # MinIO client configuration
│   └── trpc/                # tRPC client/server setup
├── server/                   # Server-side code
│   └── trpc/                # tRPC routers
│       ├── routers/         # API route handlers
│       │   ├── events.ts    # Event management routes
│       │   ├── members.ts   # Member management routes
│       │   └── routes.ts    # Route management routes
│       └── root.ts          # Root router
├── prisma/                   # Prisma configuration
│   └── schema.prisma        # Database schema
├── public/                   # Static assets
├── auth.ts                   # NextAuth configuration
├── docker-compose.yml        # Docker Compose configuration
├── Dockerfile               # Docker image definition
└── package.json             # Dependencies and scripts
```

## Database Schema

The application uses the following main models:

- **User**: Authentication and user accounts with role-based access control
- **Member**: Extended member profiles with contact information and membership details
- **Route**: Cycling routes with GPX file storage, elevation data, and metadata
- **Event**: Club events with scheduling, participant management, and route associations
- **EventParticipation**: Tracks event registrations and attendance
- **Account & Session**: NextAuth authentication tables

### User Roles

- `public`: Unauthenticated users
- `user`: Authenticated but not yet a member
- `member`: Full club member with access to all features
- `admin`: Administrative access

## API Documentation

### tRPC Routes

All API routes are type-safe and handled through tRPC:

**Events (`trpc.events.*`):**
- `getUpcomingEvents()` - Get upcoming events
- `getPastEvents()` - Get past events
- `getEventById(id)` - Get event details
- `createEvent(data)` - Create new event (admin)
- `updateEvent(id, data)` - Update event (admin)
- `deleteEvent(id)` - Delete event (admin)
- `registerForEvent(eventId)` - Register for an event
- `cancelRegistration(eventId)` - Cancel event registration

**Members (`trpc.members.*`):**
- `getCurrentUser()` - Get current authenticated user
- `getCurrentMember()` - Get current user's member profile
- `getAllMembers()` - Get all members (admin)
- `updateMemberProfile(data)` - Update member profile
- `createMemberProfile(data)` - Create member profile

**Routes (`trpc.routes.*`):**
- `getAllRoutes()` - Get all routes
- `getRouteById(id)` - Get route details
- `createRoute(data)` - Create new route
- `updateRoute(id, data)` - Update route
- `deleteRoute(id)` - Delete route

### REST API Endpoints

**File Upload:**
- `POST /api/upload/gpx` - Upload GPX file to MinIO
- `GET /api/upload/gpx/url?objectName=...` - Get presigned download URL for GPX file

**Authentication:**
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

## Authentication

The application uses NextAuth.js v5 with multiple authentication providers:

### Credentials Provider
- Email and password authentication
- Password hashing with bcryptjs
- Session management with JWT

### Google OAuth Provider
- Google sign-in integration
- Automatic user creation for OAuth users

### Protected Routes
- Routes are protected based on user roles
- Members and admins have access to the dashboard and member features
- Public users can only access the home page and sign in

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload

# Production
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes to database (dev)
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio (database GUI)

# Code Quality
npm run lint         # Run ESLint
```

### Development Workflow

1. Make changes to the code
2. The development server will hot-reload automatically
3. For database changes:
   - Update `prisma/schema.prisma`
   - Run `npm run db:push` (dev) or `npm run db:migrate` (production)
   - Run `npm run db:generate` to update Prisma client

### Code Style

- TypeScript strict mode enabled
- ESLint configuration follows Next.js best practices
- Components organized by feature/entity type
- Custom hooks in `hooks/` directory
- Utility functions in `lib/` directory

## Deployment

### Docker Deployment

The application includes Docker support:

```bash
# Build image
docker build -t spcc .

# Run with docker-compose
docker-compose up -d
```

See `DOCKER.md` and `PODMAN.md` for detailed deployment instructions.

### Environment Variables for Production

Ensure all environment variables are set in your production environment:
- Use a strong `NEXTAUTH_SECRET`
- Use production database URL
- Configure MinIO with proper credentials
- Set `NEXTAUTH_URL` to your production domain
- Use SSL for MinIO in production (`MINIO_USE_SSL=true`)

### Database Migrations

In production, always use migrations:
```bash
npm run db:migrate
```

## Additional Resources

- **Docker Setup**: See `DOCKER.md`
- **Podman Setup**: See `PODMAN.md`
- **Prisma Documentation**: https://www.prisma.io/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **tRPC Documentation**: https://trpc.io/docs

## Migration from Convex

This application was migrated from a Convex-based application. Key architectural changes:

- **Backend**: Convex functions → tRPC routers
- **Database**: Convex database → PostgreSQL with Prisma
- **Authentication**: Convex Auth → NextAuth.js
- **Build Tool**: Vite → Next.js
- **File Storage**: Convex file storage → MinIO (S3-compatible)

## Support

For issues, questions, or contributions, please contact:
- Email: info@southpeakscc.co.uk
- Strava: https://www.strava.com/clubs/451869
- Instagram: https://www.instagram.com/southpeakscc/

## License

[Add your license information here]
