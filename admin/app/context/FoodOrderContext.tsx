"use client";

import React, { createContext, useContext, useState } from "react";
import axios from "axios";
import { useAlert } from "./AlertContext";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FoodOrderStatus =
  | "placed"
  | "preparing"
  | "ready_for_pickup"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "rejected";

export interface FoodOrder {
  _id: string;
  order_number: string;
  customer: {
    _id: string;
    name: string;
    phone?: string;
    profile_pic?: string;
    email?: string;
  };
  restaurant: {
    _id: string;
    name: string;
    logo?: string;
    phone?: string;
    location?: any;
    category_tags?: string[];
  };
  items: {
    menu_item_id: string;
    name: string;
    image?: string;
    price: number;
    quantity: number;
    selected_options: any[];
    special_instructions?: string;
    item_total: number;
  }[];
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
    method: string;
    status: string;
    transaction_reference: string;
  };
  status: FoodOrderStatus;
  status_timestamps: {
    placed_at?: string;
    preparing_at?: string;
    ready_at?: string;
    in_transit_at?: string;
    delivered_at?: string;
    cancelled_at?: string;
  };
  cancellation?: {
    cancelled_by?: string;
    reason?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ─── Context Type ─────────────────────────────────────────────────────────────

interface FoodOrderContextType {
  orders: FoodOrder[];
  currentOrder: FoodOrder | null;
  totalOrders: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  fetchFoodOrders: (
    page?: number,
    limit?: number,
    filters?: { status?: string; search?: string; dateFrom?: string; dateTo?: string }
  ) => Promise<void>;
  fetchFoodOrderById: (id: string) => Promise<void>;
  updateFoodOrderStatus: (id: string, status: FoodOrderStatus) => Promise<boolean>;
  cancelFoodOrder: (id: string, reason: string) => Promise<boolean>;
  deleteFoodOrder: (id: string) => Promise<boolean>;
  clearCurrentOrder: () => void;
}

const FoodOrderContext = createContext<FoodOrderContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const FoodOrderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [currentOrder, setCurrentOrder] = useState<FoodOrder | null>(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const { showAlert } = useAlert();

  const getAuthHeaders = () => {
    const admin_token = localStorage.getItem("admin_token");
    return { headers: { Authorization: `Bearer ${admin_token}` } };
  };

  const fetchFoodOrders = async (
    page = 1,
    limit = 10,
    filters?: { status?: string; search?: string; dateFrom?: string; dateTo?: string }
  ) => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (filters?.status) params.status = filters.status;
      if (filters?.search) params.search = filters.search;
      if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters?.dateTo) params.dateTo = filters.dateTo;

      const res = await axios.get(`${API_BASE_URL}/admin/food-orders`, {
        ...getAuthHeaders(),
        params,
      });

      setOrders(res.data.orders);
      setTotalOrders(res.data.rowCount);
      setCurrentPage(res.data.currentPage);
      setTotalPages(res.data.totalPages);
    } catch (error: any) {
      showAlert(error.response?.data?.msg || "Failed to fetch food orders", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchFoodOrderById = async (id: string) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/admin/food-orders/${id}`,
        getAuthHeaders()
      );
      setCurrentOrder(res.data.order);
    } catch (error: any) {
      showAlert(error.response?.data?.msg || "Failed to fetch order details", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateFoodOrderStatus = async (
    id: string,
    status: FoodOrderStatus
  ): Promise<boolean> => {
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/admin/food-orders/${id}/status`,
        { status },
        getAuthHeaders()
      );
      showAlert(res.data.msg || "Order status updated", "success");
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status } : o))
      );
      if (currentOrder?._id === id) {
        setCurrentOrder((prev) => (prev ? { ...prev, status } : prev));
      }
      return true;
    } catch (error: any) {
      showAlert(error.response?.data?.msg || "Failed to update order status", "error");
      return false;
    }
  };

  const cancelFoodOrder = async (id: string, reason: string): Promise<boolean> => {
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/admin/food-orders/${id}/cancel`,
        { reason },
        getAuthHeaders()
      );
      showAlert(res.data.msg || "Order cancelled and customer refunded", "success");
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status: "cancelled" } : o))
      );
      if (currentOrder?._id === id) {
        setCurrentOrder((prev) =>
          prev ? { ...prev, status: "cancelled" } : prev
        );
      }
      return true;
    } catch (error: any) {
      showAlert(error.response?.data?.msg || "Failed to cancel order", "error");
      return false;
    }
  };

  const deleteFoodOrder = async (id: string): Promise<boolean> => {
    try {
      const res = await axios.delete(
        `${API_BASE_URL}/admin/food-orders/${id}`,
        getAuthHeaders()
      );
      showAlert(res.data.msg || "Order deleted", "success");
      setOrders((prev) => prev.filter((o) => o._id !== id));
      if (currentOrder?._id === id) setCurrentOrder(null);
      return true;
    } catch (error: any) {
      showAlert(error.response?.data?.msg || "Failed to delete order", "error");
      return false;
    }
  };

  const clearCurrentOrder = () => setCurrentOrder(null);

  return (
    <FoodOrderContext.Provider
      value={{
        orders,
        currentOrder,
        totalOrders,
        currentPage,
        totalPages,
        loading,
        fetchFoodOrders,
        fetchFoodOrderById,
        updateFoodOrderStatus,
        cancelFoodOrder,
        deleteFoodOrder,
        clearCurrentOrder,
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
