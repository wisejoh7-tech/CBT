# Implementation Plan: Production Hardening for VIVI CBT

This plan focuses on making the CBT Simulator ready for production by improving security, stability, and observability.

## User Review Required

> [!IMPORTANT]
> **Domain Configuration**: The `nginx.conf` contains placeholders like `yourdomain.com`. You must replace these with your actual domain name and ensure SSL certificates are provided via Certbot.
> **Environment Variables**: You will need to provide production-level secrets for `JWT_SECRET`, `POSTGRES_PASSWORD`, and `GEMINI_API_KEY`.

## Proposed Changes

### [Backend Hardening]

#### [MODIFY] [index.ts](file:///C:/Users/idemu/OneDrive/Desktop/CBT/My-exam/server/src/index.ts)
- Add structured logging using `winston`.
- Implement graceful shutdown (closing DB and Redis connections).
- Validate environment variables at startup.
- Restrict CORS to specific production domains.

#### [NEW] [logger.ts](file:///C:/Users/idemu/OneDrive/Desktop/CBT/My-exam/server/src/lib/logger.ts)
- Create a centralized logger for consistency across the application.

#### [NEW] [config.ts](file:///C:/Users/idemu/OneDrive/Desktop/CBT/My-exam/server/src/lib/config.ts)
- Use `zod` to validate all environment variables.

### [DevOps & Infrastructure]

#### [MODIFY] [docker-compose.yml](file:///C:/Users/idemu/OneDrive/Desktop/CBT/My-exam/docker-compose.yml)
- Add `healthcheck` to Postgres and Redis to ensure dependent services wait for them.
- Add resource limits (CPU/Memory) for containers.
- Fix environment variable interpolation.

#### [NEW] [.dockerignore](file:///C:/Users/idemu/OneDrive/Desktop/CBT/My-exam/server/.dockerignore)
- Exclude `node_modules` and logs from being copied into the image.

#### [MODIFY] [Dockerfile](file:///C:/Users/idemu/OneDrive/Desktop/CBT/My-exam/server/Dockerfile)
- Use a non-root user (`node`) to run the application.

### [Frontend Optimization]

#### [MODIFY] [index.html](file:///C:/Users/idemu/OneDrive/Desktop/CBT/My-exam/index.html)
- Add production-ready meta tags (CSP, security headers).

## Verification Plan

### Automated Tests
- `npm run lint` to ensure code quality.
- Startup check: Server should fail immediately if `DATABASE_URL` or `REDIS_URL` is missing.

### Manual Verification
- Verify that killing the server process logs a "Shutdown complete" message.
- Verify that the Docker containers start in the correct order using `docker-compose up`.
