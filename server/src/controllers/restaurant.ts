import { Request, Response } from "express";
import Restaurant from "../models/restaurant";
import User from "../models/user";
import { cloudinary } from "../middleware/upload";

// Helper for uploading file buffer or file path to Cloudinary
const uploadToCloudinary = async (
  filePath: string,
  folder: string = "restaurants"
): Promise<string> => {
  const result = await cloudinary.uploader.upload(filePath, { folder });
  return result.secure_url;
};

// ─── Register / Save Restaurant Details ───────────────────────────────────────
// POST /api/v1/restaurants/register
export const register_restaurant = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    const {
      name,
      phone,
      email,
      description,
      category_tags,
      operating_hours,
      address,
      landmark,
      latitude,
      longitude,
      delivery_radius_km,
      bank_name,
      account_number,
      account_name,
      bank_code,
    } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    let logo_url = "";
    let banner_url = "";
    let gov_id_url = "";
    let cac_doc_url = "";

    if (files?.logo?.[0]) {
      logo_url = await uploadToCloudinary(files.logo[0].path, "restaurants/logos");
    }
    if (files?.banner?.[0]) {
      banner_url = await uploadToCloudinary(files.banner[0].path, "restaurants/banners");
    }
    if (files?.government_id?.[0]) {
      gov_id_url = await uploadToCloudinary(files.government_id[0].path, "restaurants/docs");
    }
    if (files?.cac_document?.[0]) {
      cac_doc_url = await uploadToCloudinary(files.cac_document[0].path, "restaurants/docs");
    }

    // Parse operating_hours if passed as JSON string
    let parsedHours = operating_hours;
    if (typeof operating_hours === "string") {
      try {
        parsedHours = JSON.parse(operating_hours);
      } catch (e) {
        parsedHours = [];
      }
    }

    // Parse category_tags if passed as JSON string
    let parsedTags = category_tags;
    if (typeof category_tags === "string") {
      try {
        parsedTags = JSON.parse(category_tags);
      } catch (e) {
        parsedTags = category_tags.split(",").map((t: string) => t.trim());
      }
    }

    const coords: [number, number] = [
      longitude ? parseFloat(longitude) : 3.3792,
      latitude ? parseFloat(latitude) : 6.5244,
    ];

    let restaurant = await Restaurant.findOne({ user: user_id });

    if (restaurant) {
      // Update existing application
      restaurant.name = name || restaurant.name;
      restaurant.phone = phone || restaurant.phone;
      restaurant.email = email || restaurant.email;
      restaurant.description = description ?? restaurant.description;
      if (parsedTags) restaurant.category_tags = parsedTags;
      if (parsedHours) restaurant.operating_hours = parsedHours;
      if (logo_url) restaurant.logo = logo_url;
      if (banner_url) restaurant.banner = banner_url;

      restaurant.location = {
        address: address || restaurant.location.address,
        landmark: landmark ?? restaurant.location.landmark,
        coordinates: {
          type: "Point",
          coordinates: coords,
        },
        delivery_radius_km: delivery_radius_km
          ? parseFloat(delivery_radius_km)
          : restaurant.location.delivery_radius_km,
      };

      if (bank_name || account_number) {
        restaurant.bank = {
          bank_name: bank_name || restaurant.bank?.bank_name || "",
          account_number: account_number || restaurant.bank?.account_number || "",
          account_name: account_name || restaurant.bank?.account_name || "",
          bank_code: bank_code || restaurant.bank?.bank_code || "",
        };
      }

      if (gov_id_url) restaurant.verification.government_id = gov_id_url;
      if (cac_doc_url) {
        restaurant.verification.cac_document = cac_doc_url;
        restaurant.verification.is_cac_verified = true;
      }
      restaurant.application = "submitted";

      await restaurant.save();
    } else {
      // Create new application
      restaurant = await Restaurant.create({
        user: user_id,
        name: name || "Restaurant",
        phone: phone || "",
        email: email || "",
        description: description || "",
        category_tags: parsedTags || [],
        operating_hours: parsedHours || [],
        logo: logo_url,
        banner: banner_url,
        location: {
          address: address || "Default Address",
          landmark: landmark || "",
          coordinates: {
            type: "Point",
            coordinates: coords,
          },
          delivery_radius_km: delivery_radius_km ? parseFloat(delivery_radius_km) : 5,
        },
        bank: {
          bank_name: bank_name || "",
          account_number: account_number || "",
          account_name: account_name || "",
          bank_code: bank_code || "",
        },
        verification: {
          government_id: gov_id_url,
          cac_document: cac_doc_url,
          is_cac_verified: !!cac_doc_url,
        },
        application: "submitted",
      });
    }

    // Update user application status
    await User.findByIdAndUpdate(user_id, {
      restaurant_application: "submitted",
    });

    return res.status(200).json({
      msg: "Restaurant registration submitted successfully",
      restaurant,
    });
  } catch (error: any) {
    console.error("register_restaurant error:", error);
    return res
      .status(500)
      .json({ msg: error.message || "Failed to register restaurant" });
  }
};

// ─── Get Current Restaurant Profile ─────────────────────────────────────────
// GET /api/v1/restaurants/me
export const get_restaurant_profile = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    const restaurant = await Restaurant.findOne({ user: user_id });
    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant profile not found" });
    }

    return res.status(200).json({ restaurant });
  } catch (error: any) {
    return res.status(500).json({ msg: error.message || "Server error" });
  }
};

// ─── Toggle Online Status ───────────────────────────────────────────────────
// PATCH /api/v1/restaurants/online
export const set_restaurant_online_status = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    const { is_online } = req.body;

    const restaurant = await Restaurant.findOneAndUpdate(
      { user: user_id },
      { is_online: Boolean(is_online) },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }

    return res.status(200).json({
      msg: `Restaurant is now ${restaurant.is_online ? "online" : "offline"}`,
      is_online: restaurant.is_online,
      restaurant,
    });
  } catch (error: any) {
    return res.status(500).json({ msg: error.message || "Server error" });
  }
};
