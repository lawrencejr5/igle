import { StyleSheet, Text, View } from "react-native";
import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

import axios from "axios";

import AsyncStorage from "@react-native-async-storage/async-storage";

import * as Location from "expo-location";

import { jwtDecode } from "jwt-decode";

import { initUserSocket } from "../sockets/socketService";

import {
  NotificationContextType,
  useNotificationContext,
} from "./NotificationContext";
import { router } from "expo-router";

export const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showNotification } =
    useNotificationContext() as NotificationContextType;

  const [signedIn, setSignedIn] = useState<UserType>({
    user_id: "",
    email: "",
    phone: "",
    name: "",
    driver_application: "",
    is_driver: false,
  });

  const [tokenLoading, setTokenLoading] = useState<boolean>(true);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    getUserData();
    checkTokenValidity();
  }, []);

  const API_URL = "http://192.168.26.123:5000/api/v1/users";

  // Registration function
  const register = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<void> => {
    if (password !== confirmPassword) {
      showNotification("Passwords do not match.", "error");
      throw new Error("Passwords do not match");
    }
    try {
      const { data } = await axios.post(`${API_URL}/register`, {
        name,
        email,
        password,
      });
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user_id", data.user.id);

      await getUserData();

      showNotification("Registration successful", "success");
    } catch (err: any) {
      console.log(err);
      const errMsg = err.response?.data?.msg;
      showNotification(errMsg || "Registration failed.", "error");
      throw new Error(errMsg);
    }
  };

  // Update phone number function
  const updatePhone = async (phone: string): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.patch(
        `${API_URL}/phone`,
        { phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await getUserData();

      showNotification("Phone updated successfully.", "success");
    } catch (err: any) {
      showNotification(
        err.response?.data?.msg || "Phone update failed.",
        "error"
      );
      throw new Error(err.response?.data?.msg);
    }
  };

  // Login function (email or phone)
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const { data } = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user_id", data.user.id);
      await AsyncStorage.setItem(
        "is_driver",
        JSON.stringify(data.user.is_driver)
      );

      await getUserData();

      showNotification("Login successful.", "success");
    } catch (err: any) {
      showNotification(err.response?.data?.msg || "Login failed", "error");
      throw new Error(err.response?.data?.msg || "Login failed");
    }
  };

  const [userSocket, setUserSocket] = useState(null);
  const getUserData = async (): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) return;

      const { data } = await axios.get(`${API_URL}/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { _id, name, email, phone, driver_application, is_driver } =
        data.user;

      const socket = initUserSocket(_id);
      setUserSocket(socket);

      setSignedIn({
        user_id: _id,
        name,
        email,
        phone,
        driver_application,
        is_driver,
      });
    } catch (err) {
      console.log("Failed to fetch user data:", err);
    }
  };

  // Check for user token
  const checkTokenValidity = async () => {
    const storedToken = await AsyncStorage.getItem("token");
    setTokenLoading(false);
    if (storedToken) {
      try {
        const decoded: any = jwtDecode(storedToken);
        const now = Date.now() / 1000;
        if (decoded.exp && decoded.exp > now) {
          setIsAuthenticated(true);
        } else {
          await AsyncStorage.removeItem("token"); // Expired
        }
      } catch (err) {
        console.log("Invalid token");
        await AsyncStorage.removeItem("token");
      }
    }
  };

  const logout = async (): Promise<void> => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("is_driver");

    setIsAuthenticated(false);

    showNotification("User logged out", "error");

    setTimeout(() => {
      router.push("/");
      setSignedIn({
        user_id: "",
        name: "",
        phone: "",
        email: "",
        driver_application: "",
        is_driver: false,
      });
    }, 500);
  };

  return (
    <AuthContext.Provider
      value={{
        register,
        login,
        updatePhone,
        getUserData,
        signedIn,
        isAuthenticated,
        logout,

        userSocket,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("Auth context must be used inside the Auth Provider");
  return context;
};

type UserType = {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  driver_application: string;
  is_driver: boolean;
};

export interface AuthContextType {
  register: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<void>;
  login: (
    email: string, // email or phone
    password: string
  ) => Promise<void>;
  updatePhone: (phone: string) => Promise<void>;
  getUserData: () => Promise<void>;
  signedIn: UserType;
  isAuthenticated: boolean;
  logout: () => void;

  userSocket: any;
}
