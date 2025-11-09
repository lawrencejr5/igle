import mongoose, { Schema, Document } from "mongoose";

export interface FareSettings {
  baseFare?: number;
  costPerKm?: number;
  costPerMinute?: number;
  minimumFare?: number;
  commissionRate?: number;
  cancellationFee?: number;
}

export interface DeliveryFareSettings {
  baseDeliveryFee?: number;
  costPerKm?: number;
  weightBasedFee?: number;
  minimumDeliveryFee?: number;
}

export interface SystemSettingType extends Document {
  rideFare: FareSettings;
  deliveryFare: DeliveryFareSettings;
}

const SystemSettingSchema = new Schema<SystemSettingType>(
  {
    rideFare: {
      type: Schema.Types.Mixed,
      default: {},
    },
    deliveryFare: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model<SystemSettingType>(
  "SystemSetting",
  SystemSettingSchema
);
