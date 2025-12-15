# Local Development with Docker

To test your local changes using Docker:

## Prerequisites
- Docker and Docker Compose installed
- Node.js and npm installed

## Setup Steps

1. **Build the package:**
   ```bash
   npm run build
   ```

2. **Start n8n with Docker:**
   ```bash
   docker compose up -d
   ```

## Development Workflow

After making code changes:

```bash
npm run build && docker restart n8n-dev
```

To view logs:
```bash
docker logs n8n-dev -f
```

To stop the environment:
```bash
docker compose down
```