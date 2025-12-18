import dotenv from "dotenv";
dotenv.config();

import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + "_" + file.originalname.replace(/[\s\(\)\.com]/g, "_")
    );
  },
});

const upload = multer({ storage });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { upload, cloudinary };
