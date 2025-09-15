import { Types, Schema, model, Document } from "mongoose";

interface RatingSchemaType extends Document {
  rating: number;
  review: string;
  ride: Schema.Types.ObjectId;
  user: Schema.Types.ObjectId;
  driver: Schema.Types.ObjectId;
}

const RatingSchema = new Schema<RatingSchemaType>(
  {
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      default: "",
    },
    ride: {
      type: Types.ObjectId,
      ref: "Ride",
      required: true,
    },
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    driver: {
      type: Types.ObjectId,
      ref: "Driver",
      required: true,
    },
  },
  { timestamps: true }
);

const RatingModel = model<RatingSchemaType>("Rating", RatingSchema);
export default RatingModel;
