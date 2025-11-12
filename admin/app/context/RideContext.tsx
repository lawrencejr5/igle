"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import axios from "axios";
import { useAlert } from "./AlertContext";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const API_URL = `${API_BASE_URL}/rides`;

export interface Ride {
  _id: string;
  rider: {
    _id: string;
    name: string;
    phone?: string;
    profile_pic?: string;
  };
  driver?: {
    _id: string;
    user: {
      _id: string;
      name: string;
      email: string;
      phone?: string;
      profile_pic?: string;
    };
    vehicle_type: "bike" | "keke" | "cab" | "suv" | "van" | "truck";
    vehicle: {
      brand?: string;
      model?: string;
      color?: string;
      year?: string;
      plate_number?: string;
    };
    current_location?: [number, number];
    total_trips: number;
    rating?: number;
    num_of_reviews: number;
  };
  pickup: {
    address: string;
    coordinates: [number, number];
  };
  destination: {
    address: string;
    coordinates: [number, number];
  };
  driver_location?: [number, number];
  status:
    | "pending"
    | "scheduled"
    | "accepted"
    | "arrived"
    | "ongoing"
    | "completed"
    | "cancelled"
    | "expired";
  fare: number;
  distance_km: number;
  duration_mins: number;
  timestamps?: {
    accepted_at?: string;
    arrived_at?: string;
    started_at?: string;
    completed_at?: string;
    cancelled_at?: string;
  };
  cancelled?: {
    by?: "rider" | "driver";
    reason?: string;
  };
  vehicle: "cab" | "keke" | "suv";
  payment_status: "unpaid" | "paid";
  payment_method: "cash" | "card" | "wallet";
  driver_earnings: number;
  driver_paid: boolean;
  commission: number;
  scheduled: boolean;
  scheduled_time: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RideDetails extends Ride {
  // Additional fields if needed for details view
}

interface RidesListResponse {
  rides: Ride[];
  total: number;
  page: number;
  pages: number;
}

interface RideContextType {
  rides: Ride[];
  currentRide: RideDetails | null;
  totalRides: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  fetchRides: (
    page?: number,
    limit?: number,
    filters?: {
      status?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ) => Promise<void>;
  fetchRideDetails: (rideId: string) => Promise<void>;
  cancelRide: (rideId: string, reason?: string) => Promise<void>;
  deleteRide: (rideId: string) => Promise<void>;
}

const RideContext = createContext<RideContextType | null>(null);

export const RideProvider = ({ children }: { children: ReactNode }) => {
  const { showAlert } = useAlert();
  const [rides, setRides] = useState<Ride[]>([]);
  const [currentRide, setCurrentRide] = useState<RideDetails | null>(null);
  const [totalRides, setTotalRides] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchRides = async (
    page = 1,
    limit = 10,
    filters?: {
      status?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const params: any = { page, limit };
      if (filters?.status) params.status = filters.status;
      if (filters?.search) params.search = filters.search;
      if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters?.dateTo) params.dateTo = filters.dateTo;

      const response = await axios.get<RidesListResponse>(
        `${API_URL}/admin/rides`,
        {
          params,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setRides(response.data.rides);
      setTotalRides(response.data.total);
      setCurrentPage(response.data.page);
      setTotalPages(response.data.pages);
    } catch (error: any) {
      console.error("Error fetching rides:", error);
      showAlert(error.response?.data?.msg || "Failed to fetch rides", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchRideDetails = async (rideId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get<{ msg: string; ride: RideDetails }>(
        `${API_URL}/admin/rides/data`,
        {
          params: { ride_id: rideId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCurrentRide(response.data.ride);
    } catch (error: any) {
      console.error("Error fetching ride details:", error);
      showAlert(
        error.response?.data?.msg || "Failed to fetch ride details",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelRide = async (rideId: string, reason?: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      await axios.patch(
        `${API_URL}/admin/rides/cancel`,
        { reason },
        {
          params: { ride_id: rideId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showAlert("Ride cancelled successfully", "success");

      // Update rides list
      setRides((prev) =>
        prev.map((ride) =>
          ride._id === rideId ? { ...ride, status: "cancelled" as const } : ride
        )
      );

      // Update current ride if it's the one being cancelled
      if (currentRide && currentRide._id === rideId) {
        setCurrentRide({ ...currentRide, status: "cancelled" });
      }
    } catch (error: any) {
      console.error("Error cancelling ride:", error);
      showAlert(error.response?.data?.msg || "Failed to cancel ride", "error");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteRide = async (rideId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      await axios.delete(`${API_URL}/admin/rides`, {
        params: { ride_id: rideId },
        headers: { Authorization: `Bearer ${token}` },
      });

      showAlert("Ride deleted successfully", "success");

      // Remove from rides list
      setRides((prev) => prev.filter((ride) => ride._id !== rideId));
      setTotalRides((prev) => prev - 1);

      // Clear current ride if it's the one being deleted
      if (currentRide && currentRide._id === rideId) {
        setCurrentRide(null);
      }
    } catch (error: any) {
      console.error("Error deleting ride:", error);
      showAlert(error.response?.data?.msg || "Failed to delete ride", "error");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <RideContext.Provider
      value={{
        rides,
        currentRide,
        totalRides,
        currentPage,
        totalPages,
        loading,
        fetchRides,
        fetchRideDetails,
        cancelRide,
        deleteRide,
      }}
    >
      {children}
    </RideContext.Provider>
  );
};

export const useRideContext = () => {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error("useRideContext must be used within a RideProvider");
  }
  return context;
};
