import { Schema, Types, Document, model } from "mongoose";

interface SavedPlaceSchemaType extends Document {
  user: Types.ObjectId;
  place_header: string;
  place_id: string;
  place_name: string;
  place_sub_name: string;
  place_coords: [number, number];
}

const SavedPlaceSchema = new Schema<SavedPlaceSchemaType>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    place_header: { type: String, required: true },
    place_id: { type: String, required: true },
    place_name: { type: String, required: true },
    place_sub_name: { type: String, required: true },
    place_coords: { type: [Number, Number], required: true },
  },
  { timestamps: true }
);

export default model<SavedPlaceSchemaType>("SavedPlace", SavedPlaceSchema);
