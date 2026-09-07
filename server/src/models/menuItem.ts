import mongoose, { Document, Schema } from "mongoose";

export interface MenuItemOption {
  name: string;
  price_modifier: number;
  is_available: boolean;
}

export interface MenuItemOptionGroup {
  name: string;
  required: boolean;
  min_selection: number;
  max_selection: number;
  options: MenuItemOption[];
}

export interface MenuItemType extends Document {
  restaurant: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  image?: string;
  is_available: boolean;
  preparation_time_mins: number;
  options_groups: MenuItemOptionGroup[];
  dietary_flags: string[];
  display_order: number;
  is_deleted: boolean;
  deleted_at?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<MenuItemType>(
  {
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "MenuCategory",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
    is_available: { type: Boolean, default: true },
    preparation_time_mins: { type: Number, default: 20 },
    options_groups: [
      {
        name: { type: String, required: true },
        required: { type: Boolean, default: false },
        min_selection: { type: Number, default: 0 },
        max_selection: { type: Number, default: 1 },
        options: [
          {
            name: { type: String, required: true },
            price_modifier: { type: Number, default: 0 },
            is_available: { type: Boolean, default: true },
          },
        ],
      },
    ],
    dietary_flags: { type: [String], default: [] },
    display_order: { type: Number, default: 0 },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes for fast menu queries per restaurant and category
MenuItemSchema.index({ restaurant: 1, category: 1, is_available: 1 });
MenuItemSchema.index({ restaurant: 1, display_order: 1 });

export default mongoose.model<MenuItemType>("MenuItem", MenuItemSchema);
