"use server";

import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/categories";
import { parsePetpoojaCsv, type ParseResult } from "@/lib/parse-csv";
import { revalidatePath } from "next/cache";

export type UploadState =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | {
      kind: "success";
      result: ParseResult;
      filename: string;
      sale_date: string;
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

  // Strict per-row date check: every detected sale_date must match the row.
  const distinct = Array.from(new Set(result.days.map((d) => d.sale_date)));
  const wrong = distinct.filter((d) => d !== expected);
  if (wrong.length > 0) {
    return {
      kind: "error",
      message: `This row is for ${expected}, but the file contains data for ${wrong.join(", ")}. Pick the right file or use that date's row instead.`,
    };
  }

  const supabase = await createClient();

  // 1. Audit row for this upload.
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

  // 2. Upsert daily_summaries + summary_lines for every branch in this CSV.
  for (const day of result.days) {
    for (const branch of day.branches) {
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

      // Upsert summary_lines — only amount + order_count are written, so
      // any existing zoho_invoice_id / posted_at survive a re-upload.
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

  // 3. Audit per-date entries so we keep full upload history.
  const dateRows = result.days.map((d) => ({
    upload_id: upload.id,
    sale_date: d.sale_date,
  }));
  if (dateRows.length > 0) {
    const { error: udErr } = await supabase
      .from("upload_dates")
      .insert(dateRows);
    if (udErr) {
      return {
        kind: "error",
        message: `Database error recording upload dates: ${udErr.message}`,
      };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/upload");

  return {
    kind: "success",
    result,
    filename: file.name,
    sale_date: expected,
  };
}
