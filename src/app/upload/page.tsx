import { createClient } from "@/lib/supabase/server";
import { UploadForm } from "./UploadForm";
import { HistoryRow, type UploadEntry } from "./HistoryRow";
import { RangeControls } from "./RangeControls";

// Allow the parse + upsert to run up to 60s (Vercel Hobby plan limit).
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Today's date in IST as YYYY-MM-DD.
function todayIST(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
}

function addDays(yyyyMmDd: string, n: number): string {
  const d = new Date(yyyyMmDd + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

type Preset = "7" | "30" | "90" | "all" | "custom";

function resolveRange(
  searchParams: Record<string, string | string[] | undefined>,
): { from: string; to: string; preset: Preset } {
  const today = todayIST();
  const rangeParam = String(searchParams.range ?? "30");

  if (rangeParam === "custom") {
    const from = String(searchParams.from ?? addDays(today, -29));
    const to = String(searchParams.to ?? today);
    return { from, to, preset: "custom" };
  }
  if (rangeParam === "all") {
    return { from: "2000-01-01", to: today, preset: "all" };
  }
  const days =
    rangeParam === "7" ? 7 : rangeParam === "90" ? 90 : 30;
  return {
    from: addDays(today, -(days - 1)),
    to: today,
    preset: (rangeParam === "7" || rangeParam === "90"
      ? rangeParam
      : "30") as Preset,
  };
}

// Build the inclusive list of YYYY-MM-DD strings from `to` back to `from`.
function generateDateList(from: string, to: string): string[] {
  const out: string[] = [];
  let cur = to;
  while (cur >= from) {
    out.push(cur);
    cur = addDays(cur, -1);
    if (out.length > 1000) break; // safety
  }
  return out;
}

interface RawUploadDateRow {
  sale_date: string;
  // Supabase sometimes returns the embedded resource as an array even for
  // 1:N parents — handle both shapes.
  uploads: UploadEntry | UploadEntry[] | null;
}

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { from, to, preset } = resolveRange(params);

  // Pull every (upload, sale_date) link inside the range plus the upload's
  // metadata. Order so the latest upload per date comes first.
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("upload_dates")
    .select(
      "sale_date, uploads ( id, filename, uploaded_at, rows_success, rows_total, rows_cancelled, rows_unclassified )",
    )
    .gte("sale_date", from)
    .lte("sale_date", to)
    .order("sale_date", { ascending: false });

  const grouped = new Map<string, UploadEntry[]>();
  if (!error && rows) {
    for (const r of rows as unknown as RawUploadDateRow[]) {
      const u = Array.isArray(r.uploads) ? r.uploads[0] : r.uploads;
      if (!u) continue;
      const list = grouped.get(r.sale_date) ?? [];
      list.push(u);
      grouped.set(r.sale_date, list);
    }
    for (const list of grouped.values()) {
      list.sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
    }
  }

  const dates =
    preset === "all"
      ? Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a))
      : generateDateList(from, to);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Upload daily CSV
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Drop in a Petpooja{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">
            Order_Summary_Report
          </code>{" "}
          file. Re-uploading the same day will replace its totals; full
          upload history is kept per date.
        </p>
      </header>

      <UploadForm />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium tracking-tight">History</h2>
            <p className="text-xs text-zinc-500">
              {preset === "all"
                ? "Showing every date that has at least one upload."
                : `Showing ${from} → ${to}.`}
            </p>
          </div>
        </div>

        <RangeControls from={from} to={to} preset={preset} />

        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            Couldn&apos;t load upload history: {error.message}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Latest upload</th>
                <th className="px-4 py-2 text-right font-medium">History</th>
              </tr>
            </thead>
            <tbody>
              {dates.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-sm text-zinc-500"
                  >
                    No uploads recorded yet in this range.
                  </td>
                </tr>
              ) : (
                dates.map((d) => (
                  <HistoryRow
                    key={d}
                    sale_date={d}
                    uploads={grouped.get(d) ?? []}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
