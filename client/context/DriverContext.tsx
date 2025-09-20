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

const DriverContext = createContext<DriverConextType | null>(null);

const DriverContextPrvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { showNotification } = useNotificationContext();
  const { setDriver } = useDriverAuthContext();
  const { getRoute, region } = useMapContext();

  const [driveStatus, setDriveStatus] = useState<StatusType>("searching");

  const [incomingRideData, setIncomingRideData] = useState<any>(null);
  const [ongoingRideData, setOngoingRideData] = useState<any>(null);

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
        ongoingRideData.pickup.coordinates
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
        ongoingRideData.pickup.coordinates,
        ongoingRideData.destination.coordinates
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

  const API_URL = API_URLS.drivers;

  // Driver status functions
  const setAvailability = async (status: boolean): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.patch(
        `${API_URL}/available`,
        {
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDriver((prev: any) => {
        return { ...prev, is_available: status };
      });
      showNotification(
        `Availability toggled ${status ? "on" : "off"}`,
        `${status ? "success" : "error"}`
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
    const ride_id = incomingRideData._id;

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
    const ride_id = ongoingRideData._id;

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

  return (
    <DriverContext.Provider
      value={{
        setAvailability,
        updateLocation,
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
  setAvailability: (status: boolean) => Promise<void>;
  updateLocation: (coordinates: [number, number]) => Promise<void>;
  driveStatus: StatusType;
  setDriveStatus: Dispatch<SetStateAction<StatusType>>;
  incomingRideData: any;
  setIncomingRideData: Dispatch<SetStateAction<any>>;
  fetchIncomingRideData: (ride_id: string) => Promise<void>;

  acceptRideRequest: () => Promise<void>;
  ongoingRideData: any;
  setOngoingRideData: Dispatch<SetStateAction<any>>;
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
}

export default DriverContextPrvider;
