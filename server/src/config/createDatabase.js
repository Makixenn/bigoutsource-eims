import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const dbName = process.env.DB_NAME;

if (!dbName) {
  console.error('Missing DB_NAME in environment');
  process.exit(1);
}

const maintenanceDatabase = process.env.DB_MAINTENANCE_NAME || 'postgres';

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: maintenanceDatabase,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

function quoteIdentifier(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

try {
  await client.connect();

  const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);

  if (existing.rowCount) {
    console.log(`Database "${dbName}" already exists`);
  } else {
    await client.query(`CREATE DATABASE ${quoteIdentifier(dbName)}`);
    console.log(`Database "${dbName}" created`);
  }
} finally {
  await client.end();
}
