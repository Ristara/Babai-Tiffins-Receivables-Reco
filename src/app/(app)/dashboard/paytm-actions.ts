"use server";

import { createClient } from "@/lib/supabase/server";
import { findPaytmAccount, type PaytmCategory } from "@/lib/paytm-config";
import { fetchSettlement } from "@/lib/paytm";
import { revalidatePath } from "next/cache";

export type PaytmFetchState =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | {
      kind: "success";
      branch: string;
      category: PaytmCategory;
      sale_date: string;
      settled_amount: number;
      txn_count: number;
    };

export async function fetchPaytmSettlement(
  _prev: PaytmFetchState,
  formData: FormData,
): Promise<PaytmFetchState> {
  const branch = String(formData.get("branch") ?? "");
  const category = String(formData.get("category") ?? "") as PaytmCategory;
  const sale_date = String(formData.get("sale_date") ?? "");

  const account = findPaytmAccount(branch, category);
  if (!account) {
    return {
      kind: "error",
      message: `No PayTm account configured for ${branch} ${category}.`,
    };
  }

  const key = process.env[account.keyEnvVar];
  if (!key) {
    return {
      kind: "error",
      message: `Missing key env var ${account.keyEnvVar} in Vercel.`,
    };
  }

  let result;
  try {
    result = await fetchSettlement(account.mid, key, sale_date);
  } catch (err) {
    return {
      kind: "error",
      message: `PayTm fetch failed: ${(err as Error).message}`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("paytm_settlements").upsert(
    {
      sale_date,
      branch,
      category,
      mid: account.mid,
      settled_amount: result.settled_amount,
      txn_count: result.txn_count,
      fetched_at: new Date().toISOString(),
      raw: result.raw,
    },
    { onConflict: "sale_date,branch,category" },
  );

  if (error) {
    return {
      kind: "error",
      message: `Saved from PayTm but DB write failed: ${error.message}`,
    };
  }

  revalidatePath("/dashboard");
  return {
    kind: "success",
    branch,
    category,
    sale_date,
    settled_amount: result.settled_amount,
    txn_count: result.txn_count,
  };
}
