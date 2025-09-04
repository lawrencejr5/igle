import mongoose, { Schema, Document } from "mongoose";

export interface HistoryType extends Document {
  place_id: string;
  place_name: string;
  place_sub_name: string;
  user: mongoose.Types.ObjectId;
  lastVisitedAt: Date;
}

const HistorySchema = new Schema<HistoryType>(
  {
    place_id: { type: String, required: true },
    place_name: { type: String, required: true },
    place_sub_name: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastVisitedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<HistoryType>("History", HistorySchema);
