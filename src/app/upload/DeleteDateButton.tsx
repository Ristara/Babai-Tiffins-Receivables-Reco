"use client";

import { useActionState } from "react";
import { deleteDate, type DeleteState } from "./actions";

const initialState: DeleteState = { kind: "idle" };

export function DeleteDateButton({ sale_date }: { sale_date: string }) {
  const [state, action, pending] = useActionState(deleteDate, initialState);

  const onClick = () => {
    const ok = window.confirm(
      `Delete ALL data for ${sale_date}?\n\nThis removes the dashboard totals, the upload history, and any PayTm settlement for this date. It cannot be undone.`,
    );
    if (!ok) return;
    const fd = new FormData();
    fd.set("sale_date", sale_date);
    action(fd);
  };

  return (
    <div className="mt-2 border-t border-zinc-100 pt-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete all data for this date"}
      </button>
      {state.kind === "error" && (
        <p className="mt-1 text-xs text-red-600">{state.message}</p>
      )}
    </div>
  );
}
