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
  populateDraftFromRestaurant: (rest: RestaurantType) => void;
  saveStageDetails: (
    overrideData?: Partial<RestaurantRegistrationDraft>
  ) => Promise<RestaurantType | null>;
  saveStageLocation: (
    overrideData?: Partial<RestaurantRegistrationDraft>
  ) => Promise<RestaurantType | null>;
  saveStageBank: (
    overrideData?: Partial<RestaurantRegistrationDraft>
  ) => Promise<{ restaurant: RestaurantType; account_name: string } | null>;
  submitStageVerification: (
    overrideData?: Partial<RestaurantRegistrationDraft>
  ) => Promise<RestaurantType | null>;
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

  const populateDraftFromRestaurant = (rest: RestaurantType) => {
    setRegistrationDraft({
      logoUri: rest.logo || "",
      bannerUri: rest.banner || "",
      name: rest.name || "",
      phone: rest.phone || "",
      email: rest.email || "",
      description: rest.description || "",
      category_tags: rest.category_tags || [],
      operating_hours:
        rest.operating_hours?.length > 0
          ? rest.operating_hours
          : initialRegistrationDraft.operating_hours,
      address: rest.location?.address || "",
      landmark: rest.location?.landmark || "",
      latitude: rest.location?.coordinates?.coordinates?.[1] ?? null,
      longitude: rest.location?.coordinates?.coordinates?.[0] ?? null,
      delivery_radius_km: rest.location?.delivery_radius_km || 5,
      bank_name: rest.bank?.bank_name || "GTBank",
      account_number: rest.bank?.account_number || "",
      account_name: rest.bank?.account_name || "",
      bank_code: rest.bank?.bank_code || "058",
      government_id_uri: rest.verification?.government_id || "",
      cac_document_uri: rest.verification?.cac_document || "",
    });
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

  // Stage 1: Save Details
  const saveStageDetails = async (
    overrideData?: Partial<RestaurantRegistrationDraft>
  ): Promise<RestaurantType | null> => {
    setLoading(true);
    try {
      const draft = { ...registrationDraft, ...overrideData };
      const token =
        (await AsyncStorage.getItem("token")) ||
        (await AsyncStorage.getItem("userToken"));
      if (!token) throw new Error("Authentication token not found");

      const formData = new FormData();
      formData.append("name", draft.name);
      formData.append("phone", draft.phone);
      formData.append("email", draft.email);
      formData.append("description", draft.description);
      formData.append("category_tags", JSON.stringify(draft.category_tags));
      formData.append("operating_hours", JSON.stringify(draft.operating_hours));

      if (draft.logoUri && !draft.logoUri.startsWith("http")) {
        const filename = draft.logoUri.split("/").pop() || "logo.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formData.append("logo", { uri: draft.logoUri, name: filename, type } as any);
      }
      if (draft.bannerUri && !draft.bannerUri.startsWith("http")) {
        const filename = draft.bannerUri.split("/").pop() || "banner.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formData.append("banner", { uri: draft.bannerUri, name: filename, type } as any);
      }

      const { data } = await axios.post(
        `${API_URLS.restaurants}/save-details`,
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
        return data.restaurant;
      }
      return null;
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.msg || err?.message || "Failed to save details";
      showNotification(errorMessage, "error");
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Stage 2: Save Location
  const saveStageLocation = async (
    overrideData?: Partial<RestaurantRegistrationDraft>
  ): Promise<RestaurantType | null> => {
    setLoading(true);
    try {
      const draft = { ...registrationDraft, ...overrideData };
      const token =
        (await AsyncStorage.getItem("token")) ||
        (await AsyncStorage.getItem("userToken"));
      if (!token) throw new Error("Authentication token not found");

      const { data } = await axios.post(
        `${API_URLS.restaurants}/save-location`,
        {
          address: draft.address,
          landmark: draft.landmark,
          latitude: draft.latitude,
          longitude: draft.longitude,
          delivery_radius_km: draft.delivery_radius_km,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.restaurant) {
        setRestaurant(data.restaurant);
        return data.restaurant;
      }
      return null;
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.msg || err?.message || "Failed to save location";
      showNotification(errorMessage, "error");
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Stage 3: Save & Verify Bank Details
  const saveStageBank = async (
    overrideData?: Partial<RestaurantRegistrationDraft>
  ): Promise<{ restaurant: RestaurantType; account_name: string } | null> => {
    setLoading(true);
    try {
      const draft = { ...registrationDraft, ...overrideData };
      const token =
        (await AsyncStorage.getItem("token")) ||
        (await AsyncStorage.getItem("userToken"));
      if (!token) throw new Error("Authentication token not found");

      const { data } = await axios.post(
        `${API_URLS.restaurants}/save-bank`,
        {
          bank_name: draft.bank_name,
          bank_code: draft.bank_code,
          account_number: draft.account_number,
          account_name: draft.account_name,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.restaurant) {
        setRestaurant(data.restaurant);
        if (data.account_name) {
          updateRegistrationDraft({ account_name: data.account_name });
        }
        showNotification(
          data.msg || "Bank account details verified successfully",
          "success"
        );
        return { restaurant: data.restaurant, account_name: data.account_name };
      }
      return null;
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.msg ||
        err?.message ||
        "Bank account verification failed";
      showNotification(errorMessage, "error");
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Stage 4: Submit Verification Documents
  const submitStageVerification = async (
    overrideData?: Partial<RestaurantRegistrationDraft>
  ): Promise<RestaurantType | null> => {
    setLoading(true);
    try {
      const draft = { ...registrationDraft, ...overrideData };
      const token =
        (await AsyncStorage.getItem("token")) ||
        (await AsyncStorage.getItem("userToken"));
      if (!token) throw new Error("Authentication token not found");

      const formData = new FormData();
      if (draft.government_id_uri && !draft.government_id_uri.startsWith("http")) {
        const filename = draft.government_id_uri.split("/").pop() || "gov_id.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formData.append("government_id", { uri: draft.government_id_uri, name: filename, type } as any);
      }
      if (draft.cac_document_uri && !draft.cac_document_uri.startsWith("http")) {
        const filename = draft.cac_document_uri.split("/").pop() || "cac.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formData.append("cac_document", { uri: draft.cac_document_uri, name: filename, type } as any);
      }

      const { data } = await axios.post(
        `${API_URLS.restaurants}/save-verification`,
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
        return data.restaurant;
      }
      return null;
    } catch (err: any) {
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
        populateDraftFromRestaurant,
        saveStageDetails,
        saveStageLocation,
        saveStageBank,
        submitStageVerification,
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

