import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getAllowedBranches } from "@/lib/supabase/auth";
import { type Category } from "@/lib/categories";

export const dynamic = "force-dynamic";

const DASH = "—";

const inr0 = (n: number) => Math.round(n).toLocaleString("en-IN");

function fmtDate(d: string): string {
  return new Date(d + "T00:00:00+05:30").toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface Line {
  category: string;
  amount: number | string;
  order_count: number;
}

export default async function PosTrackerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const ALLOWED = await getAllowedBranches(me);

  const params = await searchParams;
  const branchParam = String(params.branch ?? "");
  // Only allow an outlet the user can access; otherwise default to the first.
  const branch = ALLOWED.includes(branchParam)
    ? branchParam
    : (ALLOWED[0] ?? "");

  const supabase = await createClient();

  // Resolve the date: use ?date=, else the latest date that has data.
  let date = params.date ? String(params.date) : "";
  if (!date) {
    const { data: latest } = await supabase
      .from("daily_summaries")
      .select("sale_date")
      .order("sale_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    date = latest?.sale_date ?? new Date().toISOString().slice(0, 10);
  }

  const { data: row } = await supabase
    .from("daily_summaries")
    .select("total_amount, total_orders, summary_lines (category, amount, order_count)")
    .eq("branch", branch)
    .eq("sale_date", date)
    .maybeSingle();

  // Category lookups from what we currently store (the 9-category model).
  const cat: Record<Category, { amount: number; orders: number }> = {
    Cash: { amount: 0, orders: 0 },
    PayTm: { amount: 0, orders: 0 },
    Zomato: { amount: 0, orders: 0 },
    Swiggy: { amount: 0, orders: 0 },
    Ownly: { amount: 0, orders: 0 },
    Ajantha: { amount: 0, orders: 0 },
    ODC: { amount: 0, orders: 0 },
    EnoPay: { amount: 0, orders: 0 },
    Shubha: { amount: 0, orders: 0 },
  };
  for (const ln of (row?.summary_lines ?? []) as Line[]) {
    if (ln.category in cat) {
      cat[ln.category as Category] = {
        amount: Number(ln.amount) || 0,
        orders: ln.order_count || 0,
      };
    }
  }

  const totalSales = Number(row?.total_amount) || 0;
  const totalOrders = row?.total_orders || 0;
  const billingCounter = cat.Cash.amount + cat.PayTm.amount;

  // Sales Details — derived where possible. Magicpin not yet stored.
  const salesRows: Array<{ label: string; value: string }> = [
    { label: "Swiggy", value: inr0(cat.Swiggy.amount) },
    { label: "Zomato", value: inr0(cat.Zomato.amount) },
    { label: "Magicpin", value: DASH },
    { label: "Ownly", value: inr0(cat.Ownly.amount) },
    { label: "Billing Counter", value: inr0(billingCounter) },
  ];

  // Settlement Details — Cash + Credit derivable; UPI/EDC/Wallet need the
  // payment-mode split that the current storage collapses into "PayTm".
  const settlementRows: Array<{ label: string; value: string }> = [
    { label: "UPI", value: DASH },
    { label: "EDC Machine", value: DASH },
    { label: "Credit Sale", value: inr0(cat.Ajantha.amount) },
    { label: "Wallet", value: DASH },
    { label: "Cash Sale", value: inr0(cat.Cash.amount) },
  ];

  // Billing Details + Cash management — manual entry (not in the order CSV).
  const billingRows: Array<{ label: string; orders: string; value: string }> = [
    { label: "Bills Modified", orders: DASH, value: DASH },
    { label: "Bills Re-Printed", orders: DASH, value: DASH },
    { label: "Cancelled", orders: DASH, value: DASH },
    { label: "Modified KOTs", orders: DASH, value: DASH },
  ];
  const cashRows: Array<{ label: string; value: string }> = [
    { label: "Opening Cash", value: DASH },
    { label: "Cash Expenses", value: DASH },
    { label: "Last Cash Deposit Date", value: DASH },
    { label: "Last Cash Deposit Amount", value: DASH },
    { label: "Shortage", value: DASH },
    { label: "Closing Cash", value: DASH },
  ];

  const hasData = !!row;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">POS Tracker</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Per-outlet daily operations card.
          </p>
        </div>
      </header>

      {/* Selectors */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Outlet
        </span>
        {ALLOWED.map((b) => (
          <Link
            key={b}
            href={`/pos-tracker?branch=${b}&date=${date}`}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              b === branch
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {b}
          </Link>
        ))}
        <form method="GET" action="/pos-tracker" className="flex items-center gap-2">
          <input type="hidden" name="branch" value={branch} />
          <input
            type="date"
            name="date"
            defaultValue={date}
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
          />
          <button
            type="submit"
            className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs hover:bg-zinc-50"
          >
            Go
          </button>
        </form>
      </div>

      {!hasData && (
        <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No data for {branch} on {date}. Upload that day&apos;s CSV first.
        </div>
      )}

      {/* The card */}
      <div className="overflow-hidden rounded-lg border border-zinc-300">
        {/* Header strip */}
        <div className="grid grid-cols-2 divide-x divide-zinc-200 border-b border-zinc-200">
          <div className="grid grid-cols-2 divide-y divide-zinc-200">
            <div className="flex items-center justify-between bg-blue-50 px-4 py-2 text-sm font-semibold">
              <span>Outlet</span>
              <span>{branch}</span>
            </div>
            <div className="flex items-center justify-between bg-blue-50 px-4 py-2 text-sm font-semibold">
              <span>Date</span>
              <span>{fmtDate(date)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-y divide-zinc-200">
            <div className="flex items-center justify-between px-4 py-2 text-sm">
              <span className="font-semibold">Total Sales</span>
              <span className="font-semibold tabular-nums">
                {inr0(totalSales)}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-2 text-sm">
              <span className="font-semibold">Total Orders</span>
              <span className="font-semibold tabular-nums">{totalOrders}</span>
            </div>
          </div>
        </div>

        {/* Sales + Billing */}
        <div className="grid grid-cols-2 divide-x divide-zinc-200 border-b border-zinc-200">
          <div>
            <div className="bg-blue-100 px-4 py-2 text-sm font-semibold">
              Sales Details
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs text-zinc-500">
                  <th className="px-4 py-1.5 text-left font-medium">
                    Sales Channel
                  </th>
                  <th className="px-4 py-1.5 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {salesRows.map((r) => (
                  <tr key={r.label} className="border-b border-zinc-100">
                    <td className="px-4 py-1.5">{r.label}</td>
                    <td className="px-4 py-1.5 text-right tabular-nums">
                      {r.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div className="bg-emerald-100 px-4 py-2 text-sm font-semibold">
              Billing Details
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs text-zinc-500">
                  <th className="px-4 py-1.5 text-left font-medium">Details</th>
                  <th className="px-4 py-1.5 text-right font-medium">Orders</th>
                  <th className="px-4 py-1.5 text-right font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {billingRows.map((r) => (
                  <tr key={r.label} className="border-b border-zinc-100">
                    <td className="px-4 py-1.5">{r.label}</td>
                    <td className="px-4 py-1.5 text-right tabular-nums text-zinc-400">
                      {r.orders}
                    </td>
                    <td className="px-4 py-1.5 text-right tabular-nums text-zinc-400">
                      {r.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Settlement + Cash management */}
        <div>
          <div className="bg-orange-200 px-4 py-2 text-sm font-semibold">
            Settlement Details
          </div>
          <div className="grid grid-cols-2 divide-x divide-zinc-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs text-zinc-500">
                  <th className="px-4 py-1.5 text-left font-medium">
                    Payment Channel
                  </th>
                  <th className="px-4 py-1.5 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {settlementRows.map((r) => (
                  <tr key={r.label} className="border-b border-zinc-100">
                    <td className="px-4 py-1.5">{r.label}</td>
                    <td className="px-4 py-1.5 text-right tabular-nums">
                      {r.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="w-full text-sm">
              <tbody>
                {cashRows.map((r) => (
                  <tr
                    key={r.label}
                    className={`border-b border-zinc-100 ${
                      r.label === "Closing Cash" ? "font-semibold" : ""
                    }`}
                  >
                    <td className="px-4 py-1.5">{r.label}</td>
                    <td className="px-4 py-1.5 text-right tabular-nums text-zinc-400">
                      {r.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Cells showing <span className="font-medium">{DASH}</span> need your
        number logic (payment-mode split for UPI / EDC / Wallet, billing-ops
        counts, and cash management). Send the rules and I&apos;ll wire them up.
      </p>
    </div>
  );
}
