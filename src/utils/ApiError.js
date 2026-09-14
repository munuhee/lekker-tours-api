export class ApiError extends Error {
  /**
   * @param {number} status HTTP status code
   * @param {string} message Human-readable message, safe to show a client
   * @param {object} [options]
   * @param {string} [options.code] Stable machine-readable code
   * @param {unknown} [options.details] Field-level validation detail
   */
  constructor(status, message, { code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code ?? httpCodeFor(status);
    this.details = details;
    this.expected = true;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message, options) {
    return new ApiError(400, message, options);
  }
  static unauthorized(message = 'Authentication required.', options) {
    return new ApiError(401, message, options);
  }
  static forbidden(message = 'You do not have permission to do that.', options) {
    return new ApiError(403, message, options);
  }
  static notFound(message = 'Resource not found.', options) {
    return new ApiError(404, message, options);
  }
  static conflict(message, options) {
    return new ApiError(409, message, options);
  }
  static unprocessable(message = 'Validation failed.', options) {
    return new ApiError(422, message, options);
  }
  static tooMany(message = 'Too many requests. Please try again shortly.', options) {
    return new ApiError(429, message, options);
  }
}

function httpCodeFor(status) {
  return (
    {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMITED',
    }[status] ?? 'INTERNAL_ERROR'
  );
}
