import { query } from '../config/db.js';

export const AuditLogModel = {
  async create({ userId, action, entityType, entityId = null, details = {}, ipAddress = null }) {
    const result = await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, action, entityType, entityId, details, ipAddress]
    );
    return result.rows[0];
  },

  async findAll() {
    const result = await query(
      `SELECT
         al.id,
         al.action,
         al.entity_type AS "entityType",
         al.entity_id AS "entityId",
         al.details,
         al.ip_address AS "ipAddress",
         al.created_at AS "createdAt",
         u.email AS "userEmail"
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC
       LIMIT 500`
    );
    return result.rows;
  },
};
