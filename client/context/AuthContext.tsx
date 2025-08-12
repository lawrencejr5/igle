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

  const [region, setRegion] = useState<any>(null);
  const [userAddress, setUserAddress] = useState<string>("");
  const [mapSuggestions, setMapSuggestions] = useState<any>(null);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    getUserData();
    checkTokenValidity();
    set_user_location();
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
        "http://192.168.10.123:5000/api/v1/users/register",
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
        "http://192.168.10.123:5000/api/v1/users/phone",
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
        "http://192.168.10.123:5000/api/v1/users/login",
        { email, password }
      );

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

  const getUserData = async (): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) return;

      const { data } = await axios.get(
        `http://192.168.10.123:5000/api/v1/users/data`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { _id, name, email, phone, driver_application, is_driver } =
        data.user;

      initUserSocket(_id);

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

    setSignedIn({
      user_id: "",
      name: "",
      phone: "",
      email: "",
      driver_application: "",
      is_driver: false,
    });

    setTimeout(() => {
      router.push("/");
    }, 500);
  };

  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const set_user_location = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
      await AsyncStorage.setItem("region", JSON.stringify(region));
      await getPlaceName(location.coords.latitude, location.coords.longitude);
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setLocationLoading(false);
    }
  };

  const getPlaceName = async (lat: number, lng: number): Promise<void> => {
    setLocationLoading(true);
    const apiKey = "AIzaSyDdZZ0ji5pbx3ddhhlvYugGNvSxOOC3Zss";

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

    try {
      const { data } = await axios.get(url);

      if (data.results.length > 0) {
        setLocationLoading(false);
        setUserAddress(data.results[0].formatted_address);
      }
    } catch (error) {
      console.error("Error fetching place name", error);
    } finally {
      setLocationLoading(false);
    }
  };

  const getSuggestions = async (text: string) => {
    const apiKey = "AIzaSyDdZZ0ji5pbx3ddhhlvYugGNvSxOOC3Zss";
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      text
    )}&key=${apiKey}&components=country:ng`;

    try {
      const { data } = await axios.get(url);
      if (data) {
        setMapSuggestions(data.predictions || []);
      }
    } catch (err: any) {
      console.log(
        err.response.data.message ||
          "An error occured when fetching suggestions"
      );
      throw new Error(
        err.response.data.message ||
          "An error occured when fetching suggestions"
      );
    }
  };

  const getPlaceCoords = async (
    place_id: string
  ): Promise<[number, number] | undefined> => {
    try {
      const apiKey = "AIzaSyDdZZ0ji5pbx3ddhhlvYugGNvSxOOC3Zss";
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${apiKey}`;
      const { data } = await axios.get(url);
      const location = data.result.geometry.location;

      return [location.lat, location.lng];
    } catch (error) {
      console.log(error);
    }
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

        region,
        set_user_location,
        userAddress,
        setUserAddress,
        getSuggestions,
        mapSuggestions,
        setMapSuggestions,
        getPlaceCoords,
        getPlaceName,

        locationLoading,
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

  region: any;
  set_user_location: () => Promise<void>;
  userAddress: string;
  setUserAddress: Dispatch<SetStateAction<string>>;
  getSuggestions: (text: string) => Promise<void>;
  mapSuggestions: any;
  setMapSuggestions: Dispatch<SetStateAction<any>>;

  getPlaceCoords: (place_id: string) => Promise<[number, number] | undefined>;
  getPlaceName: (lat: number, lng: number) => Promise<void>;

  locationLoading: boolean;
}
