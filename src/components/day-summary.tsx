import { CATEGORIES, SETTLEMENT, type Category } from "@/lib/categories";

const inr = (n: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export interface BranchCard {
  branch: string;
  status?: string;
  total_amount: number;
  total_orders: number;
  by_category: Record<Category, { amount: number; order_count: number }>;
}

export interface DayCard {
  sale_date: string;
  branches: BranchCard[];
}

export function DayBlock({
  day,
  actions,
}: {
  day: DayCard;
  actions?: React.ReactNode;
}) {
  const dayTotal = day.branches.reduce((s, b) => s + b.total_amount, 0);
  const dayOrders = day.branches.reduce((s, b) => s + b.total_orders, 0);
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{day.sale_date}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {day.branches.length} branch
            {day.branches.length === 1 ? "" : "es"} · {dayOrders} orders · ₹
            {inr(dayTotal)}
          </p>
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </header>
      <div className="mt-6 space-y-6">
        {day.branches.map((b) => (
          <BranchTable key={b.branch} branch={b} />
        ))}
      </div>
    </article>
  );
}

export function BranchTable({ branch }: { branch: BranchCard }) {
  return (
    <div>
      <h3 className="flex flex-wrap items-center gap-2 text-sm font-medium text-zinc-700">
        <span>{branch.branch}</span>
        {branch.status && <StatusBadge status={branch.status} />}
        <span className="text-xs font-normal text-zinc-500">
          {branch.total_orders} orders · ₹{inr(branch.total_amount)}
        </span>
      </h3>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500">
            <th className="py-2 font-medium">Category</th>
            <th className="py-2 text-right font-medium">Orders</th>
            <th className="py-2 text-right font-medium">Amount (₹)</th>
            <th className="py-2 pl-4 font-medium">Settlement</th>
          </tr>
        </thead>
        <tbody>
          {CATEGORIES.map((cat: Category) => {
            const c = branch.by_category[cat] ?? {
              amount: 0,
              order_count: 0,
            };
            const isZero = c.order_count === 0;
            return (
              <tr
                key={cat}
                className={`border-b border-zinc-100 ${isZero ? "text-zinc-400" : ""}`}
              >
                <td className="py-2">{cat}</td>
                <td className="py-2 text-right tabular-nums">
                  {c.order_count}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {inr(c.amount)}
                </td>
                <td className="py-2 pl-4 text-xs">{SETTLEMENT[cat]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    parsed: "bg-zinc-100 text-zinc-700",
    validated: "bg-amber-100 text-amber-800",
    posted: "bg-emerald-100 text-emerald-800",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-zinc-100 text-zinc-700"
      }`}
    >
      {status}
    </span>
  );
}
