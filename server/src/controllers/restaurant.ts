import { Request, Response } from "express";
import Restaurant from "../models/restaurant";
import User from "../models/user";
import { cloudinary } from "../middleware/upload";
import { resolve_bank_account } from "../utils/paystack";

// Helper for uploading file buffer or file path to Cloudinary
const uploadToCloudinary = async (
  filePath: string,
  folder: string = "restaurants"
): Promise<string> => {
  const result = await cloudinary.uploader.upload(filePath, { folder });
  return result.secure_url;
};

// ─── Stage 1: Save Restaurant Details ───────────────────────────────────────
// POST /api/v1/restaurants/save-details
export const save_restaurant_details = async (req: Request, res: Response) => {
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
    } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    let logo_url = "";
    let banner_url = "";

    if (files?.logo?.[0]) {
      logo_url = await uploadToCloudinary(files.logo[0].path, "restaurants/logos");
    }
    if (files?.banner?.[0]) {
      banner_url = await uploadToCloudinary(files.banner[0].path, "restaurants/banners");
    }

    let parsedHours = operating_hours;
    if (typeof operating_hours === "string") {
      try {
        parsedHours = JSON.parse(operating_hours);
      } catch (e) {
        parsedHours = [];
      }
    }

    let parsedTags = category_tags;
    if (typeof category_tags === "string") {
      try {
        parsedTags = JSON.parse(category_tags);
      } catch (e) {
        parsedTags = category_tags.split(",").map((t: string) => t.trim());
      }
    }

    let restaurant = await Restaurant.findOne({ user: user_id });

    if (restaurant) {
      if (name) restaurant.name = name;
      if (phone) restaurant.phone = phone;
      if (email) restaurant.email = email;
      if (description !== undefined) restaurant.description = description;
      if (parsedTags) restaurant.category_tags = parsedTags;
      if (parsedHours) restaurant.operating_hours = parsedHours;
      if (logo_url) restaurant.logo = logo_url;
      if (banner_url) restaurant.banner = banner_url;

      await restaurant.save();
    } else {
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
          address: "",
          landmark: "",
          coordinates: {
            type: "Point",
            coordinates: [6.6959, 6.2059],
          },
          delivery_radius_km: 5,
        },
        verification: {
          government_id: "",
          cac_document: "",
          is_cac_verified: false,
        },
        application: "pending",
      });
    }

    await User.findByIdAndUpdate(user_id, {
      restaurant_application: "pending",
    });

    return res.status(200).json({
      msg: "Restaurant details saved successfully",
      restaurant,
    });
  } catch (error: any) {
    console.error("save_restaurant_details error:", error);
    return res
      .status(500)
      .json({ msg: error.message || "Failed to save restaurant details" });
  }
};

// ─── Stage 2: Save Restaurant Location ──────────────────────────────────────
// POST /api/v1/restaurants/save-location
export const save_restaurant_location = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    const { address, landmark, latitude, longitude, delivery_radius_km } = req.body;

    let restaurant = await Restaurant.findOne({ user: user_id });
    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant profile not found. Please complete step 1 first." });
    }

    const coords: [number, number] = [
      longitude ? parseFloat(longitude) : restaurant.location?.coordinates?.coordinates[0] || 6.6959,
      latitude ? parseFloat(latitude) : restaurant.location?.coordinates?.coordinates[1] || 6.2059,
    ];

    restaurant.location = {
      address: address || restaurant.location?.address || "",
      landmark: landmark ?? restaurant.location?.landmark ?? "",
      coordinates: {
        type: "Point",
        coordinates: coords,
      },
      delivery_radius_km: delivery_radius_km
        ? parseFloat(delivery_radius_km)
        : restaurant.location?.delivery_radius_km || 5,
    };

    await restaurant.save();

    return res.status(200).json({
      msg: "Restaurant location saved successfully",
      restaurant,
    });
  } catch (error: any) {
    console.error("save_restaurant_location error:", error);
    return res
      .status(500)
      .json({ msg: error.message || "Failed to save restaurant location" });
  }
};

// ─── Stage 3: Save & Verify Restaurant Bank Account ──────────────────────────
// POST /api/v1/restaurants/save-bank
export const save_restaurant_bank = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    const { bank_name, bank_code, account_number, account_name } = req.body;

    if (!account_number || account_number.length !== 10) {
      return res.status(400).json({ msg: "Account number must be 10 digits" });
    }
    if (!bank_code) {
      return res.status(400).json({ msg: "Bank code is required" });
    }

    let verified_account_name = account_name || "";

    // Verify account details via Paystack resolve API
    try {
      const resolved = await resolve_bank_account(account_number, bank_code);
      if (resolved && resolved.account_name) {
        verified_account_name = resolved.account_name;
      }
    } catch (paystackError: any) {
      console.log(
        "Paystack bank resolve notice:",
        paystackError?.response?.data?.message || paystackError.message
      );
      // If Paystack API returns invalid account error, warn user
      if (paystackError?.response?.status === 422 || paystackError?.response?.data?.status === false) {
        return res.status(400).json({
          msg: paystackError?.response?.data?.message || "Could not resolve bank account details. Please check the account number and bank selected.",
        });
      }
    }

    let restaurant = await Restaurant.findOne({ user: user_id });
    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant profile not found. Please complete previous steps first." });
    }

    restaurant.bank = {
      bank_name: bank_name || restaurant.bank?.bank_name || "",
      account_number: account_number || restaurant.bank?.account_number || "",
      account_name: verified_account_name || restaurant.bank?.account_name || "",
      bank_code: bank_code || restaurant.bank?.bank_code || "",
    };

    await restaurant.save();

    return res.status(200).json({
      msg: "Bank details verified and saved successfully",
      account_name: verified_account_name,
      restaurant,
    });
  } catch (error: any) {
    console.error("save_restaurant_bank error:", error);
    return res
      .status(500)
      .json({ msg: error.message || "Failed to save bank details" });
  }
};

// ─── Stage 4: Submit Verification & Application ────────────────────────────
// POST /api/v1/restaurants/save-verification
export const submit_restaurant_verification = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    let gov_id_url = "";
    let cac_doc_url = "";

    if (files?.government_id?.[0]) {
      gov_id_url = await uploadToCloudinary(files.government_id[0].path, "restaurants/docs");
    }
    if (files?.cac_document?.[0]) {
      cac_doc_url = await uploadToCloudinary(files.cac_document[0].path, "restaurants/docs");
    }

    let restaurant = await Restaurant.findOne({ user: user_id });
    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant profile not found" });
    }

    if (gov_id_url) restaurant.verification.government_id = gov_id_url;
    if (cac_doc_url) {
      restaurant.verification.cac_document = cac_doc_url;
      restaurant.verification.is_cac_verified = true;
    }

    restaurant.application = "submitted";
    await restaurant.save();

    await User.findByIdAndUpdate(user_id, {
      restaurant_application: "submitted",
    });

    return res.status(200).json({
      msg: "Restaurant application submitted successfully",
      restaurant,
    });
  } catch (error: any) {
    console.error("submit_restaurant_verification error:", error);
    return res
      .status(500)
      .json({ msg: error.message || "Failed to submit application" });
  }
};

// ─── Full Fallback Registration Endpoint ──────────────────────────────────────
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

    let parsedHours = operating_hours;
    if (typeof operating_hours === "string") {
      try {
        parsedHours = JSON.parse(operating_hours);
      } catch (e) {
        parsedHours = [];
      }
    }

    let parsedTags = category_tags;
    if (typeof category_tags === "string") {
      try {
        parsedTags = JSON.parse(category_tags);
      } catch (e) {
        parsedTags = category_tags.split(",").map((t: string) => t.trim());
      }
    }

    const coords: [number, number] = [
      longitude ? parseFloat(longitude) : 6.6959,
      latitude ? parseFloat(latitude) : 6.2059,
    ];

    let restaurant = await Restaurant.findOne({ user: user_id });

    if (restaurant) {
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
          address: address || "",
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
