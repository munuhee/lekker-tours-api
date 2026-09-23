import { Prisma } from '@prisma/client';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function notFound(req, res, next) {
  next(ApiError.notFound(`No route matches ${req.method} ${req.originalUrl}`));
}

/**
 * The column name to put in a duplicate-key message.
 *
 * Prisma 7 driver adapters do NOT populate `meta.target`; the violated
 * constraint arrives as a Postgres index name nested under driverAdapterError
 * (e.g. "faqs_question_key" -> "question"). `meta.target` is still checked
 * first so this keeps working without an adapter.
 */
function fieldLabel(meta) {
  const target = meta?.target;
  if (Array.isArray(target) && target.length) return target[0];
  if (typeof target === 'string' && target) {
    return target.replace(/_key$/, '').split('_').pop() || 'field';
  }

  const index = meta?.driverAdapterError?.cause?.constraint?.index;
  if (typeof index === 'string' && index) {
    // "<table>_<column>_key": drop the suffix, then the table prefix.
    const withoutSuffix = index.replace(/_key$/, '');
    const table = meta?.driverAdapterError?.cause?.table;
    const column =
      table && withoutSuffix.startsWith(`${table}_`)
        ? withoutSuffix.slice(table.length + 1)
        : withoutSuffix.split('_').pop();
    if (column) return column;
  }

  return 'field';
}

/* eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity. */
export function errorHandler(err, req, res, next) {
  let status = err.status ?? 500;
  let code = err.code ?? 'INTERNAL_ERROR';
  let message = err.message ?? 'Something went wrong.';
  let details = err.details;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      // Unique constraint: most often a slug collision.
      case 'P2002': {
        status = 409;
        code = 'DUPLICATE_KEY';
        const field = fieldLabel(err.meta);
        message = `An item with that ${field} already exists.`;
        details = { [field]: 'Already in use.' };
        break;
      }
      // Row not found for an update/delete that required one.
      case 'P2025':
        status = 404;
        code = 'NOT_FOUND';
        message = 'We could not find that record.';
        break;
      // Foreign key violation, e.g. a tour pointing at a deleted destination.
      case 'P2003':
        status = 400;
        code = 'INVALID_REFERENCE';
        message = 'That record refers to something that no longer exists.';
        break;
      // Malformed value for the column type, including a non-UUID id.
      case 'P2023':
        status = 400;
        code = 'INVALID_ID';
        message = 'That is not a valid id.';
        break;
      default:
        status = 400;
        code = `DB_${err.code}`;
        message = 'That request could not be completed.';
    }
  }

  // A payload that does not match the schema (wrong type, missing column).
  // Zod catches most of these first, so reaching here means a real bug,
  // log it, but don't leak Prisma's very verbose message to the client.
  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error('[error] prisma validation:', err.message);
    status = 422;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed.';
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    status = 503;
    code = 'DATABASE_UNAVAILABLE';
    message = 'The database is unavailable. Please try again shortly.';
  }

  if (status >= 500) {
    console.error('[error]', err);
  }

  const body = { success: false, error: { message, code } };
  if (details) body.error.details = details;
  if (!env.isProduction && status >= 500) body.error.stack = err.stack;

  res.status(status).json(body);
}
