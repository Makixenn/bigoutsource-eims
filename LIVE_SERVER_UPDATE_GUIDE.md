# Live Server Update Guide

This guide contains the exact steps and golden rules for updating the BigOutsource EIMS live production server without losing data or breaking the code.

## The Golden Rules

1. **Always use the `.prod.yml` file**
   For the live server, you must always use `docker-compose.prod.yml`. Never use the standard `docker-compose.yml` (save that for local laptop development).
2. **Always Build after Pulling**
   Docker does not read your code files live. If you pull new code from GitHub, you *must* run the `build` command so Docker can package your new code into an Image.

---

## The 3-Step Update Process

Whenever you want to update the live server with new code from the `development` branch, log into PuTTY and run these three commands in exact order:

```bash
# 1. Download the newest code from GitHub
git pull origin development

# 2. Package the new code into the Production Docker Images
sudo docker compose -f docker-compose.prod.yml build

# 3. Boot up the new containers (this automatically deletes the old ones)
sudo docker compose -f docker-compose.prod.yml up -d
```

---

## Troubleshooting Git Errors

### Error: "Your local changes... would be overwritten by merge"
This happens if you manually edited a file directly on the live server (like using `nano`), and Git refuses to overwrite your manual edit.

**Option A: Discard your manual edit and accept the GitHub version (Recommended)**
```bash
# Replace 'filename' with the file that has the error (e.g., docker-compose.yml)
git checkout filename
git pull origin development
```

**Option B: Keep your manual edit and paste it on top of the new code**
```bash
git stash
git pull origin development
git stash pop
```

---

## Troubleshooting Docker Errors

### How to check the Memory Logs (If you get 502 Bad Gateway or WSS Errors)
If the frontend or backend crashes, you can see the exact error by looking at the internal container logs:

```bash
# To check the Backend logs
sudo docker compose -f docker-compose.prod.yml logs --tail=50 backend

# To check the Frontend logs
sudo docker compose -f docker-compose.prod.yml logs --tail=50 frontend
```

### How to manually wipe or edit the Database
If you need to manually wipe the database (e.g. deleting all employees), you can log directly into the running database container:

```bash
# 1. Enter the database terminal
sudo docker exec -it bigoutsource-eims-db-1 psql -U postgres -d eims

# 2. Run your SQL commands
DELETE FROM employees CASCADE;

# 3. Exit the database
\q
```
*(Note: If it says container not found, run `sudo docker ps` to check the exact name of your database container.)*
