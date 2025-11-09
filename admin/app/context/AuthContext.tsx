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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

interface Admin {
  id: string;
  username: string;
  email: string;
  profile_pic?: string | null;
}

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  isSignedIn: boolean;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  initialize: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const { showAlert } = useAlert();

  // Initialize: check for stored token and fetch admin data
  const initialize = async () => {
    setLoading(true);
    try {
      const storedToken = localStorage.getItem("admin_token");
      if (!storedToken) {
        setLoading(false);
        return;
      }

      setToken(storedToken);

      // Fetch admin data to verify token
      const response = await axios.get(`${API_BASE_URL}/admin/data`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (response.data?.admin) {
        setAdmin(response.data.admin);
        setIsSignedIn(true);
      }
    } catch (error) {
      console.error("Failed to initialize auth:", error);
      // Clear invalid token
      localStorage.removeItem("admin_token");
      setToken(null);
      setAdmin(null);
      setIsSignedIn(false);
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (identifier: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/login`, {
        login_id: identifier,
        password,
      });

      const { token: newToken, admin: adminData } = response.data;

      if (newToken && adminData) {
        localStorage.setItem("admin_token", newToken);
        setToken(newToken);
        setAdmin(adminData);
        setIsSignedIn(true);
        showAlert("Login successful!", "success");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      const message =
        error.response?.data?.msg || "Login failed. Please try again.";
      showAlert(message, "error");
      throw new Error(message);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
    setAdmin(null);
    setIsSignedIn(false);
  };

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, []);

  // Setup axios interceptor to include token in all requests
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config: any) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: any) => Promise.reject(error)
    );

    // Add response interceptor to handle 401/403 errors (expired/invalid token)
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error: any) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          // Token is invalid or expired, logout user
          showAlert("Session expired. Please login again.", "error");
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [token]);

  const value: AuthContextType = {
    admin,
    token,
    isSignedIn,
    loading,
    login,
    logout,
    initialize,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuthContext must be used within AuthProvider");
  return context;
};

export default AuthProvider;
