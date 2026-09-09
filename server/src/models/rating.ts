import mongoose, { Types, Schema, model, Document } from "mongoose";

export interface RatingSchemaType extends Document {
  rating: number;
  review: string;
  user: Types.ObjectId;
  ride?: Types.ObjectId;
  driver?: Types.ObjectId;
  food_order?: Types.ObjectId;
  restaurant?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
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
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ride: {
      type: Schema.Types.ObjectId,
      ref: "Ride",
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
    },
    food_order: {
      type: Schema.Types.ObjectId,
      ref: "FoodOrder",
    },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
    },
  },
  { timestamps: true }
);

RatingSchema.index({ driver: 1 });
RatingSchema.index({ restaurant: 1 });
RatingSchema.index({ ride: 1 });
RatingSchema.index({ food_order: 1 });

const RatingModel = model<RatingSchemaType>("Rating", RatingSchema);
export default RatingModel;
