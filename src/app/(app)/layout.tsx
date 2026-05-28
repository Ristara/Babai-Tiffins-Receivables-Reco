import { Sidebar } from "@/components/sidebar";
import { getCurrentUser } from "@/lib/supabase/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen">
      <Sidebar userEmail={user?.email ?? null} role={user?.role ?? "staff"} />
      <main className="min-w-0 flex-1 overflow-auto bg-zinc-50">{children}</main>
    </div>
  );
}
