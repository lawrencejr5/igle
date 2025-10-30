import mongoose, { Document, Schema, Types } from "mongoose";

export type UserTaskStatus =
  | "locked"
  | "in_progress"
  | "completed"
  | "claimed"
  | "expired";

export interface UserTaskDoc extends Document {
  user: Types.ObjectId;
  task: Types.ObjectId;
  progress: number;
  status: UserTaskStatus;
  claimedAt?: Date | null;
  metadata?: Record<string, any>;
  attempts?: number; // number of times user tried to claim or progress updates
  createdAt: Date;
  updatedAt: Date;
}

const UserTaskSchema = new Schema<UserTaskDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    progress: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["locked", "in_progress", "completed", "claimed", "expired"],
      default: "locked",
    },
    claimedAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ensure a user has at most one active document per task
UserTaskSchema.index({ user: 1, task: 1 }, { unique: true });

export default mongoose.model<UserTaskDoc>("UserTask", UserTaskSchema);
