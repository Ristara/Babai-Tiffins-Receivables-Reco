// PayTm All-in-One POS reconciliation config.
// MIDs are NOT secret (they identify merchant accounts) so they live in code.
// The merchant KEYS are secret and live only in env vars (keyEnvVar below).
//
// Each branch has a main POS account (the "PayTm" category) and, for HSR/SJP,
// a separate ODC account (the "ODC" category). JPN has no ODC account.

export type PaytmCategory = "PayTm" | "ODC";

export interface PaytmAccount {
  branch: string;
  category: PaytmCategory;
  mid: string;
  keyEnvVar: string;
}

export const PAYTM_ACCOUNTS: PaytmAccount[] = [
  {
    branch: "HSR",
    category: "PayTm",
    mid: "KaUGSJ98734653504905",
    keyEnvVar: "PAYTM_KEY_HSR",
  },
  {
    branch: "HSR",
    category: "ODC",
    mid: "UczQoE45460360369268",
    keyEnvVar: "PAYTM_KEY_HSR_ODC",
  },
  {
    branch: "SJP",
    category: "PayTm",
    mid: "FyUbZo70255708174933",
    keyEnvVar: "PAYTM_KEY_SJP",
  },
  {
    branch: "SJP",
    category: "ODC",
    mid: "XqUCKf58877622844538",
    keyEnvVar: "PAYTM_KEY_SJP_ODC",
  },
  {
    branch: "JPN",
    category: "PayTm",
    mid: "btwGQL64593655788917",
    keyEnvVar: "PAYTM_KEY_JPN",
  },
];

export function findPaytmAccount(
  branch: string,
  category: PaytmCategory,
): PaytmAccount | undefined {
  return PAYTM_ACCOUNTS.find(
    (a) => a.branch === branch && a.category === category,
  );
}
