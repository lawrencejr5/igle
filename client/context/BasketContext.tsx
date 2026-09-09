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

export interface BasketSelectedOption {
  group_name: string;
  option_name: string;
  price_modifier: number;
}

export interface BasketItem {
  _id?: string;
  menu_item: {
    _id: string;
    name: string;
    price: number;
    image?: string;
  } | string;
  quantity: number;
  unit_price: number;
  selected_options: BasketSelectedOption[];
  special_instructions?: string;
  item_total: number;
}

export interface BasketType {
  _id?: string;
  user: string;
  restaurant: string;
  items: BasketItem[];
  subtotal: number;
  createdAt?: string;
  updatedAt?: string;
}

interface BasketContextType {
  basket: BasketType | null;
  setBasket: Dispatch<SetStateAction<BasketType | null>>;
  loading: boolean;

  fetchBasket: (restaurantId: string) => Promise<BasketType | null>;
  addItemToBasket: (
    restaurantId: string,
    menuItemId: string,
    quantity: number,
    selectedOptions?: BasketSelectedOption[],
    specialInstructions?: string
  ) => Promise<BasketType | null>;
  updateItemQuantity: (
    itemId: string,
    quantity: number,
    restaurantId: string
  ) => Promise<BasketType | null>;
  removeItemFromBasket: (
    itemId: string,
    restaurantId: string
  ) => Promise<BasketType | null>;
  clearBasket: (restaurantId: string) => Promise<boolean>;
}

const BasketContext = createContext<BasketContextType | null>(null);

export const BasketProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { showNotification } = useNotificationContext()!;
  const [basket, setBasket] = useState<BasketType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const getAuthToken = async () => {
    return (
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("userToken"))
    );
  };

  const fetchBasket = async (restaurantId: string): Promise<BasketType | null> => {
    if (!restaurantId) return null;
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return null;

      const { data } = await axios.get(
        `${API_URLS.basket}?restaurant_id=${restaurantId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.basket) {
        setBasket(data.basket);
        return data.basket;
      }
      setBasket(null);
      return null;
    } catch (err: any) {
      console.log("fetchBasket error:", err?.response?.data || err.message);
      setBasket(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const addItemToBasket = async (
    restaurantId: string,
    menuItemId: string,
    quantity: number,
    selectedOptions: BasketSelectedOption[] = [],
    specialInstructions: string = ""
  ): Promise<BasketType | null> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Auth token missing");

      const { data } = await axios.post(
        `${API_URLS.basket}/add`,
        {
          restaurant_id: restaurantId,
          menu_item_id: menuItemId,
          quantity,
          selected_options: selectedOptions,
          special_instructions: specialInstructions,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.basket) {
        setBasket(data.basket);
        showNotification("Item added to basket", "success");
        return data.basket;
      }
      return null;
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.message || "Failed to add item to basket";
      showNotification(msg, "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateItemQuantity = async (
    itemId: string,
    quantity: number,
    restaurantId: string
  ): Promise<BasketType | null> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Auth token missing");

      const { data } = await axios.patch(
        `${API_URLS.basket}/items/${itemId}`,
        { quantity, restaurant_id: restaurantId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.basket) {
        setBasket(data.basket);
        return data.basket;
      }
      return null;
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.message || "Failed to update quantity";
      showNotification(msg, "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const removeItemFromBasket = async (
    itemId: string,
    restaurantId: string
  ): Promise<BasketType | null> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Auth token missing");

      const { data } = await axios.delete(
        `${API_URLS.basket}/items/${itemId}?restaurant_id=${restaurantId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.basket) {
        setBasket(data.basket);
        showNotification("Item removed from basket", "info");
        return data.basket;
      }
      setBasket(null);
      return null;
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.message || "Failed to remove item";
      showNotification(msg, "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearBasket = async (restaurantId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Auth token missing");

      await axios.delete(
        `${API_URLS.basket}?restaurant_id=${restaurantId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setBasket(null);
      showNotification("Basket cleared", "info");
      return true;
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.message || "Failed to clear basket";
      showNotification(msg, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <BasketContext.Provider
      value={{
        basket,
        setBasket,
        loading,
        fetchBasket,
        addItemToBasket,
        updateItemQuantity,
        removeItemFromBasket,
        clearBasket,
      }}
    >
      {children}
    </BasketContext.Provider>
  );
};

export const useBasketContext = () => {
  const context = useContext(BasketContext);
  if (!context) {
    throw new Error("useBasketContext must be used within a BasketProvider");
  }
  return context;
};

export default BasketProvider;
