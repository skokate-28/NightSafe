const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const { success, error } = require('../utils/apiResponse');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return error(res, 'Email already registered', 409);
    }

    const hashed = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, avatar, bio, reputation, reports_count, created_at',
      [name, email, hashed]
    );

    const user = result.rows[0];
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return success(res, { user, accessToken }, 'Registration successful', 201);
  } catch (err) {
    console.error('Register error:', err);
    return error(res, 'Registration failed', 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return error(res, 'Invalid credentials', 401);
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return error(res, 'Invalid credentials', 401);
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    const { password: _, refresh_token: __, ...safeUser } = user;
    return success(res, { user: safeUser, accessToken }, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    return error(res, 'Login failed', 500);
  }
};

const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return error(res, 'Refresh token required', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const result = await pool.query('SELECT id, refresh_token FROM users WHERE id = $1', [decoded.userId]);

    if (result.rows.length === 0 || result.rows[0].refresh_token !== token) {
      return error(res, 'Invalid refresh token', 401);
    }

    const accessToken = generateAccessToken(decoded.userId);
    return success(res, { accessToken }, 'Token refreshed');
  } catch (err) {
    return error(res, 'Invalid refresh token', 401);
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', ['', decoded.userId]);
      } catch {
        // ignore invalid token on logout
      }
    }
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    return success(res, null, 'Logged out successfully');
  } catch (err) {
    return error(res, 'Logout failed', 500);
  }
};

const me = async (req, res) => {
  return success(res, req.user, 'User profile retrieved');
};

module.exports = { register, login, refresh, logout, me };
