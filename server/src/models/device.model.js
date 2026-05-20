import { query, transaction } from '../config/db.js';

const deviceSelect = `
  SELECT
    d.id,
    d.asset_tag,
    d.device_type,
    d.pc_name,
    d.serial_number,
    d.bios_date,
    d.windows_key,
    d.rustdesk_id,
    d.remote_id,
    d.eset_status,
    d.activity_watch_status,
    d.status,
    d.site_id,
    s.name AS site,
    d.created_at,
    d.updated_at
  FROM devices d
  LEFT JOIN sites s ON s.id = d.site_id
`;

function normalize(row) {
  if (!row) return null;
  return {
    id: row.id,
    assetTag: row.asset_tag,
    deviceType: row.device_type,
    pcName: row.pc_name,
    serialNumber: row.serial_number,
    biosDate: row.bios_date,
    windowsKey: row.windows_key,
    rustdeskId: row.rustdesk_id,
    remoteId: row.remote_id,
    esetStatus: row.eset_status,
    activityWatchStatus: row.activity_watch_status,
    status: row.status,
    siteId: row.site_id,
    site: row.site,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const DeviceModel = {
  async findAll() {
    const result = await query(`${deviceSelect} ORDER BY d.created_at DESC`);
    return result.rows.map(normalize);
  },

  async findById(id) {
    const result = await query(`${deviceSelect} WHERE d.id = $1`, [id]);
    return normalize(result.rows[0]);
  },

  async create(data, userId) {
    const result = await query(
      `INSERT INTO devices (
         asset_tag, device_type, pc_name, serial_number, bios_date, windows_key,
         rustdesk_id, remote_id, eset_status, activity_watch_status, status,
         site_id, created_by, updated_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, 'missing'), COALESCE($10, 'missing'), COALESCE($11, 'available'), $12, $13, $13)
       RETURNING id`,
      [
        data.assetTag,
        data.deviceType,
        data.pcName || null,
        data.serialNumber || null,
        data.biosDate || null,
        data.windowsKey || null,
        data.rustdeskId || null,
        data.remoteId || null,
        data.esetStatus,
        data.activityWatchStatus,
        data.status,
        data.siteId || null,
        userId,
      ]
    );
    return this.findById(result.rows[0].id);
  },

  async update(id, data, userId) {
    const result = await query(
      `UPDATE devices
       SET asset_tag = COALESCE($2, asset_tag),
           device_type = COALESCE($3, device_type),
           pc_name = COALESCE($4, pc_name),
           serial_number = COALESCE($5, serial_number),
           bios_date = COALESCE($6, bios_date),
           windows_key = COALESCE($7, windows_key),
           rustdesk_id = COALESCE($8, rustdesk_id),
           remote_id = COALESCE($9, remote_id),
           eset_status = COALESCE($10, eset_status),
           activity_watch_status = COALESCE($11, activity_watch_status),
           status = COALESCE($12, status),
           site_id = COALESCE($13, site_id),
           updated_by = $14
       WHERE id = $1
       RETURNING id`,
      [
        id,
        data.assetTag,
        data.deviceType,
        data.pcName,
        data.serialNumber,
        data.biosDate,
        data.windowsKey,
        data.rustdeskId,
        data.remoteId,
        data.esetStatus,
        data.activityWatchStatus,
        data.status,
        data.siteId,
        userId,
      ]
    );
    return result.rowCount ? this.findById(id) : null;
  },

  async remove(id) {
    const result = await query('DELETE FROM devices WHERE id = $1', [id]);
    return result.rowCount > 0;
  },

  async assign({ deviceId, employeeId, notes }, userId) {
    return transaction(async (client) => {
      const assignment = await client.query(
        `INSERT INTO device_assignments (device_id, employee_id, assigned_by, notes)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [deviceId, employeeId, userId, notes || null]
      );

      await client.query(`UPDATE devices SET status = 'assigned', updated_by = $2 WHERE id = $1`, [deviceId, userId]);
      return assignment.rows[0];
    });
  },

  async returnAssignment(id, userId) {
    return transaction(async (client) => {
      const assignment = await client.query(
        `UPDATE device_assignments
         SET returned_at = NOW(), returned_by = $2
         WHERE id = $1 AND returned_at IS NULL
         RETURNING *`,
        [id, userId]
      );

      if (!assignment.rowCount) return null;

      await client.query(`UPDATE devices SET status = 'available', updated_by = $2 WHERE id = $1`, [
        assignment.rows[0].device_id,
        userId,
      ]);

      return assignment.rows[0];
    });
  },
};
