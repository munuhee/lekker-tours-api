import { ApiError } from '../utils/ApiError.js';
import { uniqueSlug } from '../utils/slugify.js';
import { sendData, buildPageMeta } from '../utils/respond.js';
import { revalidate } from '../utils/revalidate.js';

/**
 * Destinations, blog posts, testimonials and FAQs share the same shape:
 * a draft/published collection, listed with filters, fetched by slug or id,
 * and edited through identical CRUD verbs. Rather than four near-identical
 * service+controller pairs, they are generated from one description.
 *
 * Tours are deliberately NOT built this way — discriminators, related-tour
 * lookups and price filtering earn their own hand-written service.
 */
export function createCrudControllers({
  Model,
  label,
  slugField = 'slug',
  titleField = 'title',
  buildFilter = () => ({}),
  defaultSort = { order: 1, createdAt: -1 },
  populate = null,
  revalidateTags = () => [],
}) {
  const notFound = () => ApiError.notFound(`We could not find that ${label}.`);

  async function list(query, { publishedOnly }) {
    const { page, limit } = query;
    const filter = { ...buildFilter(query) };
    if (publishedOnly) filter.status = 'published';
    else if (query.status) filter.status = query.status;

    let q = Model.find(filter).sort(defaultSort).skip((page - 1) * limit).limit(limit);
    if (populate) q = q.populate(populate);

    const [items, total] = await Promise.all([q.lean({ virtuals: true }), Model.countDocuments(filter)]);
    return { items, total, page, limit };
  }

  return {
    /* ---------- public ---------- */

    async listPublic(req, res) {
      const { items, total, page, limit } = await list(req.query, { publishedOnly: true });
      sendData(res, items, { meta: buildPageMeta({ page, limit, total }) });
    },

    async getPublicBySlug(req, res) {
      let q = Model.findOne({ [slugField]: req.params.slug, status: 'published' });
      if (populate) q = q.populate(populate);
      const doc = await q.lean({ virtuals: true });
      if (!doc) throw notFound();
      sendData(res, doc);
    },

    /* ---------- admin ---------- */

    async listAdmin(req, res) {
      const { items, total, page, limit } = await list(req.query, { publishedOnly: false });
      sendData(res, items, { meta: buildPageMeta({ page, limit, total }) });
    },

    async getAdminById(req, res) {
      const doc = await Model.findById(req.params.id).lean({ virtuals: true });
      if (!doc) throw notFound();
      sendData(res, doc);
    },

    async create(req, res) {
      const payload = { ...req.body };
      if (slugField && titleField && payload[titleField]) {
        payload[slugField] = await uniqueSlug(Model, payload[slugField] || payload[titleField]);
      }
      const doc = await Model.create(payload);
      await revalidate(revalidateTags(doc));
      sendData(res, doc.toJSON(), { status: 201 });
    },

    async update(req, res) {
      const doc = await Model.findById(req.params.id);
      if (!doc) throw notFound();

      const payload = { ...req.body };
      if (slugField && payload[slugField] && payload[slugField] !== doc[slugField]) {
        payload[slugField] = await uniqueSlug(Model, payload[slugField], doc._id);
      } else {
        // Renaming must not silently break a published URL.
        delete payload[slugField];
      }

      Object.assign(doc, payload);
      await doc.save();
      await revalidate(revalidateTags(doc));
      sendData(res, doc.toJSON());
    },

    async updateStatus(req, res) {
      const doc = await Model.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { returnDocument: 'after', runValidators: true }
      );
      if (!doc) throw notFound();
      await revalidate(revalidateTags(doc));
      sendData(res, doc.toJSON());
    },

    async remove(req, res) {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) throw notFound();
      await revalidate(revalidateTags(doc));
      sendData(res, { id: req.params.id });
    },
  };
}
