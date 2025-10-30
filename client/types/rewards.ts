export type ProgressSource =
  | "rides_completed"
  | "weekly_streak"
  | "referrals"
  | "deliveries_completed";

export type RewardStatus =
  | "locked"
  | "in_progress"
  | "completed"
  | "claimed"
  | "expired";

export interface RewardDefinition {
  id: string;
  title: string;
  description: string;
  target: number;
  source: ProgressSource;
  action:
    | { type: "credit_wallet"; currency: "NGN" | "USD"; amount: number }
    | { type: "promo_code"; code: string }
    | { type: "discount"; percentage: number };
  expiresAt?: string;
  terms?: string;
  icon?: string;
}

export interface RewardInstance extends RewardDefinition {
  progress: number;
  status: RewardStatus;
}
