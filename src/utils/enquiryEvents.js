import { prisma } from '../config/db.js';

/**
 * The enquiry activity log.
 *
 * Every entry is written inside the same transaction as the change it
 * describes, unlike writeAudit(), which is deliberately non-fatal. The
 * difference is what the two are for: the audit log is a security record that
 * must not block an admin action, whereas this timeline *is* the enquiry's
 * history and an enquiry whose status moved without a matching entry is simply
 * wrong. If the entry cannot be written, the change is rolled back.
 */

/** Pipeline order, used for the UI stepper and to spot backwards moves. */
export const ENQUIRY_STATUSES = ['new', 'assigned', 'in_progress', 'quoted', 'won', 'lost'];

/** Terminal states. Reaching one stamps closedAt; leaving one clears it. */
export const CLOSED_STATUSES = new Set(['won', 'lost']);

export const STATUS_LABELS = {
  new: 'New',
  assigned: 'Assigned',
  in_progress: 'In progress',
  quoted: 'Quoted',
  won: 'Booked',
  lost: 'Closed',
};

export function isClosed(status) {
  return CLOSED_STATUSES.has(status);
}

/** Who to credit for an entry. `req.admin` is absent on the public form. */
export function actorOf(req) {
  const admin = req?.admin;
  return {
    actorId: admin?.id ?? null,
    actorName: admin?.name ?? admin?.email ?? null,
  };
}

/**
 * Append one entry. Pass `tx` to join the caller's transaction, every status
 * change, assignment and note does, so the entry and the change land together
 * or not at all.
 */
export function logEvent(tx, { enquiryId, type, summary, note = null, meta = {}, actor }) {
  return (tx ?? prisma).enquiryEvent.create({
    data: {
      enquiryId,
      type,
      summary,
      note,
      meta,
      actorId: actor?.actorId ?? null,
      actorName: actor?.actorName ?? null,
    },
  });
}

/**
 * The side effects a status change implies, as a patch to merge into the
 * update. Keeping these here means the detail endpoint, the bulk endpoint and
 * anything added later cannot disagree about what "won" does to closedAt.
 */
export function statusSideEffects(status) {
  const patch = { status };

  if (isClosed(status)) {
    patch.closedAt = new Date();
    // A finished enquiry should not keep surfacing in the follow-up queue.
    patch.followUpAt = null;
  } else {
    // Reopening: the enquiry is live again, so the close stamp no longer holds.
    patch.closedAt = null;
  }

  return patch;
}

export function describeStatusChange(from, to) {
  return `Status changed from ${STATUS_LABELS[from] ?? from} to ${STATUS_LABELS[to] ?? to}`;
}
