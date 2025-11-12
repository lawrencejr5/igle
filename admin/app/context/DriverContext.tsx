"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import axios from "axios";
import { useAlert } from "./AlertContext";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const API_URL = `${API_BASE_URL}/drivers`;

export interface Driver {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    profile_pic?: string | null;
  };
  profile_img?: string;
  vehicle_type: "bike" | "keke" | "cab" | "suv" | "van" | "truck";
  vehicle: {
    exterior_image?: string;
    interior_image?: string;
    brand?: string;
    model?: string;
    color?: string;
    year?: string;
    plate_number?: string;
  };
  driver_licence: {
    number?: string;
    expiry_date?: string;
    front_image?: string;
    back_image?: string;
    selfie_with_licence?: string;
  };
  bank?: {
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    bank_code?: string;
    recipient_code?: string;
  };
  is_online?: boolean;
  is_available?: boolean;
  is_blocked?: boolean;
  is_deleted?: boolean;
  rating?: number;
  total_trips: number;
  num_of_reviews: number;
  application: "none" | "rejected" | "submitted" | "approved";
  createdAt: string;
  updatedAt: string;
}

export interface DriverDetails extends Driver {
  wallet_balance?: number;
}

interface DriversListResponse {
  drivers: Driver[];
  total: number;
  page: number;
  pages: number;
}

interface DriverContextType {
  drivers: Driver[];
  currentDriver: DriverDetails | null;
  applications: Driver[];
  totalDrivers: number;
  totalApplications: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  fetchDrivers: (
    page?: number,
    limit?: number,
    includeDeleted?: boolean,
    filters?: {
      status?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ) => Promise<void>;
  fetchDriverDetails: (
    driverId: string,
    includeDeleted?: boolean
  ) => Promise<void>;
  editDriver: (driverId: string, updates: Partial<Driver>) => Promise<void>;
  deleteDriver: (driverId: string) => Promise<void>;
  blockDriver: (driverId: string, block: boolean) => Promise<void>;
  fetchDriverApplications: (
    page?: number,
    limit?: number,
    includeDeleted?: boolean
  ) => Promise<void>;
  processDriverApplication: (
    driverId: string,
    action: "approve" | "reject"
  ) => Promise<void>;
}

const DriverContext = createContext<DriverContextType | null>(null);

export const DriverProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [applications, setApplications] = useState<Driver[]>([]);
  const [currentDriver, setCurrentDriver] = useState<DriverDetails | null>(
    null
  );
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [totalApplications, setTotalApplications] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  // Fetch paginated list of drivers
  const fetchDrivers = async (
    page = 1,
    limit = 20,
    includeDeleted = false,
    filters?: {
      status?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ) => {
    try {
      setLoading(true);
      const params: any = { page, limit, include_deleted: includeDeleted };
      if (filters?.status) params.status = filters.status;
      if (filters?.search) params.search = filters.search;
      if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters?.dateTo) params.dateTo = filters.dateTo;

      const response = await axios.get(`${API_URL}/admin/drivers`, {
        params,
      });

      if (response.data) {
        setDrivers(response.data.drivers || []);
        setTotalDrivers(response.data.total || 0);
        setCurrentPage(response.data.page || 1);
        setTotalPages(response.data.pages || 0);
      }
    } catch (error: any) {
      console.error("Failed to fetch drivers:", error);
      showAlert(
        error.response?.data?.msg || "Failed to fetch drivers",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed driver data
  const fetchDriverDetails = async (
    driverId: string,
    includeDeleted = false
  ) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/driver`, {
        params: { id: driverId, include_deleted: includeDeleted },
      });

      if (response.data?.driver) {
        setCurrentDriver({
          ...response.data.driver,
          wallet_balance: response.data.wallet_balance || 0,
        });
      }
    } catch (error: any) {
      console.error("Failed to fetch driver details:", error);
      showAlert(
        error.response?.data?.msg || "Failed to fetch driver details",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Edit driver
  const editDriver = async (driverId: string, updates: Partial<Driver>) => {
    try {
      setLoading(true);
      const response = await axios.patch(`${API_URL}/admin/driver`, updates, {
        params: { id: driverId },
      });

      if (response.data?.driver) {
        // Update driver in list
        setDrivers((prev) =>
          prev.map((driver) =>
            driver._id === driverId
              ? { ...driver, ...response.data.driver }
              : driver
          )
        );
        // Update current driver if viewing details
        if (currentDriver?._id === driverId) {
          setCurrentDriver((prev) =>
            prev ? { ...prev, ...response.data.driver } : null
          );
        }
        showAlert("Driver updated successfully", "success");
      }
    } catch (error: any) {
      console.error("Failed to edit driver:", error);
      showAlert(error.response?.data?.msg || "Failed to edit driver", "error");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete driver (soft delete)
  const deleteDriver = async (driverId: string) => {
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/admin/driver`, {
        params: { id: driverId },
      });

      // Remove from list or mark as deleted
      setDrivers((prev) => prev.filter((driver) => driver._id !== driverId));
      showAlert("Driver deleted successfully", "success");
    } catch (error: any) {
      console.error("Failed to delete driver:", error);
      showAlert(
        error.response?.data?.msg || "Failed to delete driver",
        "error"
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Block or unblock driver
  const blockDriver = async (driverId: string, block: boolean) => {
    try {
      setLoading(true);
      const response = await axios.patch(
        `${API_URL}/admin/driver/block`,
        { block },
        {
          params: { id: driverId },
        }
      );

      // Update driver in list
      setDrivers((prev) =>
        prev.map((driver) =>
          driver._id === driverId ? { ...driver, is_blocked: block } : driver
        )
      );
      // Update current driver if viewing details
      if (currentDriver?._id === driverId) {
        setCurrentDriver((prev) =>
          prev ? { ...prev, is_blocked: block } : null
        );
      }
      showAlert(
        `Driver ${block ? "blocked" : "unblocked"} successfully`,
        "success"
      );
    } catch (error: any) {
      console.error("Failed to block/unblock driver:", error);
      showAlert(
        error.response?.data?.msg ||
          `Failed to ${block ? "block" : "unblock"} driver`,
        "error"
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fetch driver applications
  const fetchDriverApplications = async (
    page = 1,
    limit = 20,
    includeDeleted = false
  ) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/driver/applications`, {
        params: { page, limit, include_deleted: includeDeleted },
      });

      if (response.data) {
        setApplications(response.data.drivers || []);
        setTotalApplications(response.data.total || 0);
        setCurrentPage(response.data.page || 1);
        setTotalPages(response.data.pages || 0);
        console.log(response.data.drivers);
      }
    } catch (error: any) {
      console.error("Failed to fetch driver applications:", error);
      showAlert(
        error.response?.data?.msg || "Failed to fetch driver applications",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Process driver application (approve or reject)
  const processDriverApplication = async (
    driverId: string,
    action: "approve" | "reject"
  ) => {
    try {
      setLoading(true);
      const response = await axios.patch(
        `${API_URL}/admin/driver/application`,
        { action },
        {
          params: { id: driverId },
        }
      );

      if (response.data?.driver) {
        // Update driver in applications list
        setApplications((prev) =>
          prev.filter((driver) => driver._id !== driverId)
        );
        showAlert(
          `Driver application ${
            action === "approve" ? "approved" : "rejected"
          } successfully`,
          "success"
        );
      }
    } catch (error: any) {
      console.error("Failed to process driver application:", error);
      showAlert(
        error.response?.data?.msg || "Failed to process driver application",
        "error"
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: DriverContextType = {
    drivers,
    applications,
    currentDriver,
    totalDrivers,
    totalApplications,
    currentPage,
    totalPages,
    loading,
    fetchDrivers,
    fetchDriverDetails,
    editDriver,
    deleteDriver,
    blockDriver,
    fetchDriverApplications,
    processDriverApplication,
  };

  return (
    <DriverContext.Provider value={value}>{children}</DriverContext.Provider>
  );
};

export const useDriverContext = () => {
  const context = useContext(DriverContext);
  if (!context) {
    throw new Error("useDriverContext must be used within DriverProvider");
  }
  return context;
};

export default DriverProvider;
