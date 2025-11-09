"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import axios from "axios";
import { useAlert } from "./AlertContext";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const API_URL = `${API_BASE_URL}/users`;

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profile_pic?: string | null;
  is_driver: boolean;
  is_verified: boolean;
  is_online?: boolean;
  is_blocked?: boolean;
  is_deleted?: boolean;
  driver_application: "none" | "rejected" | "submitted" | "approved";
  createdAt: string;
  updatedAt: string;
}

export interface UserDetails extends User {
  numRides?: number;
  numDeliveries?: number;
}

interface UsersListResponse {
  users: User[];
  total: number;
  page: number;
  pages: number;
}

interface UserContextType {
  users: User[];
  currentUser: UserDetails | null;
  totalUsers: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  fetchUsers: (
    page?: number,
    limit?: number,
    includeDeleted?: boolean
  ) => Promise<void>;
  fetchUserDetails: (userId: string, includeDeleted?: boolean) => Promise<void>;
  editUser: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  blockUser: (userId: string, block: boolean) => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<UserDetails | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  // Fetch paginated list of users
  const fetchUsers = async (page = 1, limit = 20, includeDeleted = false) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/users`, {
        params: { page, limit, include_deleted: includeDeleted },
      });

      if (response.data) {
        setUsers(response.data.users || []);
        setTotalUsers(response.data.total || 0);
        setCurrentPage(response.data.page || 1);
        setTotalPages(response.data.pages || 0);
      }
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      showAlert(error.response?.data?.msg || "Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed user data
  const fetchUserDetails = async (userId: string, includeDeleted = false) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/user`, {
        params: { id: userId, include_deleted: includeDeleted },
      });

      if (response.data?.user) {
        setCurrentUser({
          ...response.data.user,
          numRides: response.data.numRides || 0,
          numDeliveries: response.data.numDeliveries || 0,
        });
      }
    } catch (error: any) {
      console.error("Failed to fetch user details:", error);
      showAlert(
        error.response?.data?.msg || "Failed to fetch user details",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Edit user
  const editUser = async (userId: string, updates: Partial<User>) => {
    try {
      setLoading(true);
      const response = await axios.patch(`${API_URL}/admin/user`, updates, {
        params: { id: userId },
      });

      if (response.data?.user) {
        // Update user in list
        setUsers((prev) =>
          prev.map((user) =>
            user._id === userId ? { ...user, ...response.data.user } : user
          )
        );
        // Update current user if viewing details
        if (currentUser?._id === userId) {
          setCurrentUser((prev) =>
            prev ? { ...prev, ...response.data.user } : null
          );
        }
        showAlert("User updated successfully", "success");
      }
    } catch (error: any) {
      console.error("Failed to edit user:", error);
      showAlert(error.response?.data?.msg || "Failed to edit user", "error");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete user (soft delete)
  const deleteUser = async (userId: string) => {
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/admin/user`, {
        params: { id: userId },
      });

      // Remove from list or mark as deleted
      setUsers((prev) => prev.filter((user) => user._id !== userId));
      showAlert("User deleted successfully", "success");
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      showAlert(error.response?.data?.msg || "Failed to delete user", "error");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Block or unblock user
  const blockUser = async (userId: string, block: boolean) => {
    try {
      setLoading(true);
      const response = await axios.patch(
        `${API_URL}/admin/user/block`,
        { block },
        {
          params: { id: userId },
        }
      );

      if (response.data?.user) {
        // Update user in list
        setUsers((prev) =>
          prev.map((user) =>
            user._id === userId ? { ...user, is_blocked: block } : user
          )
        );
        // Update current user if viewing details
        if (currentUser?._id === userId) {
          setCurrentUser((prev) =>
            prev ? { ...prev, is_blocked: block } : null
          );
        }
        showAlert(
          `User ${block ? "blocked" : "unblocked"} successfully`,
          "success"
        );
      }
    } catch (error: any) {
      console.error("Failed to block/unblock user:", error);
      showAlert(
        error.response?.data?.msg ||
          `Failed to ${block ? "block" : "unblock"} user`,
        "error"
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: UserContextType = {
    users,
    currentUser,
    totalUsers,
    currentPage,
    totalPages,
    loading,
    fetchUsers,
    fetchUserDetails,
    editUser,
    deleteUser,
    blockUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within UserProvider");
  }
  return context;
};

export default UserProvider;
