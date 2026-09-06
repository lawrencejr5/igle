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
import { API_URLS } from "../data/constants";

// Operating hours structure
export interface OperatingHour {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

// Location structure
export interface RestaurantLocationType {
  address: string;
  landmark?: string;
  coordinates: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  delivery_radius_km: number;
}

// Bank structure
export interface RestaurantBankType {
  bank_name: string;
  account_number: string;
  account_name: string;
  bank_code: string;
}

// Verification structure
export interface RestaurantVerificationType {
  government_id: string;
  cac_document?: string;
  is_cac_verified: boolean;
}

// Full Restaurant Type
export interface RestaurantType {
  _id?: string;
  user?: string;
  name: string;
  logo?: string;
  banner?: string;
  category_tags: string[];
  phone: string;
  email: string;
  description?: string;
  operating_hours: OperatingHour[];
  location: RestaurantLocationType;
  bank?: RestaurantBankType;
  verification: RestaurantVerificationType;
  is_online: boolean;
  is_verified: boolean;
  application: "none" | "pending" | "rejected" | "submitted" | "approved";
  rating?: number;
  num_of_reviews?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Registration form draft state structure
export interface RestaurantRegistrationDraft {
  logoUri: string;
  bannerUri: string;
  name: string;
  phone: string;
  email: string;
  description: string;
  category_tags: string[];
  operating_hours: OperatingHour[];
  address: string;
  landmark: string;
  latitude: number | null;
  longitude: number | null;
  delivery_radius_km: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  bank_code: string;
  government_id_uri: string;
  cac_document_uri: string;
}

const initialRegistrationDraft: RestaurantRegistrationDraft = {
  logoUri: "",
  bannerUri: "",
  name: "",
  phone: "",
  email: "",
  description: "",
  category_tags: [],
  operating_hours: [
    { day: "Mon", open: "08:00 AM", close: "10:00 PM", closed: false },
    { day: "Tue", open: "08:00 AM", close: "10:00 PM", closed: false },
    { day: "Wed", open: "08:00 AM", close: "10:00 PM", closed: false },
    { day: "Thu", open: "08:00 AM", close: "10:00 PM", closed: false },
    { day: "Fri", open: "08:00 AM", close: "10:00 PM", closed: false },
    { day: "Sat", open: "08:00 AM", close: "10:00 PM", closed: false },
    { day: "Sun", open: "08:00 AM", close: "10:00 PM", closed: true },
  ],
  address: "",
  landmark: "",
  latitude: null,
  longitude: null,
  delivery_radius_km: 5,
  bank_name: "GTBank",
  account_number: "",
  account_name: "",
  bank_code: "058",
  government_id_uri: "",
  cac_document_uri: "",
};

interface RestaurantContextType {
  restaurant: RestaurantType | null;
  setRestaurant: Dispatch<SetStateAction<RestaurantType | null>>;
  loading: boolean;
  registrationDraft: RestaurantRegistrationDraft;
  updateRegistrationDraft: (data: Partial<RestaurantRegistrationDraft>) => void;
  resetRegistrationDraft: () => void;
  submitRegistration: () => Promise<void>;
  registerRestaurant: (formData: FormData) => Promise<void>;
  fetchRestaurantProfile: () => Promise<RestaurantType | null>;
  setRestaurantOnlineStatus: (is_online: boolean) => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextType | null>(null);

export const RestaurantProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { showNotification } = useNotificationContext()!;
  const [restaurant, setRestaurant] = useState<RestaurantType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [registrationDraft, setRegistrationDraft] =
    useState<RestaurantRegistrationDraft>(initialRegistrationDraft);

  const updateRegistrationDraft = (
    data: Partial<RestaurantRegistrationDraft>
  ) => {
    setRegistrationDraft((prev) => ({ ...prev, ...data }));
  };

  const resetRegistrationDraft = () => {
    setRegistrationDraft(initialRegistrationDraft);
  };

  // Fetch current restaurant profile
  const fetchRestaurantProfile = async (): Promise<RestaurantType | null> => {
    try {
      const token =
        (await AsyncStorage.getItem("token")) ||
        (await AsyncStorage.getItem("userToken"));
      if (!token) return null;

      const { data } = await axios.get(`${API_URLS.restaurants}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data?.restaurant) {
        setRestaurant(data.restaurant);
        return data.restaurant;
      }
      return null;
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        console.log(
          "fetchRestaurantProfile error:",
          err?.response?.data || err.message
        );
      }
      return null;
    }
  };

  // Submit/Register restaurant details (multipart FormData)
  const registerRestaurant = async (formData: FormData): Promise<void> => {
    setLoading(true);
    try {
      const token =
        (await AsyncStorage.getItem("token")) ||
        (await AsyncStorage.getItem("userToken"));
      if (!token) throw new Error("Authentication token not found");

      const { data } = await axios.post(
        `${API_URLS.restaurants}/register`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (data?.restaurant) {
        setRestaurant(data.restaurant);
        showNotification(
          data.msg || "Restaurant application submitted successfully!",
          "success"
        );
      }
    } catch (err: any) {
      console.error("registerRestaurant error:", err);
      const errorMessage =
        err?.response?.data?.msg ||
        err?.message ||
        "Failed to submit application";
      showNotification(errorMessage, "error");
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Helper to construct FormData from registrationDraft and call registerRestaurant
  const submitRegistration = async (): Promise<void> => {
    const formData = new FormData();

    formData.append("name", registrationDraft.name);
    formData.append("phone", registrationDraft.phone);
    formData.append("email", registrationDraft.email);
    formData.append("description", registrationDraft.description);
    formData.append(
      "category_tags",
      JSON.stringify(registrationDraft.category_tags)
    );
    formData.append(
      "operating_hours",
      JSON.stringify(registrationDraft.operating_hours)
    );
    formData.append("address", registrationDraft.address);
    formData.append("landmark", registrationDraft.landmark);

    if (registrationDraft.latitude !== null) {
      formData.append("latitude", registrationDraft.latitude.toString());
    }
    if (registrationDraft.longitude !== null) {
      formData.append("longitude", registrationDraft.longitude.toString());
    }

    formData.append(
      "delivery_radius_km",
      registrationDraft.delivery_radius_km.toString()
    );

    formData.append("bank_name", registrationDraft.bank_name);
    formData.append("account_number", registrationDraft.account_number);
    formData.append("account_name", registrationDraft.account_name);
    formData.append("bank_code", registrationDraft.bank_code);

    const appendFile = (fieldName: string, fileUri: string) => {
      if (!fileUri) return;
      // Skip remote http/https URLs if editing
      if (fileUri.startsWith("http://") || fileUri.startsWith("https://")) return;

      const filename = fileUri.split("/").pop() || `${fieldName}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append(fieldName, {
        uri: fileUri,
        name: filename,
        type,
      } as any);
    };

    appendFile("logo", registrationDraft.logoUri);
    appendFile("banner", registrationDraft.bannerUri);
    appendFile("government_id", registrationDraft.government_id_uri);
    appendFile("cac_document", registrationDraft.cac_document_uri);

    await registerRestaurant(formData);
  };

  // Toggle restaurant online/offline status
  const setRestaurantOnlineStatus = async (
    is_online: boolean
  ): Promise<void> => {
    try {
      const token =
        (await AsyncStorage.getItem("token")) ||
        (await AsyncStorage.getItem("userToken"));
      if (!token) throw new Error("Authentication token not found");

      const { data } = await axios.patch(
        `${API_URLS.restaurants}/online`,
        { is_online },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.restaurant) {
        setRestaurant(data.restaurant);
        showNotification(data.msg, "success");
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.msg ||
        err?.message ||
        "Failed to update online status";
      showNotification(errorMessage, "error");
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchRestaurantProfile();
  }, []);

  return (
    <RestaurantContext.Provider
      value={{
        restaurant,
        setRestaurant,
        loading,
        registrationDraft,
        updateRegistrationDraft,
        resetRegistrationDraft,
        submitRegistration,
        registerRestaurant,
        fetchRestaurantProfile,
        setRestaurantOnlineStatus,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurantContext = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error(
      "useRestaurantContext must be used within a RestaurantProvider"
    );
  }
  return context;
};

