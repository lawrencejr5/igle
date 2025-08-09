import { StyleSheet, Text, View } from "react-native";
import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNotificationContext } from "./NotificationContext";

// Types for driver data
interface Vehicle {
  exterior_image: string;
  interior_image: string;
  brand: string;
  model: string;
  color: string;
  year: string;
  plate_number: string;
}

interface DriverLicence {
  number: string;
  expiry_date: string;
  front_image: string;
  back_image: string;
  selfie_with_licence: string;
}

interface BankInfo {
  bank_name: string;
  account_number: string;
  account_name: string;
  bank_code: string;
  recipient_code: string;
}

interface CurrentLocation {
  type: string;
  coordinates: [number, number];
}

interface Driver {
  _id: string;
  user: string;
  socket_id?: string;
  vehicle_type?: string; // Added vehicle_type field
  vehicle?: Vehicle;
  driver_licence?: DriverLicence;
  date_of_birth?: string;
  driver_license_image?: string;
  is_online?: boolean;
  is_available?: boolean;
  current_location?: CurrentLocation;
  bank?: BankInfo;
  rating?: number;
  total_trips?: number;
}

interface DriverAuthContextType {
  driver: Driver | null;
  isDriver: boolean; // Changed from isAuthenticated

  // Core driver profile functions
  createDriver: (vehicle_type: string) => Promise<void>; // Updated to Promise<void>
  updateDriverInfo: (updateData: Partial<Driver>) => Promise<void>; // Updated to Promise<void>
  updateVehicleInfo: (vehicle: Vehicle) => Promise<void>; // Updated to Promise<void>
  updateDriverLicense: (driver_licence: DriverLicence) => Promise<void>; // Updated to Promise<void>
  saveBankInfo: (bankInfo: Omit<BankInfo, "recipient_code">) => Promise<void>; // Updated to Promise<void>

  // Profile retrieval functions
  getDriverProfile: () => Promise<void>;
  refreshDriverData: () => Promise<void>;

  // Driver status functions
  setAvailability: (status: boolean) => Promise<void>; // Updated to Promise<void>
  setOnlineStatus: (status: boolean) => Promise<void>; // Updated to Promise<void>
  updateLocation: (coordinates: [number, number]) => Promise<void>; // Updated to Promise<void>
  updateRating: (rating: number) => Promise<void>; // Updated to Promise<void>
}

export const DriverAuthContext = createContext<DriverAuthContextType | null>(
  null
);

const DriverAuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isDriver, setIsDriver] = useState(false);
  const { showNotification } = useNotificationContext()!;

  // API base URL
  const API_BASE_URL = "http://192.168.36.123:5000/api/v1";

  // Check if user is a driver on mount
  useEffect(() => {
    checkDriverStatus();
  }, []);

  const checkDriverStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        await getDriverProfile(token);
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.msg;
      console.log(errMsg || "Error checking driver status");
      throw new Error(errMsg || "Error checking driver status");
    }
  };

  // Core driver profile functions
  const createDriver = async (vehicle_type: string): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.post(
        `${API_BASE_URL}/drivers/create`,
        {
          vehicle_type,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.driver) {
        setDriver(data.driver);
        setIsDriver(true);
        showNotification("Updated successfully", "success");
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.msg;
      console.log(errMsg || "Failed to create driver profile");
      throw new Error(errMsg || "Failed to create driver profile");
    }
  };

  const updateDriverInfo = async (
    updateData: Partial<Driver>
  ): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.patch(
        `${API_BASE_URL}/drivers/info`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.driver) {
        setDriver(data.driver);
        showNotification("Updated successfully", "success");
      }
    } catch (error: any) {
      console.log(error.response?.data?.msg || "Error updating driver info");
      showNotification("Failed to update driver information", "error");
      throw new Error("Error updating driver info");
    }
  };

  const updateVehicleInfo = async (vehicle: Vehicle): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.patch(
        `${API_BASE_URL}/drivers/vehicle`,
        {
          vehicle,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (data.vehicle) {
        setDriver((prev) => (prev ? { ...prev, vehicle: data.vehicle } : null));
        showNotification("Updated successfully", "success");
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.msg;
      console.log(errMsg || "Error updating vehicle info");
      throw new Error(errMsg || "Error updating vehicle info");
    }
  };

  const updateDriverLicense = async (
    driver_licence: DriverLicence
  ): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.patch(
        `${API_BASE_URL}/drivers/license`,
        {
          driver_licence,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (data.driver_licence) {
        setDriver((prev) =>
          prev ? { ...prev, driver_licence: data.driver_licence } : null
        );
        showNotification("Updated successfully", "success");
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.msg;
      console.log(errMsg || "Error updating driver license");
      throw new Error(errMsg || "Error updating driver license");
    }
  };

  const saveBankInfo = async (
    bankInfo: Omit<BankInfo, "recipient_code">
  ): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.patch(
        `${API_BASE_URL}/drivers/bank`,
        {
          bankInfo,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (data.msg === "Bank info saved successfully") {
        await getDriverProfile(token || undefined); // Refresh to get updated bank info
        showNotification("Bank information saved successfully", "success");
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.msg;
      console.log(errMsg || "Error saving bank info");
      throw new Error(errMsg || "Error saving bank info");
    }
  };

  // Profile retrieval functions
  const getDriverProfile = async (token?: string): Promise<void> => {
    try {
      const authToken = token || (await AsyncStorage.getItem("token"));
      const { data } = await axios.get(`${API_BASE_URL}/drivers/user`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (data.driver) {
        setDriver(data.driver);
        setIsDriver(true);
      } else {
        setIsDriver(false);
        setDriver(null);
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.msg;
      console.log(errMsg || "Error getting driver profile");
      setIsDriver(false);
      setDriver(null);
      throw new Error(errMsg || "Error getting driver profile");
    }
  };

  const refreshDriverData = async (): Promise<void> => {
    await getDriverProfile();
  };

  // Driver status functions
  const setAvailability = async (status: boolean): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.patch(
        `${API_BASE_URL}/drivers/availability`,
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
        `${API_BASE_URL}/drivers/online`,
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
        `${API_BASE_URL}/drivers/location`,
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
        `${API_BASE_URL}/drivers/rating`,
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

  const contextValue: DriverAuthContextType = {
    driver,
    isDriver,
    createDriver,
    updateDriverInfo,
    updateVehicleInfo,
    updateDriverLicense,
    saveBankInfo,
    getDriverProfile,
    refreshDriverData,
    setAvailability,
    setOnlineStatus,
    updateLocation,
    updateRating,
  };

  return (
    <DriverAuthContext.Provider value={contextValue}>
      {children}
    </DriverAuthContext.Provider>
  );
};

export default DriverAuthProvider;

export const useDriverAuthContext = () => {
  const context = useContext(DriverAuthContext);
  if (!context) {
    throw new Error(
      "useDriverAuthContext must be used within a DriverAuthProvider"
    );
  }
  return context;
};
