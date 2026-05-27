"use client";

import Link from "next/link";
import { useActionState } from "react";
import { uploadCsv, type UploadState } from "./actions";

const initialState: UploadState = { kind: "idle" };

export function UploadForm() {
  const [state, action, pending] = useActionState(uploadCsv, initialState);

  return (
    <form
      action={action}
      className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6"
    >
      <div>
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
      </div>
      <div className="flex items-center gap-3">
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
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      )}

      {state.kind === "success" && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <strong>Saved.</strong> {state.result.rows_success} order rows from{" "}
          <code className="rounded bg-emerald-100 px-1 py-0.5 text-xs">
            {state.filename}
          </code>{" "}
          {state.result.days.length === 1
            ? `for ${state.result.days[0].sale_date}`
            : `across ${state.result.days.length} dates`}
          .{" "}
          <Link
            href="/dashboard"
            className="font-medium underline underline-offset-2"
          >
            View on Dashboard →
          </Link>
        </div>
      )}
    </form>
  );
}
