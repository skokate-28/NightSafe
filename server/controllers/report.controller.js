const pool = require('../config/db');
const redis = require('../config/redis');
const { success, error } = require('../utils/apiResponse');
const { computeReportWeight } = require('../algorithm/safetyRouter');
const { computeClusters } = require('../algorithm/clusterEngine');
const { pointGeohashes } = require('../utils/geohash');

const emitReportToBbox = (io, report, bboxRooms) => {
  if (!io) return;
  const hashes = pointGeohashes(report.lat, report.lng);
  for (const room of bboxRooms || []) {
    if (hashes.includes(room.replace('bbox:', ''))) {
      io.to(room).emit('report:new', report);
    }
  }
  io.emit('report:new', report);
};

const createReport = async (req, res) => {
  try {
    const lat = parseFloat(req.body.lat);
    const lng = parseFloat(req.body.lng);
    const { category, description, address } = req.body;
    const severity = parseInt(req.body.severity, 10);
    const photo_url = req.file ? req.file.path : '';
    const currentHour = req.body.hour_of_day != null
      ? parseInt(req.body.hour_of_day, 10)
      : new Date().getHours();

    const result = await pool.query(
      `INSERT INTO reports
        (user_id, location, address, category, severity, description, photo_url, hour_of_day)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.user.id, lng, lat, address || '', category, severity, description || '', photo_url, currentHour]
    );

    const report = result.rows[0];
    const locResult = await pool.query(
      'SELECT ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng FROM reports WHERE id = $1',
      [report.id]
    );

    const formatted = {
      ...report,
      lat: parseFloat(locResult.rows[0].lat),
      lng: parseFloat(locResult.rows[0].lng),
      weight: computeReportWeight(report, new Date().getHours()),
      author: { name: req.user.name, avatar: req.user.avatar },
    };

    await pool.query('UPDATE users SET reports_count = reports_count + 1 WHERE id = $1', [req.user.id]);

    const io = req.app.get('io');
    if (io) {
      io.emit('report:new', formatted);
    }

    computeClusters().catch((err) => console.error('Cluster recompute error:', err));

    return success(res, formatted, 'Report submitted successfully', 201);
  } catch (err) {
    console.error('Create report error:', err);
    return error(res, 'Failed to create report', 500);
  }
};

const getReports = async (req, res) => {
  try {
    const { lat, lng, radius = 1000, category, severity_min } = req.query;
    if (!lat || !lng) {
      return error(res, 'lat and lng are required', 400);
    }

    const currentHour = new Date().getHours();
    let query = `
      SELECT r.*,
        ST_Y(r.location::geometry) AS lat,
        ST_X(r.location::geometry) AS lng,
        u.name AS author_name,
        u.avatar AS author_avatar
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.expires_at > NOW()
        AND ST_DWithin(r.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
    `;
    const params = [parseFloat(lng), parseFloat(lat), parseFloat(radius)];
    let paramIdx = 4;

    if (category) {
      query += ` AND r.category = $${paramIdx}`;
      params.push(category);
      paramIdx++;
    }
    if (severity_min) {
      query += ` AND r.severity >= $${paramIdx}`;
      params.push(parseInt(severity_min, 10));
      paramIdx++;
    }

    query += ' ORDER BY r.created_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    const reports = result.rows.map((r) => ({
      ...r,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      weight: computeReportWeight(r, currentHour),
      author: { name: r.author_name, avatar: r.author_avatar },
    }));

    return success(res, reports, 'Reports retrieved');
  } catch (err) {
    console.error('Get reports error:', err);
    return error(res, 'Failed to fetch reports', 500);
  }
};

const getReportById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
        ST_Y(r.location::geometry) AS lat,
        ST_X(r.location::geometry) AS lng,
        u.name AS author_name,
        u.avatar AS author_avatar
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return error(res, 'Report not found', 404);
    }

    const r = result.rows[0];
    const report = {
      ...r,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      weight: computeReportWeight(r, new Date().getHours()),
      author: { name: r.author_name, avatar: r.author_avatar },
    };

    return success(res, report, 'Report retrieved');
  } catch (err) {
    return error(res, 'Failed to fetch report', 500);
  }
};

const voteReport = async (req, res) => {
  try {
    const { vote_type } = req.body;
    const reportId = req.params.id;

    const existing = await pool.query(
      'SELECT * FROM report_votes WHERE report_id = $1 AND user_id = $2',
      [reportId, req.user.id]
    );

    if (existing.rows.length > 0) {
      const oldVote = existing.rows[0].vote_type;
      if (oldVote === vote_type) {
        return error(res, 'Already voted', 400);
      }
      await pool.query(
        'UPDATE report_votes SET vote_type = $1 WHERE report_id = $2 AND user_id = $3',
        [vote_type, reportId, req.user.id]
      );
      const decField = oldVote === 'up' ? 'upvotes' : 'downvotes';
      const incField = vote_type === 'up' ? 'upvotes' : 'downvotes';
      await pool.query(
        `UPDATE reports SET ${decField} = ${decField} - 1, ${incField} = ${incField} + 1 WHERE id = $1`,
        [reportId]
      );
    } else {
      await pool.query(
        'INSERT INTO report_votes (report_id, user_id, vote_type) VALUES ($1, $2, $3)',
        [reportId, req.user.id, vote_type]
      );
      const field = vote_type === 'up' ? 'upvotes' : 'downvotes';
      await pool.query(`UPDATE reports SET ${field} = ${field} + 1 WHERE id = $1`, [reportId]);
    }

    const result = await pool.query('SELECT * FROM reports WHERE id = $1', [reportId]);
    const report = result.rows[0];

    const io = req.app.get('io');
    if (io) {
      io.emit('report:updated', report);
    }

    return success(res, report, 'Vote recorded');
  } catch (err) {
    console.error('Vote error:', err);
    return error(res, 'Failed to vote', 500);
  }
};

const deleteReport = async (req, res) => {
  try {
    const result = await pool.query('SELECT user_id FROM reports WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return error(res, 'Report not found', 404);
    }

    if (result.rows[0].user_id !== req.user.id) {
      return error(res, 'Not authorized', 403);
    }

    await pool.query('DELETE FROM reports WHERE id = $1', [req.params.id]);
    computeClusters().catch(console.error);

    return success(res, null, 'Report deleted');
  } catch (err) {
    return error(res, 'Failed to delete report', 500);
  }
};

module.exports = {
  createReport,
  getReports,
  getReportById,
  voteReport,
  deleteReport,
};
