import { createClient } from "./server";
import { createAdminClient } from "./admin";

export type Role = "admin" | "staff";

export interface CurrentUser {
  id: string;
  email: string | null;
  role: Role;
}

function normalizeRole(value: unknown): Role | null {
  return value === "admin" || value === "staff" ? value : null;
}

// Returns the logged-in user + their role, or null if not signed in.
// The role is read with the service-role client so Row Level Security
// can never hide the profile row (which would silently downgrade to staff).
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let role: Role = "staff";

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const r = normalizeRole(profile?.role);
    if (r) role = r;
  } catch {
    // Secret key missing — fall back to the session-scoped read (needs RLS off).
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const r = normalizeRole(profile?.role);
    if (r) role = r;
  }

  return { id: user.id, email: user.email ?? null, role };
}

// Branch codes the user may access. Admins get every branch; staff get
// only the branches assigned in user_branches. Read via the service-role
// client so RLS can't interfere.
export async function getAllowedBranches(user: CurrentUser): Promise<string[]> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return [];
  }

  if (user.role === "admin") {
    const { data } = await admin.from("branches").select("code").order("code");
    return (data ?? []).map((b: { code: string }) => b.code);
  }

  const { data } = await admin
    .from("user_branches")
    .select("branch_code")
    .eq("user_id", user.id);
  return (data ?? [])
    .map((b: { branch_code: string }) => b.branch_code)
    .sort();
}
