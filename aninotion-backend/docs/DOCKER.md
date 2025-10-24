# Docker Setup for AniNotion

This document provides detailed information about the Docker setup for AniNotion.

## Overview

The AniNotion application has been fully dockerized with the following components:

- **MongoDB**: Database container (mongo:7)
- **Backend**: Node.js API server (Express)
- **Frontend**: React application (served via Nginx)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Docker Network                    │
│                  (aninotion-network)                │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐   │
│  │   Frontend   │  │   Backend    │  │ MongoDB  │   │
│  │   (Nginx)    │──│  (Node.js)   │──│  (DB)    │   │
│  │   Port: 80   │  │  Port: 5000  │  │ Port:    │   │
│  │   → 5173     │  │              │  │ 27017    │   │
│  └──────────────┘  └──────────────┘  └──────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

### Starting the Application

1. **Clone and setup environment:**
   ```bash
   git clone https://github.com/mohitahlawat2001/AniNotion.git
   cd AniNotion

   # Copy environment files
   cp aninotion-backend/.env.example aninotion-backend/.env
   cp aninotion-frontend/.env.example aninotion-frontend/.env
   ```

2. **Edit environment variables:**
   Update `aninotion-backend/.env` with your configuration:
   - `JWT_SECRET`: Strong secret key for JWT tokens
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: OAuth credentials (optional)
   - `CLOUDINARY_*`: Image upload credentials (optional)
   - Other API keys as needed

3. **Start all services:**
   ```bash
   docker compose up -d
   ```

4. **Initialize database (first time only):**
   ```bash
   docker compose exec backend npm run seed
   docker compose exec backend npm run migrate:v0.5
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api
   - MongoDB: localhost:27017

## Docker Commands

### Container Management

```bash
# Start all containers
docker compose up -d

# Stop all containers
docker compose down

# Stop and remove volumes (resets database)
docker compose down -v

# Restart specific service
docker compose restart backend
docker compose restart frontend
docker compose restart mongo

# Rebuild and restart after code changes
docker compose up -d --build

# Rebuild specific service
docker compose up -d --build backend
```

### Monitoring & Logs

```bash
# View logs from all containers
docker compose logs -f

# View logs from specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongo

# View last 100 lines
docker compose logs --tail=100 backend

# Check container status
docker compose ps

# View resource usage
docker stats
```

### Executing Commands

```bash
# Run backend commands
docker compose exec backend npm run health
docker compose exec backend npm run backup
docker compose exec backend npm run migrate
docker compose exec backend npm run seed

# Access MongoDB shell
docker compose exec mongo mongosh aninotion

# Access backend container shell
docker compose exec backend sh

# Access frontend container shell
docker compose exec frontend sh
```

### Database Management

```bash
# Backup database
docker compose exec backend npm run backup

# Access MongoDB shell
docker compose exec mongo mongosh aninotion

# Export database
docker compose exec mongo mongodump --out=/data/backup

# Import database
docker compose exec mongo mongorestore /data/backup
```

## Environment Variables

### Backend (.env)

Required variables:
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `NODE_ENV`: Environment (development/production)

Optional variables:
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- `UPSTASH_REDIS_REST_URL`: Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis token
- `RESEND_API_KEY`: Resend email API key

### Frontend (.env)

- `VITE_API_URL`: Backend API URL (default: http://localhost:5000/api)
- `VITE_APP_NAME`: Application name
- `VITE_APP_DESCRIPTION`: Application description

## Volumes

The application uses persistent volumes for data storage:

### mongo-data
Stores MongoDB database files. Data persists even when containers are stopped.

### mongo-config
Stores MongoDB configuration files.

### backend logs
Backend logs are mounted to `./aninotion-backend/logs` for easy access.

To remove all volumes and reset data:
```bash
docker compose down -v
```

## Networking

All containers run in a custom bridge network (`aninotion-network`) which allows:
- Service discovery by container name
- Isolated network environment
- Secure inter-container communication

Backend connects to MongoDB using: `mongodb://mongo:27017/aninotion`
Frontend connects to backend using: `http://localhost:5000/api`

## Health Checks

### MongoDB
- Command: `mongosh ping`
- Interval: 10 seconds
- Timeout: 5 seconds
- Retries: 5

### Backend
- Endpoint: `http://localhost:5000/api/health`
- Interval: 30 seconds
- Timeout: 3 seconds
- Retries: 3
- Start period: 40 seconds

## Production Deployment

For production deployment:

1. **Update environment variables:**
   - Use strong, unique `JWT_SECRET`
   - Configure all API keys and credentials
   - Set `NODE_ENV=production`

2. **Configure domains:**
   - Update `VITE_API_URL` to production API URL
   - Update `CLIENT_URL` in backend .env

3. **Enable HTTPS:**
   - Use a reverse proxy (nginx/traefik) with SSL certificates
   - Update URLs to use https://

4. **Security considerations:**
   - Use secrets management (Docker secrets, environment variables from CI/CD)
   - Enable firewall rules
   - Regular security updates
   - Monitor logs and metrics

5. **Scale if needed:**
   ```bash
   docker compose up -d --scale backend=3
   ```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose logs backend

# Check container status
docker compose ps

# Restart service
docker compose restart backend
```

### Port already in use

Change ports in `docker-compose.yml`:
```yaml
ports:
  - "5001:5000"  # Map to different host port
```

### Database connection issues

```bash
# Check MongoDB health
docker compose exec mongo mongosh --eval "db.runCommand('ping')"

# Check network connectivity
docker compose exec backend ping mongo
```

### Permission issues

```bash
# Fix file permissions
sudo chown -R $USER:$USER aninotion-backend/logs
```

### Clean slate

```bash
# Remove everything and start fresh
docker compose down -v
docker system prune -a
docker compose up -d --build
```

## Development Workflow

For active development with hot-reloading:

1. **Use local development setup** (see README.md)
2. **Or mount source code as volumes:**
   ```yaml
   # In docker-compose.yml
   backend:
     volumes:
       - ./aninotion-backend:/app
       - /app/node_modules
   ```

3. **Use development Dockerfile** with nodemon for auto-restart

## Performance Optimization

### Build optimization
- Multi-stage builds for smaller images
- Layer caching for faster builds
- Minimal base images (alpine)

### Runtime optimization
- Health checks for service reliability
- Resource limits (optional):
  ```yaml
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 512M
  ```

## Support

For issues related to Docker setup:
1. Check logs: `docker compose logs -f`
2. Verify configuration: `docker compose config`
3. Check container status: `docker compose ps`
4. Open an issue on GitHub with logs and configuration details
