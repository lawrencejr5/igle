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

export interface FoodOrderItemSnapshot {
  _id?: string;
  menu_item_id: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  selected_options: {
    group_name: string;
    option_name: string;
    price_modifier: number;
  }[];
  special_instructions?: string;
  item_total: number;
}

export interface FoodOrderType {
  _id: string;
  order_number: string;
  customer: {
    _id: string;
    name: string;
    phone?: string;
    profile_pic?: string;
  } | string;
  restaurant: {
    _id: string;
    name: string;
    logo?: string;
    phone?: string;
  } | string;
  driver?: {
    _id: string;
    name: string;
    phone?: string;
  } | string;
  items: FoodOrderItemSnapshot[];
  delivery_address: {
    address: string;
    landmark?: string;
    coordinates: [number, number];
    contact_name: string;
    contact_phone: string;
  };
  restaurant_address: {
    name: string;
    address: string;
    coordinates: [number, number];
    phone: string;
  };
  pricing: {
    subtotal: number;
    delivery_fee: number;
    service_fee: number;
    discount: number;
    total: number;
    restaurant_earnings: number;
    driver_earnings: number;
    platform_commission: number;
  };
  payment: {
    method: "cash" | "card" | "wallet";
    status: "unpaid" | "paid" | "refunded";
    transaction_reference?: string;
  };
  status:
    | "placed"
    | "preparing"
    | "ready_for_pickup"
    | "in_transit"
    | "delivered"
    | "cancelled"
    | "rejected";
  cancellation?: {
    cancelled_by?: "customer" | "restaurant" | "driver" | "system" | "admin";
    reason?: string;
  };
  status_timestamps?: {
    placed_at?: string;
    preparing_at?: string;
    ready_at?: string;
    in_transit_at?: string;
    delivered_at?: string;
    cancelled_at?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

interface FoodOrderContextType {
  vendorOrders: FoodOrderType[];
  setVendorOrders: Dispatch<SetStateAction<FoodOrderType[]>>;
  customerOrders: FoodOrderType[];
  setCustomerOrders: Dispatch<SetStateAction<FoodOrderType[]>>;
  activeOrder: FoodOrderType | null;
  setActiveOrder: Dispatch<SetStateAction<FoodOrderType | null>>;
  loading: boolean;

  // Vendor Functions
  fetchVendorOrders: (status?: string) => Promise<FoodOrderType[]>;
  acceptOrder: (orderId: string) => Promise<FoodOrderType | null>;
  rejectOrder: (orderId: string, reason?: string) => Promise<FoodOrderType | null>;
  markOrderReady: (orderId: string) => Promise<FoodOrderType | null>;
  markOrderDelivered: (orderId: string) => Promise<FoodOrderType | null>;
  payDeliveryRider: (orderId: string) => Promise<boolean>;
  retryDeliveryRider: (orderId: string) => Promise<boolean>;
  fetchRestaurantDeliveries: () => Promise<any[]>;
  getFoodOrderDelivery: (orderId: string) => Promise<any | null>;

  // Customer Functions
  placeFoodOrder: (orderPayload: {
    restaurant_id: string;
    delivery_address: {
      address: string;
      landmark?: string;
      coordinates: [number, number];
      contact_name: string;
      contact_phone: string;
    };
    payment_method: "cash" | "card" | "wallet";
  }) => Promise<FoodOrderType | null>;
  fetchCustomerOrders: () => Promise<FoodOrderType[]>;
  cancelFoodOrder: (orderId: string, reason?: string) => Promise<FoodOrderType | null>;

  // Detail Function
  fetchOrderById: (orderId: string) => Promise<FoodOrderType | null>;
}

const FoodOrderContext = createContext<FoodOrderContextType | null>(null);

export const FoodOrderProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { showNotification } = useNotificationContext()!;
  const [vendorOrders, setVendorOrders] = useState<FoodOrderType[]>([]);
  const [customerOrders, setCustomerOrders] = useState<FoodOrderType[]>([]);
  const [activeOrder, setActiveOrder] = useState<FoodOrderType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const getAuthToken = async () => {
    return (
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("userToken"))
    );
  };

  // ─── Vendor Operations ──────────────────────────────────────────────────────

  const fetchVendorOrders = async (status?: string): Promise<FoodOrderType[]> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return [];

      let url = `${API_URLS.orders}/vendor`;
      if (status) {
        url += `?status=${status}`;
      }

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data?.orders) {
        setVendorOrders(data.orders);
        return data.orders;
      }
      return [];
    } catch (err: any) {
      console.log("fetchVendorOrders error:", err?.response?.data || err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId: string): Promise<FoodOrderType | null> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Auth token missing");

      const { data } = await axios.post(
        `${API_URLS.orders}/${orderId}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.order) {
        setVendorOrders((prev) =>
          prev.map((o) => (o._id === orderId ? data.order : o))
        );
        showNotification("Order accepted & moved to Kitchen!", "success");
        return data.order;
      }
      return null;
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.message || "Failed to accept order";
      showNotification(msg, "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const rejectOrder = async (
    orderId: string,
    reason?: string
  ): Promise<FoodOrderType | null> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Auth token missing");

      const { data } = await axios.post(
        `${API_URLS.orders}/${orderId}/reject`,
        { reason: reason || "Vendor unable to fulfill order" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.order) {
        setVendorOrders((prev) =>
          prev.map((o) => (o._id === orderId ? data.order : o))
        );
        showNotification("Order declined", "info");
        return data.order;
      }
      return null;
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.message || "Failed to decline order";
      showNotification(msg, "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const markOrderReady = async (
    orderId: string
  ): Promise<FoodOrderType | null> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Auth token missing");

      const { data } = await axios.post(
        `${API_URLS.orders}/${orderId}/ready`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.order) {
        setVendorOrders((prev) =>
          prev.map((o) => (o._id === orderId ? data.order : o))
        );
        showNotification("Order marked Ready for Pickup!", "success");
        return data.order;
      }
      return null;
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.message || "Failed to update order status";
      showNotification(msg, "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const markOrderDelivered = async (
    orderId: string
  ): Promise<FoodOrderType | null> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Auth token missing");

      const { data } = await axios.post(
        `${API_URLS.orders}/${orderId}/deliver`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.order) {
        setVendorOrders((prev) =>
          prev.map((o) => (o._id === orderId ? data.order : o))
        );
        showNotification("Order marked as Delivered! Vendor wallet credited.", "success");
        return data.order;
      }
      return null;
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.message || "Failed to mark order as delivered";
      showNotification(msg, "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const payDeliveryRider = async (orderId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Auth token missing");

      const { data } = await axios.post(
        `${API_URLS.orders}/${orderId}/pay-delivery`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.delivery) {
        showNotification("Delivery fee paid to rider successfully! 🏍️", "success");
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.message || "Failed to pay delivery rider";
      showNotification(msg, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const retryDeliveryRider = async (orderId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Auth token missing");

      const { data } = await axios.post(
        `${API_URLS.orders}/${orderId}/retry-delivery`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.delivery) {
        showNotification("Searching for nearby bike rider again... 🏍️", "info");
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.message || "Failed to retry driver search";
      showNotification(msg, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantDeliveries = async (): Promise<any[]> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return [];

      const { data } = await axios.get(`${API_URLS.orders}/vendor/deliveries`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return data?.deliveries || [];
    } catch (err: any) {
      console.log("fetchRestaurantDeliveries error:", err?.response?.data || err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getFoodOrderDelivery = async (orderId: string): Promise<any | null> => {
    try {
      const token = await getAuthToken();
      if (!token) return null;

      const { data } = await axios.get(`${API_URLS.orders}/${orderId}/delivery`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return data?.delivery || null;
    } catch (err: any) {
      console.log("getFoodOrderDelivery error:", err?.response?.data || err.message);
      return null;
    }
  };


  // ─── Customer Operations ────────────────────────────────────────────────────

  const placeFoodOrder = async (orderPayload: {
    restaurant_id: string;
    delivery_address: {
      address: string;
      landmark?: string;
      coordinates: [number, number];
      contact_name: string;
      contact_phone: string;
    };
    payment_method: "cash" | "card" | "wallet";
  }): Promise<FoodOrderType | null> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Auth token missing");

      const { data } = await axios.post(
        `${API_URLS.orders}/place`,
        orderPayload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.order) {
        setCustomerOrders((prev) => [data.order, ...prev]);
        showNotification("Food order placed successfully!", "success");
        return data.order;
      }
      return null;
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.message || "Failed to place food order";
      showNotification(msg, "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerOrders = async (): Promise<FoodOrderType[]> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return [];

      const { data } = await axios.get(`${API_URLS.orders}/customer`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data?.orders) {
        setCustomerOrders(data.orders);
        return data.orders;
      }
      return [];
    } catch (err: any) {
      console.log("fetchCustomerOrders error:", err?.response?.data || err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const cancelFoodOrder = async (
    orderId: string,
    reason?: string
  ): Promise<FoodOrderType | null> => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Auth token missing");

      const { data } = await axios.post(
        `${API_URLS.orders}/${orderId}/cancel`,
        { reason: reason || "Cancelled by user" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.order) {
        setCustomerOrders((prev) =>
          prev.map((o) => (o._id === orderId ? data.order : o))
        );
        showNotification("Order cancelled", "info");
        return data.order;
      }
      return null;
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.message || "Failed to cancel order";
      showNotification(msg, "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderById = async (orderId: string): Promise<FoodOrderType | null> => {
    try {
      const token = await getAuthToken();
      if (!token) return null;

      const { data } = await axios.get(`${API_URLS.orders}/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data?.order) {
        setActiveOrder(data.order);
        return data.order;
      }
      return null;
    } catch (err: any) {
      console.log("fetchOrderById error:", err);
      return null;
    }
  };

  return (
    <FoodOrderContext.Provider
      value={{
        vendorOrders,
        setVendorOrders,
        customerOrders,
        setCustomerOrders,
        activeOrder,
        setActiveOrder,
        loading,
        fetchVendorOrders,
        acceptOrder,
        rejectOrder,
        markOrderReady,
        markOrderDelivered,
        payDeliveryRider,
        retryDeliveryRider,
        fetchRestaurantDeliveries,
        getFoodOrderDelivery,
        placeFoodOrder,
        fetchCustomerOrders,
        cancelFoodOrder,
        fetchOrderById,
      }}
    >
      {children}
    </FoodOrderContext.Provider>
  );
};

export const useFoodOrderContext = () => {
  const context = useContext(FoodOrderContext);
  if (!context) {
    throw new Error("useFoodOrderContext must be used within a FoodOrderProvider");
  }
  return context;
};

export default FoodOrderProvider;
