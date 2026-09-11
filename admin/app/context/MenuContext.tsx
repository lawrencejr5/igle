"use client";

import React, { createContext, useContext, useState } from "react";
import axios from "axios";
import { useAlert } from "./AlertContext";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MenuCategory {
  _id: string;
  restaurant: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  createdAt: string;
}

export interface MenuItem {
  _id: string;
  restaurant: string;
  category: {
    _id: string;
    name: string;
    display_order: number;
  };
  name: string;
  description?: string;
  price: number;
  image?: string;
  preparation_time_mins: number;
  options_groups: any[];
  dietary_flags: string[];
  is_available: boolean;
  display_order: number;
  is_deleted?: boolean;
  createdAt: string;
}

// ─── Context Type ─────────────────────────────────────────────────────────────

interface MenuContextType {
  categories: MenuCategory[];
  menuItems: MenuItem[];
  loading: boolean;
  fetchRestaurantMenu: (restaurantId: string) => Promise<void>;
  toggleMenuItem: (itemId: string) => Promise<boolean>;
  deleteMenuItem: (itemId: string) => Promise<boolean>;
  clearMenu: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);

  const { showAlert } = useAlert();

  const getAuthHeaders = () => {
    const admin_token = localStorage.getItem("admin_token");
    return { headers: { Authorization: `Bearer ${admin_token}` } };
  };

  const fetchRestaurantMenu = async (restaurantId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/admin/restaurants/${restaurantId}/menu`,
        getAuthHeaders()
      );
      setCategories(res.data.categories || []);
      setMenuItems(res.data.items || []);
    } catch (error: any) {
      showAlert(error.response?.data?.msg || "Failed to fetch menu", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleMenuItem = async (itemId: string): Promise<boolean> => {
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/admin/menu-items/${itemId}/toggle`,
        {},
        getAuthHeaders()
      );
      showAlert(res.data.msg || "Availability updated", "success");
      setMenuItems((prev) =>
        prev.map((item) =>
          item._id === itemId
            ? { ...item, is_available: res.data.is_available }
            : item
        )
      );
      return true;
    } catch (error: any) {
      showAlert(error.response?.data?.msg || "Failed to toggle availability", "error");
      return false;
    }
  };

  const deleteMenuItem = async (itemId: string): Promise<boolean> => {
    try {
      const res = await axios.delete(
        `${API_BASE_URL}/admin/menu-items/${itemId}`,
        getAuthHeaders()
      );
      showAlert(res.data.msg || "Menu item deleted", "success");
      setMenuItems((prev) => prev.filter((item) => item._id !== itemId));
      return true;
    } catch (error: any) {
      showAlert(error.response?.data?.msg || "Failed to delete menu item", "error");
      return false;
    }
  };

  const clearMenu = () => {
    setCategories([]);
    setMenuItems([]);
  };

  return (
    <MenuContext.Provider
      value={{
        categories,
        menuItems,
        loading,
        fetchRestaurantMenu,
        toggleMenuItem,
        deleteMenuItem,
        clearMenu,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};

export const useMenuContext = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error("useMenuContext must be used within a MenuProvider");
  }
  return context;
};
