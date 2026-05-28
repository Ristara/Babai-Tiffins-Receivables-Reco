"use client";

import { useActionState } from "react";
import { savePosManual, type SaveState } from "./actions";
import { LockButton } from "./LockButton";

export interface PosManual {
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

const initial: SaveState = { kind: "idle" };
const DASH = "—";
const inr0 = (n: number) => Math.round(n).toLocaleString("en-IN");

// Display a stored number with Indian commas (empty for null).
const fmtDisplay = (n: number | null | undefined) =>
  n == null ? "" : n.toLocaleString("en-IN");

// Re-format whatever the user typed into Indian commas (called on blur).
function fmtIN(raw: string): string {
  const cleaned = raw.replace(/,/g, "").trim();
  if (cleaned === "") return "";
  const neg = cleaned.startsWith("-");
  const body = neg ? cleaned.slice(1) : cleaned;
  if (!/^\d*\.?\d*$/.test(body)) return raw; // leave non-numeric as-is
  const [intPart, decPart] = body.split(".");
  const formatted = Number(intPart || "0").toLocaleString("en-IN");
  return (neg ? "-" : "") + formatted + (decPart !== undefined ? "." + decPart : "");
}

const onBlurFormat = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.value = fmtIN(e.target.value);
};

const cellClass =
  "w-28 rounded border border-zinc-200 bg-white px-2 py-1 text-right text-sm focus:border-zinc-500 focus:outline-none disabled:border-transparent disabled:bg-transparent disabled:px-0";

export interface Derived {
  totalSales: number;
  totalOrders: number;
  swiggy: number;
  zomato: number;
  magicpin: number;
  ownly: number;
  billingCounter: number;
  cashSale: number;
  creditSale: number;
}


function NumCell({
  name,
  value,
}: {
  name: string;
  value: number | null;
}) {
  return (
    <input
      type="text"
      inputMode="decimal"
      name={name}
      defaultValue={fmtDisplay(value)}
      onBlur={onBlurFormat}
      placeholder={DASH}
      className={cellClass}
    />
  );
}

export function PosCard({
  sale_date,
  dateLabel,
  branch,
  derived,
  manual,
  locked,
  isAdmin,
}: {
  sale_date: string;
  dateLabel: string;
  branch: string;
  derived: Derived;
  manual: PosManual;
  locked: boolean;
  isAdmin: boolean;
}) {
  const [state, action, pending] = useActionState(savePosManual, initial);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-300">
      {/* Lock bar (top-right) — separate form from the editable body */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-2">
        <span className="text-xs text-zinc-500">
          Edit the highlighted cells, then Save.
        </span>
        <LockButton
          sale_date={sale_date}
          branch={branch}
          locked={locked}
          isAdmin={isAdmin}
        />
      </div>

      <form action={action}>
        <input type="hidden" name="sale_date" value={sale_date} />
        <input type="hidden" name="branch" value={branch} />

        <fieldset disabled={locked}>
          {/* Header strip */}
          <div className="grid grid-cols-2 divide-x divide-zinc-200 border-b border-zinc-200">
            <div className="grid grid-cols-2 divide-y divide-zinc-200">
              <div className="flex items-center justify-between bg-blue-50 px-4 py-2 text-sm font-semibold">
                <span>Outlet</span>
                <span>{branch}</span>
              </div>
              <div className="flex items-center justify-between bg-blue-50 px-4 py-2 text-sm font-semibold">
                <span>Date</span>
                <span>{dateLabel}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-y divide-zinc-200">
              <div className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="font-semibold">Total Sales</span>
                <span className="font-semibold tabular-nums">
                  {inr0(derived.totalSales)}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="font-semibold">Total Orders</span>
                <span className="font-semibold tabular-nums">
                  {derived.totalOrders}
                </span>
              </div>
            </div>
          </div>

          {/* Sales + Billing */}
          <div className="grid grid-cols-2 divide-x divide-zinc-200 border-b border-zinc-200">
            <div>
              <div className="bg-blue-100 px-4 py-2 text-sm font-semibold">
                Sales Details
              </div>
              <table className="w-full text-sm">
                <tbody>
                  <Row label="Swiggy">{inr0(derived.swiggy)}</Row>
                  <Row label="Zomato">{inr0(derived.zomato)}</Row>
                  <Row label="Magicpin">{inr0(derived.magicpin)}</Row>
                  <Row label="Ownly">{inr0(derived.ownly)}</Row>
                  <Row label="Billing Counter">
                    {inr0(derived.billingCounter)}
                  </Row>
                </tbody>
              </table>
            </div>
            <div>
              <div className="bg-emerald-100 px-4 py-2 text-sm font-semibold">
                Billing Details
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs text-zinc-500">
                    <th className="px-4 py-1.5 text-left font-medium">
                      Details
                    </th>
                    <th className="px-2 py-1.5 text-right font-medium">
                      Orders
                    </th>
                    <th className="px-4 py-1.5 text-right font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <BillRow
                    label="Bills Modified"
                    ordersName="bills_modified_orders"
                    valueName="bills_modified_value"
                    orders={manual.bills_modified_orders}
                    value={manual.bills_modified_value}
                  />
                  <BillRow
                    label="Bills Re-Printed"
                    ordersName="bills_reprinted_orders"
                    valueName="bills_reprinted_value"
                    orders={manual.bills_reprinted_orders}
                    value={manual.bills_reprinted_value}
                  />
                  <BillRow
                    label="Cancelled"
                    ordersName="cancelled_orders"
                    valueName="cancelled_value"
                    orders={manual.cancelled_orders}
                    value={manual.cancelled_value}
                  />
                  <BillRow
                    label="Modified KOTs"
                    ordersName="modified_kots_orders"
                    valueName="modified_kots_value"
                    orders={manual.modified_kots_orders}
                    value={manual.modified_kots_value}
                  />
                </tbody>
              </table>
            </div>
          </div>

          {/* Settlement + Cash management */}
          <div>
            <div className="bg-orange-200 px-4 py-2 text-sm font-semibold">
              Settlement Details
            </div>
            <div className="grid grid-cols-2 divide-x divide-zinc-200">
              <table className="w-full text-sm">
                <tbody>
                  <Row label="UPI">
                    <NumCell name="upi" value={manual.upi} />
                  </Row>
                  <Row label="EDC Machine">
                    <NumCell name="edc_machine" value={manual.edc_machine} />
                  </Row>
                  <Row label="Credit Sale">{inr0(derived.creditSale)}</Row>
                  <Row label="Wallet">
                    <NumCell name="wallet" value={manual.wallet} />
                  </Row>
                  <Row label="Cash Sale">{inr0(derived.cashSale)}</Row>
                </tbody>
              </table>
              <table className="w-full text-sm">
                <tbody>
                  <Row label="Opening Cash">
                    <NumCell name="opening_cash" value={manual.opening_cash} />
                  </Row>
                  <Row label="Cash Expenses">
                    <NumCell name="cash_expenses" value={manual.cash_expenses} />
                  </Row>
                  <Row label="Last Cash Deposit Date">
                    <input
                      type="date"
                      name="last_deposit_date"
                      defaultValue={manual.last_deposit_date ?? ""}
                      className="rounded border border-zinc-200 bg-white px-2 py-1 text-sm focus:border-zinc-500 focus:outline-none disabled:border-transparent disabled:bg-transparent disabled:px-0"
                    />
                  </Row>
                  <Row label="Last Cash Deposit Amount">
                    <NumCell
                      name="last_deposit_amount"
                      value={manual.last_deposit_amount}
                    />
                  </Row>
                  <Row label="Shortage">
                    <NumCell name="shortage" value={manual.shortage} />
                  </Row>
                  <Row label="Closing Cash" bold>
                    <NumCell name="closing_cash" value={manual.closing_cash} />
                  </Row>
                </tbody>
              </table>
            </div>
          </div>
        </fieldset>

        {/* Save bar */}
        <div className="flex items-center gap-3 border-t border-zinc-200 bg-zinc-50 px-4 py-3">
          <button
            type="submit"
            disabled={pending || locked}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          {locked && (
            <span className="text-xs text-red-600">
              🔒 Locked — unlock to edit.
            </span>
          )}
          {state.kind === "error" && (
            <span className="text-xs text-red-600">{state.message}</span>
          )}
          {state.kind === "success" && (
            <span className="text-xs text-emerald-700">Saved ✓</span>
          )}
        </div>
      </form>
    </div>
  );
}

function Row({
  label,
  bold,
  children,
}: {
  label: string;
  bold?: boolean;
  children: React.ReactNode;
}) {
  return (
    <tr className="border-b border-zinc-100">
      <td className={`px-4 py-1.5 ${bold ? "font-semibold" : ""}`}>{label}</td>
      <td className="px-4 py-1.5 text-right tabular-nums">{children}</td>
    </tr>
  );
}

function BillRow({
  label,
  ordersName,
  valueName,
  orders,
  value,
}: {
  label: string;
  ordersName: string;
  valueName: string;
  orders: number | null;
  value: number | null;
}) {
  return (
    <tr className="border-b border-zinc-100">
      <td className="px-4 py-1.5">{label}</td>
      <td className="px-2 py-1.5 text-right">
        <input
          type="text"
          inputMode="numeric"
          name={ordersName}
          defaultValue={fmtDisplay(orders)}
          onBlur={onBlurFormat}
          placeholder={DASH}
          className="w-16 rounded border border-zinc-200 bg-white px-2 py-1 text-right text-sm focus:border-zinc-500 focus:outline-none disabled:border-transparent disabled:bg-transparent disabled:px-0"
        />
      </td>
      <td className="px-4 py-1.5 text-right">
        <input
          type="text"
          inputMode="decimal"
          name={valueName}
          defaultValue={fmtDisplay(value)}
          onBlur={onBlurFormat}
          placeholder={DASH}
          className="w-24 rounded border border-zinc-200 bg-white px-2 py-1 text-right text-sm focus:border-zinc-500 focus:outline-none disabled:border-transparent disabled:bg-transparent disabled:px-0"
        />
      </td>
    </tr>
  );
}
