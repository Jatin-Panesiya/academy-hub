import { AppError } from '../utils/appError.js';

export default function notFound(req, _res, next) {
  next(new AppError(`Not Found - ${req.originalUrl}`, { statusCode: 404 }));
}

