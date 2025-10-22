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
import { useMapContext } from "./MapContext";

export const DeliverContext = createContext<DeliverContextType | null>(null);

// Shared UI/helper utilities for delivery components
export const formatRelativeTime = (date?: string | Date | null) => {
  if (!date) return "";
  const now = new Date();
  const time = new Date(date as any);
  const diffMs = now.getTime() - time.getTime();

  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  const months = Math.floor(diffDays / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
};

export const getPackageIcon = (type?: DeliveryPackageType | string) => {
  switch (type) {
    case "document":
      return "📄";
    case "electronics":
      return "📱";
    case "food":
      return "🍔";
    case "clothing":
      return "👕";
    case "furniture":
      return "🪑";
    default:
      return "📦";
  }
};

export const getVehicleIcon = (vehicle?: string) => {
  switch (vehicle) {
    case "bike":
      return "🏍️";
    case "cab":
      return "🚗";
    case "van":
      return "🚐";
    case "truck":
      return "🚚";
    default:
      return "🚗";
  }
};

type Contact = { name?: string; phone?: string } | undefined;

export type DeliveryStatus =
  | "pending"
  | "scheduled"
  | "accepted"
  | "arrived"
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
  | "route"
  | "vehicle"
  | "searching"
  | "expired"
  | "accepted"
  | "track_driver"
  | "arrived"
  | "paying"
  | "paid"
  | "picked_up"
  | "in_transit"
  | "track_delivery"
  | "rating";

export interface Delivery {
  _id: string;
  sender: string | { _id?: string; name?: string; phone?: string };
  driver: {
    _id: string;
    vehicle_type: string;
    profile_img: string;
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
    amount?: number;
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
  deliveryDetails?: {
    distanceKm: number;
    durationMins: number;
    bikeAmount: number;
    cabAmount: number;
    vanAmount: number;
    truckAmount: number;
  };
}

const API_URL = API_URLS.deliveries;

const DeliverProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showNotification } = useNotificationContext() as any;
  const { userSocket, signedIn } = useAuthContext() as any;
  const { getRoute, mapRef, pickupCoords, destinationCoords, region } =
    useMapContext();

  const [deliveryData, setDeliveryData] = useState<Delivery | null>(null);
  const [ongoingDeliveryData, setOngoingDeliveryData] =
    useState<Delivery | null>(null);

  // Delivery route states
  const [deliveryRouteCoords, setDeliveryRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [deliveryPickupMarker, setDeliveryPickupMarker] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [deliveryDropoffMarker, setDeliveryDropoffMarker] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (!userSocket) return;

    const onDeliveryAccepted = async (data: any) => {
      const { delivery_id } = data;
      showNotification("Delivery has been accepted", "success");

      try {
        // Fetch the full delivery data with driver details
        await fetchDeliveryData(delivery_id);
        setDeliveryStatus("accepted");
      } catch (error: any) {
        console.error("Error fetching delivery data:", error);
        showNotification("Error loading delivery details", "error");
      }
    };

    const onDeliveryPickedUp = async (data: any) => {
      const { delivery_id } = data;
      showNotification("Package has been picked up!", "success");

      if (delivery_id === ongoingDeliveryData?._id) {
        setDeliveryStatus("picked_up");
      }

      fetchUserActiveDelivery();
    };

    const onDeliveryInTransit = async (data: any) => {
      const { delivery_id } = data;
      showNotification("Package is now in transit!", "success");

      if (delivery_id === ongoingDeliveryData?._id) {
        setDeliveryStatus("in_transit");
      }

      fetchUserActiveDelivery();
    };

    const onDeliveryTimeout = (data: any) => {
      const { delivery_id } = data;
      showNotification("Delivery request timed out", "error");

      if (delivery_id === ongoingDeliveryData?._id) {
        setOngoingDeliveryData(
          (prev) => ({ ...prev, status: "expired" } as any)
        );
        setDeliveryStatus("expired");
      }
      fetchUserActiveDelivery();
    };

    const onDeliveryCompleted = (data: any) => {
      const { delivery_id } = data;
      showNotification("Delivery completed successfully!", "success");

      if (delivery_id === ongoingDeliveryData?._id) {
        setDeliveryStatus("rating");
      }

      fetchUserActiveDelivery();
    };

    const onDeliveryArrived = (data: any) => {
      const { delivery_id } = data;
      showNotification("Dispatch rider has arrived!", "success");

      if (delivery_id === ongoingDeliveryData?._id) {
        setDeliveryStatus("arrived");
      }

      fetchUserActiveDelivery();
    };

    userSocket.on("delivery_accepted", onDeliveryAccepted);
    userSocket.on("delivery_timeout", onDeliveryTimeout);
    userSocket.on("delivery_picked_up", onDeliveryPickedUp);
    userSocket.on("delivery_arrived", onDeliveryArrived);
    userSocket.on("delivery_in_transit", onDeliveryInTransit);
    userSocket.on("delivery_completed", onDeliveryCompleted);

    return () => {
      userSocket.off("delivery_accepted", onDeliveryAccepted);
      userSocket.off("delivery_timeout", onDeliveryTimeout);
      userSocket.off("delivery_picked_up", onDeliveryPickedUp);
      userSocket.off("delivery_arrived", onDeliveryArrived);
      userSocket.off("delivery_in_transit", onDeliveryInTransit);
      userSocket.off("delivery_completed", onDeliveryCompleted);
    };
  }, [userSocket, ongoingDeliveryData]);

  const deliveryModalRef = useRef<BottomSheet>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryModalStatus>("");

  useEffect(() => {
    const loadOngoingDelivery = async () => {
      try {
        await fetchUserActiveDelivery();
      } catch (error: any) {
        const errMsg =
          error?.response?.data?.msg || "Failed to load ongoing delivery";
        console.log("Error loading ongoing delivery:", errMsg);
      }
    };

    if (signedIn) {
      loadOngoingDelivery();
    }
  }, [signedIn]);

  useEffect(() => {
    if (deliveryStatus === "") {
      deliveryModalRef.current?.snapToIndex(0);
    }
    if (deliveryStatus === "details") {
      deliveryModalRef.current?.snapToIndex(5);
    }
    if (deliveryStatus === "route") {
      deliveryModalRef.current?.snapToIndex(5);
    }
    if (deliveryStatus === "vehicle") {
      deliveryModalRef.current?.snapToIndex(2);
    }
    if (deliveryStatus === "searching") {
      deliveryModalRef.current?.snapToIndex(2);
    }
    if (deliveryStatus === "expired") {
      deliveryModalRef.current?.snapToIndex(1);
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
    if (deliveryStatus === "picked_up") {
      deliveryModalRef.current?.snapToIndex(2);
    }
    if (deliveryStatus === "in_transit") {
      deliveryModalRef.current?.snapToIndex(3);
    }
    if (deliveryStatus === "track_delivery") {
      deliveryModalRef.current?.snapToIndex(3);
    }
    if (deliveryStatus === "rating") {
      deliveryModalRef.current?.snapToIndex(5);
    }
  }, [deliveryStatus]);

  const navigation = useNavigation();
  const handleBackAction = (e?: any) => {
    if (e) e.preventDefault();
    if (deliveryStatus === "details") {
      setDeliveryStatus("");
      return true;
    }
    if (deliveryStatus === "route") {
      setDeliveryStatus("details");
      return true;
    }
    if (deliveryStatus === "vehicle") {
      setDeliveryStatus("route");
      return true;
    }
    if (deliveryStatus === "expired") {
      setDeliveryStatus("vehicle");
      return true;
    }
    if (deliveryStatus === "accepted") {
      setDeliveryStatus("vehicle");
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
    if (deliveryStatus === "picked_up") {
      setDeliveryStatus("paid");
      return true;
    }
    if (deliveryStatus === "in_transit") {
      setDeliveryStatus("picked_up");
      return true;
    }
    if (deliveryStatus === "track_delivery") {
      setDeliveryStatus("paid");
      return true;
    }
    if (deliveryStatus === "rating") {
      setDeliveryStatus("in_transit");
      return true;
    }

    return false;
  };

  // useEffect(() => {
  //   // Handles navigation back (iOS + Android header back + swipe)
  //   const subNav = navigation.addListener("beforeRemove", handleBackAction);

  //   // Handles hardware back (Android only)
  //   const subHW =
  //     Platform.OS === "android"
  //       ? BackHandler.addEventListener("hardwareBackPress", handleBackAction)
  //       : null;

  //   return () => {
  //     subNav();
  //     if (subHW) subHW.remove();
  //   };
  // }, [navigation, deliveryStatus]);

  const [userDeliveries, setUserDeliveries] = useState<Delivery[] | null>(null);
  const [ongoingDeliveries, setOngoingDeliveries] = useState<Delivery[] | null>(
    null
  );
  const [cancelledDeliveries, setCancelledDeliveries] = useState<
    Delivery[] | null
  >(null);
  const [deliveredDeliveries, setDeliveredDeliveries] = useState<
    Delivery[] | null
  >(null);
  const [availableDeliveries, setAvailableDeliveries] = useState<
    Delivery[] | null
  >(null);

  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [rebooking, setRebooking] = useState(false);

  // Delivery route functions
  const fetchDeliveryRoute = async (
    pickupCoords: [number, number],
    dropoffCoords: [number, number]
  ) => {
    try {
      const result = await getRoute(pickupCoords, dropoffCoords);

      if (result) {
        setDeliveryRouteCoords(result.coords);
        setDeliveryPickupMarker(result.pickupOnRoad);
        setDeliveryDropoffMarker(result.destinationOnRoad);

        // Zoom map to fit route with a small delay to ensure map is ready
        setTimeout(() => {
          if (mapRef?.current) {
            mapRef.current.fitToCoordinates(result.coords, {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            });
          }
        }, 500);
      }
    } catch (error) {
      console.error("Error fetching delivery route:", error);
    }
  };

  // useEffect to fetch route when delivery pickup and dropoff are set
  useEffect(() => {
    // For ongoing deliveries, use the delivery data coordinates
    if (
      ongoingDeliveryData?.pickup?.coordinates &&
      ongoingDeliveryData?.dropoff?.coordinates &&
      (deliveryStatus === "searching" ||
        deliveryStatus === "expired" ||
        deliveryStatus === "accepted" ||
        deliveryStatus === "track_driver" ||
        deliveryStatus === "arrived" ||
        deliveryStatus === "picked_up" ||
        deliveryStatus === "paying" ||
        deliveryStatus === "paid" ||
        deliveryStatus === "in_transit" ||
        deliveryStatus === "track_delivery") // Show route for delivery flow states
    ) {
      console.log(ongoingDeliveryData?.pickup?.coordinates);
      fetchDeliveryRoute(
        ongoingDeliveryData.pickup.coordinates,
        ongoingDeliveryData.dropoff.coordinates
      );
    }
    // For booking flow, use current pickup and destination coordinates
    else if (destinationCoords && deliveryStatus === "vehicle") {
      // Use explicit pickup coordinates if available, otherwise use current region
      const pickup = pickupCoords || [region?.latitude, region?.longitude];
      if (pickup && pickup[0] && pickup[1]) {
        fetchDeliveryRoute(pickup as [number, number], destinationCoords);
      }
    } else {
      // Clear route when not applicable
      setDeliveryRouteCoords([]);
      setDeliveryPickupMarker(null);
      setDeliveryDropoffMarker(null);
    }
  }, [
    pickupCoords,
    destinationCoords,
    ongoingDeliveryData,
    ongoingDeliveryData?.pickup?.coordinates,
    ongoingDeliveryData?.dropoff?.coordinates,
    deliveryStatus,
    region?.latitude,
    region?.longitude,
  ]);

  // Fetch delivery data function
  const fetchDeliveryData = async (delivery_id: string): Promise<void> => {
    try {
      const headers = { headers: await authHeaders() };
      const { data } = await axios.get(
        `${API_URL}/data?delivery_id=${delivery_id}`,
        headers
      );
      if (data.delivery) {
        setOngoingDeliveryData(data.delivery);
      }
    } catch (error: any) {
      console.error("Error fetching delivery data:", error);
      throw error;
    }
  };

  // Reset delivery flow
  const resetDeliveryFlow = () => {
    setDeliveryData(null);
    setOngoingDeliveryData(null);
    setDeliveryStatus("");
    setDeliveryRouteCoords([]);
    setDeliveryPickupMarker(null);
    setDeliveryDropoffMarker(null);
  };

  const authHeaders = async () => {
    const token = await AsyncStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const requestDelivery = async (
    vehicleDetails?: { type: string; amount: number },
    scheduled_time?: Date
  ) => {
    try {
      if (!deliveryData) {
        showNotification("No delivery data available", "error");
        return;
      }

      setLoading(true);
      const headers = { headers: await authHeaders() };

      // Extract data from deliveryData state
      const pickup = deliveryData.pickup;
      const dropoff = deliveryData.dropoff;
      const package_data = deliveryData.package;
      const to = deliveryData.to;
      const selectedVehicle =
        vehicleDetails || (deliveryData as any).selectedVehicle;
      const deliveryDetails = deliveryData.deliveryDetails;

      console.log("Selected vehicle:", selectedVehicle);
      console.log("Delivery details:", deliveryDetails);

      if (
        !pickup ||
        !dropoff ||
        !package_data ||
        !selectedVehicle ||
        !deliveryDetails
      ) {
        console.log("Missing data:", {
          pickup,
          dropoff,
          package_data,
          selectedVehicle,
          deliveryDetails,
        });
        showNotification("Missing required delivery information", "error");
        return;
      }

      // Get fare based on selected vehicle type
      const fare = selectedVehicle.amount;
      const vehicle = selectedVehicle.type;
      const km = deliveryDetails.distanceKm;
      const min = deliveryDetails.durationMins;

      console.log("Final delivery request data:", { fare, vehicle, km, min });

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
      console.log("Delivery request successful:", data.delivery._id);
      showNotification(data.msg || "Delivery requested", "success");

      // Store the ongoing delivery data
      setOngoingDeliveryData(data.delivery);

      // refresh active deliveries
      await fetchUserActiveDelivery();
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
      await fetchUserActiveDelivery();
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
      await fetchUserActiveDelivery();
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

  const fetchUserOngoingDeliveries = async () => {
    try {
      const headers = { headers: await authHeaders() };
      const { data } = await axios.get(`${API_URL}/in_transit`, headers);
      setOngoingDeliveries(data.deliveries || []);
      return data.deliveries || [];
    } catch (err) {
      console.log("Failed to fetch ongoing deliveries", err);
      return [];
    }
  };

  const fetchUserActiveDelivery = async () => {
    try {
      const headers = { headers: await authHeaders() };
      const { data } = await axios.get(`${API_URL}/active`, headers);
      setOngoingDeliveryData(data.delivery || null);
      return data.deliveries || [];
    } catch (err) {
      console.log("Failed to fetch active delivery", err);
      return [];
    }
  };

  const fetchCancelledDeliveries = async () => {
    try {
      const headers = { headers: await authHeaders() };
      const { data } = await axios.get(`${API_URL}/cancelled`, headers);
      setCancelledDeliveries(data.deliveries || []);
      return data.deliveries || [];
    } catch (err) {
      console.log("Failed to fetch cancelled deliveries", err);
      return [];
    }
  };

  const fetchDeliveredDeliveries = async () => {
    try {
      const headers = { headers: await authHeaders() };
      const { data } = await axios.get(
        `${API_URL}/user?status=delivered`,
        headers
      );
      setDeliveredDeliveries(data.deliveries || []);
      return data.deliveries || [];
    } catch (err) {
      console.log("Failed to fetch delivered deliveries", err);
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
      await fetchUserActiveDelivery();
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
      await fetchUserActiveDelivery();
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
      resetDeliveryFlow();
      await fetchUserActiveDelivery();
      await fetchCancelledDeliveries();
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
        deliveryData,
        setDeliveryData,
        ongoingDeliveryData,
        setOngoingDeliveryData,
        fetchUserOngoingDeliveries,
        fetchDeliveryData,
        resetDeliveryFlow,
        requestDelivery,
        retryDelivery,
        rebookDelivery,
        fetchAvailableDeliveries,
        fetchUserDeliveries,
        fetchUserActiveDelivery,
        updateDeliveryStatus,
        payForDelivery,
        cancelDelivery,
        userDeliveries,
        ongoingDeliveries,
        cancelledDeliveries,
        deliveredDeliveries,
        availableDeliveries,
        loading,
        paying,
        cancelling,
        retrying,
        rebooking,
        deliveryRouteCoords,
        deliveryPickupMarker,
        deliveryDropoffMarker,
        fetchDeliveryRoute,
        fetchCancelledDeliveries,
        fetchDeliveredDeliveries,
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
  deliveryData: Delivery | null;
  setDeliveryData: Dispatch<SetStateAction<Delivery | null>>;
  ongoingDeliveryData: Delivery | null;
  setOngoingDeliveryData: Dispatch<SetStateAction<Delivery | null>>;
  fetchUserOngoingDeliveries: () => Promise<void>;
  fetchDeliveryData: (delivery_id: string) => Promise<void>;
  resetDeliveryFlow: () => void;
  requestDelivery: (
    vehicleDetails?: { type: string; amount: number },
    scheduled_time?: Date
  ) => Promise<any>;
  retryDelivery: (delivery_id: string) => Promise<any>;
  rebookDelivery: (delivery_id: string) => Promise<any>;
  fetchAvailableDeliveries: () => Promise<any>;
  fetchUserDeliveries: (status?: string) => Promise<any>;
  fetchUserActiveDelivery: () => Promise<any>;
  updateDeliveryStatus: (delivery_id: string, status: string) => Promise<any>;
  payForDelivery: (delivery_id: string) => Promise<any>;
  cancelDelivery: (
    delivery_id: string,
    by: "sender" | "driver",
    reason?: string
  ) => Promise<any>;

  userDeliveries: Delivery[] | null;
  ongoingDeliveries: Delivery[] | null;
  cancelledDeliveries: Delivery[] | null;
  deliveredDeliveries: Delivery[] | null;
  availableDeliveries: Delivery[] | null;
  loading: boolean;
  paying: boolean;
  cancelling: boolean;
  retrying: boolean;
  rebooking: boolean;

  // Delivery route properties
  deliveryRouteCoords: { latitude: number; longitude: number }[];
  deliveryPickupMarker: { latitude: number; longitude: number } | null;
  deliveryDropoffMarker: { latitude: number; longitude: number } | null;
  fetchDeliveryRoute: (
    pickupCoords: [number, number],
    dropoffCoords: [number, number]
  ) => Promise<void>;
  fetchCancelledDeliveries: () => Promise<any>;
  fetchDeliveredDeliveries: () => Promise<any>;
}

export const useDeliverContext = () => {
  const ctx = useContext(DeliverContext);
  if (!ctx) throw new Error("Deliver context must be used inside provider");
  return ctx;
};

export default DeliverProvider;
