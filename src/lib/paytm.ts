import PaytmChecksum from "paytmchecksum";

const SETTLEMENT_URL =
  "https://secure.paytmpayments.com/merchant-settlement-service/settlement/list";

const PAGE_SIZE = 20;
const MAX_PAGES = 200; // safety cap (200 × 20 = 4000 txns/day)

interface SettlementRow {
  txnType?: string;
  settleAmount?: string;
  txnAmount?: string;
  [k: string]: unknown;
}

export interface SettlementResult {
  settled_amount: number;
  txn_count: number;
  raw: SettlementRow[];
}

// Fetch all settled transactions for one MID on one date and total them.
// settleAmount comes back as a string; refunds/chargebacks settle negative,
// so a plain sum nets them out.
export async function fetchSettlement(
  mid: string,
  merchantKey: string,
  date: string, // YYYY-MM-DD
): Promise<SettlementResult> {
  let pageNum = 1;
  let totalPages = 1;
  let settled_amount = 0;
  let txn_count = 0;
  const raw: SettlementRow[] = [];

  do {
    const bodyObj = {
      MID: mid,
      utrProcessedStartTime: date,
      utrProcessedEndTime: date,
      pageNum,
      pageSize: PAGE_SIZE,
    };
    const bodyStr = JSON.stringify(bodyObj);
    const checksumHash = await PaytmChecksum.generateSignature(
      bodyStr,
      merchantKey,
    );
    const fullBody = JSON.stringify({ ...bodyObj, checksumHash });

    const res = await fetch(SETTLEMENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: fullBody,
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from PayTm: ${text.slice(0, 300)}`);
    }

    let data: {
      status?: string;
      resultCode?: string;
      errorMessage?: string;
      settlementDetailList?: SettlementRow[];
      paginatorTotalPage?: number;
    };
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Non-JSON response from PayTm: ${text.slice(0, 300)}`);
    }

    if (data.status && data.status !== "SUCCESS") {
      throw new Error(
        `PayTm error: ${data.errorMessage ?? data.resultCode ?? "unknown"}`,
      );
    }

    const list = data.settlementDetailList ?? [];
    for (const row of list) {
      settled_amount += Number.parseFloat(row.settleAmount ?? "0") || 0;
      txn_count += 1;
      raw.push(row);
    }

    totalPages = data.paginatorTotalPage ?? 1;
    pageNum += 1;
  } while (pageNum <= totalPages && pageNum <= MAX_PAGES);

  return {
    settled_amount: Math.round(settled_amount * 100) / 100,
    txn_count,
    raw,
  };
}
