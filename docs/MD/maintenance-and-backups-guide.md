# Maintenance & Backups Guide

## 1. Overview
As a production-grade system handling critical HR operations, EIMS must be highly resilient. This guide covers the DevOps procedures for maintaining Docker container health, rate limiting to prevent DDoS, and securing the Postgres database.

## 2. Docker Restart Policies
In `docker-compose.yml`, all primary services (`frontend`, `backend`, `db`) are configured with `restart: always`.
- If the Node.js backend throws an uncaught exception (e.g., an Out-Of-Memory error from uploading a massive 50MB Excel file), the container will crash.
- Docker will automatically restart the container within seconds, minimizing downtime.
- **Maintenance Action:** If you need to stop the containers permanently, use `docker compose down`. Do NOT just stop the daemon.

## 3. Rate Limiting (`express-rate-limit`)
The backend uses an in-memory rate limiter to prevent brute-force attacks on the `/login` routes and to prevent API spamming.
- The standard tolerance is highly restrictive (e.g., 5-10 requests per minute for auth routes).
- **Maintenance Action:** If the entire BigOutsource office is working behind a single NAT (shared public IP address), the rate limiter will see 50 HR admins as a "single attacker." Ensure `trust proxy` is enabled in Express, or whitelist the office static IP if employees are complaining about being randomly blocked.

## 4. PostgreSQL Backups & Volumes
The database is managed inside Docker, meaning the raw data lives inside a Docker Volume named `pgdata`.
> [!CAUTION]
> If you run `docker compose down -v`, you will instantly and permanently wipe the entire PostgreSQL database. NEVER use the `-v` flag in production!

### Database Dump (Manual Backup)
To create a raw SQL backup of the live database without bringing the system down, run:
```bash
docker exec -t <container_id_of_db> pg_dumpall -c -U postgres > eims_dump_`date +%d-%m-%Y"_"%H_%M_%S`.sql
```

### Restoring from Backup
To restore a corrupted database from an `.sql` dump:
```bash
cat eims_dump_DD-MM-YYYY.sql | docker exec -i <container_id_of_db> psql -U postgres
```

> [!TIP]
> In a true production environment, consider setting up a cron job on the host machine to execute the `pg_dumpall` command nightly and upload the resulting `.sql` file to a secure Amazon S3 bucket.
