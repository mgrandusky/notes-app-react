# Notes App React

## 🐳 Docker Setup

This application supports Docker for easy deployment and development.

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/mgrandusky/notes-app-react.git
cd notes-app-react

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start with Docker Compose
docker-compose up -d --build

# Run database migrations
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma generate

# Access the app at http://localhost:5173
```

For detailed Docker documentation, see [DOCKER.md](DOCKER.md).
