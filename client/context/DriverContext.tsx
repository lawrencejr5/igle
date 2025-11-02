import React, {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import MapView from "react-native-maps";
import * as Location from "expo-location";

import { useDriverAuthContext } from "./DriverAuthContext";
import { useNotificationContext } from "./NotificationContext";
import { useWalletContext } from "./WalletContext";
import { useMapContext } from "./MapContext";
import { useLoading } from "./LoadingContext";

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URLS } from "../data/constants";
import { useDeliverContext } from "./DeliveryContext";

type ModalStatusType =
  | "searching"
  | "incoming"
  | "accepted"
  | "arriving"
  | "arrived"
  | "picked_up"
  | "ongoing"
  | "completed"
  | "";

type RideStatus =
  | "pending"
  | "scheduled"
  | "accepted"
  | "arrived"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "expired";

interface Ride {
  _id: string;
  duration_mins: string;
  distance_km: string;
  pickup: { address: string; coordinates: [number, number] };
  destination: { address: string; coordinates: [number, number] };
  status: RideStatus;
  fare: number;
  payment_status: string;
  scheduled_time?: Date;
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
  rider: {
    _id: string;
    name: string;
    phone: string;
    profile_pic: string;
  };
}

// Delivery types
type JobType = "ride" | "delivery" | "";

type DeliveryStatus =
  | "pending"
  | "scheduled"
  | "accepted"
  | "arrived"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "expired";

interface Delivery {
  _id: string;
  pickup: { address?: string; coordinates: [number, number] };
  dropoff: { address?: string; coordinates: [number, number] };
  to?: { name?: string; phone?: string };
  package?: {
    description?: string;
    type?: string;
    fragile?: boolean;
    amount?: number;
  };
  fare: number;
  vehicle?: string;
  distance_km?: number | string;
  duration_mins?: number | string;
  status: DeliveryStatus;
  payment_status?: string;
  sender?:
    | { _id?: string; name?: string; phone?: string; profile_pic?: string }
    | string;
  driver?: any;
}

const DriverContext = createContext<DriverConextType | null>(null);

const DriverContextPrvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { showNotification } = useNotificationContext();
  const { driver, setDriver, driverSocket } = useDriverAuthContext();
  const {
    ongoingDeliveryData: ongoingDelivery,
    setOngoingDeliveryData: setOngoingDelivery,
  } = useDeliverContext();
  const { getRoute, region, mapPadding } = useMapContext();
  const { setDriverLoading } = useLoading();

  const [driveStatus, setDriveStatus] = useState<ModalStatusType>("searching");

  // Switch between ride and delivery flows
  const [jobType, setJobType] = useState<JobType>("");

  const [incomingRideData, setIncomingRideData] = useState<Ride | null>(null);
  const [ongoingRideData, setOngoingRideData] = useState<Ride | null>(null);

  // Delivery state
  const [incomingDeliveryData, setIncomingDeliveryData] =
    useState<Delivery | null>(null);
  const [ongoingDeliveryData, setOngoingDeliveryData] =
    useState<Delivery | null>(null);

  // Location update modal state
  const [locationModalOpen, setLocationModalOpen] = useState<boolean>(false);

  const mapRef = useRef<MapView>(null);
  const [toPickupRouteCoords, setToPickupRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [toDestinationRouteCoords, setToDestinationRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  useEffect(() => {
    const fetchPickupRoute = async () => {
      console.log("fetching...");
      const { coords } = await getRoute(
        [region.latitude, region.longitude],
        ongoingRideData?.pickup.coordinates!
      );
      if (coords) {
        setToPickupRouteCoords(coords);
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    };

    const fetchDestinationRoute = async () => {
      console.log("fetching...");

      const { coords } = await getRoute(
        ongoingRideData?.pickup.coordinates!,
        ongoingRideData?.destination.coordinates!
      );
      if (coords) {
        setToDestinationRouteCoords(coords);
        // Clear pickup route only after destination route is ready to avoid blank state
        setToPickupRouteCoords([]);
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    };

    if (ongoingRideData && driveStatus === "arriving") {
      fetchPickupRoute();
    }

    if (ongoingRideData && driveStatus === "arrived") {
      fetchDestinationRoute();
    }
  }, [ongoingRideData, driveStatus]);

  // Delivery routing similar to rides
  useEffect(() => {
    const fetchPickupRoute = async () => {
      if (!ongoingDeliveryData?.pickup?.coordinates) return;
      const { coords } = await getRoute(
        [region.latitude, region.longitude],
        ongoingDeliveryData.pickup.coordinates
      );
      if (coords) {
        setToPickupRouteCoords(coords);
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    };

    const fetchDropoffRoute = async () => {
      if (
        !ongoingDeliveryData?.pickup?.coordinates ||
        !ongoingDeliveryData?.dropoff?.coordinates
      )
        return;
      const { coords } = await getRoute(
        ongoingDeliveryData.pickup.coordinates,
        ongoingDeliveryData.dropoff.coordinates
      );
      if (coords) {
        setToDestinationRouteCoords(coords);
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    };

    if (jobType === "delivery" && ongoingDeliveryData) {
      if (driveStatus === "arriving") fetchPickupRoute();
      if (driveStatus === "arrived") fetchDropoffRoute();
    }
  }, [jobType, ongoingDeliveryData, driveStatus]);

  useEffect(() => {
    // While searching, listen for new incoming jobs and related offer lifecycle events
    if (driver?.is_available && driveStatus === "searching" && driverSocket) {
      const new_ride_func = async (data: any) => {
        setJobType("ride");
        setDriveStatus("incoming");
        await fetchIncomingRideData(data.ride_id);
      };

      const ride_taken_func = (data: any) => {
        setIncomingRideData((prev: any) => {
          if (prev?._id === data.ride_id) {
            showNotification("Ride has been claimed", "error");
            return null;
          }
          return prev;
        });
      };

      driverSocket.on("new_ride_request", new_ride_func);
      driverSocket.on("ride_taken", ride_taken_func);

      // Delivery sockets
      const new_delivery_func = async (data: any) => {
        setJobType("delivery");
        setDriveStatus("incoming");
        await fetchIncomingDeliveryData(data.delivery_id);
      };

      const delivery_taken_func = (data: any) => {
        setIncomingDeliveryData((prev: any) => {
          if (prev?._id === data.delivery_id) {
            showNotification("Delivery has been claimed", "error");
            return null;
          }
          return prev;
        });
      };

      const delivery_expired_func = (data: any) => {
        setIncomingDeliveryData((prev: any) => {
          if (prev?._id === data.delivery_id) {
            showNotification("Delivery request expired", "error");
            setDriveStatus("searching");
            return null;
          }
          return prev;
        });
      };

      driverSocket.on("delivery_request", new_delivery_func);
      driverSocket.on("delivery_taken", delivery_taken_func);
      driverSocket.on("delivery_request_expired", delivery_expired_func);
      // Note: delivery_cancel and delivery_paid are handled in a persistent effect

      return () => {
        driverSocket.off("new_ride_request", new_ride_func);
        driverSocket.off("ride_taken", ride_taken_func);

        driverSocket.off("delivery_request", new_delivery_func);
        driverSocket.off("delivery_taken", delivery_taken_func);
        driverSocket.off("delivery_request_expired", delivery_expired_func);
      };
    }
  }, [driver?.is_available, driveStatus, driverSocket]);

  useEffect(() => {
    // Persist critical notifications regardless of driveStatus
    if (!driverSocket) return;

    const paidForRideHandler = (_data: any) => {
      try {
        showNotification("Rider has paid for ride", "success");
      } catch (e) {
        console.log("Error handling paid_for_ride event:", e);
      }
    };

    const delivery_paid_func = (_data: any) => {
      showNotification("Sender has paid for delivery", "success");
    };

    const delivery_cancel_func = (data: any) => {
      // Reset if this is the active or incoming delivery
      if (
        ongoingDelivery?._id === data.delivery_id ||
        incomingDeliveryData?._id === data.delivery_id
      ) {
        showNotification("Delivery cancelled", "error");
        setIncomingDeliveryData(null);
        setOngoingDelivery(null as any);
        setDriveStatus("searching");
        setJobType("");
      }
    };

    driverSocket.on("paid_for_ride", paidForRideHandler);
    driverSocket.on("delivery_paid", delivery_paid_func);
    driverSocket.on("delivery_cancel", delivery_cancel_func);

    return () => {
      driverSocket.off("paid_for_ride", paidForRideHandler);
      driverSocket.off("delivery_paid", delivery_paid_func);
      driverSocket.off("delivery_cancel", delivery_cancel_func);
    };
  }, [driverSocket, ongoingDelivery, incomingDeliveryData]);

  useEffect(() => {
    if (!driver?.is_available) {
      setDriveStatus("searching");
      setIncomingRideData(null);
      setIncomingDeliveryData(null);
      setJobType("");
    }
  }, [driver?.is_available]);

  useEffect(() => {
    (async () => {
      await fetchActiveRide();
      await fetchActiveDelivery();
    })();
  }, [driver]);

  // Emit driver location to server periodically while on an active ride/delivery
  const emitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!driverSocket) return;

    // compute active flags with minimal deps
    const isRideActive = Boolean(
      ongoingRideData &&
        ["accepted", "arriving", "arrived", "ongoing"].includes(
          ongoingRideData.status
        )
    );

    const isDeliveryActive = Boolean(
      ongoingDeliveryData &&
        ["accepted", "arrived", "picked_up", "in_transit"].includes(
          ongoingDeliveryData.status
        )
    );

    // clear any existing timer before creating a new one
    if (emitTimerRef.current) {
      clearInterval(emitTimerRef.current);
      emitTimerRef.current = null;
    }

    if (!(isRideActive || isDeliveryActive)) return;

    const emitLocation = async () => {
      try {
        const last = await Location.getLastKnownPositionAsync();
        const pos =
          last ||
          (await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }));
        if (!pos || !pos.coords) return;

        const coordinates: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        const driverId = (driver as any)?._id || (driver as any)?.driver_id;

        if (isRideActive && ongoingRideData?.rider?._id) {
          driverSocket.emit("driver_location", {
            driver_id: driverId,
            rider_id: ongoingRideData.rider._id,
            coordinates,
          });
        }
        if (isDeliveryActive && ongoingDeliveryData?.sender) {
          const s = ongoingDeliveryData.sender;
          const senderId = typeof s === "string" ? s : s?._id;
          driverSocket.emit("driver_location", {
            driver_id: driverId,
            rider_id: senderId,
            coordinates,
          });
        }
      } catch {}
    };

    // emit immediately then every 10s
    emitLocation();
    emitTimerRef.current = setInterval(emitLocation, 10000);

    return () => {
      if (emitTimerRef.current) {
        clearInterval(emitTimerRef.current);
        emitTimerRef.current = null;
      }
    };
  }, [driverSocket, ongoingRideData?.status, ongoingDeliveryData?.status]);

  const API_URL = API_URLS.drivers;
  const DELIVERY_API = API_URLS.deliveries;

  // Driver status functions
  const setAvailability = async (): Promise<void> => {
    try {
      // Prevent going offline when an active ride or delivery exists
      if (driver?.is_available && (ongoingRideData || ongoingDeliveryData)) {
        showNotification(
          "You have an active ride/delivery. Complete it before going offline.",
          "error"
        );
        return;
      }
      const token = await AsyncStorage.getItem("token");
      await axios.patch(
        `${API_URL}/available`,
        {
          status: !driver?.is_available,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDriver((prev: any) => {
        return { ...prev, is_available: !prev?.is_available };
      });
      showNotification(
        `Availability toggled ${!driver?.is_available ? "on" : "off"}`,
        `${!driver?.is_available ? "success" : "error"}`
      );
    } catch (error: any) {
      const errMsg = error.response?.data?.msg;
      console.log(errMsg || "Error setting availability");
      throw new Error(errMsg || "Error setting availability");
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

  const fetchRideData = async (ride_id: string) => {
    try {
      const url = API_URLS.rides;
      const token = await AsyncStorage.getItem("token");

      const { data } = await axios.get(`${url}/data?ride_id=${ride_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.ride) return data.ride;
    } catch (error: any) {
      const errMsg = error.response.data.message;
      throw new Error(errMsg || "An error occured while fetching rides");
    }
  };

  const fetchIncomingRideData = async (ride_id: string): Promise<void> => {
    try {
      const ride = await fetchRideData(ride_id);
      setIncomingRideData((prev: any) => {
        if (prev !== null) return prev;
        return ride;
      });
    } catch (error: any) {
      console.log(error.message);
    }
  };

  // Delivery helpers
  const fetchDeliveryData = async (delivery_id: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.get(
        `${DELIVERY_API}/data?delivery_id=${delivery_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data.delivery as Delivery;
    } catch (error: any) {
      const errMsg =
        error.response?.data?.msg || "An error occured while fetching delivery";
      throw new Error(errMsg);
    }
  };

  const fetchIncomingDeliveryData = async (
    delivery_id: string
  ): Promise<void> => {
    try {
      const delivery = await fetchDeliveryData(delivery_id);
      setIncomingDeliveryData((prev) => (prev ? prev : delivery));
    } catch (error: any) {
      console.log(error.message);
    }
  };

  const acceptDeliveryRequest = async (): Promise<void> => {
    const token = await AsyncStorage.getItem("token");
    const delivery_id = incomingDeliveryData?._id;
    if (!delivery_id) {
      showNotification("Incoming delivery not found", "error");
      return;
    }
    try {
      const { data } = await axios.patch(
        `${DELIVERY_API}/accept?delivery_id=${delivery_id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const refreshed = await fetchDeliveryData(delivery_id);
      setOngoingDeliveryData(refreshed);
      showNotification(data.msg, "success");
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Could not accept delivery";
      showNotification(errMsg, "error");
      throw new Error(errMsg);
    }
  };

  const updateDeliveryStatus = async (
    status: "arrived" | "picked_up" | "in_transit" | "delivered"
  ): Promise<void> => {
    const token = await AsyncStorage.getItem("token");
    const delivery_id = ongoingDeliveryData?._id;
    if (!delivery_id) {
      showNotification("Delivery id was not found", "error");
      return;
    }
    try {
      const { data } = await axios.patch(
        `${DELIVERY_API}/status?delivery_id=${delivery_id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOngoingDeliveryData((prev) => (prev ? { ...prev, status } : prev));
      if (data?.delivery?.payment_status) {
        setOngoingDeliveryData((prev) =>
          prev
            ? { ...prev, payment_status: data.delivery.payment_status }
            : prev
        );
      }
      if (status === "delivered") setToDestinationRouteCoords([]);
    } catch (error: any) {
      const errMsg =
        error.response?.data?.msg ||
        "An error occurred while updating delivery status";
      showNotification(errMsg, "error");
      throw new Error(errMsg);
    }
  };

  const acceptRideRequest = async () => {
    const token = await AsyncStorage.getItem("token");
    const ride_id = incomingRideData?._id;

    if (!ride_id) {
      showNotification("Incoming ride not found", "error");
      return;
    }
    try {
      const { data } = await axios.patch(
        `${API_URLS.rides}/accept?ride_id=${ride_id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const ride = await fetchRideData(ride_id);
      setOngoingRideData(ride);

      showNotification(data.msg, "success");
    } catch (error: any) {
      const errMsg = error.response.data.msg;
      showNotification(errMsg, "error");
      throw new Error(errMsg);
    }
  };

  const updateRideStatus = async (
    status: "arrived" | "ongoing" | "completed"
  ): Promise<void> => {
    const token = await AsyncStorage.getItem("token");
    const ride_id = ongoingRideData?._id;

    if (!ride_id) {
      showNotification("Ride id was not found", "error");
      return;
    }
    try {
      await axios.patch(
        `${API_URLS.rides}/status?ride_id=${ride_id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (status === "completed") setToDestinationRouteCoords([]);
      setOngoingRideData((prev: any) => ({ ...prev, status }));
    } catch (error: any) {
      const errMsg = error.response.data.msg;
      showNotification(
        errMsg || "An error occurred while updating ride status",
        "error"
      );
      throw new Error(errMsg || "An error occurred while updating ride status");
    }
  };

  // Fetch driver's active ride
  const fetchActiveRide = async (): Promise<void> => {
    try {
      setDriverLoading(true);
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/ride/active`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data.ride) {
        setOngoingRideData(data.ride);
      } else {
        setOngoingRideData(null);
      }
    } catch (error: any) {
      setOngoingRideData(null);
    } finally {
      setDriverLoading(false);
    }
  };

  // Fetching driver's active delivery
  const fetchActiveDelivery = async (): Promise<void> => {
    try {
      setDriverLoading(true);
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/delivery/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.delivery) setOngoingDeliveryData(data.delivery);
      else setOngoingDeliveryData(null);
    } catch (error) {
      setOngoingDeliveryData(null);
    } finally {
      setDriverLoading(false);
    }
  };

  // Completed rides with pagination (limit 5 per page)
  const [driverCompletedRides, setDriverCompletedRides] = useState<
    Ride[] | null
  >(null);
  const [completedPagination, setCompletedPagination] = useState({
    total: 0,
    limit: 5,
    skip: 0,
  });
  const [completedLoadingMore, setCompletedLoadingMore] = useState(false);

  const fetchCompletedRides = async (reset = true): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      const limit = completedPagination.limit;
      const skip = reset ? 0 : completedPagination.skip;

      const { data } = await axios.get(
        `${API_URL}/rides/completed?limit=${limit}&skip=${skip}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.rides) {
        if (reset) setDriverCompletedRides(data.rides);
        else
          setDriverCompletedRides((prev) =>
            prev ? [...prev, ...data.rides] : data.rides
          );

        const newSkip =
          (reset ? 0 : completedPagination.skip) + data.rides.length;
        setCompletedPagination({
          total: data.pagination?.total || 0,
          limit: Number(limit),
          skip: Number(newSkip),
        });
      }
    } catch (error: any) {
      console.log(error);
    }
  };

  const fetchMoreCompletedRides = async (): Promise<void> => {
    if (completedLoadingMore) return;
    if (
      completedPagination.total &&
      completedPagination.skip >= completedPagination.total
    )
      return;
    try {
      setCompletedLoadingMore(true);
      await fetchCompletedRides(false);
    } catch (err) {
      console.log(err);
    } finally {
      setCompletedLoadingMore(false);
    }
  };

  // Cancelled rides with pagination (limit 5 per page)
  const [driverCancelledRides, setDriverCancelledRides] = useState<
    Ride[] | null
  >(null);
  const [cancelledPagination, setCancelledPagination] = useState({
    total: 0,
    limit: 5,
    skip: 0,
  });
  const [cancelledLoadingMore, setCancelledLoadingMore] = useState(false);

  const fetchCancelledRides = async (reset = true): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      const limit = cancelledPagination.limit;
      const skip = reset ? 0 : cancelledPagination.skip;

      const { data } = await axios.get(
        `${API_URL}/rides/cancelled?limit=${limit}&skip=${skip}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (data.rides) {
        if (reset) setDriverCancelledRides(data.rides);
        else
          setDriverCancelledRides((prev) =>
            prev ? [...prev, ...data.rides] : data.rides
          );

        const newSkip =
          (reset ? 0 : cancelledPagination.skip) + data.rides.length;
        setCancelledPagination({
          total: data.pagination?.total || 0,
          limit: Number(limit),
          skip: Number(newSkip),
        });
      }
    } catch (error: any) {
      showNotification("Error fetching cancelled rides", "error");
      console.log(error);
    }
  };

  const fetchMoreCancelledRides = async (): Promise<void> => {
    if (cancelledLoadingMore) return;
    if (
      cancelledPagination.total &&
      cancelledPagination.skip >= cancelledPagination.total
    )
      return;
    try {
      setCancelledLoadingMore(true);
      await fetchCancelledRides(false);
    } catch (err) {
      console.log(err);
    } finally {
      setCancelledLoadingMore(false);
    }
  };

  return (
    <DriverContext.Provider
      value={{
        setAvailability,
        updateLocation,

        locationModalOpen,
        setLocationModalOpen,

        jobType,
        setJobType,

        driveStatus,
        setDriveStatus,
        fetchIncomingRideData,
        incomingRideData,
        setIncomingRideData,

        acceptRideRequest,
        ongoingRideData,
        setOngoingRideData,
        updateRideStatus,

        // deliveries
        incomingDeliveryData,
        setIncomingDeliveryData,
        fetchIncomingDeliveryData,
        acceptDeliveryRequest,
        ongoingDeliveryData,
        setOngoingDeliveryData,
        updateDeliveryStatus,
        fetchActiveDelivery,

        mapRef,
        toPickupRouteCoords,
        setToPickupRouteCoords,
        toDestinationRouteCoords,
        setToDestinationRouteCoords,

        fetchActiveRide,
        driverCompletedRides,
        fetchCompletedRides,
        fetchMoreCompletedRides,
        completedLoadingMore,
        driverCancelledRides,
        fetchCancelledRides,
        fetchMoreCancelledRides,
        cancelledLoadingMore,
      }}
    >
      {children}
    </DriverContext.Provider>
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

interface DriverConextType {
  setAvailability: () => Promise<void>;
  updateLocation: (coordinates: [number, number]) => Promise<void>;

  locationModalOpen: boolean;
  setLocationModalOpen: Dispatch<SetStateAction<boolean>>;

  jobType: "ride" | "delivery" | "";
  setJobType: Dispatch<SetStateAction<"ride" | "delivery" | "">>;

  driveStatus: ModalStatusType;
  setDriveStatus: Dispatch<SetStateAction<ModalStatusType>>;
  incomingRideData: Ride | null;
  setIncomingRideData: Dispatch<SetStateAction<Ride | null>>;
  fetchIncomingRideData: (ride_id: string) => Promise<void>;

  acceptRideRequest: () => Promise<void>;
  ongoingRideData: Ride | null;
  setOngoingRideData: Dispatch<SetStateAction<Ride | null>>;
  updateRideStatus: (
    status: "arrived" | "ongoing" | "completed"
  ) => Promise<void>;

  // Delivery props
  incomingDeliveryData: Delivery | null;
  setIncomingDeliveryData: Dispatch<SetStateAction<Delivery | null>>;
  fetchIncomingDeliveryData: (delivery_id: string) => Promise<void>;
  acceptDeliveryRequest: () => Promise<void>;
  ongoingDeliveryData: Delivery | null;
  setOngoingDeliveryData: Dispatch<SetStateAction<Delivery | null>>;
  updateDeliveryStatus: (
    status: "arrived" | "picked_up" | "in_transit" | "delivered"
  ) => Promise<void>;
  fetchActiveDelivery: () => Promise<void>;

  mapRef: any;
  toPickupRouteCoords: { latitude: number; longitude: number }[];
  setToPickupRouteCoords: Dispatch<
    SetStateAction<{ latitude: number; longitude: number }[]>
  >;
  toDestinationRouteCoords: { latitude: number; longitude: number }[];
  setToDestinationRouteCoords: Dispatch<
    SetStateAction<{ latitude: number; longitude: number }[]>
  >;

  fetchActiveRide: () => Promise<void>;
  driverCompletedRides: Ride[] | null;
  fetchCompletedRides: (reset?: boolean) => Promise<void>;
  fetchMoreCompletedRides: () => Promise<void>;
  completedLoadingMore: boolean;
  driverCancelledRides: Ride[] | null;
  fetchCancelledRides: (reset?: boolean) => Promise<void>;
  fetchMoreCancelledRides: () => Promise<void>;
  cancelledLoadingMore: boolean;
}

export default DriverContextPrvider;
