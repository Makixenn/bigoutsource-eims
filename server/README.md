# Employee Tracker API

Node.js, Express, and PostgreSQL backend for the Employee Tracking System.

## Setup

1. Install dependencies:

```bash
cd server
npm install
```

2. Create a PostgreSQL database:

```sql
CREATE DATABASE employee_tracker;
```

3. Copy environment variables:

```bash
cp .env.example .env
```

4. Update `.env` with your local database credentials and a strong `JWT_SECRET`.

5. Create the database, then run migrations and seeds:

```bash
npm run db:create
npm run migrate
npm run seed
```

6. Start the API:

```bash
npm run dev
```

Default API URL: `http://localhost:5000`

## Seed Admin

The seed script creates one Super Admin user from:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

Defaults are shown in `.env.example`.

## Main Endpoints

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/employees`
- `POST /api/employees`
- `GET /api/sites`
- `GET /api/devices`
- `POST /api/device-assignments`
- `PUT /api/device-assignments/:id/return`
- `GET /api/audit-logs`
