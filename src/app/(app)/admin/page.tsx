import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { CreateBranchForm } from "./CreateBranchForm";
import { AddUserForm } from "./AddUserForm";

export const dynamic = "force-dynamic";

interface ProfileRow {
  id: string;
  email: string | null;
  role: string;
}
interface UserBranchRow {
  user_id: string;
  branch_code: string;
}

export default async function AdminPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: branches }, { data: profiles }, { data: userBranches }] =
    await Promise.all([
      supabase.from("branches").select("code, name").order("code"),
      supabase.from("profiles").select("id, email, role").order("email"),
      supabase.from("user_branches").select("user_id, branch_code"),
    ]);

  const branchList = (branches ?? []) as { code: string; name: string }[];
  const profileList = (profiles ?? []) as ProfileRow[];
  const ubList = (userBranches ?? []) as UserBranchRow[];

  const branchesByUser = new Map<string, string[]>();
  for (const ub of ubList) {
    const arr = branchesByUser.get(ub.user_id) ?? [];
    arr.push(ub.branch_code);
    branchesByUser.set(ub.user_id, arr);
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Manage branches, users, and branch access.
        </p>
      </header>

      {/* Branches */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Branches</h2>
        <CreateBranchForm />
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-2 font-medium">Code</th>
                <th className="px-4 py-2 font-medium">Name</th>
              </tr>
            </thead>
            <tbody>
              {branchList.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-zinc-500">
                    No branches yet.
                  </td>
                </tr>
              ) : (
                branchList.map((b) => (
                  <tr key={b.code} className="border-b border-zinc-100">
                    <td className="px-4 py-2 font-medium">{b.code}</td>
                    <td className="px-4 py-2 text-zinc-700">{b.name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Users */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Users</h2>
        <AddUserForm branches={branchList} />
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Branch access</th>
              </tr>
            </thead>
            <tbody>
              {profileList.map((p) => {
                const branches = branchesByUser.get(p.id) ?? [];
                const access =
                  p.role === "admin"
                    ? "All (admin)"
                    : branches.length
                      ? branches.join(", ")
                      : "—";
                return (
                  <tr key={p.id} className="border-b border-zinc-100">
                    <td className="px-4 py-2">{p.email}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.role === "admin"
                            ? "bg-zinc-900 text-white"
                            : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {p.role}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-zinc-700">{access}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
