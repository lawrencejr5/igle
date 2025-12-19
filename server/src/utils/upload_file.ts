import { cloudinary } from "../middleware/upload";

/**
 * Upload a local file at filePath to Cloudinary into the provided folder.
 * Returns object { url, public_id } or null on failure.
 */
export const uploadToCloudinary = async (
  filePath?: string,
  folder?: string
): Promise<{ url: string; secure_url: string; public_id: string } | null> => {
  if (!filePath) return null;
  try {
    const uploaded = await cloudinary.uploader.upload(filePath, {
      folder: folder || "igle_images/uploads",
    });
    return {
      url: uploaded.url,
      secure_url: uploaded.secure_url,
      public_id: uploaded.public_id as string,
    };
  } catch (err) {
    console.error("uploadToCloudinary error:", err);
    return null;
  }
};
