import { ApiError } from '../utils/ApiError.js';

/**
 * Validates request segments against Zod schemas and replaces them with the
 * parsed result, so controllers receive coerced, trimmed values.
 *
 *   router.post('/', validate({ body: createTourSchema }), controller)
 */
export function validate(schemas) {
  return (req, res, next) => {
    for (const segment of ['body', 'query', 'params']) {
      const schema = schemas[segment];
      if (!schema) continue;

      const result = schema.safeParse(req[segment]);
      if (!result.success) {
        return next(
          ApiError.unprocessable('Please correct the highlighted fields.', {
            details: flattenIssues(result.error),
          })
        );
      }

      // Express 5 exposes req.query as a getter-only accessor: plain assignment
      // (whole object or per-key) is silently dropped, leaving raw strings and
      // discarding Zod defaults. Redefining the property is the only way to
      // hand controllers the coerced values.
      if (segment === 'query') {
        Object.defineProperty(req, 'query', {
          value: result.data,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      } else {
        req[segment] = result.data;
      }
    }
    next();
  };
}

function flattenIssues(error) {
  const out = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_';
    if (!out[path]) out[path] = issue.message;
  }
  return out;
}
