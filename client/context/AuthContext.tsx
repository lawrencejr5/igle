import { StyleSheet, Text, View } from "react-native";
import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
} from "react";

import axios from "axios";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { jwtDecode } from "jwt-decode";

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
  });

  const [tokenLoading, setTokenLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    getUserData();
    checkTokenValidity();
  }, []);

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
      const { data } = await axios.post(
        "http://192.168.36.123:5000/api/v1/users/register",
        {
          name,
          email,
          password,
        }
      );
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
        "http://192.168.36.123:5000/api/v1/users/phone",
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
      const { data } = await axios.post(
        "http://192.168.36.123:5000/api/v1/users/login",
        { email, password }
      );

      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user_id", data.user.id);

      await getUserData();

      showNotification("Login successful.", "success");
    } catch (err: any) {
      showNotification(err.response?.data?.msg || "Login failed", "error");
      throw new Error(err.response?.data?.msg || "Login failed");
    }
  };

  const getUserData = async (): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) return;

      const { data } = await axios.get(
        `http://192.168.36.123:5000/api/v1/users/data`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { _id, name, email, phone } = data.user;
      setSignedIn({
        user_id: _id,
        name,
        email,
        phone,
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

    showNotification("User logged out", "error");

    setSignedIn({
      user_id: "",
      name: "",
      phone: "",
      email: "",
    });

    router.push("/");
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useAuthContext = () => {
  return useContext(AuthContext);
};

type UserType = {
  user_id: string;
  name: string;
  email: string;
  phone: string;
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
}
