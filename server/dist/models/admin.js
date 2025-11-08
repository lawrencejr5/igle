"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const AdminSchema = new mongoose_1.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // hashed
    role: { type: String, default: "admin" },
    // optional profile picture fields
    profile_pic: { type: String, default: null },
    profile_pic_public_id: { type: String, default: null },
}, { timestamps: true });
const AdminModel = (0, mongoose_1.model)("Admin", AdminSchema);
exports.default = AdminModel;
