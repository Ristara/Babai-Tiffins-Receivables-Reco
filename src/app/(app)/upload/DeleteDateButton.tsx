"use client";

import { useActionState } from "react";
import { deleteDate, type DeleteState } from "./actions";

const initialState: DeleteState = { kind: "idle" };

export function DeleteDateButton({ sale_date }: { sale_date: string }) {
  const [state, action, pending] = useActionState(deleteDate, initialState);

  const onClick = () => {
    const ok = window.confirm(
      `Delete ALL data for ${sale_date}?\n\nThis removes the dashboard totals and the upload history for this date. It cannot be undone.`,
    );
    if (!ok) return;
    const fd = new FormData();
    fd.set("sale_date", sale_date);
    action(fd);
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {state.kind === "error" && (
        <p className="max-w-[26ch] text-xs text-red-600">{state.message}</p>
      )}
    </div>
  );
}
