"use client";

import { useActionState, useRef } from "react";
import { uploadCsvForDate, type UploadState } from "./actions";

const initialState: UploadState = { kind: "idle" };

interface Props {
  sale_date: string;
  hasUpload: boolean;
}

export function RowUploadButton({ sale_date, hasUpload }: Props) {
  const [state, action, pending] = useActionState(
    uploadCsvForDate,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const label = pending
    ? "Uploading…"
    : hasUpload
      ? "Replace upload"
      : "Upload";

  return (
    <form ref={formRef} action={action} className="space-y-1">
      <input type="hidden" name="expected_date" value={sale_date} />
      <input
        ref={fileRef}
        type="file"
        name="csv"
        accept=".csv,text/csv"
        className="hidden"
        onChange={() => {
          if (fileRef.current?.files?.[0]) {
            formRef.current?.requestSubmit();
          }
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={pending}
        className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
          hasUpload
            ? "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            : "bg-zinc-900 text-white hover:bg-zinc-800"
        }`}
      >
        {label}
      </button>
      {state.kind === "error" && (
        <p className="max-w-[28ch] text-xs text-red-600">{state.message}</p>
      )}
      {state.kind === "success" && state.sale_date === sale_date && (
        <p className="text-xs text-emerald-700">Saved ✓</p>
      )}
    </form>
  );
}
