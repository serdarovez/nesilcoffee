import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Locale negotiation and prefixing for the public site.
 *
 * Renamed from `middleware.ts`: Next 16 deprecates that file convention in
 * favour of `proxy.ts`. next-intl still ships this as `createMiddleware`, which
 * is just the handler factory — the file name is what Next dispatches on.
 *
 * `admin` is excluded from the matcher. The admin dashboard is deliberately not
 * localized (it is Russian-only), so without this exclusion next-intl would
 * rewrite /admin to /ru/admin and the routes would 404.
 *
 * Note this proxy performs no authorization. Admin access is enforced in the
 * admin layout and inside every Server Action — see src/server/auth/guard.ts
 * for why matcher-based auth is not sufficient on its own.
 */
export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
