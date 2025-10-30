import mongoose, { Document, Schema } from "mongoose";

export type TaskType = "ride" | "delivery" | "streak" | "referral" | "custom";

// rewards are simple naira wallet credits for now
export type RewardActionType = { amountNGN: number };

export interface TaskDoc extends Document {
  title: string;
  description?: string;
  type: TaskType;
  goalCount: number; // e.g. 10 rides, 5 weeks, etc.
  rewardAmount: number; // amount to credit in NGN when claimed
  active: boolean;
  startAt?: Date | null;
  endAt?: Date | null;
  terms?: string;
  maxPerUser?: number; // how many times a single user can claim
  totalBudget?: number | null; // optional total budget for campaign
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<TaskDoc>(
  {
    title: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ["ride", "delivery", "streak", "referral", "custom"],
      default: "ride",
    },
    goalCount: { type: Number, required: true, default: 1 },
    rewardAmount: { type: Number, required: true, default: 0 },
    active: { type: Boolean, default: true },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    terms: { type: String },
    maxPerUser: { type: Number, default: 1 },
    totalBudget: { type: Number, default: null },
  },
  { timestamps: true }
);

// useful index to query active tasks by type and date range
TaskSchema.index({ type: 1, active: 1, startAt: 1, endAt: 1 });

export default mongoose.model<TaskDoc>("Task", TaskSchema);
