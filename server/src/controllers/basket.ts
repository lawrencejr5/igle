import { Request, Response } from "express";
import mongoose from "mongoose";
import Basket from "../models/basket";
import MenuItem from "../models/menuItem";
import Restaurant from "../models/restaurant";

// 1. Get User Basket(s)
// GET /api/v1/basket
// Optional query: ?restaurant_id=xxx
export const get_user_basket = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    const { restaurant_id } = req.query;

    if (restaurant_id) {
      const basket = await Basket.findOne({
        user: user_id,
        restaurant: restaurant_id,
      })
        .populate(
          "restaurant",
          "name logo banner location is_online category_tags rating"
        )
        .populate({
          path: "items.menu_item",
          select: "name price image is_available preparation_time_mins",
        });

      return res.status(200).json({ basket: basket || null });
    }

    // Return all active restaurant baskets for the customer
    const baskets = await Basket.find({ user: user_id })
      .populate(
        "restaurant",
        "name logo banner location is_online category_tags rating"
      )
      .populate({
        path: "items.menu_item",
        select: "name price image is_available preparation_time_mins",
      })
      .sort({ updatedAt: -1 });

    return res.status(200).json({ baskets });
  } catch (error: any) {
    console.error("get_user_basket error:", error);
    return res
      .status(500)
      .json({ msg: "Server error fetching baskets", error: error.message });
  }
};

// 2. Add Item to Basket (Stores item in specific restaurant basket)
// POST /api/v1/basket/add
export const add_item_to_basket = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    const { menu_item_id, quantity, selected_options, special_instructions } =
      req.body;

    if (!menu_item_id) {
      return res.status(400).json({ msg: "menu_item_id is required" });
    }

    const qty = quantity && Number(quantity) > 0 ? Number(quantity) : 1;

    // Fetch menu item
    const menuItem = await MenuItem.findOne({
      _id: menu_item_id,
      is_deleted: { $ne: true },
    });

    if (!menuItem) {
      return res.status(404).json({ msg: "Menu item not found" });
    }

    if (!menuItem.is_available) {
      return res
        .status(400)
        .json({ msg: `"${menuItem.name}" is currently out of stock` });
    }

    // Verify restaurant is active
    const restaurant = await Restaurant.findOne({
      _id: menuItem.restaurant,
      is_deleted: { $ne: true },
    });

    if (!restaurant) {
      return res.status(404).json({ msg: "Associated restaurant not found" });
    }

    // Find or create basket specifically for THIS user and THIS restaurant
    let basket = await Basket.findOne({
      user: user_id,
      restaurant: menuItem.restaurant,
    });

    // Calculate options price modifiers
    const parsedOptions = Array.isArray(selected_options)
      ? selected_options
      : [];
    let optionsExtraPrice = 0;
    parsedOptions.forEach((opt: any) => {
      if (opt.price_modifier && !isNaN(Number(opt.price_modifier))) {
        optionsExtraPrice += Number(opt.price_modifier);
      }
    });

    const unitPrice = menuItem.price;
    const itemTotal = (unitPrice + optionsExtraPrice) * qty;
    const menuItemId = menuItem._id as mongoose.Types.ObjectId;

    if (!basket) {
      basket = new Basket({
        user: user_id,
        restaurant: menuItem.restaurant,
        items: [
          {
            menu_item: menuItemId,
            quantity: qty,
            unit_price: unitPrice,
            selected_options: parsedOptions,
            special_instructions: special_instructions || "",
            item_total: itemTotal,
          },
        ],
        subtotal: itemTotal,
      });
    } else {
      // Helper to check if item options match
      const optionsMatch = (opts1: any[], opts2: any[]) => {
        if (opts1.length !== opts2.length) return false;
        const s1 = opts1
          .map((o) => `${o.group_name}:${o.option_name}`)
          .sort()
          .join("|");
        const s2 = opts2
          .map((o) => `${o.group_name}:${o.option_name}`)
          .sort()
          .join("|");
        return s1 === s2;
      };

      const existingIndex = basket.items.findIndex(
        (item) =>
          item.menu_item.toString() === menuItemId.toString() &&
          optionsMatch(item.selected_options || [], parsedOptions)
      );

      if (existingIndex > -1) {
        // Increment quantity
        const updatedQty = basket.items[existingIndex].quantity + qty;
        basket.items[existingIndex].quantity = updatedQty;
        basket.items[existingIndex].item_total =
          (unitPrice + optionsExtraPrice) * updatedQty;
        if (special_instructions) {
          basket.items[existingIndex].special_instructions =
            special_instructions;
        }
      } else {
        // Push new item entry
        basket.items.push({
          menu_item: menuItemId,
          quantity: qty,
          unit_price: unitPrice,
          selected_options: parsedOptions,
          special_instructions: special_instructions || "",
          item_total: itemTotal,
        });
      }

      // Recalculate basket subtotal
      basket.subtotal = basket.items.reduce(
        (sum, item) => sum + (item.item_total || 0),
        0
      );
    }

    await basket.save();

    await basket.populate([
      { path: "restaurant", select: "name logo location is_online" },
      { path: "items.menu_item", select: "name price image is_available" },
    ]);

    return res.status(200).json({
      msg: `Item added to ${restaurant.name} basket`,
      basket,
    });
  } catch (error: any) {
    console.error("add_item_to_basket error:", error);
    return res
      .status(500)
      .json({ msg: "Server error adding item to basket", error: error.message });
  }
};

// 3. Update Basket Item Quantity
// PATCH /api/v1/basket/items/:itemId
export const update_basket_item_quantity = async (
  req: Request,
  res: Response
) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || isNaN(Number(quantity))) {
      return res.status(400).json({ msg: "Valid quantity is required" });
    }

    const newQty = Number(quantity);

    // Find basket containing this itemId for the user
    const basket = await Basket.findOne({
      user: user_id,
      "items._id": itemId,
    });

    if (!basket) {
      return res.status(404).json({ msg: "Item not found in any active basket" });
    }

    const itemIndex = basket.items.findIndex(
      (item) => item._id?.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ msg: "Item not found in basket" });
    }

    if (newQty <= 0) {
      basket.items.splice(itemIndex, 1);
    } else {
      const item = basket.items[itemIndex];
      let optionsExtra = 0;
      (item.selected_options || []).forEach((opt) => {
        optionsExtra += opt.price_modifier || 0;
      });

      item.quantity = newQty;
      item.item_total = (item.unit_price + optionsExtra) * newQty;
    }

    // If basket items empty after removal, delete basket
    if (basket.items.length === 0) {
      await Basket.findByIdAndDelete(basket._id);
      return res.status(200).json({
        msg: "Basket item removed and empty basket cleared",
        basket: null,
      });
    }

    // Recalculate subtotal
    basket.subtotal = basket.items.reduce(
      (sum, item) => sum + (item.item_total || 0),
      0
    );

    await basket.save();

    await basket.populate([
      { path: "restaurant", select: "name logo location is_online" },
      { path: "items.menu_item", select: "name price image is_available" },
    ]);

    return res.status(200).json({
      msg: "Basket item updated",
      basket,
    });
  } catch (error: any) {
    console.error("update_basket_item_quantity error:", error);
    return res
      .status(500)
      .json({ msg: "Server error updating basket item", error: error.message });
  }
};

// 4. Remove Item from Basket
// DELETE /api/v1/basket/items/:itemId
export const remove_item_from_basket = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    const { itemId } = req.params;
    const basket = await Basket.findOne({
      user: user_id,
      "items._id": itemId,
    });

    if (!basket) {
      return res.status(404).json({ msg: "Item not found in any active basket" });
    }

    basket.items = basket.items.filter(
      (item) => item._id?.toString() !== itemId
    );

    if (basket.items.length === 0) {
      await Basket.findByIdAndDelete(basket._id);
      return res.status(200).json({
        msg: "Item removed and empty basket cleared",
        basket: null,
      });
    }

    basket.subtotal = basket.items.reduce(
      (sum, item) => sum + (item.item_total || 0),
      0
    );

    await basket.save();

    await basket.populate([
      { path: "restaurant", select: "name logo location is_online" },
      { path: "items.menu_item", select: "name price image is_available" },
    ]);

    return res.status(200).json({
      msg: "Item removed from basket",
      basket,
    });
  } catch (error: any) {
    console.error("remove_item_from_basket error:", error);
    return res
      .status(500)
      .json({ msg: "Server error removing basket item", error: error.message });
  }
};

// 5. Clear Basket (Clears specific restaurant basket or all)
// DELETE /api/v1/basket
// Optional query: ?restaurant_id=xxx
export const clear_basket = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    const { restaurant_id } = req.query;

    if (restaurant_id) {
      await Basket.findOneAndDelete({
        user: user_id,
        restaurant: restaurant_id,
      });
    } else {
      await Basket.deleteMany({ user: user_id });
    }

    return res.status(200).json({
      msg: restaurant_id
        ? "Restaurant basket cleared successfully"
        : "All user baskets cleared successfully",
      basket: null,
    });
  } catch (error: any) {
    console.error("clear_basket error:", error);
    return res
      .status(500)
      .json({ msg: "Server error clearing basket", error: error.message });
  }
};
