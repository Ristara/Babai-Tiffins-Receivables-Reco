"use client";

import { useActionState } from "react";
import { savePosManual, type SaveState } from "./actions";

const initial: SaveState = { kind: "idle" };

export interface PosManual {
  magicpin: number | null;
  upi: number | null;
  edc_machine: number | null;
  wallet: number | null;
  bills_modified_orders: number | null;
  bills_modified_value: number | null;
  bills_reprinted_orders: number | null;
  bills_reprinted_value: number | null;
  cancelled_orders: number | null;
  cancelled_value: number | null;
  modified_kots_orders: number | null;
  modified_kots_value: number | null;
  opening_cash: number | null;
  cash_expenses: number | null;
  last_deposit_date: string | null;
  last_deposit_amount: number | null;
  shortage: number | null;
  closing_cash: number | null;
}

const v = (n: number | null | undefined) => (n == null ? "" : String(n));

function NumField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: number | null;
}) {
  return (
    <label className="flex flex-col text-xs text-zinc-600">
      <span className="mb-1 font-medium">{label}</span>
      <input
        type="number"
        step="0.01"
        name={name}
        defaultValue={v(defaultValue)}
        className="w-32 rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
      />
    </label>
  );
}

export function PosManualForm({
  sale_date,
  branch,
  data,
  locked = false,
}: {
  sale_date: string;
  branch: string;
  data: PosManual;
  locked?: boolean;
}) {
  const [state, action, pending] = useActionState(savePosManual, initial);

  return (
    <form
      action={action}
      className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6"
    >
      <input type="hidden" name="sale_date" value={sale_date} />
      <input type="hidden" name="branch" value={branch} />

      {locked && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          🔒 This day is locked. An admin must unlock it before anyone can edit.
        </p>
      )}

      <fieldset disabled={locked} className="space-y-6 disabled:opacity-60">
      <div>
        <h3 className="mb-2 text-sm font-semibold">Settlement split</h3>
        <div className="flex flex-wrap gap-4">
          <NumField name="magicpin" label="Magicpin" defaultValue={data.magicpin} />
          <NumField name="upi" label="UPI" defaultValue={data.upi} />
          <NumField name="edc_machine" label="EDC Machine" defaultValue={data.edc_machine} />
          <NumField name="wallet" label="Wallet" defaultValue={data.wallet} />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Billing details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex gap-3">
            <NumField name="bills_modified_orders" label="Bills Modified — orders" defaultValue={data.bills_modified_orders} />
            <NumField name="bills_modified_value" label="value" defaultValue={data.bills_modified_value} />
          </div>
          <div className="flex gap-3">
            <NumField name="bills_reprinted_orders" label="Bills Re-Printed — orders" defaultValue={data.bills_reprinted_orders} />
            <NumField name="bills_reprinted_value" label="value" defaultValue={data.bills_reprinted_value} />
          </div>
          <div className="flex gap-3">
            <NumField name="cancelled_orders" label="Cancelled — orders" defaultValue={data.cancelled_orders} />
            <NumField name="cancelled_value" label="value" defaultValue={data.cancelled_value} />
          </div>
          <div className="flex gap-3">
            <NumField name="modified_kots_orders" label="Modified KOTs — orders" defaultValue={data.modified_kots_orders} />
            <NumField name="modified_kots_value" label="value" defaultValue={data.modified_kots_value} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Cash management</h3>
        <div className="flex flex-wrap gap-4">
          <NumField name="opening_cash" label="Opening Cash" defaultValue={data.opening_cash} />
          <NumField name="cash_expenses" label="Cash Expenses" defaultValue={data.cash_expenses} />
          <label className="flex flex-col text-xs text-zinc-600">
            <span className="mb-1 font-medium">Last Cash Deposit Date</span>
            <input
              type="date"
              name="last_deposit_date"
              defaultValue={data.last_deposit_date ?? ""}
              className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </label>
          <NumField name="last_deposit_amount" label="Last Cash Deposit Amount" defaultValue={data.last_deposit_amount} />
          <NumField name="shortage" label="Shortage" defaultValue={data.shortage} />
          <NumField name="closing_cash" label="Closing Cash" defaultValue={data.closing_cash} />
        </div>
      </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || locked}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save entries"}
        </button>
        {state.kind === "error" && (
          <p className="text-xs text-red-600">{state.message}</p>
        )}
        {state.kind === "success" && (
          <p className="text-xs text-emerald-700">Saved ✓</p>
        )}
      </div>
    </form>
  );
}
