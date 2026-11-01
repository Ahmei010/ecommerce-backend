import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
};

function createToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return jwt.sign({ userId: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });
}

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function register(req, res, next) {
  try {
    const { name, email, password, confirmPassword } = req.body || {};
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters long.' });
    }

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    }

    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and no more than 72 bytes.',
      });
    }

    if (confirmPassword !== password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      role: 'user',
    });

    setAuthCookie(res, createToken(user._id));
    return res.status(201).json({
      success: true,
      message: 'Your account has been created.',
      data: { user: serializeUser(user) },
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!emailPattern.test(normalizedEmail) || typeof password !== 'string' || !password) {
      return res.status(400).json({ success: false, message: 'Enter a valid email and password.' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    const passwordMatches = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !passwordMatches) {
      return res.status(401).json({ success: false, message: 'Email or password is incorrect.' });
    }

    setAuthCookie(res, createToken(user._id));
    return res.status(200).json({
      success: true,
      message: 'You are now logged in.',
      data: { user: serializeUser(user) },
    });
  } catch (error) {
    return next(error);
  }
}

export function getProfile(req, res) {
  return res.status(200).json({
    success: true,
    data: { user: serializeUser(req.user) },
  });
}

export async function updateProfile(req, res, next) {
  try {
    const { name, email } = req.body || {};
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
        return res.status(400).json({ success: false, message: 'Name must be between 2 and 80 characters.' });
      }
      updates.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || !emailPattern.test(email.trim())) {
        return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
      }
      updates.email = email.trim().toLowerCase();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'Provide a name or email to update.' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Your profile has been updated.',
      data: { user: serializeUser(user) },
    });
  } catch (error) {
    return next(error);
  }
}

export function logout(req, res) {
  res.clearCookie('token', cookieOptions);
  return res.status(200).json({ success: true, message: 'You have been logged out.' });
}
