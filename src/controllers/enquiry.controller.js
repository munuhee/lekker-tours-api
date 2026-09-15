import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData, buildPageMeta } from '../utils/respond.js';
import { serializeEnquiry, serializeMany } from '../utils/serialize.js';

/** The validator accepts `tour` as an id; the column is `tourId`. */
function toRow(payload) {
  const { tour, ...data } = payload;
  if (tour !== undefined) data.tourId = tour || null;
  return data;
}

const TOUR_SUMMARY = { select: { id: true, title: true, slug: true } };

/* ---------- public ---------- */

export async function submitEnquiry(req, res) {
  const enquiry = await prisma.enquiry.create({ data: toRow(req.body) });
  // Echo back only what the sender needs — never the admin fields.
  sendData(
    res,
    { id: enquiry.id, _id: enquiry.id, type: enquiry.type, createdAt: enquiry.createdAt },
    { status: 201 }
  );
}

/* ---------- admin ---------- */

export async function listEnquiries(req, res) {
  const { page, limit, status, type } = req.query;
  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const [items, total, unreadCount] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: { tour: TOUR_SUMMARY },
    }),
    prisma.enquiry.count({ where }),
    prisma.enquiry.count({ where: { status: 'new' } }),
  ]);

  sendData(res, serializeMany(items, serializeEnquiry), {
    meta: { ...buildPageMeta({ page, limit, total }), unreadCount },
  });
}

export async function getEnquiry(req, res) {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id: req.params.id },
    include: { tour: TOUR_SUMMARY },
  });
  if (!enquiry) throw ApiError.notFound('That enquiry no longer exists.');

  // Opening a new enquiry marks it read.
  if (enquiry.status === 'new') {
    const updated = await prisma.enquiry.update({
      where: { id: enquiry.id },
      data: { status: 'read' },
      include: { tour: TOUR_SUMMARY },
    });
    return sendData(res, serializeEnquiry(updated));
  }

  sendData(res, serializeEnquiry(enquiry));
}

export async function updateEnquiry(req, res) {
  const enquiry = await prisma.enquiry.update({
    where: { id: req.params.id },
    data: req.body,
    include: { tour: TOUR_SUMMARY },
  });
  sendData(res, serializeEnquiry(enquiry));
}

export async function deleteEnquiry(req, res) {
  await prisma.enquiry.delete({ where: { id: req.params.id } });
  sendData(res, { id: req.params.id });
}
