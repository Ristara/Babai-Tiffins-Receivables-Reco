import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, type Category } from "@/lib/categories";
import {
  DayBlock,
  type BranchCard,
  type DayCard,
} from "@/components/day-summary";

// Always read fresh data — uploads happen ad-hoc, no caching benefit.
export const dynamic = "force-dynamic";

interface SummaryRow {
  id: string;
  sale_date: string;
  branch: string;
  status: string;
  total_amount: number | string;
  total_orders: number;
  summary_lines: Array<{
    category: string;
    amount: number | string;
    order_count: number;
  }>;
}

function emptyByCategory(): Record<
  Category,
  { amount: number; order_count: number }
> {
  const out = {} as Record<Category, { amount: number; order_count: number }>;
  for (const c of CATEGORIES) out[c] = { amount: 0, order_count: 0 };
  return out;
}

function toBranchCard(row: SummaryRow): BranchCard {
  const by = emptyByCategory();
  for (const ln of row.summary_lines) {
    if ((CATEGORIES as readonly string[]).includes(ln.category)) {
      by[ln.category as Category] = {
        amount: Number(ln.amount) || 0,
        order_count: ln.order_count,
      };
    }
  }
  return {
    branch: row.branch,
    status: row.status,
    total_amount: Number(row.total_amount) || 0,
    total_orders: row.total_orders,
    by_category: by,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_summaries")
    .select(
      "id, sale_date, branch, status, total_amount, total_orders, summary_lines (category, amount, order_count)",
    )
    .order("sale_date", { ascending: false })
    .order("branch", { ascending: true });

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 p-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-sm text-zinc-500 hover:text-zinc-900"
            >
              ← Home
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              All daily sales summaries, latest first.
            </p>
          </div>
          <Link
            href="/upload"
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Upload new CSV
          </Link>
        </header>

        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            Couldn&apos;t load summaries: {error.message}
          </div>
        )}

        {!error &&
          (() => {
            const days = new Map<string, DayCard>();
            for (const row of (data ?? []) as SummaryRow[]) {
              if (!days.has(row.sale_date)) {
                days.set(row.sale_date, {
                  sale_date: row.sale_date,
                  branches: [],
                });
              }
              days.get(row.sale_date)!.branches.push(toBranchCard(row));
            }
            const list = Array.from(days.values()).sort((a, b) =>
              b.sale_date.localeCompare(a.sale_date),
            );

            if (list.length === 0) {
              return (
                <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center text-sm text-zinc-500">
                  No summaries yet. Head to the{" "}
                  <Link href="/upload" className="underline">
                    Upload page
                  </Link>{" "}
                  to add one.
                </div>
              );
            }

            return (
              <div className="space-y-6">
                {list.map((day) => (
                  <DayBlock key={day.sale_date} day={day} />
                ))}
              </div>
            );
          })()}
      </div>
    </main>
  );
}
