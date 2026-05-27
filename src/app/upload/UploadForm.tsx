"use client";

import { useActionState } from "react";
import type { ParseResult } from "@/lib/parse-csv";
import { DayBlock, type DayCard } from "@/components/day-summary";
import { uploadCsv, type UploadState } from "./actions";

const initialState: UploadState = { kind: "idle" };

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
        <DayBlock
          key={day.sale_date}
          day={day as DayCard}
          actions={
            <>
              <button
                type="button"
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
                disabled
                title="Coming next"
              >
                Mark validated
              </button>
              <button
                type="button"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white opacity-40"
                disabled
                title="Phase 2 — Zoho Invoice integration"
              >
                Post to Zoho
              </button>
            </>
          }
        />
      ))}
    </section>
  );
}
