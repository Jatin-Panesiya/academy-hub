import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { AppError } from '../utils/appError.js';

export function protect(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next(new AppError('Authorization header missing', { statusCode: 401 }));
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('Authorization header must be in the form: Bearer <token>', { statusCode: 401 }));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (_err) {
    return next(new AppError('Invalid or expired token', { statusCode: 401 }));
  }
}

export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    const role = req.user?.role ?? 'student';

    if (!allowedRoles.includes(role)) {
      return next(
        new AppError(`Forbidden: requires one of roles: ${allowedRoles.join(', ')}`, { statusCode: 403 })
      );
    }

    return next();
  };
}

