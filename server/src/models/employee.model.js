import { query } from '../config/db.js';

const employeeSelect = `
  SELECT
    e.id,
    e.employee_number,
    e.full_name,
    e.bo_email,
    e.phone,
    e.address,
    e.account_assignment,
    e.lms_account,
    e.site_id,
    s.name AS site,
    es.name AS status,
    ep.avatar_url,
    e.created_at,
    e.updated_at
  FROM employees e
  LEFT JOIN sites s ON s.id = e.site_id
  LEFT JOIN employment_status es ON es.id = e.status_id
  LEFT JOIN employee_profiles ep ON ep.employee_id = e.id
`;

function normalize(row) {
  if (!row) return null;
  return {
    id: row.id,
    employeeNumber: row.employee_number,
    fullName: row.full_name,
    boEmail: row.bo_email,
    phone: row.phone,
    address: row.address,
    accountAssignment: row.account_assignment,
    lmsAccount: row.lms_account,
    siteId: row.site_id,
    site: row.site,
    status: row.status,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const EmployeeModel = {
  async findAll() {
    const result = await query(`${employeeSelect} ORDER BY e.created_at DESC`);
    return result.rows.map(normalize);
  },

  async findById(id) {
    const result = await query(`${employeeSelect} WHERE e.id = $1`, [id]);
    return normalize(result.rows[0]);
  },

  async create(data, userId) {
    const result = await query(
      `INSERT INTO employees (
         employee_number, full_name, bo_email, phone, address, account_assignment,
         lms_account, site_id, status_id, created_by, updated_by
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8,
         (SELECT id FROM employment_status WHERE name = COALESCE($9, 'active')),
         $10, $10
       )
       RETURNING id`,
      [
        data.employeeNumber,
        data.fullName,
        data.boEmail || null,
        data.phone || null,
        data.address || null,
        data.accountAssignment || null,
        data.lmsAccount || null,
        data.siteId || null,
        data.status || 'active',
        userId,
      ]
    );
    return this.findById(result.rows[0].id);
  },

  async update(id, data, userId) {
    const result = await query(
      `UPDATE employees
       SET employee_number = COALESCE($2, employee_number),
           full_name = COALESCE($3, full_name),
           bo_email = COALESCE($4, bo_email),
           phone = COALESCE($5, phone),
           address = COALESCE($6, address),
           account_assignment = COALESCE($7, account_assignment),
           lms_account = COALESCE($8, lms_account),
           site_id = COALESCE($9, site_id),
           status_id = COALESCE((SELECT id FROM employment_status WHERE name = $10), status_id),
           updated_by = $11
       WHERE id = $1
       RETURNING id`,
      [
        id,
        data.employeeNumber,
        data.fullName,
        data.boEmail,
        data.phone,
        data.address,
        data.accountAssignment,
        data.lmsAccount,
        data.siteId,
        data.status,
        userId,
      ]
    );
    return result.rowCount ? this.findById(id) : null;
  },

  async remove(id) {
    const result = await query('DELETE FROM employees WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};
