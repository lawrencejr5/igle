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

import { registerForPushNotificationsAsync } from "../utils/registerPushNotification";

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
    const init = async () => {
      const isValid = await checkTokenValidity();
      if (isValid) {
        await getUserData();
        getWalletBalance("User");
      }
    };
    init();
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

  // Detect Apple relay emails (user chose "Hide My Email")
  const isAppleHiddenEmail = (email: string) =>
    email?.endsWith("@privaterelay.appleid.com");

  // Check if name looks auto-generated (no spaces = likely email prefix fallback)
  const needsFullname = (name: string, email: string) =>
    isAppleHiddenEmail(email) && !name.includes(" ");

  useEffect(() => {
    if (!signedIn) {
      router.replace("/");
      return;
    }

    // Authenticated but name looks auto-generated from Apple relay: force name capture
    if (needsFullname(signedIn.name, signedIn.email)) {
      router.replace("(auth)/fullname");
      return;
    }

    // Authenticated but missing phone: force phone capture
    if (!signedIn.phone || signedIn.phone === "") {
      router.replace("(auth)/phone");
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
    confirmPassword: string,
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
    console.log(token);

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
        },
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
        { headers: { Authorization: `Bearer ${token}` } },
      );

      await getUserData();

      await createActivity(
        "phone_update",
        "Phone number updated",
        `Your phone number has been updated`,
        { phone: data.user.phone },
      );

      showNotification("Phone updated successfully.", "success");
    } catch (err: any) {
      showNotification(
        err.response?.data?.msg || "Phone update failed.",
        "error",
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
        },
      );

      await getUserData();

      showNotification("Name updated successfully.", "success");
    } catch (err: any) {
      showNotification(
        err.response?.data?.msg || "Name update failed.",
        "error",
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
        },
      );

      await getUserData();

      await createActivity(
        "email_update",
        "Email updated",
        `Your email has been updated`,
        { email: data.user.email },
      );

      showNotification("Email updated successfully.", "success");
    } catch (err: any) {
      showNotification(
        err.response?.data?.msg || "Email update failed.",
        "error",
      );
      throw new Error(err.response?.data?.msg);
    }
  };

  const updatePassword = async (
    old_password: string,
    new_password: string,
    confirm_password: string,
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
        { headers: { Authorization: `Bearer ${token}` } },
      );

      await createActivity(
        "security",
        "Password updated",
        `Your password has been changed`,
      );

      showNotification("Password updated successfully.", "success");
      setTimeout(async () => {
        await logout();
      }, 1000);
    } catch (err: any) {
      showNotification(
        err.response?.data?.msg || "Email update failed.",
        "error",
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
        JSON.stringify(data.user.is_driver),
      );

      await getUserData();

      // If user hasn't added a phone number, navigate to phone update
      const hasPhone = !!data.user?.phone;
      if (!hasPhone) {
        router.replace("/(auth)/phone");
      } else {
        // Navigate based on role
        if (data.user.is_driver) {
          router.replace("/(driver)/home");
        } else {
          router.replace("/(tabs)/home");
        }
      }

      showNotification("Login successful.", "success");
    } catch (err: any) {
      showNotification(err.response?.data?.msg || "Login failed", "error");
      throw new Error(err.response?.data?.msg || "Login failed");
    }
  };

  // Google login (backend verifies tokenId and returns jwt + user)
  const googleLogin = async (tokenId: string): Promise<void> => {
    console.log("entered, ", tokenId);
    try {
      const { data } = await axios.post(`${API_URL}/google_auth`, { tokenId });

      console.log("came out");
      await AsyncStorage.setItem("token", data.token);

      const is_driver = data.user.is_driver;
      const hasPhone = !!data.user?.phone;

      showNotification(
        data.isNew ? "Account created" : "Login successful.",
        "success",
      );

      await getUserData();

      // New accounts or accounts without phone must update phone first
      if (data.isNew || !hasPhone) {
        router.replace("/(auth)/phone");
      } else if (is_driver) {
        router.replace("/(driver)/home");
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (err: any) {
      showNotification(
        err?.response?.data?.msg || "Google login failed.",
        "error",
      );
      console.log(
        "Google login error:",
        err?.response?.data || err?.message || err,
      );
      throw err;
    }
  };

  // Apple login (backend verifies identityToken and returns jwt + user)
  const appleLogin = async (
    identityToken: string,
    fullName?: { givenName?: string | null; familyName?: string | null } | null,
  ): Promise<void> => {
    console.log("[AppleAuth] appleLogin called, sending to server...");
    console.log("[AppleAuth] API_URL:", API_URL);
    console.log("[AppleAuth] identityToken length:", identityToken?.length);
    console.log("[AppleAuth] fullName:", fullName);
    try {
      const { data } = await axios.post(`${API_URL}/apple_auth`, {
        identityToken,
        fullName,
      });

      console.log("[AppleAuth] Server response received:", {
        hasToken: !!data.token,
        isNew: data.isNew,
        userId: data.user?._id,
        userEmail: data.user?.email,
        userName: data.user?.name,
        hasPhone: !!data.user?.phone,
        isDriver: data.user?.is_driver,
      });

      await AsyncStorage.setItem("token", data.token);
      console.log("[AppleAuth] Token stored in AsyncStorage");

      const is_driver = data.user.is_driver;
      const hasPhone = !!data.user?.phone;

      showNotification(
        data.isNew ? "Account created" : "Login successful.",
        "success",
      );

      console.log("[AppleAuth] Calling getUserData...");
      await getUserData();
      console.log("[AppleAuth] getUserData completed");

      console.log("[AppleAuth] Navigation decision:", { isNew: data.isNew, hasPhone, is_driver, userName: data.user?.name, userEmail: data.user?.email });

      // Check if name needs to be captured (Apple hidden email with auto-generated name)
      if (needsFullname(data.user?.name || "", data.user?.email || "")) {
        console.log("[AppleAuth] Hidden Apple account detected, navigating to fullname");
        router.replace("/(auth)/fullname");
      } else if (data.isNew || !hasPhone) {
        console.log("[AppleAuth] Navigating to phone screen");
        router.replace("/(auth)/phone");
      } else if (is_driver) {
        console.log("[AppleAuth] Navigating to driver home");
        router.replace("/(driver)/home");
      } else {
        console.log("[AppleAuth] Navigating to tabs home");
        router.replace("/(tabs)/home");
      }
    } catch (err: any) {
      console.log("[AppleAuth] appleLogin error:", {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
      showNotification(
        err?.response?.data?.msg || err?.response?.data?.message || "Apple login failed.",
        "error",
      );
      console.log(
        "Apple login error:",
        err?.response?.data || err?.message || err,
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
      await registerPushToken();
      await getWalletBalance("User");
    } catch (err) {
      console.log("Failed to fetch user data:", err);
    } finally {
      setAppLoading(false);
    }
  };

  // Push notification helpers -------------------------------------------------
  const registerPushToken = async () => {
    try {
      const pushToken = await registerForPushNotificationsAsync();
      if (!pushToken) return;

      const savedToken = await AsyncStorage.getItem("expoPushToken");
      if (savedToken === pushToken) return;

      await AsyncStorage.setItem("expoPushToken", pushToken);

      const authToken = await AsyncStorage.getItem("token");
      if (!authToken) return;

      await axios.patch(
        `${API_URL}/push_token`,
        { token: pushToken },
        { headers: { Authorization: `Bearer ${authToken}` } },
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
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      await AsyncStorage.removeItem("expoPushToken");
    } catch (err) {
      console.log("Failed to unregister push token:", err);
    }
  };

  // Check for user token
  const checkTokenValidity = async (): Promise<boolean> => {
    const storedToken = await AsyncStorage.getItem("token");
    if (storedToken) {
      try {
        const decoded: any = jwtDecode(storedToken);
        const now = Date.now() / 1000;
        if (decoded.exp && decoded.exp > now) {
          setIsAuthenticated(true);
          return true;
        } else {
          await AsyncStorage.removeItem("token"); // Expired
        }
      } catch (err) {
        console.log("Invalid token");
        await AsyncStorage.removeItem("token");
      }
    }
    return false;
  };

  const updateDriverApplication = async (
    status: "none" | "submitted" | "rejected" | "approved",
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
        },
      );

      if (data.status !== undefined) {
        setDriver((prev) =>
          prev ? { ...prev, driver_application: data.status } : null,
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
    await unregisterPushToken();

    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("is_driver");
    await AsyncStorage.removeItem("ongoingRideId");

    setIsAuthenticated(false);

    showNotification("User logged out", "error");

    setTimeout(() => {
      // Replace history so the user cannot go back into the app after logout
      router.replace("/");
      setSignedIn(null);
      setDriver(null);
    }, 500);
  };

  const deleteAccount = async (): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.delete(`${API_URL}/delete`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Clear local data and logout after deleting account
      await unregisterPushToken();

      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("is_driver");
      await AsyncStorage.removeItem("ongoingRideId");

      setIsAuthenticated(false);

      showNotification("Account permanently deleted", "success");

      setTimeout(() => {
        router.replace("/");
        setSignedIn(null);
        setDriver(null);
      }, 500);
    } catch (err: any) {
      showNotification(
        err.response?.data?.msg || "Account deletion failed.",
        "error",
      );
      throw new Error(err.response?.data?.msg);
    }
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
        appleLogin,
        getUserData,
        signedIn,
        isAuthenticated,
        logout,
        userSocket,
        updateDriverApplication,
        deleteAccount,
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
    confirmPassword: string,
  ) => Promise<void>;
  login: (
    email: string, // email or phone
    password: string,
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
    confirm_password: string,
  ) => Promise<void>;
  getUserData: () => Promise<void>;
  signedIn: UserType | null;
  isAuthenticated: boolean;
  logout: () => void;

  updateDriverApplication: (
    status: "none" | "approved" | "submitted" | "rejected",
  ) => Promise<void>;

  // Google login helper - accepts id token from client and exchanges with backend
  googleLogin: (tokenId: string) => Promise<void>;

  // Apple login helper - accepts identity token from client and exchanges with backend
  appleLogin: (
    identityToken: string,
    fullName?: { givenName?: string | null; familyName?: string | null } | null,
  ) => Promise<void>;

  userSocket: any;
  deleteAccount: () => Promise<void>;
}
