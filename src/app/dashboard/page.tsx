import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, type Category } from "@/lib/categories";
import { BranchMultiSelect } from "./BranchMultiSelect";

export const dynamic = "force-dynamic";

const BRANCHES = ["HSR", "SJP", "JPN"] as const;

type Preset = "7" | "30" | "90" | "all" | "custom";

const inr0 = (n: number) => Math.round(n).toLocaleString("en-IN");

function todayIST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function addDays(d: string, n: number): string {
  const x = new Date(d + "T00:00:00Z");
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
}

function resolveRange(rangeParam: string, fromP?: string, toP?: string) {
  const today = todayIST();
  if (rangeParam === "custom") {
    return {
      from: fromP || addDays(today, -29),
      to: toP || today,
      preset: "custom" as Preset,
    };
  }
  if (rangeParam === "all") {
    return { from: "2000-01-01", to: today, preset: "all" as Preset };
  }
  const days = rangeParam === "7" ? 7 : rangeParam === "90" ? 90 : 30;
  const preset: Preset =
    rangeParam === "7" || rangeParam === "90" ? (rangeParam as Preset) : "30";
  return { from: addDays(today, -(days - 1)), to: today, preset };
}

function buildHref(
  branches: string[],
  preset: Preset,
  from: string,
  to: string,
) {
  const sp = new URLSearchParams();
  if (branches.length > 0 && branches.length < BRANCHES.length) {
    sp.set("branches", branches.join(","));
  }
  sp.set("range", preset);
  if (preset === "custom") {
    sp.set("from", from);
    sp.set("to", to);
  }
  return `/dashboard?${sp.toString()}`;
}

interface Row {
  sale_date: string;
  branch: string;
  summary_lines: Array<{ category: string; amount: number | string }>;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requested = String(params.branches ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((b) => (BRANCHES as readonly string[]).includes(b));
  // Effective selection: empty param means "all branches".
  const selected = requested.length > 0 ? requested : [...BRANCHES];
  const isSubset = selected.length < BRANCHES.length;
  const { from, to, preset } = resolveRange(
    String(params.range ?? "30"),
    params.from ? String(params.from) : undefined,
    params.to ? String(params.to) : undefined,
  );

  const supabase = await createClient();
  let query = supabase
    .from("daily_summaries")
    .select("sale_date, branch, summary_lines (category, amount)")
    .gte("sale_date", from)
    .lte("sale_date", to)
    .order("sale_date", { ascending: false });
  if (isSubset) query = query.in("branch", selected);
  const { data, error } = await query;

  // Pivot: sale_date -> category -> summed amount (across the filtered branches)
  const byDate = new Map<string, Record<Category, number>>();
  for (const row of (data ?? []) as Row[]) {
    if (!byDate.has(row.sale_date)) {
      const rec = {} as Record<Category, number>;
      for (const c of CATEGORIES) rec[c] = 0;
      byDate.set(row.sale_date, rec);
    }
    const rec = byDate.get(row.sale_date)!;
    for (const ln of row.summary_lines) {
      if ((CATEGORIES as readonly string[]).includes(ln.category)) {
        rec[ln.category as Category] += Number(ln.amount) || 0;
      }
    }
  }
  const dates = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a));

  const colTotals = {} as Record<Category, number>;
  for (const c of CATEGORIES) colTotals[c] = 0;
  for (const rec of byDate.values())
    for (const c of CATEGORIES) colTotals[c] += rec[c];
  const grandTotal = CATEGORIES.reduce((s, c) => s + colTotals[c], 0);

  const presets: Preset[] = ["7", "30", "90", "all"];
  const branchLabel = isSubset ? selected.join(", ") : "all branches";
  // The branches value to carry through range/date links (empty = all).
  const branchesForLinks = isSubset ? selected : [];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Daily sales by category. Showing {from} → {to} · {branchLabel}.
          </p>
        </div>
        <Link
          href="/upload"
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Upload new CSV
        </Link>
      </header>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Branch
          </span>
          <BranchMultiSelect selected={isSubset ? selected : []} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Range
          </span>
          {presets.map((p) => (
            <Link
              key={p}
              href={buildHref(branchesForLinks, p, from, to)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                p === preset
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {p === "all"
                ? "All time"
                : `Last ${p} days`}
            </Link>
          ))}
          <form
            method="GET"
            action="/dashboard"
            className="flex flex-wrap items-end gap-2"
          >
            {isSubset && (
              <input type="hidden" name="branches" value={selected.join(",")} />
            )}
            <input type="hidden" name="range" value="custom" />
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
            />
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
            />
            <button
              type="submit"
              className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs hover:bg-zinc-50"
            >
              Apply
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          Couldn&apos;t load data: {error.message}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-3 py-2 text-left font-medium">Date</th>
              {CATEGORIES.map((c) => (
                <th key={c} className="px-3 py-2 text-right font-medium">
                  {c}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {dates.length === 0 ? (
              <tr>
                <td
                  colSpan={CATEGORIES.length + 2}
                  className="px-3 py-12 text-center text-sm text-zinc-500"
                >
                  No data in this range.{" "}
                  <Link href="/upload" className="underline">
                    Upload a CSV
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              dates.map((d) => {
                const rec = byDate.get(d)!;
                const rowTotal = CATEGORIES.reduce((s, c) => s + rec[c], 0);
                return (
                  <tr
                    key={d}
                    className="border-b border-zinc-100 hover:bg-zinc-50"
                  >
                    <td className="whitespace-nowrap px-3 py-2 font-medium text-zinc-900">
                      {d}
                    </td>
                    {CATEGORIES.map((c) => (
                      <td
                        key={c}
                        className={`px-3 py-2 text-right tabular-nums ${
                          rec[c] === 0 ? "text-zinc-300" : "text-zinc-700"
                        }`}
                      >
                        {rec[c] === 0 ? "—" : inr0(rec[c])}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {inr0(rowTotal)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {dates.length > 0 && (
            <tfoot>
              <tr className="border-t border-zinc-300 bg-zinc-50 font-medium">
                <td className="px-3 py-2 text-left">Total</td>
                {CATEGORIES.map((c) => (
                  <td key={c} className="px-3 py-2 text-right tabular-nums">
                    {colTotals[c] === 0 ? "—" : inr0(colTotals[c])}
                  </td>
                ))}
                <td className="px-3 py-2 text-right tabular-nums">
                  {inr0(grandTotal)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
