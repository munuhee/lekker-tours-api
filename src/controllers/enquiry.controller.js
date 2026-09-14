import { Enquiry } from '../models/Enquiry.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData, buildPageMeta } from '../utils/respond.js';

/* ---------- public ---------- */

export async function submitEnquiry(req, res) {
  const enquiry = await Enquiry.create(req.body);
  // Echo back only what the sender needs — never the admin fields.
  sendData(
    res,
    { id: enquiry._id, type: enquiry.type, createdAt: enquiry.createdAt },
    { status: 201 }
  );
}

/* ---------- admin ---------- */

export async function listEnquiries(req, res) {
  const { page, limit, status, type } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;

  const [items, total, unreadCount] = await Promise.all([
    Enquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('tour', 'title slug')
      .lean({ virtuals: true }),
    Enquiry.countDocuments(filter),
    Enquiry.countDocuments({ status: 'new' }),
  ]);

  sendData(res, items, { meta: { ...buildPageMeta({ page, limit, total }), unreadCount } });
}

export async function getEnquiry(req, res) {
  const enquiry = await Enquiry.findById(req.params.id).populate('tour', 'title slug');
  if (!enquiry) throw ApiError.notFound('That enquiry no longer exists.');

  // Opening a new enquiry marks it read.
  if (enquiry.status === 'new') {
    enquiry.status = 'read';
    await enquiry.save();
  }

  sendData(res, enquiry.toJSON());
}

export async function updateEnquiry(req, res) {
  const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!enquiry) throw ApiError.notFound('That enquiry no longer exists.');
  sendData(res, enquiry.toJSON());
}

export async function deleteEnquiry(req, res) {
  const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
  if (!enquiry) throw ApiError.notFound('That enquiry no longer exists.');
  sendData(res, { id: req.params.id });
}
