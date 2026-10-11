# Deployment checklist — ليلتنا

## Protect credentials
The originally shared Neon connection string included a password. Rotate that password in Neon, create a fresh connection string, and never commit it. Keep `apps/api/.env` on the server only and restrict its filesystem permissions. For GitHub Actions deployment, use GitHub Secrets rather than a committed file.

## Database migration
1. Back up or snapshot Neon first and verify the intended project/database.
2. From `apps/api`: `npm ci` (if lockfile exists; otherwise `npm install`), `npx prisma generate`, `npx prisma migrate status`.
3. Review pending SQL before running `npx prisma migrate deploy`.
4. Verify `GET /api/health/ready` returns HTTP 200 when DB is reachable.

Do not run `prisma migrate dev` against production. This repository's checked-in migration is meant to be applied with `migrate deploy`.

## Environment

Backend `apps/api/.env`:
```dotenv
DATABASE_URL="postgresql://USER:NEW_PASSWORD@YOUR-NEON-HOST/neondb?sslmode=require"
JWT_SECRET="LONG_RANDOM_SECRET_AT_LEAST_32_CHARACTERS"
PORT=5000
CORS_ORIGIN="https://your-domain.example"
```

Frontend build-time `.env.production`:
```dotenv
VITE_API_URL="https://your-domain.example/api"
```

The frontend URL is compiled into Vite assets at build time. Never set `DATABASE_URL` or `JWT_SECRET` in any variable prefixed `VITE_`.

## Operations
- Run the NestJS API with a managed process and a TLS reverse proxy.
- Use Nginx (or equivalent) to route `/api/` to the NestJS service and `/invite/*` to the frontend SPA index.html.
- Configure HTTPS and appropriate security headers.
- `GET /api/health/live` confirms the Node server is responding.
- `GET /api/health/ready` also checks database connectivity.
- Test registration, login, invitation CRUD, publish/unpublish, and public URL before opening access to users.

## Production blockers
The current MVP does not have rate limiting, account verification, password reset, persistent music/image uploads, centralized logs, or a tested production deployment. Do not treat passing a build as proof of production readiness.
