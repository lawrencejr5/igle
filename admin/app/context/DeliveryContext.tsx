"use client";

import React, { createContext, useContext, useState } from "react";
import axios from "axios";
import { useAlert } from "./AlertContext";

// Delivery interface matching backend model
export interface Delivery {
  _id: string;
  sender: {
    _id: string;
    name: string;
    phone: string;
    profile_pic?: string;
  };
  driver?: {
    _id: string;
    user: {
      _id: string;
      name: string;
      email: string;
      phone: string;
      profile_pic?: string;
    };
    vehicle_type: "bike" | "cab" | "van" | "truck";
    vehicle: {
      make: string;
      model: string;
      year: number;
      color: string;
      plate_number: string;
      exterior_image?: string;
      interior_image?: string;
    };
    current_location?: {
      type: string;
      coordinates: [number, number];
    };
    total_trips: number;
    rating: number;
    num_of_reviews: number;
  };
  pickup: {
    address: string;
    coordinates: [number, number];
  };
  dropoff: {
    address: string;
    coordinates: [number, number];
  };
  to?: {
    name?: string;
    phone?: string;
  };
  package: {
    description?: string;
    fragile?: boolean;
    amount?: number;
    type?:
      | "document"
      | "electronics"
      | "clothing"
      | "food"
      | "furniture"
      | "other";
  };
  status:
    | "pending"
    | "scheduled"
    | "accepted"
    | "arrived"
    | "picked_up"
    | "in_transit"
    | "delivered"
    | "failed"
    | "cancelled"
    | "expired";
  fare: number;
  distance_km: number;
  duration_mins: number;
  vehicle: "bike" | "cab" | "van" | "truck";
  payment_status: "unpaid" | "paid";
  payment_method: "cash" | "card" | "wallet";
  timestamps: {
    accepted_at?: Date;
    picked_up_at?: Date;
    delivered_at?: Date;
    cancelled_at?: Date;
  };
  cancelled?: {
    by?: "sender" | "driver";
    reason?: string;
  };
  driver_earnings: number;
  commission: number;
  scheduled: boolean;
  scheduled_time?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Detailed delivery interface with populated fields
export interface DeliveryDetails extends Delivery {}

// API response interface for deliveries list
interface DeliveriesListResponse {
  msg: string;
  rowCount: number;
  deliveries: Delivery[];
  totalPages: number;
  currentPage: number;
}

// Context interface
interface DeliveryContextType {
  deliveries: Delivery[];
  currentDelivery: DeliveryDetails | null;
  totalDeliveries: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  fetchDeliveries: (
    page?: number,
    limit?: number,
    filters?: {
      status?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ) => Promise<void>;
  fetchDeliveryDetails: (deliveryId: string) => Promise<void>;
  cancelDelivery: (deliveryId: string, reason: string) => Promise<boolean>;
  deleteDelivery: (deliveryId: string) => Promise<boolean>;
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(
  undefined
);

export const DeliveryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [currentDelivery, setCurrentDelivery] =
    useState<DeliveryDetails | null>(null);
  const [totalDeliveries, setTotalDeliveries] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const { showAlert } = useAlert();

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const API_URL = `${API_BASE_URL}/delivery`;

  // Get admin token from localStorage
  const getAuthHeaders = () => {
    const admin_token = localStorage.getItem("admin_token");
    return {
      headers: {
        Authorization: `Bearer ${admin_token}`,
      },
    };
  };

  // Fetch paginated deliveries list
  const fetchDeliveries = async (
    page: number = 1,
    limit: number = 10,
    filters?: {
      status?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ) => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (filters?.status) params.status = filters.status;
      if (filters?.search) params.search = filters.search;
      if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters?.dateTo) params.dateTo = filters.dateTo;

      const response = await axios.get<DeliveriesListResponse>(
        `${API_URL}/admin/deliveries`,
        {
          ...getAuthHeaders(),
          params,
        }
      );

      setDeliveries(response.data.deliveries);
      setTotalDeliveries(response.data.rowCount);
      setCurrentPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
    } catch (error: any) {
      console.error("Error fetching deliveries:", error);
      showAlert(
        error.response?.data?.msg || "Failed to fetch deliveries",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch single delivery details with full population
  const fetchDeliveryDetails = async (deliveryId: string) => {
    setLoading(true);
    try {
      const response = await axios.get<{
        msg: string;
        delivery: DeliveryDetails;
      }>(`${API_URL}/admin/deliveries/data`, {
        ...getAuthHeaders(),
        params: { delivery_id: deliveryId },
      });

      setCurrentDelivery(response.data.delivery);
    } catch (error: any) {
      console.error("Error fetching delivery details:", error);
      showAlert(
        error.response?.data?.msg || "Failed to fetch delivery details",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Cancel a delivery
  const cancelDelivery = async (
    deliveryId: string,
    reason: string
  ): Promise<boolean> => {
    try {
      const response = await axios.patch(
        `${API_URL}/admin/deliveries/cancel`,
        { reason },
        {
          ...getAuthHeaders(),
          params: { delivery_id: deliveryId },
        }
      );

      showAlert(
        response.data.msg || "Delivery cancelled successfully",
        "success"
      );
      return true;
    } catch (error: any) {
      console.error("Error cancelling delivery:", error);
      showAlert(
        error.response?.data?.msg || "Failed to cancel delivery",
        "error"
      );
      return false;
    }
  };

  // Delete a delivery
  const deleteDelivery = async (deliveryId: string): Promise<boolean> => {
    try {
      const response = await axios.delete(`${API_URL}/admin/deliveries`, {
        ...getAuthHeaders(),
        params: { delivery_id: deliveryId },
      });

      showAlert(
        response.data.msg || "Delivery deleted successfully",
        "success"
      );
      return true;
    } catch (error: any) {
      console.error("Error deleting delivery:", error);
      showAlert(
        error.response?.data?.msg || "Failed to delete delivery",
        "error"
      );
      return false;
    }
  };

  const value: DeliveryContextType = {
    deliveries,
    currentDelivery,
    totalDeliveries,
    currentPage,
    totalPages,
    loading,
    fetchDeliveries,
    fetchDeliveryDetails,
    cancelDelivery,
    deleteDelivery,
  };

  return (
    <DeliveryContext.Provider value={value}>
      {children}
    </DeliveryContext.Provider>
  );
};

export const useDeliveryContext = () => {
  const context = useContext(DeliveryContext);
  if (context === undefined) {
    throw new Error(
      "useDeliveryContext must be used within a DeliveryProvider"
    );
  }
  return context;
};
