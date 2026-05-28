"use client";

import { useActionState } from "react";
import { fetchPaytmSettlement, type PaytmFetchState } from "./paytm-actions";
import { findPaytmAccount, type PaytmCategory } from "@/lib/paytm-config";

const initialState: PaytmFetchState = { kind: "idle" };

const inr = (n: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

interface Props {
  sale_date: string;
  branch: string;
  category: PaytmCategory;
  petpoojaAmount: number;
  settledAmount: number | null;
}

export function PaytmReconcileCell({
  sale_date,
  branch,
  category,
  petpoojaAmount,
  settledAmount,
}: Props) {
  const [state, action, pending] = useActionState(
    fetchPaytmSettlement,
    initialState,
  );

  // No PayTm account for this branch+category (e.g. JPN has no ODC).
  if (!findPaytmAccount(branch, category)) {
    return <span className="text-xs text-zinc-300">—</span>;
  }

  const settled =
    state.kind === "success" ? state.settled_amount : settledAmount;
  const diff =
    settled === null ? null : Math.round((settled - petpoojaAmount) * 100) / 100;

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="branch" value={branch} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="sale_date" value={sale_date} />

      {settled !== null && (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="tabular-nums text-zinc-700">₹{inr(settled)}</span>
          {diff !== null && <DiffBadge diff={diff} base={petpoojaAmount} />}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded border border-zinc-300 bg-white px-2 py-0.5 text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
      >
        {pending ? "Fetching…" : settled === null ? "Fetch PayTm" : "Refresh"}
      </button>

      {state.kind === "error" && (
        <p className="max-w-[26ch] text-right text-xs text-red-600">
          {state.message}
        </p>
      )}
    </form>
  );
}

function DiffBadge({ diff, base }: { diff: number; base: number }) {
  const abs = Math.abs(diff);
  if (abs < 1) {
    return (
      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800">
        ✓ matched
      </span>
    );
  }
  const pct = base > 0 ? abs / base : 1;
  const cls =
    pct <= 0.01
      ? "bg-amber-100 text-amber-800"
      : "bg-red-100 text-red-800";
  const sign = diff > 0 ? "+" : "−";
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${cls}`}>
      {sign}₹{inr(abs)}
    </span>
  );
}
