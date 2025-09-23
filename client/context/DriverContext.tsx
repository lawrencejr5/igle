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

import { useDriverAuthContext } from "./DriverAuthContext";
import { useNotificationContext } from "./NotificationContext";
import { useWalletContext } from "./WalletContext";
import { useMapContext } from "./MapContext";

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URLS } from "../data/constants";

type StatusType =
  | "searching"
  | "incoming"
  | "accepted"
  | "arriving"
  | "arrived"
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
  };
}

const DriverContext = createContext<DriverConextType | null>(null);

const DriverContextPrvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { showNotification } = useNotificationContext();
  const { driver, setDriver } = useDriverAuthContext();
  const { getRoute, region } = useMapContext();

  const [driveStatus, setDriveStatus] = useState<StatusType>("searching");

  const [incomingRideData, setIncomingRideData] = useState<Ride | null>(null);
  const [ongoingRideData, setOngoingRideData] = useState<Ride | null>(null);

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

  useEffect(() => {
    (async () => await fetchActiveRide())();
  }, []);

  const API_URL = API_URLS.drivers;

  // Driver status functions
  const setAvailability = async (): Promise<void> => {
    try {
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
      console.log(error.message);
      console.log(errMsg);
      showNotification(errMsg, "error");
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

        driveStatus,
        setDriveStatus,
        fetchIncomingRideData,
        incomingRideData,
        setIncomingRideData,

        acceptRideRequest,
        ongoingRideData,
        setOngoingRideData,
        updateRideStatus,

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

  driveStatus: StatusType;
  setDriveStatus: Dispatch<SetStateAction<StatusType>>;
  incomingRideData: Ride | null;
  setIncomingRideData: Dispatch<SetStateAction<Ride | null>>;
  fetchIncomingRideData: (ride_id: string) => Promise<void>;

  acceptRideRequest: () => Promise<void>;
  ongoingRideData: Ride | null;
  setOngoingRideData: Dispatch<SetStateAction<Ride | null>>;
  updateRideStatus: (
    status: "arrived" | "ongoing" | "completed"
  ) => Promise<void>;

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
