import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const relativeFile = process.argv[2];

if (!relativeFile) {
  console.error('Usage: node src/config/runSqlFile.js <relative-sql-file>');
  process.exit(1);
}

const filePath = path.resolve(__dirname, '../../', relativeFile);
const sql = fs.readFileSync(filePath, 'utf8');

try {
  await pool.query(sql);
  console.log(`Executed ${relativeFile}`);
} finally {
  await pool.end();
}
