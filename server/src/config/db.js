import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool(env.db);

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error', error);
  process.exit(1);
});

export const query = (text, params) => pool.query(text, params);

export async function transaction(callback) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
