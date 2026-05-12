export const PLANS = ["free", "pro", "unlimited"] as const;
export type Plan = (typeof PLANS)[number];

export const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  pro: "Pro",
  unlimited: "Unlimited",
};

export const PRO_PRICE_USD = 9;
export const UNLIMITED_PRICE_USD = 50;

export const UNLIMITED_PROJECT_LIMIT = 999_999;

export function isPaid(plan: Plan | null | undefined): boolean {
  return plan === "pro" || plan === "unlimited";
}

export function isUnlimited(plan: Plan | null | undefined): boolean {
  return plan === "unlimited";
}

export function hasUnlimitedEdits(plan: Plan | null | undefined): boolean {
  return isPaid(plan);
}

export function projectLimit(
  plan: Plan | null | undefined,
  freeLimit: number,
  paidLimit: number
): number {
  if (plan === "unlimited") return UNLIMITED_PROJECT_LIMIT;
  if (plan === "pro") return paidLimit;
  return freeLimit;
}

export const ASSISTANT_RATE_LIMITS = {
  anon: 5,
  free: 30,
  pro: 300,
  unlimited: 2000,
} as const;

export const CHAT_RATE_LIMITS = {
  free: 60,
  pro: 300,
  unlimited: 2000,
} as const;
