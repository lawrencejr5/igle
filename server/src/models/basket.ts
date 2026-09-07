import mongoose, { Document, Schema } from "mongoose";

export interface BasketSelectedOption {
  group_name: string;
  option_name: string;
  price_modifier: number;
}

export interface BasketItem {
  _id?: mongoose.Types.ObjectId;
  menu_item: mongoose.Types.ObjectId;
  quantity: number;
  unit_price: number;
  selected_options: BasketSelectedOption[];
  special_instructions?: string;
  item_total: number;
}

export interface BasketType extends Document {
  user: mongoose.Types.ObjectId;
  restaurant: mongoose.Types.ObjectId;
  items: BasketItem[];
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

const BasketSchema = new Schema<BasketType>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    items: [
      {
        menu_item: {
          type: Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        unit_price: { type: Number, required: true, min: 0 },
        selected_options: [
          {
            group_name: { type: String, required: true },
            option_name: { type: String, required: true },
            price_modifier: { type: Number, default: 0 },
          },
        ],
        special_instructions: { type: String, default: "" },
        item_total: { type: Number, required: true, min: 0 },
      },
    ],
    subtotal: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

// Index to quickly look up a user's active cart
BasketSchema.index({ user: 1 }, { unique: true });

export default mongoose.model<BasketType>("Basket", BasketSchema);
