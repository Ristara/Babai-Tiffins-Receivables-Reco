"use client";

import { useActionState } from "react";
import { createBranch, type ActionState } from "./actions";

const initial: ActionState = { kind: "idle" };

export function CreateBranchForm() {
  const [state, action, pending] = useActionState(createBranch, initial);
  return (
    <form
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4"
    >
      <label className="flex flex-col text-xs text-zinc-600">
        <span className="mb-1 font-medium">Code</span>
        <input
          name="code"
          required
          placeholder="HSR"
          className="w-28 rounded-md border border-zinc-300 px-2 py-1.5 text-sm uppercase"
        />
      </label>
      <label className="flex flex-col text-xs text-zinc-600">
        <span className="mb-1 font-medium">Name</span>
        <input
          name="name"
          required
          placeholder="Babai Tiffins HSR"
          className="w-64 rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add branch"}
      </button>
      {state.kind === "error" && (
        <p className="w-full text-xs text-red-600">{state.message}</p>
      )}
      {state.kind === "success" && (
        <p className="w-full text-xs text-emerald-700">{state.message}</p>
      )}
    </form>
  );
}
