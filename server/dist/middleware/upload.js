"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = exports.upload = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const storage = multer_1.default.diskStorage({
    filename: (req, file, cb) => {
        cb(null, Date.now() + "_" + file.originalname.replace(/[\s\(\)\.com]/g, "_"));
    },
});
const upload = (0, multer_1.default)({ storage });
exports.upload = upload;
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});
