const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { success, error } = require('../utils/apiResponse');

const getStats = async (req, res) => {
  try {
    const routesResult = await pool.query(
      'SELECT COUNT(*) FROM route_requests WHERE user_id = $1',
      [req.user.id]
    );

    const categoryResult = await pool.query(
      `SELECT category, COUNT(*) as count
       FROM reports WHERE user_id = $1
       GROUP BY category ORDER BY count DESC LIMIT 1`,
      [req.user.id]
    );

    return success(res, {
      reports_count: req.user.reports_count,
      reputation: req.user.reputation,
      routes_computed: parseInt(routesResult.rows[0].count, 10),
      top_category: categoryResult.rows[0]?.category || null,
    }, 'Stats retrieved');
  } catch (err) {
    return error(res, 'Failed to fetch stats', 500);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const avatar = req.file ? req.file.path : undefined;

    const fields = [];
    const values = [];
    let idx = 1;

    if (name) { fields.push(`name = $${idx++}`); values.push(name); }
    if (bio !== undefined) { fields.push(`bio = $${idx++}`); values.push(bio); }
    if (avatar) { fields.push(`avatar = $${idx++}`); values.push(avatar); }

    if (fields.length === 0) {
      return error(res, 'No fields to update', 400);
    }

    fields.push('updated_at = NOW()');
    values.push(req.user.id);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, name, email, avatar, bio, reputation, reports_count, created_at`,
      values
    );

    return success(res, result.rows[0], 'Profile updated');
  } catch (err) {
    return error(res, 'Failed to update profile', 500);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!valid) {
      return error(res, 'Current password is incorrect', 400);
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [
      hashed,
      req.user.id,
    ]);

    return success(res, null, 'Password changed successfully');
  } catch (err) {
    return error(res, 'Failed to change password', 500);
  }
};

module.exports = { getStats, updateProfile, changePassword };
