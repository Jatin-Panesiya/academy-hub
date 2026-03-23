import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { AppError } from '../utils/appError.js';

function signJwtToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      mustChangePassword: Boolean(user.mustChangePassword),
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

function safeUser(userDoc) {
  return {
    id: userDoc._id.toString(),
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role,
    mustChangePassword: Boolean(userDoc.mustChangePassword),
  };
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      throw new AppError('Missing required fields: email, password', { statusCode: 400 });
    }

    const user = await User.findOne({ email }).exec();
    if (!user) {
      throw new AppError('Invalid email or password', { statusCode: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AppError('Invalid email or password', { statusCode: 401 });
    }

    const token = signJwtToken(user);

    return res.status(200).json({
      token,
      user: safeUser(user),
    });
  } catch (err) {
    return next(err);
  }
}

export async function createAdmin(req, res, next) {
  try {
    const setupKeyFromHeader = req.headers['x-admin-key'];
    if (!env.ADMIN_CREATION_KEY) {
      throw new AppError('Admin creation key is not configured on server', { statusCode: 500 });
    }
    if (setupKeyFromHeader !== env.ADMIN_CREATION_KEY) {
      throw new AppError('Unauthorized admin creation key', { statusCode: 401 });
    }

    const { name, email, password } = req.body ?? {};
    if (!name || !email || !password) {
      throw new AppError('Missing required fields: name, email, password', { statusCode: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
    });

    const token = signJwtToken(user);

    return res.status(201).json({
      token,
      user: safeUser(user),
    });
  } catch (err) {
    if (err?.code === 11000) {
      return next(new AppError('Email already in use', { statusCode: 409 }));
    }
    if (err?.name === 'ValidationError') {
      return next(new AppError(err.message ?? 'Invalid input', { statusCode: 400 }));
    }
    return next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', { statusCode: 401 });
    }

    const { currentPassword, newPassword } = req.body ?? {};
    if (!currentPassword || !newPassword) {
      throw new AppError('Missing required fields: currentPassword, newPassword', { statusCode: 400 });
    }
    if (String(newPassword).length < 6) {
      throw new AppError('New password must be at least 6 characters', { statusCode: 400 });
    }

    const user = await User.findById(userId).exec();
    if (!user) {
      throw new AppError('User not found', { statusCode: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new AppError('Current password is incorrect', { statusCode: 401 });
    }

    user.password = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);
    user.mustChangePassword = false;
    await user.save();

    const token = signJwtToken(user);
    return res.status(200).json({
      token,
      user: safeUser(user),
      message: 'Password updated successfully',
    });
  } catch (err) {
    return next(err);
  }
}


