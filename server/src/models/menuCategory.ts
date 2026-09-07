import mongoose, { Document, Schema } from "mongoose";

export interface MenuCategoryType extends Document {
  restaurant: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuCategorySchema = new Schema<MenuCategoryType>(
  {
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    display_order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound index to quickly fetch categories per restaurant sorted by display order
MenuCategorySchema.index({ restaurant: 1, display_order: 1 });
MenuCategorySchema.index({ restaurant: 1, name: 1 }, { unique: true });

export default mongoose.model<MenuCategoryType>(
  "MenuCategory",
  MenuCategorySchema
);
