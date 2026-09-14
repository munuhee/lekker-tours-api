import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export function notFound(req, res, next) {
  next(ApiError.notFound(`No route matches ${req.method} ${req.originalUrl}`));
}

/* eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity. */
export function errorHandler(err, req, res, next) {
  let status = err.status ?? 500;
  let code = err.code ?? 'INTERNAL_ERROR';
  let message = err.message ?? 'Something went wrong.';
  let details = err.details;

  // Mongoose validation -> 422 with per-field detail.
  if (err instanceof mongoose.Error.ValidationError) {
    status = 422;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed.';
    details = Object.fromEntries(
      Object.entries(err.errors).map(([field, e]) => [field, e.message])
    );
  }

  // Bad ObjectId in a path param.
  if (err instanceof mongoose.Error.CastError) {
    status = 400;
    code = 'INVALID_ID';
    message = `Invalid value for ${err.path}.`;
  }

  // Duplicate unique key, most often a slug collision.
  if (err?.code === 11000) {
    status = 409;
    code = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    message = `An item with that ${field} already exists.`;
    details = err.keyValue;
  }

  if (status >= 500) {
    console.error('[error]', err);
  }

  const body = { success: false, error: { message, code } };
  if (details) body.error.details = details;
  if (!env.isProduction && status >= 500) body.error.stack = err.stack;

  res.status(status).json(body);
}
