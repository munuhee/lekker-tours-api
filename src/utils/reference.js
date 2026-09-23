import { prisma } from '../config/db.js';

/**
 * Human-readable enquiry references: ENQ-YYMM-NNNN, e.g. ENQ-2609-0042.
 *
 * These get read aloud on the phone and put in email subject lines, which a
 * UUID cannot survive. The month prefix keeps the counter short and makes the
 * age of an enquiry obvious at a glance.
 *
 * The sequence restarts each month, so NNNN is "the 42nd enquiry this month",
 * not a global count. Four digits is ~330 enquiries a day before it overflows;
 * if that day ever comes, widen the padding, the column holds 20 characters.
 */
const PREFIX = 'ENQ';

function periodFor(date) {
  const yy = String(date.getUTCFullYear()).slice(-2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${yy}${mm}`;
}

function format(period, seq) {
  return `${PREFIX}-${period}-${String(seq).padStart(4, '0')}`;
}

/**
 * Claim the next reference for a period, atomically.
 *
 * An earlier version read the highest existing reference and added one. That
 * loses submissions under load: concurrent callers all read the same value,
 * all compute the same next one, and the unique index rejects every loser,
 * and retrying does not help, because each retry re-reads the same number. A
 * burst of ten simultaneous submissions reliably dropped one.
 *
 * `UPDATE ... RETURNING` takes a row lock, so concurrent callers queue on it
 * and each is handed a distinct sequence number in one round trip. The INSERT
 * seeds the first enquiry of a new month; ON CONFLICT DO NOTHING means two
 * submissions racing to open the same month are harmless.
 *
 * Passed a transaction client when the caller has one, so the number is only
 * spent if the enquiry is actually written.
 */
async function claimReference(client, date = new Date()) {
  const period = periodFor(date);

  await client.$executeRaw`
    INSERT INTO enquiry_reference_counters (period, last_seq)
    VALUES (${period}, 0)
    ON CONFLICT (period) DO NOTHING
  `;

  const [row] = await client.$queryRaw`
    UPDATE enquiry_reference_counters
       SET last_seq = last_seq + 1
     WHERE period = ${period}
    RETURNING last_seq
  `;

  return format(period, Number(row.last_seq));
}

/** Exposed for tests and for anything that needs to preview the next value. */
export function referenceFor(period, seq) {
  return format(period, seq);
}

/**
 * Create an enquiry with a freshly allocated reference.
 *
 * Both steps share one transaction: an enquiry must never be stored without a
 * reference, and a number must not be burned by a create that then fails.
 */
export async function createWithReference(data) {
  return prisma.$transaction(async (tx) => {
    const reference = await claimReference(tx);
    return tx.enquiry.create({ data: { ...data, reference } });
  });
}
