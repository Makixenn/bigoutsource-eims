import { query } from '../config/db.js';

export const SiteModel = {
  async findAll() {
    const result = await query(
      `SELECT id, name, code, address, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM sites
       ORDER BY name ASC`
    );
    return result.rows;
  },

  async create(data) {
    const result = await query(
      `INSERT INTO sites (name, code, address, is_active)
       VALUES ($1, $2, $3, COALESCE($4, TRUE))
       RETURNING id, name, code, address, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [data.name, data.code || null, data.address || null, data.isActive]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE sites
       SET name = COALESCE($2, name),
           code = COALESCE($3, code),
           address = COALESCE($4, address),
           is_active = COALESCE($5, is_active)
       WHERE id = $1
       RETURNING id, name, code, address, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id, data.name, data.code, data.address, data.isActive]
    );
    return result.rows[0] || null;
  },

  async remove(id) {
    const result = await query('DELETE FROM sites WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};
