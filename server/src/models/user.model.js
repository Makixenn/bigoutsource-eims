import { query } from '../config/db.js';

const userSelect = `
  SELECT
    u.id,
    u.email,
    u.password_hash,
    u.status,
    u.site_id,
    s.name AS site,
    COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles,
    u.created_at,
    u.updated_at
  FROM users u
  LEFT JOIN sites s ON s.id = u.site_id
  LEFT JOIN user_roles ur ON ur.user_id = u.id
  LEFT JOIN roles r ON r.id = ur.role_id
`;

function normalize(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    status: row.status,
    siteId: row.site_id,
     
    site: row.site,
    roles: row.roles || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const UserModel = {
  async findByEmail(email) {
    const result = await query(
      `${userSelect}
       WHERE u.email = $1
       GROUP BY u.id, s.name`,
      [email.toLowerCase()]
    );
    return normalize(result.rows[0]);
  },

  async findById(id) {
    const result = await query(
      `${userSelect}
       WHERE u.id = $1
       GROUP BY u.id, s.name`,
      [id]
    );
    return normalize(result.rows[0]);
  },

  async create({ email, passwordHash, siteId = null, role = 'viewer' }, client = { query }) {
    const user = await client.query(
      `INSERT INTO users (email, password_hash, site_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [email.toLowerCase(), passwordHash, siteId]
    );

    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, id FROM roles WHERE name = $2`,
      [user.rows[0].id, role]
    );

    return this.findById(user.rows[0].id);
  },
};
