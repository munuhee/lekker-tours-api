/**
 * Row -> API response shaping.
 *
 * The web app is a separate repo (lekker-tours-web) whose TypeScript types read
 * `_id` on every interface and expect three fields that used to be Mongoose
 * virtuals. Postgres has no equivalent of either, so both are reconstructed
 * here — this module is the entire compatibility layer between the new storage
 * and the unchanged wire contract.
 *
 * Every controller response goes through one of these functions. Returning a
 * raw Prisma row anywhere would ship `_id: undefined` to the browser and blank
 * every React `key`.
 */

/**
 * Prisma returns Decimal instances for numeric columns (priceFrom, rating,
 * budgetUSD). JSON.stringify would render those as objects, not numbers, so
 * they are unwrapped before they reach the client.
 */
function plain(value) {
  if (value == null) return value;
  if (typeof value === 'object' && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  return value;
}

/** Adds `_id`/`id` and unwraps Decimals. The base every serializer builds on. */
function withIds(row) {
  if (!row) return row;

  const out = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = plain(value);
  }

  out._id = row.id;
  out.id = row.id;
  return out;
}

/** `4 Days / 3 Nights` — was tourSchema.virtual('durationLabel'). */
function durationLabel(durationDays, durationNights) {
  const nights = durationNights ?? Math.max(0, durationDays - 1);
  const dayWord = durationDays === 1 ? 'Day' : 'Days';
  const nightWord = nights === 1 ? 'Night' : 'Nights';
  return `${durationDays} ${dayWord} / ${nights} ${nightWord}`;
}

export function serializeTour(row) {
  if (!row) return row;

  const out = withIds(row);
  out.durationLabel = durationLabel(row.durationDays, row.durationNights);

  // The old API returned `destination` as either a populated object or a bare
  // id string, and the web app still branches on `typeof`. Preserve both.
  if (row.destination) {
    out.destination = withIds(row.destination);
  } else if (row.destinationId) {
    out.destination = row.destinationId;
  } else {
    out.destination = undefined;
  }
  delete out.destinationId;

  return out;
}

export function serializeDestination(row) {
  if (!row) return row;

  const out = withIds(row);
  // Was destinationSchema.virtual('parkCount').
  out.parkCount = Array.isArray(row.parks) ? row.parks.length : 0;
  return out;
}

export function serializeEnquiry(row) {
  if (!row) return row;

  const out = withIds(row);

  // Was enquirySchema.virtual('totalGuests') — null for contact submissions.
  if (row.type !== 'booking') {
    out.totalGuests = null;
  } else {
    const { adults = 0, children = 0, infants = 0 } = row.guests ?? {};
    out.totalGuests = adults + children + infants;
  }

  if (row.tour) {
    out.tour = withIds(row.tour);
  } else if (row.tourId) {
    out.tour = row.tourId;
  }
  delete out.tourId;

  // Expanded when the query included it; otherwise the bare id is left for the
  // client to resolve against its own staff list.
  if (row.assignee) out.assignee = withIds(row.assignee);

  if (row.events) out.events = row.events.map(withIds);

  // Whether this enquiry is past its follow-up date, computed here so every
  // consumer agrees rather than each re-deriving it from two fields.
  out.isOverdue = Boolean(
    row.followUpAt && row.followUpAt < new Date() && !['won', 'lost'].includes(row.status)
  );

  return out;
}

export function serializeEnquiryEvent(row) {
  return withIds(row);
}

/** BlogPost, Testimonial, FAQ and SiteSettings need ids and nothing more. */
export const serialize = withIds;

/** Maps a serializer over a list. */
export function serializeMany(rows, fn = withIds) {
  return rows.map((row) => fn(row));
}
