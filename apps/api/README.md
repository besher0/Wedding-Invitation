# Wedding API (NestJS + Neon PostgreSQL)

Run from apps/api:

```bash
npm install
cp .env.example .env
# Set a fresh Neon DATABASE_URL and a 32+ character JWT_SECRET in .env
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

The supplied Neon password appeared in chat: rotate it in Neon before configuring the .env. Never commit .env or credentials.

Routes: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me; GET/POST /api/invitations; GET/PATCH/DELETE /api/invitations/:id; POST /api/invitations/:id/publish and /unpublish; GET /api/invitations/public/:slug.

This API is a foundation only. Frontend integration, rate limiting, media hosting, password recovery and production tests are pending.
