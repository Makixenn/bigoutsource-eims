import { pool, transaction } from '../src/config/db.js';
import { hashPassword } from '../src/utils/hashPassword.js';

const roles = [
  ['super_admin', 'Full system access'],
  ['hr_admin', 'Employee and HR record management'],
  ['it_admin', 'Device and assignment management'],
  ['viewer', 'Read-only access'],
];

const statuses = [
  ['active', 'Currently employed'],
  ['inactive', 'Inactive employee record'],
  ['archive', 'Archived employee record'],
];

try {
  await transaction(async (client) => {
    for (const [name, description] of roles) {
      await client.query(
        `INSERT INTO roles (name, description)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`,
        [name, description]
      );
    }

    for (const [name, description] of statuses) {
      await client.query(
        `INSERT INTO employment_status (name, description)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`,
        [name, description]
      );
    }

    const site = await client.query(
      `INSERT INTO sites (name, code, address)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET code = EXCLUDED.code
       RETURNING id`,
      ['HQ', 'HQ', 'Main office']
    );

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@bigoutsource.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
    const passwordHash = await hashPassword(adminPassword);

    const user = await client.query(
      `INSERT INTO users (email, password_hash, site_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET site_id = EXCLUDED.site_id
       RETURNING id`,
      [adminEmail.toLowerCase(), passwordHash, site.rows[0].id]
    );

    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, id FROM roles WHERE name = 'super_admin'
       ON CONFLICT DO NOTHING`,
      [user.rows[0].id]
    );
  });

  console.log('Seed data inserted');
} finally {
  await pool.end();
}
