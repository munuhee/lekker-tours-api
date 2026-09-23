import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData, buildPageMeta } from '../utils/respond.js';
import { serializeEnquiry, serializeMany } from '../utils/serialize.js';
import { hasPermission } from '../middleware/requirePermission.js';
import { createWithReference } from '../utils/reference.js';
import {
  actorOf,
  describeStatusChange,
  isClosed,
  logEvent,
  statusSideEffects,
  STATUS_LABELS,
} from '../utils/enquiryEvents.js';

/** The validator accepts `tour` as an id; the column is `tourId`. */
function toRow(payload) {
  const { tour, ...data } = payload;
  if (tour !== undefined) data.tourId = tour || null;
  return data;
}

const TOUR_SUMMARY = { select: { id: true, title: true, slug: true } };
const ASSIGNEE_SUMMARY = { select: { id: true, name: true, email: true } };

/** Everything a detail or list row needs. */
const ENQUIRY_INCLUDE = { tour: TOUR_SUMMARY, assignee: ASSIGNEE_SUMMARY };

/** Stages where the enquiry is still live work. */
const OPEN_STATUSES = ['new', 'assigned', 'in_progress', 'quoted'];

/* ---------- public ---------- */

export async function submitEnquiry(req, res) {
  const enquiry = await createWithReference(toRow(req.body));

  // The opening entry. Written after the row rather than in a transaction with
  // it: a customer's submission must never fail because the timeline did, and
  // an enquiry with no history is still a recoverable enquiry.
  await logEvent(null, {
    enquiryId: enquiry.id,
    type: 'created',
    summary:
      enquiry.type === 'booking'
        ? `Booking enquiry received for ${enquiry.tourTitle ?? 'a tour'}`
        : 'Contact enquiry received',
    meta: { source: enquiry.source },
    actor: null,
  }).catch((err) => {
    console.error('[enquiry] could not log creation of %s:', enquiry.reference, err.message);
  });

  // Echo back only what the sender needs, never the admin fields. The
  // reference is included so a confirmation page can quote it back.
  sendData(
    res,
    {
      id: enquiry.id,
      _id: enquiry.id,
      reference: enquiry.reference,
      type: enquiry.type,
      createdAt: enquiry.createdAt,
    },
    { status: 201 }
  );
}

/* ---------- admin ---------- */

const ENQUIRY_SORTS = {
  newest: [{ createdAt: 'desc' }],
  oldest: [{ createdAt: 'asc' }],
  'name-asc': [{ name: 'asc' }],
  // Soonest follow-up first; rows with no reminder sink to the bottom.
  'follow-up': [{ followUpAt: { sort: 'asc', nulls: 'last' } }],
  // The triage default: whatever has been waiting longest without an owner.
  'oldest-open': [{ assigneeId: { sort: 'asc', nulls: 'first' } }, { createdAt: 'asc' }],
};

function buildEnquiryWhere(query, admin) {
  const { status, type, assignee, overdue, q } = query;
  const where = {};

  if (status?.length) where.status = status.length === 1 ? status[0] : { in: status };
  if (type) where.type = type;

  if (assignee === 'unassigned') where.assigneeId = null;
  else if (assignee === 'me') where.assigneeId = admin.id;
  else if (assignee) where.assigneeId = assignee;

  // Overdue means: still open, and the follow-up date has passed.
  if (overdue) {
    where.followUpAt = { lt: new Date() };
    where.status = where.status ?? { in: OPEN_STATUSES };
  }

  // Sender name, address, message body and reference: what an admin
  // remembers, or reads back off an email, when hunting for one enquiry.
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: 'insensitive' } },
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { message: { contains: q, mode: 'insensitive' } },
    ];
  }

  return where;
}

export async function listEnquiries(req, res) {
  const { page, limit, sort } = req.query;
  const where = buildEnquiryWhere(req.query, req.admin);

  const [items, total, counts, unassignedCount, overdueCount] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      orderBy: ENQUIRY_SORTS[sort] ?? ENQUIRY_SORTS.newest,
      skip: (page - 1) * limit,
      take: limit,
      include: ENQUIRY_INCLUDE,
    }),
    prisma.enquiry.count({ where }),
    // Board counts are for the whole pipeline, not the filtered view; they are
    // the tabs you filter *with*, so narrowing them by the current filter would
    // make every other stage read zero.
    prisma.enquiry.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.enquiry.count({ where: { assigneeId: null, status: { in: OPEN_STATUSES } } }),
    prisma.enquiry.count({
      where: { followUpAt: { lt: new Date() }, status: { in: OPEN_STATUSES } },
    }),
  ]);

  const statusCounts = Object.fromEntries(counts.map((r) => [r.status, r._count._all]));

  sendData(res, serializeMany(items, serializeEnquiry), {
    meta: {
      ...buildPageMeta({ page, limit, total }),
      statusCounts,
      // The sidebar badge counts work waiting to be picked up, not unread mail.
      unassignedCount,
      overdueCount,
    },
  });
}

/**
 * Who an enquiry can be handed to: everyone whose role can work them.
 *
 * Separate from /admin/users because that list needs `users.view`, and an account
 * that handles enquiries all day has no business reading the staff directory,
 * but still has to populate an assignee dropdown. Only names are returned.
 */
export async function listAssignableStaff(req, res) {
  const candidates = await prisma.adminUser.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      roleRef: { select: { locked: true, permissions: true } },
    },
  });

  // Mirrors permissionsFor(): a locked role holds everything, and an account
  // predating the roles table falls back to its coarse enum.
  const assignable = candidates.filter((user) => {
    if (user.roleRef?.locked) return true;
    if (user.roleRef) return user.roleRef.permissions?.includes('enquiries.edit');
    return user.role === 'admin';
  });

  sendData(
    res,
    assignable.map(({ id, name, email }) => ({ id, _id: id, name, email }))
  );
}

export async function getEnquiry(req, res) {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id: req.params.id },
    include: {
      ...ENQUIRY_INCLUDE,
      // Newest first: the useful end of a long timeline is the recent end.
      events: { orderBy: { createdAt: 'desc' }, take: 100 },
    },
  });
  if (!enquiry) throw ApiError.notFound('That enquiry no longer exists.');

  // Opening no longer changes anything. Under the old mailbox model a GET
  // silently marked the enquiry "read", which meant the list could not
  // distinguish someone glancing at a row from someone working it: the reason
  // that state is gone. Progress is now recorded only by an explicit action.
  sendData(res, serializeEnquiry(enquiry));
}

export async function updateEnquiry(req, res) {
  const enquiry = await prisma.enquiry.update({
    where: { id: req.params.id },
    data: req.body,
    include: ENQUIRY_INCLUDE,
  });
  sendData(res, serializeEnquiry(enquiry));
}

export async function deleteEnquiry(req, res) {
  await prisma.enquiry.delete({ where: { id: req.params.id } });
  sendData(res, { id: req.params.id });
}

/* ---------- pipeline ---------- */

/** Load an enquiry or 404, for the endpoints that need its prior state. */
async function loadOr404(id, select) {
  const enquiry = await prisma.enquiry.findUnique({ where: { id }, select });
  if (!enquiry) throw ApiError.notFound('That enquiry no longer exists.');
  return enquiry;
}

export async function changeStatus(req, res) {
  const { status, note } = req.body;
  const actor = actorOf(req);

  const current = await loadOr404(req.params.id, { id: true, status: true, assigneeId: true });

  if (current.status === status) {
    throw ApiError.badRequest(`That enquiry is already ${STATUS_LABELS[status] ?? status}.`);
  }

  const patch = statusSideEffects(status);

  // Moving work forward without an owner leaves nobody accountable for it, so
  // the mover takes it: the same shortcut as picking a card up off a board.
  if (!current.assigneeId && !isClosed(status) && status !== 'new') {
    patch.assigneeId = req.admin.id;
    patch.assignedAt = new Date();
  }

  const enquiry = await prisma.$transaction(async (tx) => {
    const updated = await tx.enquiry.update({
      where: { id: current.id },
      data: patch,
      include: ENQUIRY_INCLUDE,
    });

    await logEvent(tx, {
      enquiryId: current.id,
      type: 'status_change',
      summary: describeStatusChange(current.status, status),
      note: note ?? null,
      meta: { from: current.status, to: status },
      actor,
    });

    if (patch.assigneeId) {
      await logEvent(tx, {
        enquiryId: current.id,
        type: 'assigned',
        summary: `Assigned to ${actor.actorName} on taking the enquiry forward`,
        meta: { assigneeId: patch.assigneeId, automatic: true },
        actor,
      });
    }

    return updated;
  });

  sendData(res, serializeEnquiry(enquiry));
}

/**
 * Assign, reassign, self-claim or unassign.
 *
 * An omitted `assigneeId` means "give it to me": the self-claim path. The
 * route requires only enquiries.edit, because claiming unowned work and putting
 * your own back are the behaviours the queue exists to encourage. Anything that
 * moves work to or from *another person* additionally needs enquiries.assign,
 * which is checked below once the current owner is known.
 */
export async function assignEnquiry(req, res) {
  const actor = actorOf(req);
  const claimingForSelf = req.body.assigneeId === undefined;
  const assigneeId = claimingForSelf ? req.admin.id : req.body.assigneeId;

  const current = await loadOr404(req.params.id, {
    id: true,
    status: true,
    assigneeId: true,
    assignee: ASSIGNEE_SUMMARY,
  });

  // Claiming is only for unowned work. Without this, two people opening the
  // queue at once would silently take the enquiry off each other.
  if (claimingForSelf && current.assigneeId && current.assigneeId !== req.admin.id) {
    throw ApiError.conflict(
      `${current.assignee?.name ?? 'Someone else'} is already handling that enquiry.`
    );
  }

  // Giving work to someone else, or taking it off them, is the management half
  // of this endpoint.
  const givingToOther = assigneeId !== null && assigneeId !== req.admin.id;
  const takingFromOther = current.assigneeId && current.assigneeId !== req.admin.id;
  if ((givingToOther || takingFromOther) && !hasPermission(req.admin, 'enquiries.assign')) {
    throw ApiError.forbidden('Your role does not include reassigning other people’s enquiries.');
  }

  if (current.assigneeId === assigneeId) {
    throw ApiError.badRequest('That enquiry is already assigned to them.');
  }

  const patch = { assigneeId, assignedAt: assigneeId ? new Date() : null };

  // Taking ownership of untouched work moves it out of the new pile; the whole
  // point of `assigned` is that it is no longer waiting to be picked up.
  if (assigneeId && current.status === 'new') patch.status = 'assigned';
  // Handing it back returns it to the pool, unless work is already under way.
  if (!assigneeId && current.status === 'assigned') patch.status = 'new';

  const target = assigneeId
    ? await prisma.adminUser.findUnique({ where: { id: assigneeId }, select: { name: true } })
    : null;

  if (assigneeId && !target) throw ApiError.badRequest('That account no longer exists.');

  const enquiry = await prisma.$transaction(async (tx) => {
    const updated = await tx.enquiry.update({
      where: { id: current.id },
      data: patch,
      include: ENQUIRY_INCLUDE,
    });

    await logEvent(tx, {
      enquiryId: current.id,
      type: assigneeId ? 'assigned' : 'unassigned',
      summary: assigneeId
        ? claimingForSelf
          ? `${actor.actorName} claimed this enquiry`
          : `Assigned to ${target.name}`
        : `Returned to the unassigned queue by ${actor.actorName}`,
      meta: { from: current.assigneeId, to: assigneeId, claimed: claimingForSelf },
      actor,
    });

    if (patch.status && patch.status !== current.status) {
      await logEvent(tx, {
        enquiryId: current.id,
        type: 'status_change',
        summary: describeStatusChange(current.status, patch.status),
        meta: { from: current.status, to: patch.status, automatic: true },
        actor,
      });
    }

    return updated;
  });

  sendData(res, serializeEnquiry(enquiry));
}

export async function addNote(req, res) {
  const actor = actorOf(req);
  await loadOr404(req.params.id, { id: true });

  await logEvent(null, {
    enquiryId: req.params.id,
    type: 'note',
    summary: `Note added by ${actor.actorName}`,
    note: req.body.note,
    actor,
  });

  const enquiry = await prisma.enquiry.findUnique({
    where: { id: req.params.id },
    include: { ...ENQUIRY_INCLUDE, events: { orderBy: { createdAt: 'desc' }, take: 100 } },
  });

  sendData(res, serializeEnquiry(enquiry), { status: 201 });
}

/**
 * Record that the customer was actually contacted, and optionally when to
 * chase again. This is what keeps the overdue queue honest: without an explicit
 * "I spoke to them", a stale enquiry and a busy one look identical.
 */
export async function recordContact(req, res) {
  const actor = actorOf(req);
  const { note, followUpAt } = req.body;

  const current = await loadOr404(req.params.id, { id: true, status: true, assigneeId: true });

  const now = new Date();
  const patch = { lastContactedAt: now };

  if (followUpAt !== undefined) patch.followUpAt = followUpAt;
  // Reaching out is work in progress by definition.
  if (current.status === 'new' || current.status === 'assigned') patch.status = 'in_progress';
  if (!current.assigneeId) {
    patch.assigneeId = req.admin.id;
    patch.assignedAt = now;
  }

  const enquiry = await prisma.$transaction(async (tx) => {
    const updated = await tx.enquiry.update({
      where: { id: current.id },
      data: patch,
      include: ENQUIRY_INCLUDE,
    });

    await logEvent(tx, {
      enquiryId: current.id,
      type: 'contacted',
      summary: followUpAt
        ? `${actor.actorName} contacted the customer, following up ${followUpAt.toISOString().slice(0, 10)}`
        : `${actor.actorName} contacted the customer`,
      note: note ?? null,
      meta: { followUpAt: followUpAt ?? null },
      actor,
    });

    if (patch.status && patch.status !== current.status) {
      await logEvent(tx, {
        enquiryId: current.id,
        type: 'status_change',
        summary: describeStatusChange(current.status, patch.status),
        meta: { from: current.status, to: patch.status, automatic: true },
        actor,
      });
    }

    return updated;
  });

  sendData(res, serializeEnquiry(enquiry));
}

/* ---------- bulk ---------- */

export async function bulkEnquiryStatus(req, res) {
  const { ids, status } = req.body;
  const actor = actorOf(req);

  // Read first so each timeline entry can name the stage it moved from, and so
  // rows already at the target status are not logged as having changed.
  const targets = await prisma.enquiry.findMany({
    where: { id: { in: ids }, status: { not: status } },
    select: { id: true, status: true },
  });

  if (targets.length === 0) {
    throw ApiError.notFound('None of those enquiries still exist, or none needed changing.');
  }

  const patch = statusSideEffects(status);

  const count = await prisma.$transaction(async (tx) => {
    const { count: changed } = await tx.enquiry.updateMany({
      where: { id: { in: targets.map((t) => t.id) } },
      data: patch,
    });

    await tx.enquiryEvent.createMany({
      data: targets.map((t) => ({
        enquiryId: t.id,
        type: 'status_change',
        summary: describeStatusChange(t.status, status),
        meta: { from: t.status, to: status, bulk: true },
        actorId: actor.actorId,
        actorName: actor.actorName,
      })),
    });

    return changed;
  });

  sendData(res, { ids: targets.map((t) => t.id), status, count });
}

export async function bulkAssignEnquiries(req, res) {
  const { ids, assigneeId } = req.body;
  const actor = actorOf(req);

  const target = assigneeId
    ? await prisma.adminUser.findUnique({ where: { id: assigneeId }, select: { name: true } })
    : null;
  if (assigneeId && !target) throw ApiError.badRequest('That account no longer exists.');

  // "Everything not already assigned to this person." Written as an explicit
  // OR rather than NOT { assigneeId }, because Prisma compiles that to SQL
  // `assignee_id <> $1`, which is NULL, and therefore not true, for
  // unassigned rows. That would silently skip exactly the rows a bulk assign is
  // usually aimed at.
  const needsChanging =
    assigneeId === null
      ? { assigneeId: { not: null } }
      : { OR: [{ assigneeId: null }, { assigneeId: { not: assigneeId } }] };

  const targets = await prisma.enquiry.findMany({
    where: { id: { in: ids }, ...needsChanging },
    select: { id: true, status: true, assigneeId: true },
  });

  if (targets.length === 0) {
    throw ApiError.notFound('None of those enquiries still exist, or none needed changing.');
  }

  const count = await prisma.$transaction(async (tx) => {
    const { count: changed } = await tx.enquiry.updateMany({
      where: { id: { in: targets.map((t) => t.id) } },
      data: { assigneeId, assignedAt: assigneeId ? new Date() : null },
    });

    // Assigning untouched enquiries advances them, matching the single-item path.
    if (assigneeId) {
      await tx.enquiry.updateMany({
        where: { id: { in: targets.map((t) => t.id) }, status: 'new' },
        data: { status: 'assigned' },
      });
    }

    await tx.enquiryEvent.createMany({
      data: targets.map((t) => ({
        enquiryId: t.id,
        type: assigneeId ? 'assigned' : 'unassigned',
        summary: assigneeId
          ? `Assigned to ${target.name}`
          : 'Returned to the unassigned queue',
        meta: { from: t.assigneeId, to: assigneeId, bulk: true },
        actorId: actor.actorId,
        actorName: actor.actorName,
      })),
    });

    return changed;
  });

  sendData(res, { ids: targets.map((t) => t.id), assigneeId, count });
}

export async function bulkDeleteEnquiries(req, res) {
  const { ids } = req.body;
  const { count } = await prisma.enquiry.deleteMany({ where: { id: { in: ids } } });
  if (count === 0) throw ApiError.notFound('None of those enquiries still exist.');
  sendData(res, { ids, count });
}
