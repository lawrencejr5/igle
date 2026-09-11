"use client";

import React, { createContext, useContext, useState } from "react";
import axios from "axios";
import { useAlert } from "./AlertContext";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Restaurant {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    profile_pic?: string;
    restaurant_application?: string;
    is_blocked?: boolean;
  };
  name: string;
  logo?: string;
  banner?: string;
  category_tags: string[];
  phone: string;
  email: string;
  description?: string;
  operating_hours: {
    day: string;
    open: string;
    close: string;
    closed: boolean;
  }[];
  location: {
    address: string;
    landmark?: string;
    coordinates: { type: string; coordinates: [number, number] };
    delivery_radius_km: number;
  };
  bank?: {
    bank_name: string;
    account_number: string;
    account_name: string;
    bank_code: string;
    recipient_code?: string;
  };
  verification: {
    government_id: string;
    cac_document?: string;
    is_cac_verified: boolean;
  };
  is_online: boolean;
  is_verified: boolean;
  application: "none" | "pending" | "submitted" | "approved" | "rejected";
  rating?: number;
  num_of_reviews?: number;
  is_deleted?: boolean;
  is_blocked?: boolean;
  blocked_at?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Context Type ─────────────────────────────────────────────────────────────

interface RestaurantContextType {
  restaurants: Restaurant[];
  currentRestaurant: Restaurant | null;
  totalRestaurants: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  fetchRestaurants: (
    page?: number,
    limit?: number,
    filters?: { status?: string; search?: string; dateFrom?: string; dateTo?: string }
  ) => Promise<void>;
  fetchRestaurantById: (id: string) => Promise<void>;
  approveRestaurant: (id: string) => Promise<boolean>;
  rejectRestaurant: (id: string, reason: string) => Promise<boolean>;
  blockRestaurant: (id: string) => Promise<boolean>;
  deleteRestaurant: (id: string) => Promise<boolean>;
  clearCurrentRestaurant: () => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [totalRestaurants, setTotalRestaurants] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const { showAlert } = useAlert();

  const getAuthHeaders = () => {
    const admin_token = localStorage.getItem("admin_token");
    return { headers: { Authorization: `Bearer ${admin_token}` } };
  };

  const fetchRestaurants = async (
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

      const res = await axios.get(`${API_BASE_URL}/admin/restaurants`, {
        ...getAuthHeaders(),
        params,
      });

      setRestaurants(res.data.restaurants);
      setTotalRestaurants(res.data.rowCount);
      setCurrentPage(res.data.currentPage);
      setTotalPages(res.data.totalPages);
    } catch (error: any) {
      showAlert(error.response?.data?.msg || "Failed to fetch restaurants", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantById = async (id: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/restaurants/${id}`, getAuthHeaders());
      setCurrentRestaurant(res.data.restaurant);
    } catch (error: any) {
      showAlert(error.response?.data?.msg || "Failed to fetch restaurant details", "error");
    } finally {
      setLoading(false);
    }
  };

  const approveRestaurant = async (id: string): Promise<boolean> => {
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/admin/restaurants/${id}/approve`,
        {},
        getAuthHeaders()
      );
      showAlert(res.data.msg || "Restaurant approved", "success");
      setRestaurants((prev) =>
        prev.map((r) => (r._id === id ? { ...r, application: "approved", is_verified: true } : r))
      );
      if (currentRestaurant?._id === id) {
        setCurrentRestaurant((prev) =>
          prev ? { ...prev, application: "approved", is_verified: true } : prev
        );
      }
      return true;
    } catch (error: any) {
      showAlert(error.response?.data?.msg || "Failed to approve restaurant", "error");
      return false;
    }
  };

  const rejectRestaurant = async (id: string, reason: string): Promise<boolean> => {
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/admin/restaurants/${id}/reject`,
        { reason },
        getAuthHeaders()
      );
      showAlert(res.data.msg || "Restaurant rejected", "success");
      setRestaurants((prev) =>
        prev.map((r) => (r._id === id ? { ...r, application: "rejected" } : r))
      );
      if (currentRestaurant?._id === id) {
        setCurrentRestaurant((prev) =>
          prev ? { ...prev, application: "rejected" } : prev
        );
      }
      return true;
    } catch (error: any) {
      showAlert(error.response?.data?.msg || "Failed to reject restaurant", "error");
      return false;
    }
  };

  const blockRestaurant = async (id: string): Promise<boolean> => {
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/admin/restaurants/${id}/block`,
        {},
        getAuthHeaders()
      );
      showAlert(res.data.msg || "Restaurant block status updated", "success");
      const newBlocked = res.data.is_blocked;
      setRestaurants((prev) =>
        prev.map((r) => (r._id === id ? { ...r, is_blocked: newBlocked } : r))
      );
      if (currentRestaurant?._id === id) {
        setCurrentRestaurant((prev) =>
          prev ? { ...prev, is_blocked: newBlocked } : prev
        );
      }
      return true;
    } catch (error: any) {
      showAlert(error.response?.data?.msg || "Failed to update block status", "error");
      return false;
    }
  };

  const deleteRestaurant = async (id: string): Promise<boolean> => {
    try {
      const res = await axios.delete(
        `${API_BASE_URL}/admin/restaurants/${id}`,
        getAuthHeaders()
      );
      showAlert(res.data.msg || "Restaurant deleted", "success");
      setRestaurants((prev) => prev.filter((r) => r._id !== id));
      if (currentRestaurant?._id === id) setCurrentRestaurant(null);
      return true;
    } catch (error: any) {
      showAlert(error.response?.data?.msg || "Failed to delete restaurant", "error");
      return false;
    }
  };

  const clearCurrentRestaurant = () => setCurrentRestaurant(null);

  return (
    <RestaurantContext.Provider
      value={{
        restaurants,
        currentRestaurant,
        totalRestaurants,
        currentPage,
        totalPages,
        loading,
        fetchRestaurants,
        fetchRestaurantById,
        approveRestaurant,
        rejectRestaurant,
        blockRestaurant,
        deleteRestaurant,
        clearCurrentRestaurant,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurantContext = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error("useRestaurantContext must be used within a RestaurantProvider");
  }
  return context;
};
