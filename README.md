# Lekker Tours API

Express 5 + PostgreSQL backend for **Lekker Tours and Travel**, a Nairobi-based safari operator.
It serves all public site content, the admin dashboard's CRUD endpoints, and image uploads.

The frontend that consumes this API lives in a separate repository: **`lekker-tours-web`**
(Next.js 15). The two communicate over HTTP only, there is no shared code between them.

- **Runtime:** Node 20+, Express 5, ES modules
- **Database:** PostgreSQL 17 via Prisma 7
- **Default port:** `4000`, so the API base URL is `http://localhost:4000/api`

---

## Getting started

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # then edit it, see below
docker compose up -d postgres
npm run db:migrate          # creates the schema
npm run seed:admin          # creates the first administrator from .env
npm run seed                # loads tours, destinations, blog posts, testimonials, FAQs
npm run dev                 # starts the API on :4000
```

`docker compose up -d postgres` starts PostgreSQL on `5432` with credentials matching the
`DATABASE_URL` in `.env.example`. To use an existing database instead (a local install, Neon,
Supabase, RDS), just point `DATABASE_URL` at it and skip the compose step.

Both seed scripts are idempotent, running them twice changes nothing.

### Scripts

```bash
npm run dev          # node --watch, restarts on change
npm start            # production mode
npm run seed         # content tables
npm run seed:admin   # first administrator
npm run db:migrate   # create/apply a migration in development
npm run db:deploy    # apply pending migrations (production, CI)
npm run db:generate  # regenerate the Prisma client
npm run db:studio    # browse the data in Prisma Studio
npm run db:reset     # drop, recreate and re-migrate, destroys all data
```

### Running everything in Docker

```bash
docker compose up --build              # API + database
docker compose run --rm api npm run seed:admin
docker compose run --rm api npm run seed
```

The `api` service applies migrations on start, so a fresh database comes up usable. Uploads are
kept in a named volume rather than the container filesystem, so they survive a rebuild.

---

## Environment

Copy `.env.example` to `.env`. `.env` is gitignored and must never be committed.

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` or `production`. Controls cookie `secure` and error verbosity. |
| `PORT` | API port. Default `4000`. |
| `DATABASE_URL` | PostgreSQL connection string. Read by the runtime client *and* by the Prisma CLI via [prisma.config.ts](prisma.config.ts). |
| `WEB_ORIGIN` | Origin of the web app. Used for the CORS allowlist **and** as the target for revalidation callbacks. |
| `PUBLIC_API_URL` | This service's own public origin. Baked into uploaded-image URLs. Defaults to `http://localhost:{PORT}`. **Must be the real hostname in production**, see below. |
| `JWT_SECRET` | Signs admin JWTs. **Required**, the app refuses to boot without it. |
| `JWT_EXPIRES_IN` | Token lifetime. Default `7d`. |
| `REVALIDATE_SECRET` | Shared secret for the webhook to the web app. Must match the value in `lekker-tours-web`. If empty, revalidation is skipped entirely. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Used once by `npm run seed:admin`. |

---

## How it talks to the web app

Two directions, both plain HTTP:

1. **Web → API.** The Next.js app reads content from `/api/*`. Public endpoints return published
   records only; admin endpoints require the JWT cookie and see drafts too.
2. **API → Web.** After any admin write, the API POSTs the affected cache tags to
   `{WEB_ORIGIN}/api/revalidate` with an `x-revalidate-secret` header, so published changes appear
   on the public site without a restart.

The revalidation call is **deliberately non-fatal** ([src/utils/revalidate.js](src/utils/revalidate.js)):
if the web app is down or restarting, the failure is logged and swallowed so the content save still
succeeds. This means the API runs perfectly well with no web app present, useful when developing
against the API alone.

Because the two repos are deployed separately, `WEB_ORIGIN` and `REVALIDATE_SECRET` are the entire
contract. Get those two right and the halves connect.

### The `_id` compatibility layer

Primary keys are UUIDs, but the web app's TypeScript types read **`_id`** on every interface,
a leftover from when this service ran on MongoDB. Rather than change both repos at once, every
response is shaped by [src/utils/serialize.js](src/utils/serialize.js), which sets `_id` *and* `id`
to the same UUID and recomputes the three fields that used to be Mongoose virtuals:

| Field | On | Was |
|---|---|---|
| `durationLabel` | Tour | `virtual('durationLabel')` |
| `parkCount` | Destination | `virtual('parkCount')` |
| `totalGuests` | Enquiry | `virtual('totalGuests')` |

**Every controller response must go through a serializer.** Returning a raw Prisma row ships
`_id: undefined` to the browser and blanks every React `key`. If the web app is ever updated to
read `id`, this layer is the only thing that needs deleting.

---

## Layout

```
prisma/
├─ schema.prisma   # 8 models, enums, indexes
└─ migrations/     # generated SQL, committed
src/
├─ config/         # env parsing, Prisma client, settings defaults
├─ routes/         # one router per resource
├─ controllers/    # request/response handling
├─ services/       # data access (incl. a shared CRUD factory)
├─ middleware/     # auth, Zod validation, error handling
├─ validators/     # Zod schemas per resource
├─ utils/          # serializers, slugs, errors, revalidation
└─ seed/           # seedAdmin.js, seedContent.js + data/
uploads/           # admin-uploaded images, served at /uploads
```

### Data model

| Table | Purpose |
|---|---|
| `tours` | `category` column (`SafariExpedition` \| `WeekendEscape`) with nullable subtype fields, formerly a Mongoose discriminator. Itinerary, gallery and SEO are JSON. |
| `destinations` | Country-level, with `parks` as JSON, each park carries its own best-time guidance. |
| `blog_posts` | Journal articles, with a small Markdown subset in the body. |
| `testimonials` | Reviews shown in the homepage carousel. |
| `faqs` | Grouped questions for the homepage accordion. |
| `enquiries` | Both contact-form and booking-form submissions, with a `new → read → responded → archived` workflow. |
| `site_settings` | Singleton (unique `key = 'primary'`) holding hero copy, values, contact block, socials, footer and default SEO. |
| `admin_users` | bcrypt-hashed credentials for dashboard access. |

Everything with a public URL carries a `draft`/`published` status.

**Why JSON for some columns.** Itineraries, galleries, parks and SEO blocks are only ever read and
written whole, nothing filters or sorts on them, and the admin UI PUTs the entire array back on
every save. Child tables would add joins and migrations for no query benefit. Anything the site
*does* filter, sort or paginate by is a real column with a real index.

---

## Security

- JWT in an `httpOnly` cookie (`sameSite: lax`, `secure` in production); the token is verified only
  here, never decoded in the browser.
- bcrypt password hashing at cost 12. Unlike the old schema there is no `select: false`, so
  `passwordHash` comes back on every read, it must never reach a serializer. `publicShape()` in
  [src/controllers/auth.controller.js](src/controllers/auth.controller.js) is the only thing that
  reaches the client.
- Zod validation on every request body, query and path parameter. Path ids are validated as UUIDs.
- Rate limiting on login (10 per 15 min) and public enquiry submission (20 per hour).
- Helmet, CORS restricted to `WEB_ORIGIN`, an origin check on cookie-authenticated writes, and a
  uniform error envelope that never leaks stack traces in production.

### A note on `npm audit`

`npm audit` reports high-severity advisories in `deepmerge-ts` and `mysql2`. Both are transitive
dependencies **of the Prisma CLI**, which is a `devDependency` and never ships. `mysql2` in
particular is a driver this project does not load. `npm audit fix --force` "resolves" them by
downgrading to Prisma 6, which would undo the Prisma 7 configuration this repo is built on, don't
run it.

---

## Deployment

- Set real values for `JWT_SECRET` and `REVALIDATE_SECRET`. The API **refuses to start in
  production** if `JWT_SECRET` is still the development placeholder.
- Run `npm run db:deploy` (not `db:migrate`) to apply migrations, it never prompts and never
  attempts to reset.
- Change the seeded administrator password.
- Set `NODE_ENV=production` so the auth cookie is marked `secure` (requires HTTPS).
- Point `WEB_ORIGIN` at the deployed web hostname, and set the web app's `NEXT_PUBLIC_API_URL` at
  this service.
- `uploads/` needs **persistent storage**. On an ephemeral filesystem (most PaaS containers) the
  directory is wiped on each deploy, mount a volume, or move uploads to object storage.
- **Set `PUBLIC_API_URL` to the deployed hostname.** When an admin uploads an image, the absolute
  URL returned by `POST /api/admin/uploads` is *stored on the content row* and later rendered
  by the public site. If this is left at localhost in production, every newly uploaded image is
  saved with an unreachable URL, and fixing it afterwards means rewriting stored rows, not
  just changing config. Whatever you set here must also be allowed by the web app's
  `images.remotePatterns` (it derives that from `NEXT_PUBLIC_API_URL`, so keep the two identical).

## Continuous integration

[.github/workflows/ci.yml](.github/workflows/ci.yml) runs on push and PR: `npm ci`, a
`node --check` syntax pass over every tracked `.js`, `prisma validate`, `prisma migrate deploy`
against a real PostgreSQL service container, then it boots the app, seeds it, and asserts
`/api/tours` answers. There is no unit-test suite yet, so this is the safety net, a broken import,
a bad route shape or a schema that does not migrate fails the build.

---

## A note on content

The seed data in `src/seed/data/` is a mix of Lekker's real published content and material written
for this project. Some of it, the testimonials in particular, is illustrative and must not be
published as genuine. See the "Content provenance" section of the `lekker-tours-web` README before
this faces customers.
