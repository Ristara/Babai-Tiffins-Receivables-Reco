"use client";

import { useActionState } from "react";
import { CATEGORIES, SETTLEMENT, type Category } from "@/lib/categories";
import type {
  BranchSummary,
  DaySummary,
  ParseResult,
} from "@/lib/parse-csv";
import { uploadCsv, type UploadState } from "./actions";

const initialState: UploadState = { kind: "idle" };

const inr = (n: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function UploadForm() {
  const [state, action, pending] = useActionState(uploadCsv, initialState);

  return (
    <div className="space-y-8">
      <form
        action={action}
        className="rounded-lg border border-zinc-200 bg-white p-6"
      >
        <label className="block">
          <span className="block text-sm font-medium text-zinc-800">
            Petpooja CSV file
          </span>
          <input
            type="file"
            name="csv"
            accept=".csv,text/csv"
            required
            disabled={pending}
            className="mt-2 block w-full text-sm text-zinc-700 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-zinc-200 disabled:opacity-50"
          />
        </label>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Parsing & saving…" : "Upload & parse"}
          </button>
          {pending && (
            <span className="text-sm text-zinc-500">
              This can take a few seconds for a full day&apos;s file.
            </span>
          )}
        </div>
        {state.kind === "error" && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.message}
          </p>
        )}
      </form>

      {state.kind === "success" && (
        <ResultPanel result={state.result} filename={state.filename} />
      )}
    </div>
  );
}

function ResultPanel({
  result,
  filename,
}: {
  result: ParseResult;
  filename: string;
}) {
  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <p>
          <strong>Saved.</strong> File: <code>{filename}</code> · Rows parsed:{" "}
          {result.rows_total} · Success: {result.rows_success} · Cancelled:{" "}
          {result.rows_cancelled} · Unclassified: {result.rows_unclassified}
        </p>
      </div>
      {result.days.map((day) => (
        <DayBlock key={day.sale_date} day={day} />
      ))}
    </section>
  );
}

function DayBlock({ day }: { day: DaySummary }) {
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
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
            disabled
            title="Coming next: marks this day as validated"
          >
            Mark validated
          </button>
          <button
            type="button"
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white opacity-40"
            disabled
            title="Phase 2 — Zoho Invoice integration coming soon"
          >
            Post to Zoho
          </button>
        </div>
      </header>
      <div className="mt-6 space-y-6">
        {day.branches.map((b) => (
          <BranchTable key={b.branch} branch={b} />
        ))}
      </div>
    </article>
  );
}

function BranchTable({ branch }: { branch: BranchSummary }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-700">
        {branch.branch}{" "}
        <span className="ml-2 text-xs font-normal text-zinc-500">
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
            const c = branch.by_category[cat];
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
