import { Types, Schema, model, Document } from "mongoose";

interface ActivitySchemaType extends Document {
  type:
    | "ride"
    | "cancelled_ride"
    | "scheduled_ride"
    | "wallet_funding"
    | "ride_payment"
    | "system"
    | "security"
    | "email_update"
    | "phone_update";
  user: Schema.Types.ObjectId;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  is_read: boolean;
}

const ActivitySchema = new Schema<ActivitySchemaType>(
  {
    type: {
      type: String,
      enum: [
        "ride",
        "cancelled_ride",
        "scheduled_ride",
        "wallet_funding",
        "ride_payment",
        "system",
        "security",
        "phone_update",
        "email_updated",
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
  },
  { timestamps: true }
);

const ActivityModel = model<ActivitySchemaType>("Activity", ActivitySchema);
export default ActivityModel;
