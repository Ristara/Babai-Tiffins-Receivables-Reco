"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, getAllowedBranches } from "@/lib/supabase/auth";

export type SaveState =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "success" };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function num(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function intOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function dateOrNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return DATE_RE.test(s) ? s : null;
}

export async function savePosManual(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const me = await getCurrentUser();
  if (!me) return { kind: "error", message: "Sign in required." };

  const sale_date = String(formData.get("sale_date") ?? "");
  const branch = String(formData.get("branch") ?? "");
  if (!DATE_RE.test(sale_date) || !branch) {
    return { kind: "error", message: "Missing date or outlet." };
  }

  const allowed = await getAllowedBranches(me);
  if (!allowed.includes(branch)) {
    return { kind: "error", message: "You don't have access to this outlet." };
  }

  const row = {
    sale_date,
    branch,
    magicpin: num(formData.get("magicpin")),
    upi: num(formData.get("upi")),
    edc_machine: num(formData.get("edc_machine")),
    wallet: num(formData.get("wallet")),
    bills_modified_orders: intOrNull(formData.get("bills_modified_orders")),
    bills_modified_value: num(formData.get("bills_modified_value")),
    bills_reprinted_orders: intOrNull(formData.get("bills_reprinted_orders")),
    bills_reprinted_value: num(formData.get("bills_reprinted_value")),
    cancelled_orders: intOrNull(formData.get("cancelled_orders")),
    cancelled_value: num(formData.get("cancelled_value")),
    modified_kots_orders: intOrNull(formData.get("modified_kots_orders")),
    modified_kots_value: num(formData.get("modified_kots_value")),
    opening_cash: num(formData.get("opening_cash")),
    cash_expenses: num(formData.get("cash_expenses")),
    last_deposit_date: dateOrNull(formData.get("last_deposit_date")),
    last_deposit_amount: num(formData.get("last_deposit_amount")),
    shortage: num(formData.get("shortage")),
    closing_cash: num(formData.get("closing_cash")),
    updated_at: new Date().toISOString(),
    updated_by: me.id,
  };

  const admin = createAdminClient();
  const { error } = await admin
    .from("pos_manual")
    .upsert(row, { onConflict: "sale_date,branch" });
  if (error) {
    return { kind: "error", message: error.message };
  }

  revalidatePath("/pos-tracker");
  return { kind: "success" };
}
