import mongoose, { Document, Schema } from "mongoose";

export interface FoodOrderItemSnapshot {
  menu_item_id: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  selected_options: {
    group_name: string;
    option_name: string;
    price_modifier: number;
  }[];
  special_instructions?: string;
  item_total: number;
}

export interface FoodOrderType extends Document {
  order_number: string;
  customer: mongoose.Types.ObjectId;
  restaurant: mongoose.Types.ObjectId;
  driver?: mongoose.Types.ObjectId;
  items: FoodOrderItemSnapshot[];
  delivery_address: {
    address: string;
    landmark?: string;
    coordinates: [number, number]; // [longitude, latitude]
    contact_name: string;
    contact_phone: string;
  };
  restaurant_address: {
    name: string;
    address: string;
    coordinates: [number, number];
    phone: string;
  };
  pricing: {
    subtotal: number;
    delivery_fee: number;
    service_fee: number;
    discount: number;
    total: number;
    restaurant_earnings: number;
    driver_earnings: number;
    platform_commission: number;
  };
  payment: {
    method: "cash" | "card" | "wallet";
    status: "unpaid" | "paid" | "refunded";
    transaction_reference?: string;
  };
  status:
    | "placed"
    | "preparing"
    | "ready_for_pickup"
    | "in_transit"
    | "delivered"
    | "cancelled"
    | "rejected";
  cancellation?: {
    cancelled_by?: "customer" | "restaurant" | "driver" | "system" | "admin";
    reason?: string;
  };
  status_timestamps: {
    placed_at?: Date;
    preparing_at?: Date;
    ready_at?: Date;
    in_transit_at?: Date;
    delivered_at?: Date;
    cancelled_at?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const FoodOrderSchema = new Schema<FoodOrderType>(
  {
    order_number: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    items: [
      {
        menu_item_id: {
          type: Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        selected_options: [
          {
            group_name: { type: String, required: true },
            option_name: { type: String, required: true },
            price_modifier: { type: Number, default: 0 },
          },
        ],
        special_instructions: { type: String, default: "" },
        item_total: { type: Number, required: true },
      },
    ],
    delivery_address: {
      address: { type: String, required: true },
      landmark: { type: String, default: "" },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      contact_name: { type: String, required: true },
      contact_phone: { type: String, required: true },
    },
    restaurant_address: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      coordinates: {
        type: [Number],
        required: true,
      },
      phone: { type: String, required: true },
    },
    pricing: {
      subtotal: { type: Number, required: true },
      delivery_fee: { type: Number, required: true, default: 0 },
      service_fee: { type: Number, required: true, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
      restaurant_earnings: { type: Number, default: 0 },
      driver_earnings: { type: Number, default: 0 },
      platform_commission: { type: Number, default: 0 },
    },
    payment: {
      method: {
        type: String,
        enum: ["cash", "card", "wallet"],
        required: true,
      },
      status: {
        type: String,
        enum: ["unpaid", "paid", "refunded"],
        default: "unpaid",
      },
      transaction_reference: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: [
        "placed",
        "preparing",
        "ready_for_pickup",
        "in_transit",
        "delivered",
        "cancelled",
        "rejected",
      ],
      default: "placed",
    },
    cancellation: {
      cancelled_by: {
        type: String,
        enum: ["customer", "restaurant", "driver", "system", "admin"],
      },
      reason: { type: String, default: "" },
    },
    status_timestamps: {
      placed_at: { type: Date, default: null },
      preparing_at: { type: Date, default: null },
      ready_at: { type: Date, default: null },
      in_transit_at: { type: Date, default: null },
      delivered_at: { type: Date, default: null },
      cancelled_at: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

FoodOrderSchema.index({ customer: 1, createdAt: -1 });
FoodOrderSchema.index({ restaurant: 1, status: 1, createdAt: -1 });
FoodOrderSchema.index({ driver: 1, status: 1 });

export default mongoose.model<FoodOrderType>("FoodOrder", FoodOrderSchema);
