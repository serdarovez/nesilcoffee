import { requireAdmin } from "@/server/auth/guard";
import { Sidebar } from "@/components/admin/Sidebar";

/**
 * Guarded area. Everything in this route group requires a signed-in admin;
 * /admin/login sits outside it so the login page is reachable.
 *
 * This guard covers rendering only. Server Actions are separately reachable by
 * direct POST, so each one calls requireAdmin() itself.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="flex min-h-dvh">
      <Sidebar userName={user.name} userEmail={user.email} />
      <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
