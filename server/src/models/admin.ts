import { Schema, model, Document } from "mongoose";

interface AdminSchemaType extends Document {
  username: string;
  email: string;
  password: string;
  role: string;
  profile_pic?: string | null;
  profile_pic_public_id?: string | null;
}

const AdminSchema = new Schema<AdminSchemaType>(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // hashed
    role: { type: String, default: "admin" },
    // optional profile picture fields
    profile_pic: { type: String, default: null },
    profile_pic_public_id: { type: String, default: null },
  },
  { timestamps: true }
);

const AdminModel = model<AdminSchemaType>("Admin", AdminSchema);
export default AdminModel;
