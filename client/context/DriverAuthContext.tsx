import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNotificationContext } from "./NotificationContext";

import {
  initDriverSocket,
  disconnectDriverSocket,
} from "../sockets/socketService";
import { useWalletContext } from "./WalletContext";
import { API_URLS } from "../data/constants";

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

interface DriverType {
  driver_id: string;
  user?: string;
  profile_pic: string;
  createdAt: Date;
  name?: string;
  email?: string;
  phone?: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_color: string;
  socket_id?: string;
  vehicle_type?: string;
  vehicle?: Vehicle;
  driver_licence?: DriverLicence;
  driver_licence_number?: number;
  date_of_birth?: string;
  driver_license_image?: string;
  is_online?: boolean;
  is_available?: boolean;
  current_location?: CurrentLocation;
  bank?: BankInfo;
  rating?: number;
  total_trips?: number;
  plate_number?: string;
}

interface DriverAuthContextType {
  driver: DriverType | null;
  setDriver: Dispatch<SetStateAction<DriverType | null>>;
  driverData: DriverType | null;
  driverSocket: any;
  setDriverSocket: Dispatch<SetStateAction<any>>;
  isDriver: boolean; // Changed from isAuthenticated

  // Core driver profile functions
  createDriver: (vehicle_type: string) => Promise<void>; // Updated to Promise<void>
  updateDriverInfo: (updateData: Partial<DriverType>) => Promise<void>; // Updated to Promise<void>
  updateVehicleInfo: (vehicle: Vehicle) => Promise<void>; // Updated to Promise<void>
  updateDriverLicense: (driver_licence: DriverLicence) => Promise<void>; // Updated to Promise<void>
  saveBankInfo: (bankInfo: Omit<BankInfo, "recipient_code">) => Promise<void>; // Updated to Promise<void>

  // Profile retrieval functions
  getDriverProfile: () => Promise<void>;
  getDriverData: (driver_id: string) => Promise<void>;

  gettingDriverData: boolean;
  setGettingDriverData: Dispatch<SetStateAction<boolean>>;

  // Driver status functions
}

export const DriverAuthContext = createContext<DriverAuthContextType | null>(
  null
);

const DriverAuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [driver, setDriver] = useState<DriverType | null>(null);
  const [driverData, setDriverData] = useState<DriverType | null>(null);
  const [isDriver, setIsDriver] = useState(false);
  const { showNotification } = useNotificationContext();
  const { getWalletBalance } = useWalletContext();

  // API base URL
  const API_URL = API_URLS.drivers;

  // Check if user is a driver on mount
  useEffect(() => {
    getDriverProfile();
    getWalletBalance("Driver");
  }, []);

  useEffect(() => {
    if (driver?.driver_id) {
      const socket = initDriverSocket(driver.driver_id);
      setDriverSocket(socket);

      return () => {
        setDriverSocket(null);
        disconnectDriverSocket();
      };
    }
  }, [driver?.driver_id]);

  const getDriverInfo = async (driver_id?: string) => {
    try {
      const authToken = await AsyncStorage.getItem("token");

      const url = driver_id
        ? `${API_URL}/data?driver_id=${driver_id}`
        : `${API_URL}/data`;

      const { data } = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (data.driver) {
        const {
          _id,
          vehicle_type,
          socket_id,
          total_trips,
          is_available,
          rating,
          user: { name, email, phone, createdAt, profile_pic },
          vehicle: { brand, model, color, plate_number },
          driver_licence: { number: driver_licence_number },
        } = data.driver;

        const driverInfo = {
          driver_id: _id,
          socket_id,
          vehicle_type,
          name,
          email,
          phone,
          total_trips,
          vehicle_brand: brand,
          vehicle_model: model,
          vehicle_color: color,
          plate_number,
          driver_licence_number,
          is_available,
          rating,
          profile_pic,
          createdAt,
        };
        return driverInfo;
      } else {
        console.log("Something's wrong");
        throw new Error("An error occured");
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.msg;
      throw new Error(errMsg || "Error getting driver profile");
    }
  };

  // Profile retrieval functions
  const [driverSocket, setDriverSocket] = useState<any>(null);
  const getDriverProfile = async (): Promise<void> => {
    try {
      const data = await getDriverInfo();

      if (data) {
        setDriver({ ...data });
      } else {
        throw new Error("An error occured");
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.msg;
      throw new Error(errMsg || "Error getting driver profile");
    }
  };

  const [gettingDriverData, setGettingDriverData] = useState<boolean>(false);
  const getDriverData = async (driver_id: string): Promise<void> => {
    setGettingDriverData(true);
    try {
      const data = await getDriverInfo(driver_id);

      if (data) {
        setDriverData({
          ...data,
        });
      } else {
        console.log("Something went wrong");
        throw new Error("An error occured");
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.msg;
      console.log(errMsg);
      throw new Error(errMsg || "Error getting driver profile");
    } finally {
      setGettingDriverData(false);
    }
  };

  // Core driver profile functions
  const createDriver = async (vehicle_type: string): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.post(
        `${API_URL}/create`,
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
    updateData: Partial<DriverType>
  ): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.patch(`${API_URL}/info`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
        `${API_URL}/vehicle`,
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
        `${API_URL}/license`,
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
        `${API_URL}/bank`,
        {
          bank_name: bankInfo.bank_name,
          bank_code: bankInfo.bank_code,
          account_number: bankInfo.account_number,
          account_name: bankInfo.account_name,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      showNotification(data.msg, "success");
    } catch (error: any) {
      const errMsg = error.response?.data?.msg;
      console.log(errMsg || "Error saving bank info");
      throw new Error(errMsg || "Error saving bank info");
    }
  };

  const contextValue: DriverAuthContextType = {
    driver,
    setDriver,
    driverData,
    driverSocket,
    setDriverSocket,
    getDriverData,
    isDriver,
    createDriver,
    updateDriverInfo,
    updateVehicleInfo,
    updateDriverLicense,
    saveBankInfo,
    getDriverProfile,
    gettingDriverData,
    setGettingDriverData,
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
