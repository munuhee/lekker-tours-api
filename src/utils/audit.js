import { prisma } from '../config/db.js';

/**
 * Append an entry to the audit log.
 *
 * Deliberately non-fatal: a failure to write history must not fail the action
 * the admin actually asked for, nor roll back a user who has already been
 * created. Failures are logged and swallowed, matching how the revalidation
 * webhook treats a web app that is down.
 *
 * Never pass a password, a hash, or a whole user record as `changes` — only
 * the fields that changed. `recordChanges()` below is the safe way to build it.
 */
export async function writeAudit(req, { action, target, changes = {} }) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: req.admin?.id ?? null,
        actorEmail: req.admin?.email ?? 'system',
        action,
        targetType: target?.type ?? null,
        targetId: target?.id ?? null,
        targetLabel: target?.label ?? null,
        changes,
        ip: req.ip ?? null,
      },
    });
  } catch (err) {
    console.error('[audit] could not record %s:', action, err.message);
  }
}

const REDACTED = new Set(['password', 'passwordHash']);

/**
 * Build a { before, after } diff of only the fields that actually changed,
 * with credentials reduced to a boolean. A password reset is worth recording;
 * the password itself is not.
 */
export function recordChanges(before, after) {
  const changed = { before: {}, after: {} };

  for (const key of Object.keys(after)) {
    if (REDACTED.has(key)) {
      changed.after.passwordChanged = true;
      continue;
    }
    if (before?.[key] !== after[key]) {
      changed.before[key] = before?.[key] ?? null;
      changed.after[key] = after[key];
    }
  }

  return changed;
}
