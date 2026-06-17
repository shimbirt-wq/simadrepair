# Deployment

## Vercel

Set these environment variables in Vercel before creating a production deployment:

- `DATABASE_URL`: Supabase pooled PostgreSQL connection string for runtime.
- `DIRECT_URL`: Supabase direct PostgreSQL connection string for migrations.
- `JWT_SECRET`: Random secret with at least 32 characters.
- `NEXT_PUBLIC_APP_URL`: Canonical deployed application URL.
- `UPLOAD_MAX_SIZE_MB`: Maximum accepted repair photo size, default `5`.
- `UPLOAD_PUBLIC_BASE_URL`: Optional public object-storage base URL for stored repair photos.
- `UPLOAD_BUCKET`: Supabase Storage bucket for repair photos, default `repair-ticket-photos`.
- `SUPABASE_URL`: Supabase project URL for Storage REST uploads.
- `SUPABASE_SERVICE_ROLE_KEY`: Server-only Supabase key used by upload routes.

Run Prisma migrations from a controlled environment before promoting the deployment:

```bash
npx prisma migrate deploy
```

## Supabase

Use Supabase PostgreSQL for application records and Supabase Storage, or another object-storage provider, for repair ticket photos. Store only the generated object path or public/signed URL in `repair_tickets.photo_url`.

## Readiness Checks

- `GET /api/health` returns service status and environment validation state.
- Auth cookies are HTTP-only and become `secure` when `NODE_ENV=production`.
- Security headers are configured in `next.config.ts`.
- Login and registration routes use lightweight in-process rate limiting.
- Do not commit `.env` or production secrets.
