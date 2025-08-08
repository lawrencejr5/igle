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
import {
  NotificationContextType,
  useNotificationContext,
} from "./NotificationContext";

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
}

export const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showNotification } =
    useNotificationContext() as NotificationContextType;

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
      showNotification("Registration successful", "success");
    } catch (err: any) {
      console.log(err);
      const errMsg = err.response?.data?.msg;
      showNotification(errMsg || "Registration failed.", "error");
      throw new Error(errMsg);
    }
  };

  // Login function (email or phone)
  const login = async (identifier: string, password: string): Promise<void> => {
    try {
      let data;
      if (identifier.includes("@")) {
        ({ data } = await axios.post(
          "http://localhost:5000/api/v1/users/login",
          { email: identifier, password }
        ));
      } else {
        ({ data } = await axios.post(
          "http://localhost:5000/api/v1/users/login",
          { phone: identifier, password }
        ));
      }
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user_id", data.user.id);
      showNotification("Login successful.", "success");
    } catch (err: any) {
      showNotification(err.response?.data?.msg || "Login failed.", "error");
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
      showNotification("Phone updated successfully.", "success");
    } catch (err: any) {
      showNotification(
        err.response?.data?.msg || "Phone update failed.",
        "error"
      );
      throw new Error(err.response?.data?.msg);
    }
  };

  return (
    <AuthContext.Provider value={{ register, login, updatePhone }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useAuthContext = () => {
  return useContext(AuthContext);
};
