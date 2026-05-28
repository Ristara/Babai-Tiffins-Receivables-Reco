"use client";

import { useActionState } from "react";
import { setLock, type LockState } from "./actions";

const initial: LockState = { kind: "idle" };

export function LockButton({
  sale_date,
  branch,
  locked,
  isAdmin,
}: {
  sale_date: string;
  branch: string;
  locked: boolean;
  isAdmin: boolean;
}) {
  const [state, action, pending] = useActionState(setLock, initial);

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          locked
            ? "bg-red-100 text-red-700"
            : "bg-emerald-100 text-emerald-800"
        }`}
      >
        {locked ? "🔒 Locked" : "Unlocked"}
      </span>
      {isAdmin && (
        <form action={action}>
          <input type="hidden" name="sale_date" value={sale_date} />
          <input type="hidden" name="branch" value={branch} />
          <input type="hidden" name="locked" value={(!locked).toString()} />
          <button
            type="submit"
            disabled={pending}
            className={`rounded-md px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
              locked
                ? "bg-zinc-900 text-white hover:bg-zinc-800"
                : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {pending ? "…" : locked ? "Unlock" : "Lock"}
          </button>
        </form>
      )}
      {state.kind === "error" && (
        <span className="text-xs text-red-600">{state.message}</span>
      )}
    </div>
  );
}
