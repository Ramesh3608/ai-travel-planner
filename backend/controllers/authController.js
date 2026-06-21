const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const COOKIE_NAME = 'token';

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd, // requires HTTPS in production (Render/Vercel both provide this)
    sameSite: isProd ? 'none' : 'lax', // 'none' needed for cross-site FE/BE domains in prod
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email and password are all required.');
  }
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long.');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });

  const token = signToken(user._id);
  setAuthCookie(res, token);

  res.status(201).json({ success: true, user });
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const match = await user.comparePassword(password);
  if (!match) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const token = signToken(user._id);
  setAuthCookie(res, token);

  res.status(200).json({ success: true, user });
});

// @route POST /api/auth/logout
const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.status(200).json({ success: true, message: 'Logged out.' });
});

// @route GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }
  res.status(200).json({ success: true, user });
});

module.exports = { register, login, logout, me };
