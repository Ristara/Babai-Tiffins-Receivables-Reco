"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Not authorized.");
  }
  return user;
}

export type ActionState =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "success"; message: string };

export async function createBranch(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { kind: "error", message: "Not authorized." };
  }

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!code || !name) {
    return { kind: "error", message: "Code and name are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("branches")
    .insert({ code, name });
  if (error) {
    return { kind: "error", message: error.message };
  }

  revalidatePath("/admin");
  return { kind: "success", message: `Branch ${code} created.` };
}

export async function addUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { kind: "error", message: "Not authorized." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "staff");
  const branches = formData.getAll("branches").map(String);

  if (!email || password.length < 6) {
    return {
      kind: "error",
      message: "Email and a 6+ character password are required.",
    };
  }
  if (role !== "admin" && role !== "staff") {
    return { kind: "error", message: "Invalid role." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return { kind: "error", message: (err as Error).message };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    return {
      kind: "error",
      message: error?.message ?? "Could not create user.",
    };
  }
  const userId = data.user.id;

  // Trigger creates a staff profile; set the chosen role explicitly.
  const { error: pErr } = await admin
    .from("profiles")
    .upsert({ id: userId, email, role }, { onConflict: "id" });
  if (pErr) {
    return { kind: "error", message: `User made, role failed: ${pErr.message}` };
  }

  if (branches.length > 0) {
    const { error: bErr } = await admin
      .from("user_branches")
      .insert(branches.map((b) => ({ user_id: userId, branch_code: b })));
    if (bErr) {
      return {
        kind: "error",
        message: `User made, branch access failed: ${bErr.message}`,
      };
    }
  }

  revalidatePath("/admin");
  return { kind: "success", message: `User ${email} created (${role}).` };
}
