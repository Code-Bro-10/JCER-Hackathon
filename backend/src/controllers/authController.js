import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

/**
 * Register a new user / operator / admin
 * POST /api/v1/auth/register
 */
export async function register(req, res, next) {
  try {
    const { name, email, password, role, department, badgeNumber } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.',
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'user',
      department: department || 'Traffic Control',
      badgeNumber: badgeNumber || null,
    });

    const token = generateToken(user);

    await AuditLog.create({
      action: 'USER_REGISTERED',
      category: 'AUTH',
      actor: { userId: user._id.toString(), email: user.email, role: user.role },
      details: { name: user.name, role: user.role, department: user.department },
    });

    logger.info(`User registered successfully: ${user.email} (${user.role})`);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Login user and issue JWT
 * POST /api/v1/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials: email not found.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials: password incorrect.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account has been suspended. Contact systems administrator.',
      });
    }

    const token = generateToken(user);

    await AuditLog.create({
      action: 'USER_LOGIN',
      category: 'AUTH',
      actor: { userId: user._id.toString(), email: user.email, role: user.role },
      details: { loginTime: new Date().toISOString() },
    });

    logger.info(`User logged in: ${user.email} (${user.role})`);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get current authenticated user profile
 * GET /api/v1/auth/me
 */
export async function getMe(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      user: req.user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export async function logout(req, res, next) {
  try {
    if (req.user) {
      await AuditLog.create({
        action: 'USER_LOGOUT',
        category: 'AUTH',
        actor: { userId: req.user._id.toString(), email: req.user.email, role: req.user.role },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    next(err);
  }
}

