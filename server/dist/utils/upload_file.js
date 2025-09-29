"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = void 0;
const upload_1 = require("../middleware/upload");
/**
 * Upload a local file at filePath to Cloudinary into the provided folder.
 * Returns object { url, public_id } or null on failure.
 */
const uploadToCloudinary = (filePath, folder) => __awaiter(void 0, void 0, void 0, function* () {
    if (!filePath)
        return null;
    try {
        const uploaded = yield upload_1.cloudinary.uploader.upload(filePath, {
            folder: folder || "igle_images/uploads",
        });
        return {
            url: uploaded.url,
            public_id: uploaded.public_id,
        };
    }
    catch (err) {
        console.error("uploadToCloudinary error:", err);
        return null;
    }
});
exports.uploadToCloudinary = uploadToCloudinary;
