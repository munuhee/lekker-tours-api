import { ApiError } from '../utils/ApiError.js';
import { uniqueSlug } from '../utils/slugify.js';
import { sendData, buildPageMeta } from '../utils/respond.js';
import { revalidate } from '../utils/revalidate.js';
import { serialize, serializeMany } from '../utils/serialize.js';

/**
 * Destinations, blog posts, testimonials and FAQs share the same shape:
 * a draft/published collection, listed with filters, fetched by slug or id,
 * and edited through identical CRUD verbs. Rather than four near-identical
 * service+controller pairs, they are generated from one description.
 *
 * Tours are deliberately NOT built this way, the category subtype fields,
 * related-tour lookups and price filtering earn their own hand-written service.
 *
 * `defaultSort` and the objects returned by `buildFilter` are Prisma clauses,
 * not the old Mongo ones: `[{ order: 'asc' }]` rather than `{ order: 1 }`, and
 * `{ country: 'Kenya' }` passes straight into `where`.
 */
export function createCrudControllers({
  delegate,
  label,
  slugField = 'slug',
  titleField = 'title',
  buildFilter = () => ({}),
  defaultSort = [{ order: 'asc' }, { createdAt: 'desc' }],
  /**
   * Columns `?q=` searches, as a case-insensitive substring. Empty disables
   * search for the resource rather than silently ignoring the parameter.
   */
  searchFields = [],
  /** Sort keys the admin list may request, mapped to Prisma orderBy clauses. */
  sorts = {},
  include = null,
  serializer = serialize,
  revalidateTags = () => [],
}) {
  const notFound = () => ApiError.notFound(`We could not find that ${label}.`);

  async function list(query, { publishedOnly }) {
    const { page, limit } = query;
    const where = { ...buildFilter(query) };
    if (publishedOnly) where.status = 'published';
    else if (query.status) where.status = query.status;

    // Substring rather than full-text, matching the tour service: partial words
    // match as the admin types instead of only on word boundaries.
    if (query.q && searchFields.length > 0) {
      where.OR = searchFields.map((field) => ({
        [field]: { contains: query.q, mode: 'insensitive' },
      }));
    }

    const [items, total] = await Promise.all([
      delegate.findMany({
        where,
        orderBy: sorts[query.sort] ?? defaultSort,
        skip: (page - 1) * limit,
        take: limit,
        ...(include ? { include } : {}),
      }),
      delegate.count({ where }),
    ]);

    return { items: serializeMany(items, serializer), total, page, limit };
  }

  return {
    /* ---------- public ---------- */

    async listPublic(req, res) {
      const { items, total, page, limit } = await list(req.query, { publishedOnly: true });
      sendData(res, items, { meta: buildPageMeta({ page, limit, total }) });
    },

    async getPublicBySlug(req, res) {
      const doc = await delegate.findFirst({
        where: { [slugField]: req.params.slug, status: 'published' },
        ...(include ? { include } : {}),
      });
      if (!doc) throw notFound();
      sendData(res, serializer(doc));
    },

    /* ---------- admin ---------- */

    async listAdmin(req, res) {
      const { items, total, page, limit } = await list(req.query, { publishedOnly: false });
      sendData(res, items, { meta: buildPageMeta({ page, limit, total }) });
    },

    async getAdminById(req, res) {
      const doc = await delegate.findUnique({ where: { id: req.params.id } });
      if (!doc) throw notFound();
      sendData(res, serializer(doc));
    },

    async create(req, res) {
      const payload = { ...req.body };
      if (slugField && titleField && payload[titleField]) {
        payload[slugField] = await uniqueSlug(delegate, payload[slugField] || payload[titleField]);
      }
      const doc = await delegate.create({ data: payload });
      await revalidate(revalidateTags(doc));
      sendData(res, serializer(doc), { status: 201 });
    },

    async update(req, res) {
      const existing = await delegate.findUnique({ where: { id: req.params.id } });
      if (!existing) throw notFound();

      const payload = { ...req.body };
      if (slugField && payload[slugField] && payload[slugField] !== existing[slugField]) {
        payload[slugField] = await uniqueSlug(delegate, payload[slugField], existing.id);
      } else if (slugField) {
        // Renaming must not silently break a published URL.
        delete payload[slugField];
      }

      const doc = await delegate.update({ where: { id: existing.id }, data: payload });
      await revalidate(revalidateTags(doc));
      sendData(res, serializer(doc));
    },

    async updateStatus(req, res) {
      // update() throws P2025 when the row is gone; the error middleware maps
      // that to a 404, so no separate existence check is needed.
      const doc = await delegate.update({
        where: { id: req.params.id },
        data: { status: req.body.status },
      });
      await revalidate(revalidateTags(doc));
      sendData(res, serializer(doc));
    },

    async remove(req, res) {
      const doc = await delegate.delete({ where: { id: req.params.id } });
      await revalidate(revalidateTags(doc));
      sendData(res, { id: req.params.id });
    },

    /* ---------- bulk ---------- */

    /**
     * Publishing or archiving a batch one request at a time made the admin wait
     * through N round trips and could half-finish. These apply to the whole set
     * or not at all, and report back which ids actually changed so the client
     * can reconcile without a full reload.
     */
    async bulkStatus(req, res) {
      const { ids, status } = req.body;

      // Fetch first: the response needs the affected rows for revalidation, and
      // updateMany returns only a count.
      const existing = await delegate.findMany({ where: { id: { in: ids } } });
      if (existing.length === 0) throw notFound();

      await delegate.updateMany({ where: { id: { in: ids } }, data: { status } });

      const tags = new Set();
      for (const doc of existing) for (const tag of revalidateTags(doc)) tags.add(tag);
      await revalidate([...tags]);

      sendData(res, { ids: existing.map((doc) => doc.id), status, count: existing.length });
    },

    async bulkRemove(req, res) {
      const { ids } = req.body;

      const existing = await delegate.findMany({ where: { id: { in: ids } } });
      if (existing.length === 0) throw notFound();

      await delegate.deleteMany({ where: { id: { in: ids } } });

      const tags = new Set();
      for (const doc of existing) for (const tag of revalidateTags(doc)) tags.add(tag);
      await revalidate([...tags]);

      sendData(res, { ids: existing.map((doc) => doc.id), count: existing.length });
    },
  };
}
