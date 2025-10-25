import { Types, Schema, model, Document } from "mongoose";

interface FeedbackSchemaType extends Document {
  user?: Schema.Types.ObjectId;
  type: "bug" | "feature" | "general";
  message: string;
  images?: string[];
  contact?: string;
  metadata?: Record<string, any>;
}

const FeedbackSchema = new Schema<FeedbackSchemaType>(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: false,
    },
    type: {
      type: String,
      enum: ["bug", "feature", "general"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    contact: {
      type: String,
      required: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const FeedbackModel = model<FeedbackSchemaType>("Feedback", FeedbackSchema);
export default FeedbackModel;
