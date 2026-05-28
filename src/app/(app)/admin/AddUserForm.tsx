"use client";

import { useActionState } from "react";
import { addUser, type ActionState } from "./actions";

const initial: ActionState = { kind: "idle" };

export function AddUserForm({ branches }: { branches: { code: string; name: string }[] }) {
  const [state, action, pending] = useActionState(addUser, initial);
  return (
    <form
      action={action}
      className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4"
    >
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col text-xs text-zinc-600">
          <span className="mb-1 font-medium">Email</span>
          <input
            type="email"
            name="email"
            required
            className="w-64 rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col text-xs text-zinc-600">
          <span className="mb-1 font-medium">Password (6+ chars)</span>
          <input
            type="text"
            name="password"
            required
            minLength={6}
            className="w-48 rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col text-xs text-zinc-600">
          <span className="mb-1 font-medium">Role</span>
          <select
            name="role"
            defaultValue="staff"
            className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
          >
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </label>
      </div>

      <fieldset>
        <legend className="mb-1 text-xs font-medium text-zinc-600">
          Branch access
        </legend>
        <div className="flex flex-wrap gap-3">
          {branches.length === 0 && (
            <span className="text-xs text-zinc-400">
              No branches yet — add one above first.
            </span>
          )}
          {branches.map((b) => (
            <label
              key={b.code}
              className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2 py-1 text-sm"
            >
              <input
                type="checkbox"
                name="branches"
                value={b.code}
                className="h-4 w-4 rounded border-zinc-300"
              />
              {b.code}
            </label>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-zinc-400">
          Admins see all branches regardless of ticks.
        </p>
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Add user"}
        </button>
        {state.kind === "error" && (
          <p className="text-xs text-red-600">{state.message}</p>
        )}
        {state.kind === "success" && (
          <p className="text-xs text-emerald-700">{state.message}</p>
        )}
      </div>
    </form>
  );
}
