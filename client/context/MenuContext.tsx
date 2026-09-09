import React, {
  createContext,
  useContext,
  useState,
  FC,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URLS } from "../data/constants";
import { useNotificationContext } from "./NotificationContext";

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface MenuCategory {
  _id: string;
  restaurant: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItemOption {
  name: string;
  price_modifier: number;
  is_available: boolean;
}

export interface MenuItemOptionGroup {
  name: string;
  required: boolean;
  min_selection: number;
  max_selection: number;
  options: MenuItemOption[];
}

export interface MenuItem {
  _id: string;
  restaurant: string;
  category: MenuCategory | string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  is_available: boolean;
  preparation_time_mins: number;
  options_groups: MenuItemOptionGroup[];
  dietary_flags: string[];
  display_order: number;
  is_deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface MenuContextType {
  categories: MenuCategory[];
  setCategories: Dispatch<SetStateAction<MenuCategory[]>>;
  menuItems: MenuItem[];
  setMenuItems: Dispatch<SetStateAction<MenuItem[]>>;
  loading: boolean;

  // Category Actions
  fetchVendorCategories: () => Promise<MenuCategory[]>;
  createCategory: (data: {
    name: string;
    description?: string;
    display_order?: number;
  }) => Promise<MenuCategory | null>;
  updateCategory: (
    id: string,
    data: Partial<MenuCategory>
  ) => Promise<MenuCategory | null>;
  deleteCategory: (id: string) => Promise<boolean>;

  // Menu Item Actions
  fetchVendorMenuItems: (categoryId?: string) => Promise<MenuItem[]>;
  createMenuItem: (formData: FormData) => Promise<MenuItem | null>;
  updateMenuItem: (id: string, formData: FormData) => Promise<MenuItem | null>;
  toggleItemAvailability: (id: string) => Promise<boolean>;
  deleteMenuItem: (id: string) => Promise<boolean>;

  // Public Actions for Customers
  fetchPublicCategories: (restaurantId: string) => Promise<MenuCategory[]>;
  fetchPublicMenuItems: (
    restaurantId: string,
    categoryId?: string
  ) => Promise<MenuItem[]>;
  fetchMenuItemDetails: (id: string) => Promise<MenuItem | null>;
}

const MenuContext = createContext<MenuContextType | null>(null);

export const MenuProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { showNotification } = useNotificationContext()!;
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const getAuthToken = async () => {
    return (
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("userToken"))
    );
  };

  // ─── Category Operations ────────────────────────────────────────────────────

  const fetchVendorCategories = async (): Promise<MenuCategory[]> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return [];

      const { data } = await axios.get(`${API_URLS.menu}/categories/vendor`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data?.categories) {
        setCategories(data.categories);
        return data.categories;
      }
      return [];
    } catch (err: any) {
      console.log("fetchVendorCategories error:", err?.response?.data || err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (catData: {
    name: string;
    description?: string;
    display_order?: number;
  }): Promise<MenuCategory | null> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Auth token missing");

      const { data } = await axios.post(
        `${API_URLS.menu}/categories`,
        catData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.category) {
        setCategories((prev) => [...prev, data.category]);
        showNotification("Menu category created successfully", "success");
        return data.category;
      }
      return null;
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.message || "Failed to create category";
      showNotification(msg, "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (
    id: string,
    catData: Partial<MenuCategory>
  ): Promise<MenuCategory | null> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Auth token missing");

      const { data } = await axios.put(
        `${API_URLS.menu}/categories/${id}`,
        catData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.category) {
        setCategories((prev) =>
          prev.map((c) => (c._id === id ? data.category : c))
        );
        showNotification("Category updated successfully", "success");
        return data.category;
      }
      return null;
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.message || "Failed to update category";
      showNotification(msg, "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Auth token missing");

      await axios.delete(`${API_URLS.menu}/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCategories((prev) => prev.filter((c) => c._id !== id));
      showNotification("Category deleted", "success");
      return true;
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.message || "Failed to delete category";
      showNotification(msg, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ─── Menu Item Operations ──────────────────────────────────────────────────

  const fetchVendorMenuItems = async (categoryId?: string): Promise<MenuItem[]> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return [];

      let url = `${API_URLS.menu}/items/vendor`;
      if (categoryId) {
        url += `?category_id=${categoryId}`;
      }

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data?.items) {
        setMenuItems(data.items);
        return data.items;
      }
      return [];
    } catch (err: any) {
      console.log("fetchVendorMenuItems error:", err?.response?.data || err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createMenuItem = async (formData: FormData): Promise<MenuItem | null> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Auth token missing");

      const { data } = await axios.post(`${API_URLS.menu}/items`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (data?.item) {
        setMenuItems((prev) => [data.item, ...prev]);
        showNotification("Menu item added successfully", "success");
        return data.item;
      }
      return null;
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.message || "Failed to create menu item";
      showNotification(msg, "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateMenuItem = async (
    id: string,
    formData: FormData
  ): Promise<MenuItem | null> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Auth token missing");

      const { data } = await axios.put(
        `${API_URLS.menu}/items/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (data?.item) {
        setMenuItems((prev) =>
          prev.map((item) => (item._id === id ? data.item : item))
        );
        showNotification("Menu item updated successfully", "success");
        return data.item;
      }
      return null;
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.message || "Failed to update menu item";
      showNotification(msg, "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const toggleItemAvailability = async (id: string): Promise<boolean> => {
    try {
      const token = await getAuthToken();
      if (!token) return false;

      const { data } = await axios.patch(
        `${API_URLS.menu}/items/${id}/toggle-availability`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.item) {
        setMenuItems((prev) =>
          prev.map((item) => (item._id === id ? data.item : item))
        );
        showNotification(data.msg || "Item availability updated", "success");
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.message || "Failed to update status";
      showNotification(msg, "error");
      return false;
    }
  };

  const deleteMenuItem = async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Auth token missing");

      await axios.delete(`${API_URLS.menu}/items/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMenuItems((prev) => prev.filter((item) => item._id !== id));
      showNotification("Menu item deleted", "success");
      return true;
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.message || "Failed to delete menu item";
      showNotification(msg, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ─── Public Operations ─────────────────────────────────────────────────────

  const fetchPublicCategories = async (
    restaurantId: string
  ): Promise<MenuCategory[]> => {
    try {
      const { data } = await axios.get(
        `${API_URLS.menu}/categories/restaurant/${restaurantId}`
      );
      return data?.categories || [];
    } catch (err) {
      console.log("fetchPublicCategories error:", err);
      return [];
    }
  };

  const fetchPublicMenuItems = async (
    restaurantId: string,
    categoryId?: string
  ): Promise<MenuItem[]> => {
    try {
      let url = `${API_URLS.menu}/items/restaurant/${restaurantId}`;
      if (categoryId) {
        url += `?category_id=${categoryId}`;
      }
      const { data } = await axios.get(url);
      return data?.items || [];
    } catch (err) {
      console.log("fetchPublicMenuItems error:", err);
      return [];
    }
  };

  const fetchMenuItemDetails = async (id: string): Promise<MenuItem | null> => {
    try {
      const { data } = await axios.get(
        `${API_URLS.menu}/items/details/${id}`
      );
      return data?.item || null;
    } catch (err) {
      console.log("fetchMenuItemDetails error:", err);
      return null;
    }
  };

  return (
    <MenuContext.Provider
      value={{
        categories,
        setCategories,
        menuItems,
        setMenuItems,
        loading,
        fetchVendorCategories,
        createCategory,
        updateCategory,
        deleteCategory,
        fetchVendorMenuItems,
        createMenuItem,
        updateMenuItem,
        toggleItemAvailability,
        deleteMenuItem,
        fetchPublicCategories,
        fetchPublicMenuItems,
        fetchMenuItemDetails,
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

export default MenuProvider;
