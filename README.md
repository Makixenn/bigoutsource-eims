# Employee Tracking System

React + Vite frontend with a Node.js, Express, and PostgreSQL API backend.

## Project Layout

```text
eims/
├── src/                 # Existing React + Vite frontend
├── server/              # Express + PostgreSQL backend
├── package.json         # Frontend scripts
└── README.md
```

This workspace did not include a separate `client/` directory, so the existing frontend remains at the repository root. Backend code lives in `server/`.

## Frontend Setup

```bash
npm install
copy .env.example .env
npm run dev
```

Set the backend URL in `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Default frontend URL: `http://localhost:3000`

## Backend Setup

```bash
cd server
npm install
copy .env.example .env
```

Create a PostgreSQL database:

```sql
CREATE DATABASE employee_tracker;
```

Update `server/.env` with your database credentials and a strong `JWT_SECRET`, then run:

```bash
npm run db:create
npm run migrate
npm run seed
npm run dev
```

Default backend URL: `http://localhost:5000`

## Seed Login

The seed script creates a Super Admin using:

```env
SEED_ADMIN_EMAIL=admin@bigoutsource.com
SEED_ADMIN_PASSWORD=Admin123!
```

Change these in `server/.env` before seeding if needed.
