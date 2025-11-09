"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import { useAlert } from "./AlertContext";
import { useAuthContext } from "./AuthContext";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

interface AdminProfile {
  id: string;
  username: string;
  email: string;
  profile_pic?: string | null;
}

interface SummaryData {
  totalUsers: number;
  activeDrivers: number;
  activeRides: number;
  activeDeliveries: number;
  totalReports: number;
  totalRevenueThisMonth: number;
}

interface AppWallet {
  balance: number;
}

interface AdminContextType {
  profile: AdminProfile | null;
  summary: SummaryData | null;
  appWallet: AppWallet | null;
  loading: boolean;
  updateProfile: (username: string, email: string) => Promise<void>;
  updatePassword: (
    old_password: string,
    new_password: string,
    confirm_password: string
  ) => Promise<void>;
  uploadProfilePic: (file: File) => Promise<void>;
  removeProfilePic: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchAppWallet: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [appWallet, setAppWallet] = useState<AppWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();
  const { admin } = useAuthContext();

  // Initialize profile from AuthContext
  useEffect(() => {
    if (admin) {
      setProfile({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        profile_pic: admin.profile_pic,
      });
    }
  }, [admin]);

  // Fetch admin profile data
  const refreshProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/data`);
      if (response.data?.admin) {
        setProfile(response.data.admin);
      }
    } catch (error: any) {
      console.error("Failed to fetch admin profile:", error);
      showAlert(
        error.response?.data?.msg || "Failed to fetch profile",
        "error"
      );
    }
  };

  // Update profile (username/email)
  const updateProfile = async (username: string, email: string) => {
    try {
      setLoading(true);
      const response = await axios.patch(`${API_BASE_URL}/admin/profile`, {
        username,
        email,
      });
      if (response.data?.admin) {
        setProfile(response.data.admin);
        showAlert("Profile updated successfully", "success");
      }
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      showAlert(
        error.response?.data?.msg || "Failed to update profile",
        "error"
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const updatePassword = async (
    old_password: string,
    new_password: string,
    confirm_password: string
  ) => {
    try {
      setLoading(true);
      await axios.patch(`${API_BASE_URL}/admin/password`, {
        old_password,
        new_password,
        confirm_password,
      });
      showAlert("Password updated successfully", "success");
    } catch (error: any) {
      console.error("Failed to update password:", error);
      showAlert(
        error.response?.data?.msg || "Failed to update password",
        "error"
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Upload profile picture
  const uploadProfilePic = async (file: File) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("profile_pic", file);

      const response = await axios.patch(
        `${API_BASE_URL}/admin/profile_pic`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data?.admin) {
        setProfile((prev) =>
          prev
            ? { ...prev, profile_pic: response.data.admin.profile_pic }
            : null
        );
        showAlert("Profile picture updated successfully", "success");
      }
    } catch (error: any) {
      console.error("Failed to upload profile picture:", error);
      showAlert(
        error.response?.data?.msg || "Failed to upload profile picture",
        "error"
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Remove profile picture
  const removeProfilePic = async () => {
    try {
      setLoading(true);
      const response = await axios.patch(`${API_BASE_URL}/admin/remove_pic`);
      if (response.data?.admin) {
        setProfile((prev) => (prev ? { ...prev, profile_pic: null } : null));
        showAlert("Profile picture removed successfully", "success");
      }
    } catch (error: any) {
      console.error("Failed to remove profile picture:", error);
      showAlert(
        error.response?.data?.msg || "Failed to remove profile picture",
        "error"
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary data
  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/summary`);
      if (response.data) {
        setSummary({
          totalUsers: response.data.totalUsers || 0,
          activeDrivers: response.data.activeDrivers || 0,
          activeRides: response.data.activeRides || 0,
          activeDeliveries: response.data.activeDeliveries || 0,
          totalReports: response.data.totalReports || 0,
          totalRevenueThisMonth: response.data.totalRevenueThisMonth || 0,
        });
      }
    } catch (error: any) {
      console.error("Failed to fetch summary:", error);
      showAlert(
        error.response?.data?.msg || "Failed to fetch summary",
        "error"
      );
    }
  };

  // Fetch app wallet balance
  const fetchAppWallet = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/app_wallet/balance`);
      if (response.data?.wallet) {
        setAppWallet({ balance: response.data.wallet.balance || 0 });
      }
    } catch (error: any) {
      console.error("Failed to fetch app wallet:", error);
      showAlert(
        error.response?.data?.msg || "Failed to fetch app wallet",
        "error"
      );
    }
  };

  const value: AdminContextType = {
    profile,
    summary,
    appWallet,
    loading,
    updateProfile,
    updatePassword,
    uploadProfilePic,
    removeProfilePic,
    fetchSummary,
    fetchAppWallet,
    refreshProfile,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdminContext must be used within AdminProvider");
  }
  return context;
};

export default AdminProvider;
