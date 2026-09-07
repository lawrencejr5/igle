import { Request, Response } from "express";
import mongoose from "mongoose";
import MenuCategory from "../models/menuCategory";
import MenuItem from "../models/menuItem";
import Restaurant from "../models/restaurant";
import { cloudinary } from "../middleware/upload";
import { getVendorRestaurant } from "../utils/get_vendor_restaurant";

// Helper for uploading image file to Cloudinary
const uploadToCloudinary = async (
  filePath: string,
  folder: string = "restaurants/menu_items"
): Promise<string> => {
  const result = await cloudinary.uploader.upload(filePath, { folder });
  return result.secure_url;
};

// ─── MENU CATEGORY CONTROLLERS ────────────────────────────────────────────────

// 1. Create Menu Category (Vendor)
// POST /api/v1/menu/categories
export const create_category = async (req: Request, res: Response) => {
  try {
    const restaurant = await getVendorRestaurant(req, res);
    if (!restaurant) return;

    const { name, description, display_order } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ msg: "Category name is required" });
    }

    const trimmedName = name.trim();

    // Check for duplicate category name within the same restaurant
    const existingCategory = await MenuCategory.findOne({
      restaurant: restaurant._id,
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });

    if (existingCategory) {
      return res.status(400).json({
        msg: "A category with this name already exists in your restaurant menu.",
      });
    }

    const category = new MenuCategory({
      restaurant: restaurant._id,
      name: trimmedName,
      description: description || "",
      display_order: display_order !== undefined ? Number(display_order) : 0,
      is_active: true,
    });

    await category.save();

    return res.status(201).json({
      msg: "Menu category created successfully",
      category,
    });
  } catch (error: any) {
    console.error("create_category error:", error);
    return res
      .status(500)
      .json({ msg: "Server error creating menu category", error: error.message });
  }
};

// 2. Get Vendor Categories (Vendor)
// GET /api/v1/menu/categories/vendor
export const get_vendor_categories = async (req: Request, res: Response) => {
  try {
    const restaurant = await getVendorRestaurant(req, res);
    if (!restaurant) return;

    const categories = await MenuCategory.find({
      restaurant: restaurant._id,
    }).sort({ display_order: 1, createdAt: 1 });

    return res.status(200).json({ categories });
  } catch (error: any) {
    console.error("get_vendor_categories error:", error);
    return res
      .status(500)
      .json({ msg: "Server error fetching categories", error: error.message });
  }
};

// 3. Get Public Categories for a Restaurant (Public / Customer)
// GET /api/v1/menu/categories/restaurant/:restaurantId
export const get_public_categories = async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;

    const categories = await MenuCategory.find({
      restaurant: restaurantId,
      is_active: true,
    }).sort({ display_order: 1, createdAt: 1 });

    return res.status(200).json({ categories });
  } catch (error: any) {
    console.error("get_public_categories error:", error);
    return res
      .status(500)
      .json({ msg: "Server error fetching public categories", error: error.message });
  }
};

// 4. Update Category (Vendor)
// PUT /api/v1/menu/categories/:id
export const update_category = async (req: Request, res: Response) => {
  try {
    const restaurant = await getVendorRestaurant(req, res);
    if (!restaurant) return;

    const { id } = req.params;
    const { name, description, display_order, is_active } = req.body;

    const category = await MenuCategory.findOne({
      _id: id,
      restaurant: restaurant._id,
    });

    if (!category) {
      return res
        .status(404)
        .json({ msg: "Menu category not found or does not belong to your restaurant" });
    }

    if (name && typeof name === "string" && name.trim()) {
      const trimmedName = name.trim();
      if (trimmedName.toLowerCase() !== category.name.toLowerCase()) {
        const duplicate = await MenuCategory.findOne({
          restaurant: restaurant._id,
          _id: { $ne: category._id },
          name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
        });

        if (duplicate) {
          return res.status(400).json({
            msg: "Another category with this name already exists in your restaurant menu.",
          });
        }
        category.name = trimmedName;
      }
    }

    if (description !== undefined) category.description = description;
    if (display_order !== undefined) category.display_order = Number(display_order);
    if (is_active !== undefined) category.is_active = Boolean(is_active);

    await category.save();

    return res.status(200).json({
      msg: "Menu category updated successfully",
      category,
    });
  } catch (error: any) {
    console.error("update_category error:", error);
    return res
      .status(500)
      .json({ msg: "Server error updating category", error: error.message });
  }
};

// 5. Delete Category (Vendor)
// DELETE /api/v1/menu/categories/:id
export const delete_category = async (req: Request, res: Response) => {
  try {
    const restaurant = await getVendorRestaurant(req, res);
    if (!restaurant) return;

    const { id } = req.params;

    const category = await MenuCategory.findOne({
      _id: id,
      restaurant: restaurant._id,
    });

    if (!category) {
      return res
        .status(404)
        .json({ msg: "Menu category not found or does not belong to your restaurant" });
    }

    // CHECK: Are there active/non-deleted menu items under this category?
    const existingItemsCount = await MenuItem.countDocuments({
      category: category._id,
      is_deleted: { $ne: true },
    });

    if (existingItemsCount > 0) {
      return res.status(400).json({
        msg: `Cannot delete menu category "${category.name}". It contains ${existingItemsCount} active menu item(s). Please delete or reassign these items first.`,
        item_count: existingItemsCount,
      });
    }

    await MenuCategory.findByIdAndDelete(category._id);

    return res.status(200).json({
      msg: "Menu category deleted successfully",
      category_id: id,
    });
  } catch (error: any) {
    console.error("delete_category error:", error);
    return res
      .status(500)
      .json({ msg: "Server error deleting category", error: error.message });
  }
};

// ─── MENU ITEM CONTROLLERS ───────────────────────────────────────────────────

// 1. Create Menu Item (Vendor)
// POST /api/v1/menu/items
export const create_menu_item = async (req: Request, res: Response) => {
  try {
    const restaurant = await getVendorRestaurant(req, res);
    if (!restaurant) return;

    const {
      category_id,
      name,
      description,
      price,
      preparation_time_mins,
      options_groups,
      dietary_flags,
      is_available,
      display_order,
    } = req.body;

    if (!category_id) {
      return res.status(400).json({ msg: "category_id is required" });
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ msg: "Menu item name is required" });
    }

    if (price === undefined || price === null || isNaN(Number(price))) {
      return res.status(400).json({ msg: "Valid menu item price is required" });
    }

    // Verify category belongs to this vendor
    const category = await MenuCategory.findOne({
      _id: category_id,
      restaurant: restaurant._id,
    });

    if (!category) {
      return res.status(400).json({
        msg: "Selected menu category was not found or does not belong to your restaurant.",
      });
    }

    // Handle optional food item image upload
    let image_url = "";
    if (req.file) {
      image_url = await uploadToCloudinary(req.file.path, "restaurants/menu_items");
    }

    // Parse options_groups if sent as string (multipart/form-data)
    let parsedOptionsGroups = options_groups;
    if (typeof options_groups === "string") {
      try {
        parsedOptionsGroups = JSON.parse(options_groups);
      } catch (e) {
        parsedOptionsGroups = [];
      }
    }

    // Parse dietary_flags if sent as string
    let parsedDietaryFlags = dietary_flags;
    if (typeof dietary_flags === "string") {
      try {
        parsedDietaryFlags = JSON.parse(dietary_flags);
      } catch (e) {
        parsedDietaryFlags = dietary_flags.split(",").map((f: string) => f.trim());
      }
    }

    const menuItem = new MenuItem({
      restaurant: restaurant._id,
      category: category._id,
      name: name.trim(),
      description: description || "",
      price: Number(price),
      image: image_url,
      preparation_time_mins: preparation_time_mins ? Number(preparation_time_mins) : 20,
      options_groups: Array.isArray(parsedOptionsGroups) ? parsedOptionsGroups : [],
      dietary_flags: Array.isArray(parsedDietaryFlags) ? parsedDietaryFlags : [],
      is_available: is_available !== undefined ? Boolean(is_available) : true,
      display_order: display_order ? Number(display_order) : 0,
    });

    await menuItem.save();

    return res.status(201).json({
      msg: "Menu item created successfully",
      item: menuItem,
    });
  } catch (error: any) {
    console.error("create_menu_item error:", error);
    return res
      .status(500)
      .json({ msg: "Server error creating menu item", error: error.message });
  }
};

// 2. Get Vendor Menu Items (Vendor)
// GET /api/v1/menu/items/vendor
export const get_vendor_menu_items = async (req: Request, res: Response) => {
  try {
    const restaurant = await getVendorRestaurant(req, res);
    if (!restaurant) return;

    const items = await MenuItem.find({
      restaurant: restaurant._id,
      is_deleted: { $ne: true },
    })
      .populate("category", "name display_order is_active")
      .sort({ display_order: 1, createdAt: -1 });

    return res.status(200).json({ items });
  } catch (error: any) {
    console.error("get_vendor_menu_items error:", error);
    return res
      .status(500)
      .json({ msg: "Server error fetching vendor menu items", error: error.message });
  }
};

// 3. Get Public Menu Items for a Restaurant (Public / Customer)
// GET /api/v1/menu/items/restaurant/:restaurantId
export const get_public_menu_items = async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const { category_id } = req.query;

    const queryFilter: any = {
      restaurant: restaurantId,
      is_available: true,
      is_deleted: { $ne: true },
    };

    if (category_id) {
      queryFilter.category = category_id;
    }

    const items = await MenuItem.find(queryFilter)
      .populate("category", "name display_order")
      .sort({ display_order: 1, createdAt: -1 });

    return res.status(200).json({ items });
  } catch (error: any) {
    console.error("get_public_menu_items error:", error);
    return res
      .status(500)
      .json({ msg: "Server error fetching menu items", error: error.message });
  }
};

// 4. Get Single Menu Item Details
// GET /api/v1/menu/items/:id
export const get_menu_item_by_id = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const item = await MenuItem.findOne({
      _id: id,
      is_deleted: { $ne: true },
    })
      .populate("category", "name description")
      .populate("restaurant", "name logo banner is_online location rating");

    if (!item) {
      return res.status(404).json({ msg: "Menu item not found" });
    }

    return res.status(200).json({ item });
  } catch (error: any) {
    console.error("get_menu_item_by_id error:", error);
    return res
      .status(500)
      .json({ msg: "Server error fetching menu item details", error: error.message });
  }
};

// 5. Update Menu Item (Vendor)
// PUT /api/v1/menu/items/:id
export const update_menu_item = async (req: Request, res: Response) => {
  try {
    const restaurant = await getVendorRestaurant(req, res);
    if (!restaurant) return;

    const { id } = req.params;
    const {
      category_id,
      name,
      description,
      price,
      preparation_time_mins,
      options_groups,
      dietary_flags,
      is_available,
      display_order,
    } = req.body;

    const menuItem = await MenuItem.findOne({
      _id: id,
      restaurant: restaurant._id,
      is_deleted: { $ne: true },
    });

    if (!menuItem) {
      return res
        .status(404)
        .json({ msg: "Menu item not found or does not belong to your restaurant" });
    }

    if (category_id) {
      const category = await MenuCategory.findOne({
        _id: category_id,
        restaurant: restaurant._id,
      });

      if (!category) {
        return res.status(400).json({
          msg: "Selected menu category was not found or does not belong to your restaurant.",
        });
      }
      menuItem.category = category._id as mongoose.Types.ObjectId;
    }

    if (name && typeof name === "string") menuItem.name = name.trim();
    if (description !== undefined) menuItem.description = description;
    if (price !== undefined && !isNaN(Number(price))) menuItem.price = Number(price);
    if (preparation_time_mins !== undefined)
      menuItem.preparation_time_mins = Number(preparation_time_mins);

    if (req.file) {
      menuItem.image = await uploadToCloudinary(req.file.path, "restaurants/menu_items");
    }

    if (options_groups !== undefined) {
      let parsedOptionsGroups = options_groups;
      if (typeof options_groups === "string") {
        try {
          parsedOptionsGroups = JSON.parse(options_groups);
        } catch (e) {
          parsedOptionsGroups = menuItem.options_groups;
        }
      }
      if (Array.isArray(parsedOptionsGroups)) {
        menuItem.options_groups = parsedOptionsGroups;
      }
    }

    if (dietary_flags !== undefined) {
      let parsedDietaryFlags = dietary_flags;
      if (typeof dietary_flags === "string") {
        try {
          parsedDietaryFlags = JSON.parse(dietary_flags);
        } catch (e) {
          parsedDietaryFlags = dietary_flags.split(",").map((f: string) => f.trim());
        }
      }
      if (Array.isArray(parsedDietaryFlags)) {
        menuItem.dietary_flags = parsedDietaryFlags;
      }
    }

    if (is_available !== undefined) menuItem.is_available = Boolean(is_available);
    if (display_order !== undefined) menuItem.display_order = Number(display_order);

    await menuItem.save();

    return res.status(200).json({
      msg: "Menu item updated successfully",
      item: menuItem,
    });
  } catch (error: any) {
    console.error("update_menu_item error:", error);
    return res
      .status(500)
      .json({ msg: "Server error updating menu item", error: error.message });
  }
};

// 6. Toggle Item Availability (Vendor)
// PATCH /api/v1/menu/items/:id/toggle-availability
export const toggle_item_availability = async (req: Request, res: Response) => {
  try {
    const restaurant = await getVendorRestaurant(req, res);
    if (!restaurant) return;

    const { id } = req.params;

    const menuItem = await MenuItem.findOne({
      _id: id,
      restaurant: restaurant._id,
      is_deleted: { $ne: true },
    });

    if (!menuItem) {
      return res
        .status(404)
        .json({ msg: "Menu item not found or does not belong to your restaurant" });
    }

    menuItem.is_available = !menuItem.is_available;
    await menuItem.save();

    return res.status(200).json({
      msg: `Menu item availability set to ${menuItem.is_available ? "Available" : "Out of Stock"}`,
      is_available: menuItem.is_available,
      item: menuItem,
    });
  } catch (error: any) {
    console.error("toggle_item_availability error:", error);
    return res
      .status(500)
      .json({ msg: "Server error toggling availability", error: error.message });
  }
};

// 7. Soft Delete Menu Item (Vendor)
// DELETE /api/v1/menu/items/:id
export const delete_menu_item = async (req: Request, res: Response) => {
  try {
    const restaurant = await getVendorRestaurant(req, res);
    if (!restaurant) return;

    const { id } = req.params;

    const menuItem = await MenuItem.findOne({
      _id: id,
      restaurant: restaurant._id,
      is_deleted: { $ne: true },
    });

    if (!menuItem) {
      return res
        .status(404)
        .json({ msg: "Menu item not found or does not belong to your restaurant" });
    }

    menuItem.is_deleted = true;
    menuItem.deleted_at = new Date();
    menuItem.is_available = false;

    await menuItem.save();

    return res.status(200).json({
      msg: "Menu item deleted successfully",
      item_id: id,
    });
  } catch (error: any) {
    console.error("delete_menu_item error:", error);
    return res
      .status(500)
      .json({ msg: "Server error deleting menu item", error: error.message });
  }
};
