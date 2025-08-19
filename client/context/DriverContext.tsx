import React, { createContext, FC, ReactNode, useContext } from "react";

import { useDriverAuthContext } from "./DriverAuthContext";
import { useNotificationContext } from "./NotificationContext";
import { useWalletContext } from "./WalletContext";

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface DriverConextType {}

const DriverContext = createContext<DriverConextType | null>(null);

const DriverContextPrvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { driverSocket, driver, setDriver } = useDriverAuthContext();

  const { showNotification } = useNotificationContext();
  const { getWalletBalance } = useWalletContext();

  const API_URL = "http://192.168.235.123:5000/api/v1/drivers";

  // Driver status functions
  const setAvailability = async (status: boolean): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.patch(
        `${API_URL}/availability`,
        {
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.is_available !== undefined) {
        setDriver((prev) =>
          prev ? { ...prev, is_available: data.is_available } : null
        );
        showNotification(
          `Availability ${status ? "enabled" : "disabled"} successfully`,
          "success"
        );
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.msg;
      console.log(errMsg || "Error setting availability");
      throw new Error(errMsg || "Error setting availability");
    }
  };

  const setOnlineStatus = async (status: boolean): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.patch(
        `${API_URL}/online`,
        {
          is_online: status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.is_online !== undefined) {
        setDriver((prev) =>
          prev ? { ...prev, is_online: data.is_online } : null
        );
        showNotification(
          `Online status ${status ? "enabled" : "disabled"} successfully`,
          "success"
        );
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.msg;
      console.log(errMsg || "Error setting online status");
      throw new Error(errMsg || "Error setting online status");
    }
  };

  const updateLocation = async (
    coordinates: [number, number]
  ): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.patch(
        `${API_URL}/location`,
        {
          coordinates,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.new_coordinates) {
        setDriver((prev) =>
          prev
            ? {
                ...prev,
                current_location: {
                  type: "Point", // Explicitly set type
                  coordinates: data.new_coordinates,
                },
              }
            : null
        );
        showNotification("Location updated successfully", "success");
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.msg;
      console.log(errMsg || "Error updating location");
      throw new Error(errMsg || "Error updating location");
    }
  };

  const updateRating = async (rating: number): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.patch(
        `${API_URL}/rating`,
        {
          rating,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.rating !== undefined) {
        setDriver((prev) => (prev ? { ...prev, rating: data.rating } : null));
        showNotification("Rating updated successfully", "success");
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.msg;
      console.log(errMsg || "Error updating rating");
      throw new Error(errMsg || "Error updating rating");
    }
  };

  return (
    <DriverContext.Provider value={null}>{children}</DriverContext.Provider>
  );
};

export const useDriverContext = () => {
  const context = useContext(DriverContext);
  if (!context)
    throw new Error(
      "Driver context can only be used within the Driver provider"
    );
  return context;
};

export default DriverContextPrvider;
