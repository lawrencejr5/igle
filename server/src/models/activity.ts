import { Types, Schema, model, Document } from "mongoose";

interface ActivitySchemaType extends Document {
  type:
    | "ride"
    | "scheduled_ride"
    | "wallet_funding"
    | "transaction"
    | "system"
    | "security"
    | "user_details";
  user: Schema.Types.ObjectId;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  is_read: boolean;
}

const ActivitySchema = new Schema<ActivitySchemaType>({
  type: {
    type: String,
    enum: [
      "ride",
      "scheduled_ride",
      "wallet_funding",
      "transaction",
      "system",
      "security",
      "user_details",
    ],
    required: true,
  },
  user: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
  },
  metadata: {
    type: Schema.Types.Mixed, // allows any object
    default: {},
  },
  is_read: {
    type: Boolean,
    default: false,
  },
});

const ActivityModel = model<ActivitySchemaType>("Activity", ActivitySchema);
export default ActivityModel;
