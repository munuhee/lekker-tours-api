# Lekker Tours — cPanel deployment: finishing steps

This picks up **after the DNS zone for `lekkertours.com` has been fixed** (via
Cloudflare or a Truehost zone rebuild). Everything before that point is already
done — see "What is already in place" below.

Roughly 15 minutes of work, plus waiting on DNS propagation.

---

## Environment

| | |
|---|---|
| Host | Truehost cPanel, server `lon110`, package `newTruehost_Silver` |
| cPanel user | `llpovtxj` |
| Server IP | `51.89.153.183` |
| Node version | 22.23.2 (selected in Setup Node.js App) |
| API code | `/home/llpovtxj/lekker-api` |
| Web code | `/home/llpovtxj/lekkertours.com` |
| Database | PostgreSQL, `llpovtxj_lekker`, user `llpovtxj_api` |

Two Node apps, both already created and running under Passenger:

| App | Root | URL (current) | Startup file |
|---|---|---|---|
| API (Express 5 + Prisma) | `lekker-api` | `lekkertours.com/lekker-api-temp` ← **temporary** | `src/server.js` |
| Web (Next.js 15) | `lekkertours.com` | `lekkertours.com/` | `server.js` |

There is **no SSH access** on this account — every port is closed. All work is
done through the cPanel UI.

---

## What is already in place

Do not redo any of this:

- Both repos cloned via **Git Version Control** (API at commit `da3329b` or later)
- `.env` written at `/home/llpovtxj/lekker-api/.env`
- `.env.local` written at `/home/llpovtxj/lekkertours.com/.env.local`
- API dependencies installed; Prisma client generated (`db:generate`)
- Migration applied (`db:deploy`) — all 8 tables exist
- Admin user seeded (`seed:admin`) and content seeded (`seed`)
- Web app dependencies installed and `npm run build` completed
- Both apps show **started (v22.23.2)** in Setup Node.js App
- Let's Encrypt **wildcard certificate** `*.lekkertours.com` + `lekkertours.com`
  already on the server (expires 2026-12-06) — covers `api.` automatically, so
  no AutoSSL run is needed

---

## Step 0 — Confirm DNS actually resolves

Do not start until this passes. From any machine:

```
nslookup lekkertours.com
nslookup api.lekkertours.com
```

Both must return **`51.89.153.183`**.

If you get `NXDOMAIN`, the zone is still broken — stop here and chase the DNS
fix. Nothing below will work.

Browsing to `http://lekkertours.com` should now show the Next.js site. The site
will render but show **no tours, destinations or blog posts** — that is expected
at this stage and is fixed in Step 2.

---

## Step 1 — Repoint the API to its real subdomain

The API is currently mounted at `lekkertours.com/lekker-api-temp`. That was a
workaround: cPanel refuses to run `npm install` unless the app's URL resolves,
and `api.lekkertours.com` did not resolve at the time.

**cPanel → Setup Node.js App → the `lekker-api` app → pencil/edit icon**

Change **Application URL**:

- Dropdown: `api.lekkertours.com`
- Path box: **empty** (delete `lekker-api-temp`)

Leave everything else alone — Node 22.23.2, Production, root `lekker-api`,
startup `src/server.js`.

**SAVE**, then **RESTART**.

### Verify

```
https://api.lekkertours.com/api/health
```

Expect JSON:

```json
{"success":true,"data":{"status":"ok","uptimeSeconds":12,"database":"connected","timestamp":"..."}}
```

`"database":"connected"` is the important part. If it says `disconnected`, the
`DATABASE_URL` in `/home/llpovtxj/lekker-api/.env` is wrong or the Postgres user
lacks privileges on `llpovtxj_lekker`.

Then check real data:

```
https://api.lekkertours.com/api/tours
```

Should return the seeded tours.

---

## Step 2 — Rebuild the web app

**This step is not optional.** `src/lib/api.ts` reads `NEXT_PUBLIC_API_URL` at
**build time** — Next.js inlines `NEXT_PUBLIC_*` variables into the compiled
bundle. The existing build was produced while the API sat on a temporary path,
so the baked-in URL may not match where the API now lives.

Symptom if skipped: the site loads, but every page is empty of content.

**cPanel → Setup Node.js App → the `lekkertours.com` app**

1. First confirm `/home/llpovtxj/lekkertours.com/.env.local` contains:

   ```
   NEXT_PUBLIC_API_URL=https://api.lekkertours.com
   NEXT_PUBLIC_SITE_URL=https://lekkertours.com
   REVALIDATE_SECRET=<must match the API's .env exactly>
   ```

   (File Manager → enable **Settings → Show Hidden Files** to see dotfiles.)

2. **Run JS script** → choose **`build`** → run. Takes a few minutes.
3. **RESTART** the app.

### Verify

`https://lekkertours.com` should now show tours, destinations and blog posts.

---

## Step 3 — Force HTTPS on both domains

The admin session cookie is `httpOnly` + `secure` when `NODE_ENV=production`
(it is). **Login will silently fail over plain HTTP** — the browser refuses to
store a `secure` cookie on an insecure origin.

**cPanel → Domains**

Toggle **Force HTTPS Redirect** → **On** for:

- `lekkertours.com`
- `api.lekkertours.com`

Both currently show `Off`.

Do this only after Step 0 passes. Enabling it while DNS is unresolved redirects
to an address that does not exist.

---

## Step 4 — Redirect `www` to the bare domain

**cPanel → Domains → Redirects**

- Type: **Permanent (301)**
- From: `www.lekkertours.com`
- To: `https://lekkertours.com`

This matters more than it looks. `src/middleware/csrf.js` in the API compares
the browser's `Origin` header against `WEB_ORIGIN` **character for character**.
`WEB_ORIGIN` is `https://lekkertours.com`, so an admin who happens to be on
`www.` will have every write rejected with "This request came from an
unrecognised origin."

---

## Step 5 — Verify the admin dashboard

1. Go to `https://lekkertours.com/admin/login`
2. Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from
   `/home/llpovtxj/lekker-api/.env`
3. Confirm you can list tours
4. Edit something trivial and save — confirms CORS, the CSRF origin check, and
   the JWT cookie all work end to end
5. Upload an image on any content item — confirms `PUBLIC_API_URL` is right

### On uploads — read this before the client adds content

`PUBLIC_API_URL` must be `https://api.lekkertours.com`.

When an admin uploads an image, `src/routes/uploads.js` builds an **absolute
URL** from `PUBLIC_API_URL` and **stores it on the content row**. If that value
is ever wrong, every image uploaded while it was wrong is saved with an
unreachable URL — and fixing it later means rewriting stored rows, not just
editing config.

Check an uploaded image's URL in the dashboard. It must begin
`https://api.lekkertours.com/uploads/`.

---

## Step 6 — Change the seeded admin password

The password in `.env` was set during deployment. Change it from inside the
dashboard, or reset it by deleting the `admin_users` row and re-running
`seed:admin` with a new `ADMIN_PASSWORD`.

---

## Deploying code changes later

1. **Git Version Control** → the repo → **Manage** → **Pull or Deploy** →
   **Update from Remote**
2. If dependencies changed: **Setup Node.js App** → **Run NPM Install**
3. If the Prisma schema changed: **Run JS script** → `db:generate`, then
   `db:deploy`
4. For the web app, **always** `build` after pulling
5. **RESTART** the app

### Using Run JS script

It is a picklist, not a text box, and the list scrolls — `db:deploy`,
`db:generate`, `db:studio`, `db:reset` are below the visible entries.

**Never run these from the UI:**

- `dev` / `start` — daemons; cPanel cannot stop them once started
- `db:migrate` — prompts interactively and will hang (use `db:deploy`)
- `db:reset` — drops the entire database

---

## Known issues and gotchas

**`postinstall` was deliberately removed.** cPanel runs `npm install` with its
virtualenv as the working directory (`~/nodevenv/lekker-api/22/lib`), not the
app root, so a `prisma generate` postinstall hook fails there — no
`prisma/schema.prisma` in that directory. Commit `da3329b` removed the hook.
**Do not add it back.** Run `db:generate` explicitly after installs instead.

**Document roots do not match app roots, and that is correct.**
`api.lekkertours.com`'s document root is `/api.lekkertours.com` while its code
lives in `/home/llpovtxj/lekker-api`; `lekkertours.com`'s document root is
`/public_html` while its code is in `/home/llpovtxj/lekkertours.com`. Passenger
routes on the app's root directory, not the document root. The API code was
deliberately placed outside the web-accessible tree so `.env` cannot be fetched
over HTTP.

**Do not delete `.well-known`** from either document root — Let's Encrypt uses
it for domain validation and renewal.

**Git clone fails into a non-empty directory.** New cPanel domains are seeded
with `cgi-bin`, `php.ini`, `.htaccess`, `.user.ini` and `.well-known`. Clone to
a fresh directory instead of clearing those.

**Disk `/home` was at 88%** at deployment time. Next.js builds are disk-hungry;
if builds start failing oddly, check disk usage first.

**`uploads/` is real persistent disk here** — unlike most PaaS hosts, files
survive restarts and redeploys. It is *not* in git. Include
`/home/llpovtxj/lekker-api/uploads/` in any backup routine.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `NXDOMAIN` | DNS zone missing/terminated | Fix at the DNS provider; nothing on the server will help |
| Site loads, no content | `NEXT_PUBLIC_API_URL` baked in wrong | Step 2 — rebuild and restart |
| `"database":"disconnected"` on `/api/health` | Bad `DATABASE_URL`, or user lacks privileges | Check `.env`; in PostgreSQL Databases confirm `llpovtxj_api` has **ALL PRIVILEGES** on `llpovtxj_lekker` |
| Admin login appears to succeed but bounces back | Cookie is `secure`, site served over HTTP | Step 3 — Force HTTPS |
| Admin writes rejected, "unrecognised origin" | Browser on `www.`, `WEB_ORIGIN` is bare domain | Step 4 — `www` redirect |
| Uploaded images broken | `PUBLIC_API_URL` wrong when uploaded | Fix `.env`, restart; already-stored rows need rewriting |
| Content edits do not appear on the public site | `REVALIDATE_SECRET` mismatch between the two `.env` files | Make them identical, restart both |
| 403 from the server on every path | Host header does not match a resolving domain | Expected before DNS resolves; not an app fault |
| `npm install` fails on `prisma generate` | The `postinstall` hook is back | Remove it; run `db:generate` separately |

---

## Architecture notes

The two apps talk over HTTP only — no shared code.

- **Web → API:** the Next.js app reads `/api/*`. Public endpoints return
  published records only; admin endpoints need the JWT cookie and see drafts.
- **API → Web:** after any admin write, the API POSTs affected cache tags to
  `{WEB_ORIGIN}/api/revalidate` with an `x-revalidate-secret` header, so
  published changes appear without a restart. This call is deliberately
  non-fatal — if the web app is down, the failure is logged and swallowed so the
  content save still succeeds.

`WEB_ORIGIN` and `REVALIDATE_SECRET` are the entire contract between them. Get
those right and the halves connect.

See `README.md` for the full API reference, data model and security notes.
