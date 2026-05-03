# Deployment Guide

This guide covers deploying RNUdb in production environments.

## Options

RNUdb can be deployed in several ways:

1. **Docker** (recommended) - Containerized deployment
2. **Bare Metal** - Direct installation on a server

---

## Docker Deployment

### Quick Start

```bash
# Pull and run the latest image
docker-compose up -d

# View logs
docker-compose logs -f

# Access at http://localhost:8000
```

### Custom Deployment

```bash
# Pull the image
docker pull ghcr.io/computational-rare-disease-genomics-whg/rnudb:latest

# Run with custom environment
docker run -d \
  --name rnudb \
  -p 8000:8000 \
  -e GITHUB_CLIENT_ID=your_client_id \
  -e GITHUB_CLIENT_SECRET=your_client_secret \
  -e JWT_SECRET_KEY=your_secure_secret_key \
  -e ADMIN_GITHUB_LOGINS=admin1,admin2 \
  -e FRONTEND_URL=https://your-domain.com \
  -v rnudb-data:/app/data \
  ghcr.io/computational-rare-disease-genomics-whg/rnudb:latest
```

### Volume Mounts

The Docker image mounts `/app/data` for persistent storage:

- `database.db` - SQLite database file
- Backups and other data

### Environment Variables

| Variable               | Required | Description                            |
| ---------------------- | -------- | -------------------------------------- |
| `GITHUB_CLIENT_ID`     | Yes      | GitHub OAuth App client ID             |
| `GITHUB_CLIENT_SECRET` | Yes      | GitHub OAuth App client secret         |
| `JWT_SECRET_KEY`       | Yes      | Secret for JWT signing (min 32 chars)  |
| `ADMIN_GITHUB_LOGINS`  | Yes      | Comma-separated admin GitHub usernames |
| `FRONTEND_URL`         | Yes      | Production URL for OAuth callbacks     |

---

## Building Docker Image

### Local Build

```bash
# Build for current platform
docker build -t rnudb:local .

# Build and tag for registry
docker build -t ghcr.io/your-org/rnudb:latest .
```

### Multi-arch Build

For deploying to servers with different architectures (amd64, arm64):

```bash
# Enable Docker Buildx
docker buildx create --name mybuilder
docker buildx use mybuilder

# Build multi-arch image
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag ghcr.io/computational-rare-disease-genomics-whg/rnudb:latest \
  --push .
```

---

## Bare Metal Deployment

### Requirements

- Python 3.11
- Node.js 20+
- uv package manager
- Web server (nginx, Apache) for static files
- Process manager (systemd, Supervisor)

### Setup

1. **Install dependencies:**

   ```bash
   uv sync
   npm install
   ```

2. **Build frontend:**

   ```bash
   npm run build
   ```

3. **Run migrations:**

   ```bash
   uv run alembic upgrade head
   ```

4. **Configure environment:**

   ```bash
   cp .env.example .env
   # Edit with production values
   ```

5. **Serve with uvicorn:**

   ```bash
   uv run uvicorn api.main:app --host 0.0.0.0 --port 8000
   ```

6. **Reverse proxy (nginx):**

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           root /path/to/rnudb/dist;
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

---

## GitHub Container Registry

### Authentication

The image is automatically built and pushed on main branch commits via GitHub Actions.

To pull the image:

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_ACTOR --password-stdin

# Pull the image
docker pull ghcr.io/computational-rare-disease-genomics-whg/rnudb:latest
```

### Image Tags

| Tag          | Description                  |
| ------------ | ---------------------------- |
| `latest`     | Latest stable release        |
| `main`       | Latest commit on main branch |
| `sha-xxxxxx` | Specific commit SHA          |
| `v1.2.3`     | Semantic version             |

---

## Backup & Restore

### Automated Backup

Create a backup script:

```bash
#!/bin/bash
# /opt/rnudb-backup.sh

BACKUP_DIR="/backup/rnudb"
DATE=$(date +%Y%m%d-%H%M%S)
CONTAINER_NAME="rnudb"

mkdir -p "$BACKUP_DIR"

# Copy database from container
docker cp "$CONTAINER_NAME:/app/data/database.db" "$BACKUP_DIR/database-$DATE.db"

# Keep only last 7 backups
find "$BACKUP_DIR" -name "database-*.db" -mtime +7 -delete

echo "Backup completed: database-$DATE.db"
```

Add to cron:

```bash
crontab -e
# Add: 0 2 * * * /opt/rnudb-backup.sh
```

### Manual Backup

```bash
# From running container
docker exec rnudb cat /app/data/database.db > backup.db

# Or using docker cp
docker cp rnudb:/app/data/database.db ./backup-$(date +%Y%m%d).db
```

### Restore

```bash
# Stop the container
docker-compose down

# Restore database
docker cp backup.db rnudb:/app/data/database.db

# Restart
docker-compose up -d
```

---

## Health Checks

### Docker Health Check

The container includes a health check endpoint:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' rnudb
```

### Manual Health Check

```bash
curl -f http://localhost:8000/api/genes || exit 1
```

---

## Security Considerations

### Production Checklist

- [ ] Use strong JWT_SECRET_KEY (generate with `python -c "import secrets; print(secrets.token_hex(32))"`)
- [ ] Enable HTTPS (use Let's Encrypt or your certificate authority)
- [ ] Restrict ADMIN_GITHUB_LOGINS to trusted users
- [ ] Set FRONTEND_URL to your production domain
- [ ] Enable firewall rules for port 8000
- [ ] Regular backups (daily recommended)
- [ ] Monitor logs for suspicious activity

### Environment Variables

Never commit `.env` to version control. Use:

- Environment file (local)
- Docker secrets (production)
- Environment variables (CI/CD)

---

## Monitoring

### Logs

```bash
# Docker
docker-compose logs -f

# Systemd
journalctl -u rnudb -f
```

### Resource Usage

```bash
docker stats rnudb
```

---

## Troubleshooting

### Container Won't Start

1. Check environment variables:

   ```bash
   docker-compose config
   ```

2. Check logs:
   ```bash
   docker-compose logs
   ```

### Database Locked

```bash
# Remove lock file
docker exec rnudb rm -f /app/data/database.db-journal
```

### Permission Issues

```bash
# Fix volume permissions
docker exec rnudb chown -R nonroot:nonroot /app/data
```

---

## CI/CD

The project uses GitHub Actions for CI/CD:

- **ci.yml** - Runs tests, linting, and build on all PRs
- **build.yml** - Builds and pushes Docker image on main branch push

See `.github/workflows/` for configuration.
