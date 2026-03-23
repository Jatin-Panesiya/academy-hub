import { env } from '../config/env.js';

export default function errorHandler(err, req, res, _next) {
  const statusCode = err?.statusCode ?? 500;
  const message = statusCode >= 500 ? 'Internal Server Error' : err?.message ?? 'Request failed';

  const response = {
    error: {
      message,
      statusCode,
    },
  };

  if (env.NODE_ENV !== 'production') {
    response.error.details = {
      stack: err?.stack,
      ...(err?.details ? { details: err.details } : {}),
    };
  }

  res.status(statusCode).json(response);
}

