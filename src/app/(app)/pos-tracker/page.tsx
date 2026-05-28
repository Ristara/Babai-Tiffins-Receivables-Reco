import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, getAllowedBranches } from "@/lib/supabase/auth";
import { type Category } from "@/lib/categories";
import { PosCard, type Derived, type PosManual } from "./PosCard";

export const dynamic = "force-dynamic";

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

const EMPTY_MANUAL: PosManual = {
  magicpin: null,
  upi: null,
  edc_machine: null,
  wallet: null,
  bills_modified_orders: null,
  bills_modified_value: null,
  bills_reprinted_orders: null,
  bills_reprinted_value: null,
  cancelled_orders: null,
  cancelled_value: null,
  modified_kots_orders: null,
  modified_kots_value: null,
  opening_cash: null,
  cash_expenses: null,
  last_deposit_date: null,
  last_deposit_amount: null,
  shortage: null,
  closing_cash: null,
};

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
  const branch = ALLOWED.includes(branchParam)
    ? branchParam
    : (ALLOWED[0] ?? "");

  const supabase = await createClient();

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
    .select(
      "total_amount, total_orders, summary_lines (category, amount, order_count)",
    )
    .eq("branch", branch)
    .eq("sale_date", date)
    .maybeSingle();

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

  // Manual entries + lock state for this (date, branch).
  let manual: PosManual = EMPTY_MANUAL;
  let locked = false;
  if (branch && date) {
    const { data: pm } = await createAdminClient()
      .from("pos_manual")
      .select("*")
      .eq("branch", branch)
      .eq("sale_date", date)
      .maybeSingle();
    if (pm) {
      manual = { ...EMPTY_MANUAL, ...(pm as Partial<PosManual>) };
      locked = !!(pm as { locked?: boolean }).locked;
    }
  }

  const derived: Derived = {
    totalSales: Number(row?.total_amount) || 0,
    totalOrders: row?.total_orders || 0,
    swiggy: cat.Swiggy.amount,
    zomato: cat.Zomato.amount,
    ownly: cat.Ownly.amount,
    billingCounter: cat.Cash.amount + cat.PayTm.amount,
    cashSale: cat.Cash.amount,
    creditSale: cat.Ajantha.amount,
  };

  const hasData = !!row;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">POS Tracker</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Per-outlet daily operations card. Edit the manual cells inline and
          Save.
        </p>
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
        <form
          method="GET"
          action="/pos-tracker"
          className="flex items-center gap-2"
        >
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
          No sales data for {branch} on {fmtDate(date)} — derived figures will
          be ₹0. You can still record manual entries below.
        </div>
      )}

      {branch ? (
        <PosCard
          sale_date={date}
          dateLabel={fmtDate(date)}
          branch={branch}
          derived={derived}
          manual={manual}
          locked={locked}
          isAdmin={me.role === "admin"}
        />
      ) : (
        <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You don&apos;t have access to any outlet yet. Ask an admin to assign
          one.
        </div>
      )}
    </div>
  );
}
