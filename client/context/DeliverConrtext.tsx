import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
  useRef,
} from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URLS } from "../data/constants";
import { useNotificationContext } from "./NotificationContext";
import { useAuthContext } from "./AuthContext";
import BottomSheet from "@gorhom/bottom-sheet";
import { BackHandler, Platform } from "react-native";
import { useNavigation } from "expo-router";

export const DeliverContext = createContext<DeliverContextType | null>(null);

type Contact = { name?: string; phone?: string } | undefined;

export type DeliveryStatus =
  | "pending"
  | "scheduled"
  | "accepted"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "failed"
  | "cancelled"
  | "expired";

export type DeliveryPackageType =
  | "document"
  | "electronics"
  | "clothing"
  | "food"
  | "furniture"
  | "other";

export type DeliveryModalStatus =
  | ""
  | "details"
  | "vehicle"
  | "searching"
  | "accepted"
  | "track_driver"
  | "arrived"
  | "track_ride"
  | "paying"
  | "paid"
  | "rating";

export interface Delivery {
  _id: string;
  sender: string | { _id?: string; name?: string; phone?: string };
  driver: {
    _id: string;
    vehicle_type: string;
    vehicle: {
      model: string;
      brand: string;
      color: string;
    };
    current_location: { coordinates: [number, number] };
    total_trips: number;
    rating: number;
    num_of_reviews: number;
    user: {
      _id: string;
      name: string;
      email: string;
      phone: string;
    };
  };
  pickup: { address?: string; coordinates: [number, number] };
  dropoff: { address?: string; coordinates: [number, number] };
  to?: { name?: string; phone?: string };
  package?: {
    description?: string;
    fragile?: boolean;
    value?: number;
    type?: DeliveryPackageType;
  };
  status: DeliveryStatus;
  fare: number;
  vehicle: "bike" | "cab" | "van" | "truck" | string;
  payment_status?: "unpaid" | "paid" | string;
  payment_method?: "cash" | "card" | "wallet" | string;
  timestamps?: {
    accepted_at?: string | Date;
    picked_up_at?: string | Date;
    in_transit_at?: string | Date;
    delivered_at?: string | Date;
    cancelled_at?: string | Date;
  };
  cancelled?: { by?: "sender" | "driver"; reason?: string };
  driver_earnings?: number;
  commission?: number;
  distance_km?: number;
  duration_mins?: number;
  scheduled?: boolean;
  scheduled_time?: string | Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

const API_URL = API_URLS.deliveries;

const DeliverProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showNotification } = useNotificationContext() as any;
  const { userSocket } = useAuthContext() as any;

  const deliveryModalRef = useRef<BottomSheet>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryModalStatus>("");
  useEffect(() => {
    if (deliveryStatus === "") {
      deliveryModalRef.current?.snapToIndex(0);
    }
    if (deliveryStatus === "details") {
      deliveryModalRef.current?.snapToIndex(5);
    }
    if (deliveryStatus === "vehicle") {
      deliveryModalRef.current?.snapToIndex(2);
    }
    if (deliveryStatus === "searching") {
      deliveryModalRef.current?.snapToIndex(2);
    }
    if (deliveryStatus === "accepted") {
      deliveryModalRef.current?.snapToIndex(3);
    }
    if (deliveryStatus === "track_driver") {
      deliveryModalRef.current?.snapToIndex(2);
    }
    if (deliveryStatus === "arrived") {
      deliveryModalRef.current?.snapToIndex(2);
    }
    if (deliveryStatus === "paying") {
      deliveryModalRef.current?.snapToIndex(1);
    }
    if (deliveryStatus === "paid") {
      deliveryModalRef.current?.snapToIndex(1);
    }
  }, [deliveryStatus]);

  const navigation = useNavigation();
  const handleBackAction = (e?: any) => {
    if (e) e.preventDefault();
    if (deliveryStatus === "details") {
      setDeliveryStatus("");
      return true;
    }
    if (deliveryStatus === "vehicle") {
      setDeliveryStatus("details");
      return true;
    }
    if (deliveryStatus === "accepted") {
      setDeliveryStatus("searching");
      return true;
    }
    if (deliveryStatus === "track_driver") {
      setDeliveryStatus("accepted");
      return true;
    }
    if (deliveryStatus === "arrived") {
      setDeliveryStatus("track_driver");
      return true;
    }
    if (deliveryStatus === "paying") {
      setDeliveryStatus("arrived");
      return true;
    }
    if (deliveryStatus === "paid") {
      setDeliveryStatus("paying");
      return true;
    }

    return false;
  };

  useEffect(() => {
    // Handles navigation back (iOS + Android header back + swipe)
    const subNav = navigation.addListener("beforeRemove", handleBackAction);

    // Handles hardware back (Android only)
    const subHW =
      Platform.OS === "android"
        ? BackHandler.addEventListener("hardwareBackPress", handleBackAction)
        : null;

    return () => {
      subNav();
      if (subHW) subHW.remove();
    };
  }, [navigation, deliveryStatus]);

  const [userDeliveries, setUserDeliveries] = useState<Delivery[] | null>(null);
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[] | null>(
    null
  );
  const [availableDeliveries, setAvailableDeliveries] = useState<
    Delivery[] | null
  >(null);

  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [rebooking, setRebooking] = useState(false);

  useEffect(() => {
    if (!userSocket) return;

    const onDeliveryAccepted = (data: any) => {
      // refresh active deliveries when one is accepted
      fetchUserActiveDeliveries();
    };

    const onDeliveryTimeout = (data: any) => {
      fetchUserActiveDeliveries();
    };

    const onDeliveryUpdate = (data: any) => {
      fetchUserActiveDeliveries();
    };

    userSocket.on("delivery_accepted", onDeliveryAccepted);
    userSocket.on("delivery_timeout", onDeliveryTimeout);
    userSocket.on("delivery_picked_up", onDeliveryUpdate);
    userSocket.on("delivery_in_transit", onDeliveryUpdate);
    userSocket.on("delivery_completed", onDeliveryUpdate);

    return () => {
      userSocket.off("delivery_accepted", onDeliveryAccepted);
      userSocket.off("delivery_timeout", onDeliveryTimeout);
      userSocket.off("delivery_picked_up", onDeliveryUpdate);
      userSocket.off("delivery_in_transit", onDeliveryUpdate);
      userSocket.off("delivery_completed", onDeliveryUpdate);
    };
  }, [userSocket]);

  const authHeaders = async () => {
    const token = await AsyncStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const requestDelivery = async (
    pickup: any,
    dropoff: any,
    package_data: any,
    fare: number,
    vehicle: string,
    to?: Contact,
    km?: number,
    min?: number,
    scheduled_time?: Date
  ) => {
    try {
      setLoading(true);
      const headers = { headers: await authHeaders() };
      const q: string[] = [];
      if (km !== undefined) q.push(`km=${km}`);
      if (min !== undefined) q.push(`min=${min}`);
      if (scheduled_time)
        q.push(`scheduled_time=${scheduled_time.toISOString()}`);
      const qs = q.length ? `?${q.join("&")}` : "";

      const { data } = await axios.post(
        `${API_URL}/request${qs}`,
        { pickup, dropoff, package_data, fare, vehicle, to },
        headers
      );
      showNotification(data.msg || "Delivery requested", "success");
      // refresh active deliveries
      await fetchUserActiveDeliveries();
      return data.delivery;
    } catch (err: any) {
      const msg =
        err?.response?.data?.msg || err.message || "Failed to request delivery";
      showNotification(msg, "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const retryDelivery = async (delivery_id: string) => {
    try {
      setRetrying(true);
      const headers = { headers: await authHeaders() };
      const { data } = await axios.patch(
        `${API_URL}/retry?delivery_id=${delivery_id}`,
        {},
        headers
      );
      showNotification(data.msg || "Retrying delivery", "success");
      await fetchUserActiveDeliveries();
      return data.delivery;
    } catch (err: any) {
      showNotification(err?.response?.data?.msg || "Failed to retry", "error");
      throw err;
    } finally {
      setRetrying(false);
    }
  };

  const rebookDelivery = async (delivery_id: string) => {
    try {
      setRebooking(true);
      const headers = { headers: await authHeaders() };
      const { data } = await axios.post(
        `${API_URL}/rebook?delivery_id=${delivery_id}`,
        {},
        headers
      );
      showNotification(data.msg || "Rebooked delivery", "success");
      await fetchUserActiveDeliveries();
      return data.delivery;
    } catch (err: any) {
      showNotification(err?.response?.data?.msg || "Failed to rebook", "error");
      throw err;
    } finally {
      setRebooking(false);
    }
  };

  const fetchAvailableDeliveries = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/available`);
      setAvailableDeliveries(data.deliveries || []);
      return data.deliveries || [];
    } catch (err) {
      console.log("Failed to fetch available deliveries", err);
      return [];
    }
  };

  const fetchUserDeliveries = async (status?: string) => {
    try {
      const headers = { headers: await authHeaders() };
      const qs = status ? `?status=${status}` : "";
      const { data } = await axios.get(`${API_URL}/user${qs}`, headers);
      setUserDeliveries(data.deliveries || []);
      return data.deliveries || [];
    } catch (err) {
      showNotification("Failed to fetch deliveries", "error");
      return [];
    }
  };

  const fetchUserActiveDeliveries = async () => {
    try {
      const headers = { headers: await authHeaders() };
      const { data } = await axios.get(`${API_URL}/active`, headers);
      setActiveDeliveries(data.deliveries || []);
      return data.deliveries || [];
    } catch (err) {
      console.log("Failed to fetch active deliveries", err);
      return [];
    }
  };

  const updateDeliveryStatus = async (delivery_id: string, status: string) => {
    try {
      const headers = { headers: await authHeaders() };
      const { data } = await axios.patch(
        `${API_URL}/status?delivery_id=${delivery_id}`,
        { status },
        headers
      );
      showNotification(data.msg || "Status updated", "success");
      await fetchUserActiveDeliveries();
      return data.delivery;
    } catch (err: any) {
      showNotification(
        err?.response?.data?.msg || "Failed to update status",
        "error"
      );
      throw err;
    }
  };

  const payForDelivery = async (delivery_id: string) => {
    try {
      setPaying(true);
      const headers = { headers: await authHeaders() };
      const { data } = await axios.post(
        `${API_URL}/pay?delivery_id=${delivery_id}`,
        {},
        headers
      );
      showNotification(data.msg || "Payment successful", "success");
      await fetchUserActiveDeliveries();
      return data.transaction;
    } catch (err: any) {
      showNotification(err?.response?.data?.msg || "Payment failed", "error");
      throw err;
    } finally {
      setPaying(false);
    }
  };

  const cancelDelivery = async (
    delivery_id: string,
    by: "sender" | "driver",
    reason?: string
  ) => {
    try {
      setCancelling(true);
      const headers = { headers: await authHeaders() };
      const { data } = await axios.patch(
        `${API_URL}/cancel?delivery_id=${delivery_id}`,
        { by, reason },
        headers
      );
      showNotification(data.msg || "Delivery cancelled", "success");
      await fetchUserActiveDeliveries();
      return data.delivery;
    } catch (err: any) {
      showNotification(err?.response?.data?.msg || "Cancel failed", "error");
      throw err;
    } finally {
      setCancelling(false);
    }
  };

  return (
    <DeliverContext.Provider
      value={{
        deliveryStatus,
        deliveryModalRef,
        setDeliveryStatus,
        requestDelivery,
        retryDelivery,
        rebookDelivery,
        fetchAvailableDeliveries,
        fetchUserDeliveries,
        fetchUserActiveDeliveries,
        updateDeliveryStatus,
        payForDelivery,
        cancelDelivery,
        userDeliveries,
        activeDeliveries,
        availableDeliveries,
        loading,
        paying,
        cancelling,
        retrying,
        rebooking,
      }}
    >
      {children}
    </DeliverContext.Provider>
  );
};

export interface DeliverContextType {
  deliveryStatus: DeliveryModalStatus;
  deliveryModalRef: any;
  setDeliveryStatus: Dispatch<SetStateAction<DeliveryModalStatus>>;
  requestDelivery: (
    pickup: any,
    dropoff: any,
    package_data: any,
    fare: number,
    vehicle: string,
    to?: Contact,
    km?: number,
    min?: number,
    scheduled_time?: Date
  ) => Promise<any>;
  retryDelivery: (delivery_id: string) => Promise<any>;
  rebookDelivery: (delivery_id: string) => Promise<any>;
  fetchAvailableDeliveries: () => Promise<any>;
  fetchUserDeliveries: (status?: string) => Promise<any>;
  fetchUserActiveDeliveries: () => Promise<any>;
  updateDeliveryStatus: (delivery_id: string, status: string) => Promise<any>;
  payForDelivery: (delivery_id: string) => Promise<any>;
  cancelDelivery: (
    delivery_id: string,
    by: "sender" | "driver",
    reason?: string
  ) => Promise<any>;

  userDeliveries: Delivery[] | null;
  activeDeliveries: Delivery[] | null;
  availableDeliveries: Delivery[] | null;
  loading: boolean;
  paying: boolean;
  cancelling: boolean;
  retrying: boolean;
  rebooking: boolean;
}

export const useDeliverContext = () => {
  const ctx = useContext(DeliverContext);
  if (!ctx) throw new Error("Deliver context must be used inside provider");
  return ctx;
};

export default DeliverProvider;
