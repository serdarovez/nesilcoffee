# NesilCoffee

Marketing site and admin dashboard for NesilCoffee, a B2B coffee producer in
Turkmenistan. Next.js 16 App Router, five locales (`ru` default, plus `en`,
`tk`, `uz`, `az`), PostgreSQL via Prisma.

Architecture, the full decision record and the phased build plan live in
[`docs/backend-blueprint.html`](docs/backend-blueprint.html) — open it in a
browser.

## Requirements

- Node.js 20.9+
- PostgreSQL 17 or 18

## Setup

```bash
npm install
cp .env.example .env          # then fill in DATABASE_URL at minimum
npx prisma migrate deploy     # create the tables
npm run db:seed               # load the current site content
npm run dev
```

The site runs at http://localhost:3000. `/` redirects to a language rather
than serving one — locally that is `/en`, because a loopback address has no
country to detect. See [Language detection](#language-detection).

### Database

`npm run db:seed` populates the database from the content that used to be
hardcoded — 16 products across 4 categories, both carousels, 5 team members,
6 FAQ items, 2 certificates, the 2 About-page experts and the contact details —
reading all five translations straight out of `src/messages/*.json`. It is
idempotent and never overwrites rows edited in the admin, so it is safe to
re-run.

**Run it after deploying too.** The experts are a fixed pair created by the
seed, not by the admin, so an environment that only runs migrations will show an
empty Experts screen until it has been seeded once.

| Script | Purpose |
| --- | --- |
| `npm run db:migrate` | Create a new migration from schema changes (development) |
| `npm run db:deploy` | Apply pending migrations (production) |
| `npm run db:seed` | Load or top up baseline content |
| `npm run db:studio` | Browse the database in Prisma Studio |
| `npm run db:reset` | Drop, re-migrate and re-seed — destroys all data |
| `npm run geoip:fetch` | Download the DB-IP Lite country database (see below) |

### Admin access

```bash
npm run admin:create -- --email you@example.com --name "Имя"
```

Prints a generated password once. Re-running with the same email resets that
account's password and revokes its existing sessions, which doubles as password
recovery from the server console. Sign in at `/admin/login`.

Sessions are opaque 256-bit tokens stored as SHA-256 digests, so the database
never holds anything replayable. Login is rate limited to 5 attempts per 15
minutes, counted per IP *and* per email address.

## Content model

Translatable fields are JSONB objects keyed by locale: `{ ru, en?, tk?, uz?, az? }`.
Only `ru` is required. Reads go through `pick()` in
[`src/lib/i18n-field.ts`](src/lib/i18n-field.ts), which falls back to `ru` and
then to a next-intl message, so a partially translated record never renders an
empty field.

Prose that changes rarely — most of the About page, the production-process
blocks and the home page section copy — deliberately stays in
`src/messages/*.json` rather than the database. The exception on that page is
the Experts block, which is editable at `/admin/experts`; its heading falls back
to the message file when left blank.

### Rich text

Two fields hold sanitized HTML rather than plain text: FAQ answers and the
expert quotes. They are edited with a deliberately constrained Tiptap editor —
emphasis and line breaks for a quote, plus lists and links for an answer — and
every value is passed through the tag allowlist in
[`sanitizeRichText()`](src/server/form.ts) **on the way into the database**, so
nothing is stored that we would not be willing to render. The site renders them
with `dangerouslySetInnerHTML` inside a `.rich-text` block; that class styles
the editor and the page from the same rules, so what an editor sees is what a
visitor gets.

### Per-category product fields

A tea has no roast profile and a 20-stick instant pack has no meaningful
acidity, so each category declares — per field — whether it is `required`,
`optional`, or `off`. The declaration lives in `Category.fieldRules` and is read
by [`src/lib/category-fields.ts`](src/lib/category-fields.ts); the product form,
the save validation and the public cards all follow it.

Switching a field off **never deletes anything**. The stored value stays in the
table and reappears if the rule is switched back on, which means the rules have
to be applied twice: `writableSpecs()` keeps off fields out of the write, and
`applyFieldRules()` blanks them again on every read path. Add a new consumer of
product specs and it must call the latter, or it will show a field the rest of
the site hides.

Changing a rule never hides a product either. A product missing a newly-required
field gets a warning badge in the admin list and stays on the site — unlike a
missing photo, a missing spec just means the card renders one fewer row.

## Forms and notifications

The contact form and the product order modal both post to route handlers that
**write the submission to Postgres before attempting any notification**, so a
bounced email or an expired token can never lose a lead. Everything shows up
under `/admin/submissions`, with CSV export.

Delivery is best-effort on top of that, and each channel is independent:

- **Email** — Gmail SMTP via nodemailer. `SMTP_PASS` must be a Google *App
  Password*, which Google only issues once 2-step verification is enabled on the
  account. With no credentials set, sending is skipped rather than failing.
- **WhatsApp** — Cloud API, gated behind `WHATSAPP_ENABLED`. Meta requires an
  approved message template before a business can start a conversation, so this
  stays off until that approval lands; switching it on is an env change, not a
  deploy.

Spam protection is a hidden honeypot field, a minimum fill time of 3 seconds,
and a per-IP limit of 5 submissions per hour. Suspected bots get an ordinary
success response and are stored under the **Спам** tab rather than silently
dropped, so a false positive is recoverable.

## Language detection

A visitor with no locale in the URL and no stored preference is sent to the
language their country suggests: Turkmenistan → `tk`, Azerbaijan → `az`,
Uzbekistan → `uz`, the Russian-speaking CIS → `ru`, everything else → `en`.
Geo deliberately outranks `Accept-Language`, because Turkmen and Azeri visitors
overwhelmingly run Russian- or English-configured browsers. An explicit URL and
the `NEXT_LOCALE` cookie both still win — a language someone chose is never
overridden by a guess about them. The full order is documented in
[`src/proxy.ts`](src/proxy.ts).

The lookup reads a local IP-to-country database rather than a CDN header or a
geo API: the site is self-hosted behind nginx, and a CDN in front would be a
third party that can be blocked in the primary market.

**Detection is off until a database is present**, and the site is fully
functional without one: it logs a single warning on the first request that would
have needed it, then negotiates on `Accept-Language` and falls back to English —
exactly as it did before this feature existed. Nothing is stored against a
visitor either way; only the country code is read.

Any IP-to-country database in MMDB format works. `npm run geoip:fetch` gets one,
`GEOIP_DB_PATH` says where it lives, and detection starts on the next request —
no rebuild, no redeploy.

The source is **DB-IP Lite**: free, no account, a plain monthly URL.

```bash
npm run geoip:fetch    # writes data/dbip-country-lite.mmdb (gitignored)
```

Its CC BY 4.0 licence requires a visible `IP Geolocation by DB-IP` credit, which
is in the site footer ([`Footer.tsx`](src/components/layout/Footer.tsx)). Keep
that credit while DB-IP is the source.

Any other IP-to-country MMDB works too — drop it in and point `GEOIP_DB_PATH`
at it. Refresh the database every month or so; a stale one still works, it just
knows about fewer ranges. The download prefers a direct connection and falls
back to `curl` when one is not available, so it also works from behind a proxy
such as a VPN.

## Media

Uploads are normalized to WebP, capped at 2400px on the long edge, and written
under `UPLOAD_DIR` — outside the git tree, so a redeploy cannot destroy them.
The original filename is kept alongside the generated one purely so two similar
uploads can be told apart in the gallery.

`/admin/gallery` lists everything uploaded and is the only place images are
deleted. Deletion is never blocked, but the confirm dialog names every affected
item first: **products are taken off the site** (they cannot render without a
photo), while team members, certificates and both carousels simply lose their
image and keep working.

That product rule is enforced in the server actions, not the form — saving a
product with no image forces it inactive, and it cannot be switched back on
until one is uploaded. See `NO_IMAGE_REASON` in
[`src/lib/product-rules.ts`](src/lib/product-rules.ts).

## Environment

See [`.env.example`](.env.example) for the full list. `DATABASE_URL` and
`UPLOAD_DIR` are the only variables needed to run the site locally; the mail,
WhatsApp and GeoIP settings are each optional and degrade gracefully when
absent.

## Notes

- This project uses Next.js 16, where `middleware.ts` is deprecated in favour of
  `proxy.ts`, and two caching models ship in parallel. Read the relevant guide
  under `node_modules/next/dist/docs/` before changing routing or caching code.
- Run `npm run blur-data` after adding images to `public/` to regenerate the
  static blur placeholder map. Images uploaded through the admin get their
  placeholder generated automatically and stored on the media record.
