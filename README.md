# Lekker Tours API

Express 5 + Mongoose 9 backend for **Lekker Tours and Travel**, a Nairobi-based safari operator.
It serves all public site content, the admin dashboard's CRUD endpoints, and image uploads.

The frontend that consumes this API lives in a separate repository: **`lekker-tours-web`**
(Next.js 15). The two communicate over HTTP only — there is no shared code between them.

- **Runtime:** Node 20+, Express 5, ES modules
- **Database:** MongoDB via Mongoose 9
- **Default port:** `4000`, so the API base URL is `http://localhost:4000/api`

---

## Getting started

```bash
npm install
cp .env.example .env    # then edit it — see below
npm run seed:admin      # creates the first administrator from .env
npm run seed            # loads tours, destinations, blog posts, testimonials, FAQs
npm run dev             # starts the API on :4000
```

MongoDB must be running locally on `27017`. To point somewhere else (Atlas, for example), change
`MONGODB_URI` in `.env`.

Both seed scripts are idempotent — running them twice changes nothing.

### Scripts

```bash
npm run dev         # node --watch, restarts on change
npm start           # production mode
npm run seed        # content collections
npm run seed:admin  # first administrator
```

---

## Environment

Copy `.env.example` to `.env`. `.env` is gitignored and must never be committed.

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` or `production`. Controls cookie `secure` and error verbosity. |
| `PORT` | API port. Default `4000`. |
| `MONGODB_URI` | Mongo connection string. |
| `WEB_ORIGIN` | Origin of the web app. Used for the CORS allowlist **and** as the target for revalidation callbacks. |
| `JWT_SECRET` | Signs admin JWTs. **Required** — the app refuses to boot without it. |
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
succeeds. This means the API runs perfectly well with no web app present — useful when developing
against the API alone.

Because the two repos are deployed separately, `WEB_ORIGIN` and `REVALIDATE_SECRET` are the entire
contract. Get those two right and the halves connect.

---

## Layout

```
src/
├─ config/       # env parsing, Mongo connection
├─ models/       # 8 Mongoose schemas
├─ routes/       # one router per resource
├─ controllers/  # request/response handling
├─ services/     # data access (incl. a shared CRUD factory)
├─ middleware/   # auth, Zod validation, error handling
├─ validators/   # Zod schemas per resource
└─ seed/         # seedAdmin.js, seedContent.js + data/
uploads/         # admin-uploaded images, served at /uploads
```

### Data model

| Model | Purpose |
|---|---|
| `Tour` | Discriminated on `category` into `SafariExpedition` and `WeekendEscape`. Embedded day-by-day itinerary, inclusions/exclusions, gallery. |
| `Destination` | Country-level, with embedded `parks[]` each carrying its own best-time guidance. |
| `BlogPost` | Journal articles, with a small Markdown subset in the body. |
| `Testimonial` | Reviews shown in the homepage carousel. |
| `FAQ` | Grouped questions for the homepage accordion. |
| `Enquiry` | Both contact-form and booking-form submissions, with a `new → read → responded → archived` workflow. |
| `SiteSettings` | Singleton holding hero copy, values, contact block, socials, footer and default SEO. |
| `AdminUser` | bcrypt-hashed credentials for dashboard access. |

Everything with a public URL carries a `draft`/`published` status.

---

## Security

- JWT in an `httpOnly` cookie (`sameSite: lax`, `secure` in production); the token is verified only
  here, never decoded in the browser.
- bcrypt password hashing at cost 12, with the hash excluded from queries by default.
- Zod validation on every request body, query and path parameter.
- Rate limiting on login (10 per 15 min) and public enquiry submission (20 per hour).
- Helmet, CORS restricted to `WEB_ORIGIN`, and a uniform error envelope that never leaks stack
  traces in production.

---

## Deployment

- Set real values for `JWT_SECRET` and `REVALIDATE_SECRET`. The API **refuses to start in
  production** if `JWT_SECRET` is still the development placeholder.
- Change the seeded administrator password.
- Set `NODE_ENV=production` so the auth cookie is marked `secure` (requires HTTPS).
- Point `WEB_ORIGIN` at the deployed web hostname, and set the web app's `NEXT_PUBLIC_API_URL` at
  this service.
- `uploads/` needs **persistent storage**. On an ephemeral filesystem (most PaaS containers) the
  directory is wiped on each deploy — move uploads to object storage instead.

---

## A note on content

The seed data in `src/seed/data/` is a mix of Lekker's real published content and material written
for this project. Some of it — the testimonials in particular — is illustrative and must not be
published as genuine. See the "Content provenance" section of the `lekker-tours-web` README before
this faces customers.
