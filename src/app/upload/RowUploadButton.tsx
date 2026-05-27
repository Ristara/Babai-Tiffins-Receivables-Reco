"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
  const [warningDismissed, setWarningDismissed] = useState(false);

  // A fresh state object means a new submission completed — re-open the
  // warning modal if this submission produced one.
  useEffect(() => {
    setWarningDismissed(false);
  }, [state]);

  const showWarning =
    state.kind === "success" &&
    state.sale_date === sale_date &&
    !!state.warning &&
    !warningDismissed;

  const label = pending
    ? "Uploading…"
    : hasUpload
      ? "Replace upload"
      : "Upload";

  return (
    <>
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
        {state.kind === "success" &&
          state.sale_date === sale_date &&
          !state.warning && (
            <p className="text-xs text-emerald-700">Saved ✓</p>
          )}
        {state.kind === "success" &&
          state.sale_date === sale_date &&
          state.warning && (
            <p className="text-xs text-amber-700">Saved with warning</p>
          )}
      </form>

      {showWarning && state.kind === "success" && state.warning && (
        <WarningModal
          sale_date={state.sale_date}
          filename={state.filename}
          orders_saved={state.orders_saved}
          warning={state.warning}
          onClose={() => setWarningDismissed(true)}
        />
      )}
    </>
  );
}

function WarningModal({
  sale_date,
  filename,
  orders_saved,
  warning,
  onClose,
}: {
  sale_date: string;
  filename: string;
  orders_saved: number;
  warning: { skipped_dates: string[]; skipped_orders: number };
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <div
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700"
          >
            !
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-zinc-900">
              Saved with a warning
            </h3>
            <p className="mt-2 text-sm text-zinc-700">
              Saved <strong>{orders_saved.toLocaleString("en-IN")}</strong>{" "}
              orders for <strong>{sale_date}</strong>.
            </p>
            <p className="mt-2 text-sm text-zinc-700">
              The file also contained{" "}
              <strong>{warning.skipped_orders.toLocaleString("en-IN")}</strong>{" "}
              orders for{" "}
              <strong>{warning.skipped_dates.join(", ")}</strong> — those were
              <strong> ignored</strong>. To save them, click{" "}
              <em>Upload</em> on that date&apos;s row.
            </p>
            <p
              className="mt-3 truncate font-mono text-xs text-zinc-500"
              title={filename}
            >
              {filename}
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
