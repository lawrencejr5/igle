import mongoose, { Schema, Document, Types } from "mongoose";

export interface ReportType extends Document {
  reporter?: Types.ObjectId | null;
  driver: Types.ObjectId;
  ride?: Types.ObjectId | null;
  category: string;
  description?: string;
  anonymous: boolean;
  status: string;
}

const ReportSchema = new Schema<ReportType>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: false },
    driver: { type: Schema.Types.ObjectId, ref: "Driver", required: true },
    ride: { type: Schema.Types.ObjectId, ref: "Ride", required: false },
    category: { type: String, required: true },
    description: { type: String, default: "" },
    anonymous: { type: Boolean, default: false },
    status: { type: String, default: "new" },
  },
  { timestamps: true }
);

export default mongoose.model<ReportType>("Report", ReportSchema);
