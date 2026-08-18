# Environment Variables Guide

This document lists all the required and optional environment variables needed to configure the BigOutsource EIMS for local development and production. 

The system relies on a unified `.env` structure. Ensure you copy the `.env.example` to `.env` in both the `frontend` and `backend` directories (or at the project root, depending on your deployment strategy).

## Backend Configuration (`backend/.env`)

These variables control the Node.js/Express server and its connections.

| Variable | Description | Default / Example | Required |
|----------|-------------|-------------------|:--------:|
| `NODE_ENV` | Sets the application environment. Controls logging verbosity and error traces. | `development` | Yes |
| `PORT` | The port the Express server listens on. | `5001` | Yes |
| `CORS_ORIGIN` | Comma-separated list of allowed frontend origins to prevent CORS errors. | `http://localhost:3000` | Yes |
| `DATABASE_URL` | The PostgreSQL connection string for Prisma. | `postgresql://postgres:postgres@localhost:5432/eims?schema=public` | Yes |
| `JWT_SECRET` | The cryptographic key used to sign and verify JSON Web Tokens for authentication. | `super_secret_jwt_key` | Yes |
| `SMTP_HOST` | Hostname for the email SMTP server (e.g., SendGrid, Mailpit). | `mailpit` | No |
| `SMTP_PORT` | Port for the SMTP server. | `1025` | No |
| `SMTP_USER` | Username for SMTP authentication. | *empty* | No |
| `SMTP_PASS` | Password for SMTP authentication. | *empty* | No |

### Seeding Variables (Development Only)
These variables are used by the database seeder to create a default Super Admin account if the database is empty. They are **not** needed in production.

| Variable | Description | Default |
|----------|-------------|---------|
| `SEED_SUPER_ADMIN_EMAIL` | Default login email for the admin. | `kamote@gmail.com` |
| `SEED_SUPER_ADMIN_PASSWORD` | Default password for the admin. | `kamote123` |
| `SEED_SUPER_ADMIN_FULL_NAME`| Default name. | `Local Super Admin` |
| `SEED_SUPER_ADMIN_DEPARTMENT`| Default department. | `Administration` |
| `SEED_SUPER_ADMIN_SITE` | Default site location. | `HQ` |

---

## Frontend Configuration (`frontend/.env`)

These variables are baked into the React/Vite build process. In Vite, only variables prefixed with `VITE_` are exposed to the client-side code.

| Variable | Description | Default / Example | Required |
|----------|-------------|-------------------|:--------:|
| `VITE_API_BASE_URL` | The absolute URL pointing to your backend Express server's API routes. | `http://localhost:5001/api` | Yes |
| `VITE_SUPABASE_URL` | The URL for your Supabase project (if using Supabase for specific realtime or storage features). | `https://your-project-ref.supabase.co` | No |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The anonymous/publishable key for Supabase client interactions. | `your-anon-key` | No |

> [!CAUTION]
> **Never** expose server-side secrets (like `JWT_SECRET` or `DATABASE_URL`) in the `frontend/.env` file. Any variable starting with `VITE_` is visible to anyone inspecting the network traffic in the browser.
