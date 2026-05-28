"use server";

import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/categories";
import { parsePetpoojaCsv, type ParseResult } from "@/lib/parse-csv";
import { getCurrentUser, getAllowedBranches } from "@/lib/supabase/auth";
import { revalidatePath } from "next/cache";

export type UploadWarning = {
  skipped_dates: string[];
  skipped_orders: number;
};

export type UploadState =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | {
      kind: "success";
      filename: string;
      sale_date: string;
      orders_saved: number;
      branches_saved: number;
      warning?: UploadWarning;
    };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function uploadCsvForDate(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const file = formData.get("csv");
  const expected = String(formData.get("expected_date") ?? "");

  if (!DATE_RE.test(expected)) {
    return {
      kind: "error",
      message: "Internal error: invalid date binding on this row.",
    };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { kind: "error", message: "No file selected." };
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    return { kind: "error", message: "Could not read the file." };
  }

  let result: ParseResult;
  try {
    result = parsePetpoojaCsv(text);
  } catch (err) {
    return {
      kind: "error",
      message: `Could not parse CSV: ${(err as Error).message}`,
    };
  }

  if (result.days.length === 0) {
    return {
      kind: "error",
      message:
        "No valid order rows found. Is this a Petpooja Order_Summary_Report?",
    };
  }

  // Keep only rows for the row's date; everything else is "skipped".
  const matchingDays = result.days.filter((d) => d.sale_date === expected);
  const otherDays = result.days.filter((d) => d.sale_date !== expected);
  const skipped_orders = otherDays.reduce(
    (s, d) =>
      s + d.branches.reduce((bs, b) => bs + b.total_orders, 0),
    0,
  );
  const skipped_dates = Array.from(
    new Set(otherDays.map((d) => d.sale_date)),
  ).sort();

  // If nothing in the file actually matches this row, refuse — otherwise
  // the audit row would record an upload that touched zero data.
  if (matchingDays.length === 0) {
    return {
      kind: "error",
      message: `This file has data for ${skipped_dates.join(", ")} but nothing for ${expected}. Pick the right file or use the matching row instead.`,
    };
  }

  // Branch-access enforcement: a user can only save branches they're allowed.
  const me = await getCurrentUser();
  if (!me) {
    return { kind: "error", message: "You must be signed in." };
  }
  const allowed = new Set(await getAllowedBranches(me));

  const supabase = await createClient();

  // 1. Audit row for this upload (counts reflect the whole file).
  const { data: upload, error: uploadErr } = await supabase
    .from("uploads")
    .insert({
      filename: file.name,
      rows_total: result.rows_total,
      rows_success: result.rows_success,
      rows_cancelled: result.rows_cancelled,
      rows_unclassified: result.rows_unclassified,
    })
    .select()
    .single();

  if (uploadErr || !upload) {
    return {
      kind: "error",
      message: `Database error recording upload: ${uploadErr?.message ?? "unknown"}`,
    };
  }

  // 2. Upsert daily_summaries + summary_lines — but only for the matching
  //    date. Spillover-date rows are dropped on purpose.
  let orders_saved = 0;
  let branches_saved = 0;
  for (const day of matchingDays) {
    for (const branch of day.branches) {
      // Skip branches this user isn't allowed to write.
      if (!allowed.has(branch.branch)) continue;
      orders_saved += branch.total_orders;
      branches_saved += 1;

      const { data: ds, error: dsErr } = await supabase
        .from("daily_summaries")
        .upsert(
          {
            upload_id: upload.id,
            sale_date: day.sale_date,
            branch: branch.branch,
            total_amount: branch.total_amount,
            total_orders: branch.total_orders,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "sale_date,branch" },
        )
        .select()
        .single();

      if (dsErr || !ds) {
        return {
          kind: "error",
          message: `Database error saving ${day.sale_date} ${branch.branch}: ${dsErr?.message ?? "unknown"}`,
        };
      }

      const lineRows = CATEGORIES.map((cat) => ({
        daily_summary_id: ds.id,
        category: cat,
        amount: branch.by_category[cat].amount,
        order_count: branch.by_category[cat].order_count,
      }));

      const { error: linesErr } = await supabase
        .from("summary_lines")
        .upsert(lineRows, {
          onConflict: "daily_summary_id,category",
        });

      if (linesErr) {
        return {
          kind: "error",
          message: `Database error saving category totals for ${day.sale_date} ${branch.branch}: ${linesErr.message}`,
        };
      }
    }
  }

  // 3. Audit per-date entry — only for the date we actually saved.
  const { error: udErr } = await supabase
    .from("upload_dates")
    .insert({ upload_id: upload.id, sale_date: expected });
  if (udErr) {
    return {
      kind: "error",
      message: `Database error recording upload date: ${udErr.message}`,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/upload");

  return {
    kind: "success",
    filename: file.name,
    sale_date: expected,
    orders_saved,
    branches_saved,
    warning:
      skipped_orders > 0 ? { skipped_dates, skipped_orders } : undefined,
  };
}

export type DeleteState =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "success"; sale_date: string };

// Wipe everything for a date: dashboard totals (daily_summaries cascades to
// summary_lines), upload history (upload_dates), and any PayTm settlements.
// The uploads audit rows are intentionally left as a log.
export async function deleteDate(
  _prev: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  const sale_date = String(formData.get("sale_date") ?? "");
  if (!DATE_RE.test(sale_date)) {
    return { kind: "error", message: "Invalid date." };
  }

  const supabase = await createClient();

  const { error: e1 } = await supabase
    .from("daily_summaries")
    .delete()
    .eq("sale_date", sale_date);
  if (e1) {
    return { kind: "error", message: `Failed deleting summaries: ${e1.message}` };
  }

  const { error: e2 } = await supabase
    .from("upload_dates")
    .delete()
    .eq("sale_date", sale_date);
  if (e2) {
    return {
      kind: "error",
      message: `Failed deleting upload history: ${e2.message}`,
    };
  }

  const { error: e3 } = await supabase
    .from("paytm_settlements")
    .delete()
    .eq("sale_date", sale_date);
  if (e3) {
    return {
      kind: "error",
      message: `Failed deleting settlements: ${e3.message}`,
    };
  }

  revalidatePath("/upload");
  revalidatePath("/dashboard");
  return { kind: "success", sale_date };
}
