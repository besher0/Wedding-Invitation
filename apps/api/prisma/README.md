# Neon setup

Use a newly rotated Neon connection string and place it only in `apps/api/.env` (never commit `.env`). Run `npm install`, `npx prisma generate`, then `npx prisma migrate deploy` inside `apps/api` to apply the checked-in initial migration. For application/runtime connections prefer the pooler URL; for schema migrations, configure a direct connection if Neon pooling causes migration issues. Always verify which database you are targeting before applying migrations.
