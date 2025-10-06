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
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import { jwtDecode } from "jwt-decode";

import { initUserSocket, disconnectUserSocket } from "../sockets/socketService";

import {
  NotificationContextType,
  useNotificationContext,
} from "./NotificationContext";
import { useWalletContext } from "./WalletContext";

import { router } from "expo-router";

import { useDriverAuthContext } from "./DriverAuthContext";
import { useHistoryContext } from "./HistoryContext";
import { useLoading } from "./LoadingContext";

import { API_URLS } from "../data/constants";
import { useActivityContext } from "./ActivityContext";
import { useSavedPlaceContext } from "./SavedPlaceContext";

export const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showNotification } =
    useNotificationContext() as NotificationContextType;
  const { getWalletBalance } = useWalletContext();
  const { getRideHistory } = useHistoryContext();
  const { setAppLoading } = useLoading();
  const { createActivity, fetchActivities } = useActivityContext();
  const { getSavedPlaces } = useSavedPlaceContext();

  const [signedIn, setSignedIn] = useState<UserType | null>(null);

  const { setDriver } = useDriverAuthContext();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    getUserData();
    checkTokenValidity();
    getWalletBalance("User");
  }, []);

  useEffect(() => {
    if (signedIn?.user_id) {
      const socket = initUserSocket(signedIn.user_id);
      setUserSocket(socket);

      return () => {
        setUserSocket(null);
        disconnectUserSocket();
      };
    }
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn?.user_id) return;

    const load = async () => {
      await Promise.all([
        getRideHistory(),
        fetchActivities(),
        getSavedPlaces(),
      ]);
    };

    load();
  }, [signedIn?.user_id]);

  const API_URL = API_URLS.users;

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

      await getUserData();

      showNotification("Registration successful", "success");
    } catch (err: any) {
      console.log(err);
      const errMsg = err.response?.data?.msg;
      showNotification(errMsg || "Registration failed.", "error");
      throw new Error(errMsg);
    }
  };

  const [uploadingPic, setUploadingPic] = useState<boolean>(false);
  const uploadProfilePic = async (formaData: any): Promise<void> => {
    if (!formaData) showNotification("No image was selected", "error");
    const token = await AsyncStorage.getItem("token");

    setUploadingPic(true);
    try {
      console.log(formaData);
      const { data } = await axios.patch(`${API_URL}/profile_pic`, formaData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (data) {
        await getUserData();
        showNotification(data.msg, "success");
      }
    } catch (error: any) {
      const errMsg = error.response.data.msg;
      showNotification(errMsg || "An error occured", "error");
    } finally {
      setUploadingPic(false);
    }
  };

  const [removingPic, setRemovingPic] = useState<boolean>(false);
  const removeProfilePic = async (): Promise<void> => {
    const token = await AsyncStorage.getItem("token");

    setRemovingPic(true);
    try {
      const { data } = await axios.patch(
        `${API_URL}/remove_pic`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (data) {
        await getUserData();
        showNotification(data.msg, "success");
      }
    } catch (error: any) {
      const errMsg = error.response.data.msg;
      showNotification(errMsg || "An error occured", "error");
    } finally {
      setRemovingPic(false);
    }
  };

  // Update phone number function
  const updatePhone = async (phone: string): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.patch(
        `${API_URL}/phone`,
        { phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await getUserData();

      await createActivity(
        "phone_update",
        "Phone number updated",
        `Your phone number has been updated`,
        { phone: data.user.phone }
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

  // Update phone number function
  const updateName = async (fullname: string): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.patch(
        `${API_URL}/name?fullname=${fullname}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await getUserData();

      showNotification("Name updated successfully.", "success");
    } catch (err: any) {
      showNotification(
        err.response?.data?.msg || "Name update failed.",
        "error"
      );
      throw new Error(err.response?.data?.msg);
    }
  };

  // Update phone number function
  const updateEmail = async (email: string): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.patch(
        `${API_URL}/email?email=${email}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await getUserData();

      await createActivity(
        "email_update",
        "Email updated",
        `Your email has been updated`,
        { email: data.user.email }
      );

      showNotification("Email updated successfully.", "success");
    } catch (err: any) {
      showNotification(
        err.response?.data?.msg || "Email update failed.",
        "error"
      );
      throw new Error(err.response?.data?.msg);
    }
  };

  const updatePassword = async (
    old_password: string,
    new_password: string,
    confirm_password: string
  ): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      const password = {
        old_password,
        new_password,
        confirm_password,
      };
      await axios.patch(
        `${API_URL}/password`,
        { ...password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await createActivity(
        "security",
        "Password updated",
        `Your password has been changed`
      );

      showNotification("Password updated successfully.", "success");
      setTimeout(async () => {
        await logout();
      }, 1000);
    } catch (err: any) {
      showNotification(
        err.response?.data?.msg || "Email update failed.",
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

  // Google login (backend verifies tokenId and returns jwt + user)
  const googleLogin = async (tokenId: string): Promise<void> => {
    try {
      const { data } = await axios.post(`${API_URL}/google_auth`, { tokenId });

      await AsyncStorage.setItem("token", data.token);

      const is_driver = data.user.is_driver;

      await getUserData();
      // If this is a newly created user via Google, navigate to phone update flow
      if (data.isNew) {
        router.push("/(auth)/phone");
      } else {
        if (is_driver) {
          router.push("/(driver)/home");
        } else {
          router.push("/(tabs)/home");
        }
      }
      showNotification(
        data.isNew ? "Account created" : "Login successful.",
        "success"
      );
    } catch (err: any) {
      showNotification(
        err?.response?.data?.msg || "Google login failed.",
        "error"
      );
      console.log(
        "Google login error:",
        err?.response?.data || err?.message || err
      );
      throw err;
    }
  };

  const [userSocket, setUserSocket] = useState<any>(null);
  const getUserData = async (): Promise<void> => {
    setAppLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) return;

      const { data } = await axios.get(`${API_URL}/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const {
        _id,
        name,
        profile_pic,
        email,
        phone,
        driver_application,
        is_driver,
      } = data.user;

      setSignedIn({
        user_id: _id,
        name,
        profile_pic,
        email,
        phone,
        driver_application,
        is_driver,
      });
      await getWalletBalance("User");
    } catch (err) {
      console.log("Failed to fetch user data:", err);
    } finally {
      setAppLoading(false);
    }
  };

  // Push notification helpers -------------------------------------------------
  const registerForPushNotificationsAsync = async (): Promise<
    string | null
  > => {
    try {
      if (!Device.isDevice) {
        console.log("Must use physical device for Push Notifications");
        return null;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token permission");
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      return token;
    } catch (err) {
      console.log("Error getting push token:", err);
      return null;
    }
  };

  const registerPushToken = async () => {
    try {
      const pushToken = await registerForPushNotificationsAsync();
      if (!pushToken) return;

      await AsyncStorage.setItem("expoPushToken", pushToken);

      const authToken = await AsyncStorage.getItem("token");
      if (!authToken) return;

      await axios.patch(
        `${API_URL}/push_token`,
        { token: pushToken },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
    } catch (err) {
      console.log("Failed to register push token:", err);
    }
  };

  const unregisterPushToken = async () => {
    try {
      const pushToken = await AsyncStorage.getItem("expoPushToken");
      if (!pushToken) return;

      const authToken = await AsyncStorage.getItem("token");
      if (!authToken) return;

      await axios.patch(
        `${API_URL}/push_token`,
        { token: pushToken, action: "remove" },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      await AsyncStorage.removeItem("expoPushToken");
    } catch (err) {
      console.log("Failed to unregister push token:", err);
    }
  };

  // Check for user token
  const checkTokenValidity = async () => {
    const storedToken = await AsyncStorage.getItem("token");
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

  const updateDriverApplication = async (
    status: "none" | "submitted" | "rejected" | "approved"
  ): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.patch(
        `${API_URL}/driver_application`,
        { driver_application: status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.status !== undefined) {
        setDriver((prev) =>
          prev ? { ...prev, driver_application: data.status } : null
        );
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.msg;
      console.log(errMsg || "Error updating driver application status");
      throw new Error(errMsg || "Error updating driver application status");
    }
  };

  const logout = async (): Promise<void> => {
    // Unregister push token for this device (best-effort)
    // try {
    //   await unregisterPushToken();
    // } catch (e) {
    //   console.log("Error unregistering push token:", e);
    // }

    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("is_driver");
    await AsyncStorage.removeItem("ongoingRideId");

    setIsAuthenticated(false);

    showNotification("User logged out", "error");

    setTimeout(() => {
      router.push("/");
      setSignedIn(null);
      setDriver(null);
    }, 500);
  };

  return (
    <AuthContext.Provider
      value={{
        register,
        login,
        uploadingPic,
        uploadProfilePic,
        removingPic,
        removeProfilePic,
        updatePhone,
        updateEmail,
        updateName,
        updatePassword,
        googleLogin,
        getUserData,
        signedIn,
        isAuthenticated,
        logout,
        userSocket,
        updateDriverApplication,
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
  profile_pic: string;
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
  uploadingPic: boolean;
  uploadProfilePic: (formaData: any) => Promise<void>;
  removingPic: boolean;
  removeProfilePic: () => Promise<void>;
  updatePhone: (phone: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  updatePassword: (
    old_password: string,
    new_password: string,
    confirm_password: string
  ) => Promise<void>;
  getUserData: () => Promise<void>;
  signedIn: UserType | null;
  isAuthenticated: boolean;
  logout: () => void;

  updateDriverApplication: (
    status: "none" | "approved" | "submitted" | "rejected"
  ) => Promise<void>;

  // Google login helper - accepts id token from client and exchanges with backend
  googleLogin: (tokenId: string) => Promise<void>;

  userSocket: any;
}
