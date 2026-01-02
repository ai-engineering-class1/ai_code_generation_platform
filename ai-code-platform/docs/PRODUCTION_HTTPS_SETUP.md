# Production Deployment and HTTPS Configuration

This document outlines the architecture for deploying the AI Code Generation Platform in production with HTTPS support, resolving "Mixed Content" errors, and configuring local development environments.

## Architecture Overview

In production, the application sits behind an **Nginx Reverse Proxy**. This handles SSL termination and routes traffic to the appropriate Docker containers.

- **External URL**: `https://aicodegen.easiiodev.ai` (HTTPS)
- **Frontend Container**: Exposed internally on port `3012` (mapped to host `4530`)
- **Backend Container**: Exposed internally on port `8000` (mapped to host `4531`)

### The Mixed Content Challenge

Browsers block requests from a secure page (`https://...`) to an insecure server (`http://...`).
- **Problem**: If the frontend tries to call `http://103.98.xxx.xxx:8000/api/...`, the browser blocks it.
- **Solution**: Use **Relative Paths** associated with the Nginx proxy.

Instead of calling the backend directly, the frontend calls `/api/v1/...`. The browser treats this as `https://aicodegen.easiiodev.ai/api/v1/...` (Secure). Nginx then proxies this request to the backend service.

---

## 1. Nginx Configuration

The Nginx server block handles the routing.

*   `/` -> Proxies to Frontend (Next.js)
*   `/api/` -> Proxies to Backend (FastAPI + Websockets)

```nginx
server {
    server_name aicodegen.easiiodev.ai;

    # Frontend Application
    location / {
        proxy_pass http://127.0.0.1:4530;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Backend API & WebSockets
    # Note: Websocket headers (Upgrade, Connection) are critical for the terminal to work.
    location /api/ {
        proxy_pass http://127.0.0.1:4531;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SSL Configuration (Managed by Certbot)
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/aicodegen.easiiodev.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aicodegen.easiiodev.ai/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# HTTP to HTTPS Redirect
server {
    if ($host = aicodegen.easiiodev.ai) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name aicodegen.easiiodev.ai;
    return 404;
}
```

---

## 2. Docker Compose Configuration

To support the relative path strategy in production while allowing the app to build correctly, we explicitly set the `NEXT_PUBLIC_API_URL` to an empty string in `docker-compose.yml`.

**`docker-compose.yml`**:
```yaml
  frontend:
    # ...
    environment:
      # Runtime override: Set to empty string to force relative paths.
      # This results in API calls to "/api/v1" instead of "http://hostname..."
      - NEXT_PUBLIC_API_URL=
```

---

## 3. Frontend Configuration (`src/lib/api.ts`)

The frontend code adapts based on the environment to support both production (relative) and local dev (absolute).

```typescript
// On client, we want relative path '/api/v1' ONLY if we are behind a reverse proxy (like Nginx).
// In local dev without proxy, we need the full URL 'http://localhost:8000'.
const API_URL = isServer
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  : (process.env.NEXT_PUBLIC_API_URL || '') // Defaults to '' in Prod, forcing relative path behavior

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  // ...
})
```

---

## 4. Local Development Guide

Since we do not run Nginx locally on Windows, we cannot use relative paths because the frontend (port 3012) and backend (port 8000) are on different ports.

To run locally without errors:

1.  Create or update `frontend/.env.local`:
    ```bash
    NEXT_PUBLIC_API_URL=http://localhost:8000
    ```
2.  Restart your local Next.js server (`npm run dev`).

This configuration forces the frontend to talk directly to `http://localhost:8000`, bypassing the need for an Nginx proxy during development.

## 5. WebSocket & Terminal Configuration

The web-based terminal (`Terminal.tsx`) has specific logic to handle WebSocket connections across environments:

1.  **Local Development**:
    *   It checks for `NEXT_PUBLIC_API_URL`.
    *   If present (e.g., `http://localhost:8000`), it replaces `http` with `ws` to derive `ws://localhost:8000`.
    *   This ensures it connects to the correct backend port, even if the frontend is running on a different port (3012).

2.  **Production**:
    *   `NEXT_PUBLIC_API_URL` is empty.
    *   It falls back to `window.location.host` (e.g., `aicodegen.easiiodev.ai`).
    *   It derives the protocol based on the current page (`https:` -> `wss:`).
    *   The resulting URL (`wss://aicodegen.easiiodev.ai/api/v1/...`) is handled by Nginx and proxied to the backend.
