# Docker Setup for Notes App (React)

This guide explains how to run the Notes App React version using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Project Structure

```
notes-app-react/
├── backend/          # Node.js/Express backend with Prisma
│   └── Dockerfile
├── frontend/         # React/Vite frontend
│   └── Dockerfile
├── docker-compose.yml
└── .env
```

## Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mgrandusky/notes-app-react.git
   cd notes-app-react
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build and start the containers**:
   ```bash
   docker-compose up -d --build
   ```

4. **Run database migrations**:
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   docker-compose exec backend npx prisma generate
   ```

5. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Database: localhost:5432

## Existing Docker Configuration

Your app already includes:
- ✅ `docker-compose.yml` with PostgreSQL, backend, and frontend services
- ✅ Environment variable configuration
- ✅ Health checks for PostgreSQL
- ✅ Volume mounting for uploads
- ✅ OAuth integration support (Google & GitHub)

## Docker Commands

### Start the application
```bash
docker-compose up -d
```

### Stop the application
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Access backend shell
```bash
docker-compose exec backend sh
```

### Run Prisma commands
```bash
# Generate Prisma Client
docker-compose exec backend npx prisma generate

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Open Prisma Studio
docker-compose exec backend npx prisma studio
```

## Environment Variables

Required variables in `.env`:

```env
# JWT Secrets
JWT_SECRET=your-secure-jwt-secret-minimum-32-characters
JWT_REFRESH_SECRET=your-secure-refresh-secret-minimum-32-characters
SESSION_SECRET=your-secure-session-secret-minimum-32-characters

# OpenAI (for AI features)
OPENAI_API_KEY=sk-...

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Database (automatically configured in docker-compose)
DATABASE_URL=postgresql://user:password@postgres:5432/notesapp
```

## Development Mode

For development with hot reloading, create `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  backend:
    command: npm run dev
    environment:
      NODE_ENV: development
    volumes:
      - ./backend:/app
      - /app/node_modules
      - ./backend/uploads:/app/uploads

  frontend:
    command: npm run dev -- --host
    environment:
      NODE_ENV: development
    volumes:
      - ./frontend:/app
      - /app/node_modules
```

Then run:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Production Deployment

### Security Checklist

- [ ] Generate strong secrets for JWT_SECRET, JWT_REFRESH_SECRET, and SESSION_SECRET
- [ ] Set up HTTPS with SSL certificates
- [ ] Configure OAuth callbacks with production URLs
- [ ] Use managed PostgreSQL database (AWS RDS, Azure Database, etc.)
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure CORS for production domain
- [ ] Review Helmet.js security headers

### Production docker-compose Override

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    restart: always
    environment:
      NODE_ENV: production
      FRONTEND_URL: https://yourdomain.com
      GOOGLE_CALLBACK_URL: https://yourdomain.com/api/auth/google/callback
      GITHUB_CALLBACK_URL: https://yourdomain.com/api/auth/github/callback

  frontend:
    restart: always
    environment:
      VITE_API_URL: https://yourdomain.com/api
      VITE_WS_URL: wss://yourdomain.com

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
```

## Troubleshooting

### Database connection errors
```bash
# Check if PostgreSQL is healthy
docker-compose ps

# Restart with fresh database
docker-compose down -v
docker-compose up -d
```

### Prisma schema changes
```bash
# After modifying schema.prisma
docker-compose exec backend npx prisma migrate dev --name your_migration_name
docker-compose exec backend npx prisma generate
```

### Port already in use
```bash
# Check what's using the port
lsof -i :5000
lsof -i :5173

# Kill the process or change ports in docker-compose.yml
```

### Upload directory permissions
```bash
chmod -R 755 backend/uploads
```

### WebSocket connection issues
Ensure `VITE_WS_URL` matches your backend URL and check CORS settings.

## Database Management

### Backup database
```bash
docker-compose exec postgres pg_dump -U user notesapp > backup_$(date +%Y%m%d).sql
```

### Restore database
```bash
docker-compose exec -T postgres psql -U user notesapp < backup_20260122.sql
```

### Access PostgreSQL CLI
```bash
docker-compose exec postgres psql -U user -d notesapp
```

## Volume Management

Data persistence volumes:
- `postgres_data` - Database data
- `./backend/uploads` - User uploaded files

### Cleanup volumes
```bash
# Remove all volumes (WARNING: deletes data)
docker-compose down -v

# Remove only orphaned volumes
docker volume prune
```

## Monitoring

### Check container health
```bash
docker-compose ps
```

### Monitor resource usage
```bash
docker stats
```

### View container details
```bash
docker-compose exec backend node -v
docker-compose exec frontend npm -v
```

## Additional Features

### Socket.IO (Real-time collaboration)
The app includes Socket.IO for real-time features. Ensure WebSocket connections are properly proxied if using nginx.

### File Uploads
Files are stored in `./backend/uploads` which is mounted as a volume. For production, consider using cloud storage (S3, Azure Blob, etc.).

### PDF Export
The app supports PDF export using PDFKit. No additional configuration needed.

## Need Help?

- Check logs: `docker-compose logs -f`
- Verify environment variables are set correctly
- Ensure all required ports are available
- Check Docker and Docker Compose versions

Happy coding! 🚀
