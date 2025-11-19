# South Peaks Cycle Club - Next.js App

A cycling club management application built with Next.js, PostgreSQL, Prisma, and tRPC.

## Tech Stack

- **Framework**: Next.js 15
- **Database**: PostgreSQL
- **ORM**: Prisma
- **API**: tRPC
- **Authentication**: NextAuth.js
- **File Storage**: MinIO (S3-compatible)
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- MinIO server (for GPX file storage)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your database URL, NextAuth secret, and MinIO configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/spcc?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# MinIO Configuration (for GPX file storage)
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET_NAME="gpx-files"
```

5. Set up MinIO (if not already running):
```bash
# Using Docker (recommended)
docker run -p 9000:9000 -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  -v minio-data:/data \
  minio/minio server /data --console-address ":9001"
```

6. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Or push schema directly (for development)
npm run db:push
```

7. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # NextAuth routes
│   │   └── trpc/         # tRPC API endpoint
│   ├── dashboard/        # Dashboard pages
│   └── page.tsx          # Home page
├── components/            # React components
├── lib/                   # Utility functions
│   ├── prisma.ts         # Prisma client
│   └── trpc/             # tRPC client setup
├── prisma/                # Prisma schema
│   └── schema.prisma     # Database schema
└── server/                # Server-side code
    └── trpc/             # tRPC routers
        └── routers/      # API route handlers
```

## Database Schema

The application uses the following main models:
- **User**: Authentication and user accounts
- **Member**: Club member profiles
- **Route**: Cycling routes with GPX files
- **Event**: Club events and rides
- **EventParticipation**: Event registration tracking

## API Routes

All API routes are handled through tRPC:
- `trpc.events.*` - Event management
- `trpc.members.*` - Member management
- `trpc.routes.*` - Route management

File uploads are handled via REST API:
- `POST /api/upload/gpx` - Upload GPX files to MinIO
- `GET /api/upload/gpx/url?objectName=...` - Get presigned download URL

## Authentication

The app uses NextAuth.js with credentials provider. Users can:
- Sign up with email and password
- Sign in with existing credentials
- Access protected routes after authentication

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:studio` - Open Prisma Studio
- `npm run lint` - Run ESLint

## Migration from Convex

This app was migrated from a Convex-based application. Key changes:
- Convex functions → tRPC routers
- Convex database → PostgreSQL with Prisma
- Convex Auth → NextAuth.js
- Vite → Next.js
