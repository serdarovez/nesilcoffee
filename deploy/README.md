# Deployment

Target: a single Ubuntu 22.04/24.04 host running the Next.js app under systemd,
PostgreSQL locally, nginx in front terminating TLS and serving `/uploads`
straight off disk.

```
              ┌─ nginx :80/:443 ──────────────────────────┐
  visitor ───▶│  /uploads/*  → /var/www/nesilcoffee/uploads│
              │  everything else → 127.0.0.1:3000         │
              └───────────────────────┬───────────────────┘
                                      ▼
                        systemd: nesilcoffee (npm run start)
                                      ▼
                        PostgreSQL 17 — localhost:5432
```

Paths:

| What | Where |
| --- | --- |
| Repository checkout | `/var/www/nesilcoffee/app` |
| Uploads (outside the repo, survives redeploys) | `/var/www/nesilcoffee/uploads` |
| Environment | `/var/www/nesilcoffee/.env` |
| GeoIP database | `/var/www/nesilcoffee/data/GeoLite2-Country.mmdb` |
| Generated DB password | `/var/www/nesilcoffee/.dbpass` |

## Reaching the server

From Turkmenistan the host is not reachable directly — ICMP gets no reply and
every port times out, while the same probes through a VPN succeed. If that
applies, run the forwarder and point everything at its local port:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File deploy\socks-forward.ps1
```

It listens on `127.0.0.1:2222` and carries each connection through the local
SOCKS proxy (Happ/Xray on `127.0.0.1:10808` by default) out to
`2.27.202.93:22`. Then `ssh -p 2222 root@127.0.0.1` is the real server —
confirm with the banner, which should read `OpenSSH_9.6p1 Ubuntu-3ubuntu13.18`
and match what you get connecting to the host directly through the proxy.

Windows OpenSSH cannot speak SOCKS itself, and the obvious `ProxyCommand`
alternative does not survive contact with SSH's binary stream: the handshake
completes and the session dies on the first encrypted packet. Forwarding
socket-to-socket avoids the problem. Override the target with `-TargetHost`,
`-TargetPort`, `-ProxyPort` if any of them differ.

## Before the first deploy

**Push the code.** `admin-fixes` exists only on this laptop — six commits,
including the entire admin gallery, rich text, experts and geo work, are not on
GitHub. A server cloning the repo today gets `main` and none of it:

```bash
git push -u origin admin-fixes
```

**Point DNS at the server** — an `A` record for the domain and for `www`.
Certbot verifies over HTTP and will fail until this resolves.

## First deploy

On the server, as root:

```bash
git clone https://github.com/serdarovez/nesilcoffee.git /var/www/nesilcoffee/app
```

```bash
DOMAIN=nesilcoffee.com [email protected] /var/www/nesilcoffee/app/deploy/setup-server.sh
```

That installs Node 20, PostgreSQL, nginx and certbot; creates the `nesil`
service user, the database and a generated password; writes `.env`; installs
the systemd unit and nginx site; opens the firewall; obtains the certificate.
It is idempotent — re-running never rotates the DB password or overwrites
`.env`.

Then release:

```bash
chown -R nesil:nesil /var/www/nesilcoffee/app && sudo -u nesil /var/www/nesilcoffee/app/deploy/deploy.sh admin-fixes
```

Finally, create the first admin user:

```bash
cd /var/www/nesilcoffee/app && sudo -u nesil npm run admin:create -- --email you@example.com --name "Имя"
```

It prints a generated password **once**. Sign in at `https://<domain>/admin/login`.

## Every deploy after that

```bash
sudo -u nesil /var/www/nesilcoffee/app/deploy/deploy.sh
```

Pulls, `npm ci`, `prisma generate`, `prisma migrate deploy`, `db:seed`, builds,
restarts, health-checks. The seed is idempotent and never overwrites rows edited
in the admin, so it runs on every release by design — it is also the only thing
that creates the two About-page experts.

## Things that will bite

**Migrations run before the new build starts.** A migration that drops a column
the currently-running build still selects causes a window of errors. Nothing in
the current set does this, but a future destructive migration needs the
expand/contract split.

**`npm run build` needs dev dependencies.** Don't "optimise" `npm ci` with
`--omit=dev`: typescript, tailwind and the next-intl plugin are all dev deps,
and `db:seed` runs through `tsx`.

**The `X-Real-IP` / `X-Forwarded-For` headers in `nginx.conf` are load-bearing.**
`src/server/geo.ts` reads them for first-visit language detection and the
submission rate limit counts against them. Drop them and every visitor looks
like `127.0.0.1`: language detection silently stops, and the 5-per-hour form
limit becomes global rather than per-visitor.

**GeoIP is optional and off until a file exists.** The site works without it —
it logs one warning and negotiates on `Accept-Language`. To switch it on, put
any IP-to-country MMDB at `/var/www/nesilcoffee/data/GeoLite2-Country.mmdb`;
detection starts on the next request, no rebuild. With MaxMind credentials in
`.env`, `npm run geoip:fetch` downloads it. MaxMind's signup rejects VPN
addresses — DB-IP Lite is a drop-in alternative needing no account, but its
licence requires a visible credit link.

**Email and WhatsApp are blank by default** and skip sending rather than
failing. Leads are written to Postgres before any notification is attempted, so
nothing is lost while they're off. `SMTP_PASS` must be a Google *App Password*.

## Operating

```bash
systemctl status nesilcoffee
```

```bash
journalctl -u nesilcoffee -f
```

```bash
sudo -u postgres pg_dump nesilcoffee | gzip > /root/nesilcoffee-$(date +%F).sql.gz
```

A real backup covers both the database **and** `/var/www/nesilcoffee/uploads` —
the database only stores paths, so a dump alone restores a site full of broken
images.

## SSH hardening

Once key authentication works, in `/etc/ssh/sshd_config`:

```
PasswordAuthentication no
PermitRootLogin prohibit-password
```

then `systemctl restart ssh`. A password-authenticated root account on a public
IP is brute-forced continuously.
