import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  FC,
  Dispatch,
  SetStateAction,
  ReactNode,
} from "react";

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useNotificationContext } from "./NotificationContext";
import { useMapContext } from "./MapContext";
import { useDriverAuthContext } from "./DriverAuthContext";
import { useAuthContext } from "./AuthContext";

const RideContext = createContext<RideContextType | null>(null);

type RideStatusType =
  | ""
  | "booking"
  | "choosing_car"
  | "searching"
  | "accepted"
  | "paying"
  | "paid";

// interface RideType {
//   _id: string;
//   pickup: {
//     address: string;
//     coordinates: [number, number];
//   };
//   destination: {
//     address: string;
//     coordinates: [number, number];
//   };
//   driver_id: string;
//   status: any;
//   fare: number;
//   createdAt: string;
//   updatedAt: string;
// }

export const RideContextProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { showNotification } = useNotificationContext();
  const { calculateRide } = useMapContext();

  const [ongoingRideId, setOngoingRideId] = useState<string | null>(null);
  const [ongoingRideData, setOngoingRideData] = useState<any>(null);
  const [rideData, setRideData] = useState<any>(null);

  const [rideStatus, setRideStatus] = useState<RideStatusType>("");
  const [modalUp, setModalUp] = useState<boolean>(false);

  const { getDriverData } = useDriverAuthContext();

  const { userSocket } = useAuthContext();

  useEffect(() => {
    if (!userSocket) return;

    const onRideAccepted = async (data: any) => {
      const { driver_id, ride_id } = data;
      setOngoingRideId(ride_id);
      await AsyncStorage.setItem("ongoingRideId", ride_id);
      await getDriverData(driver_id);
      setModalUp(true);
      setRideStatus("accepted");
      console.log("accepted", data);
    };

    userSocket.on("ride_accepted", onRideAccepted);
    return () => {
      userSocket.off("ride_accepted", onRideAccepted);
    };
  }, [userSocket]);

  useEffect(() => {
    const loadOngoingRide = async () => {
      try {
        const id = await AsyncStorage.getItem("ongoingRideId");
        setOngoingRideId(id ?? null);

        if (id) {
          await fetchOngoingRideData(id);
        }
      } catch (error) {
        console.log("Error loading ongoing ride:", error);
      }
    };

    loadOngoingRide();
  }, []);

  const API_URL = "http://192.168.250.123:5000/api/v1/rides";
  // const API_URL = "https://igleapi.onrender.com/api/v1/rides";

  const rideRequest = async (
    pickup: { address: string; coordinates: [number, number] },
    destination: { address: string; coordinates: [number, number] }
  ): Promise<void> => {
    const token = await AsyncStorage.getItem("token");
    try {
      const distance_and_duration = await calculateRide(
        pickup.coordinates,
        destination.coordinates
      );
      const distanceKm = distance_and_duration?.distanceKm;
      const durationMins = distance_and_duration?.durationMins;

      const { data } = await axios.post(
        `${API_URL}/request?km=${distanceKm}&min=${durationMins}`,
        { pickup, destination },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOngoingRideId(data.ride._id);
      await AsyncStorage.setItem("ongoingRideId", data.ride._id);
      await fetchOngoingRideData(data.ride._id);
      showNotification(data.msg, "success");
    } catch (error: any) {
      throw new Error(error.response.data.message);
    }
  };

  const cancelRideRequest = async (
    ride_id: string,
    by: "rider" | "driver",
    reason: string
  ): Promise<void> => {
    const token = await AsyncStorage.getItem("token");
    try {
      await axios.patch(
        `${API_URL}/cancel?ride_id=${ride_id}`,
        { reason, by },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOngoingRideId(null);
      await AsyncStorage.removeItem("ongoingRideId");
      setRideData(null);
      showNotification("Ride request cancelled", "error");
      setRideStatus("");
      setModalUp(false);
    } catch (error: any) {
      console.log(error);
      showNotification(error.response.data.msg, "error");
    }
  };

  const fetchOngoingRideData = async (ride_id: string): Promise<void> => {
    const token = await AsyncStorage.getItem("token");
    try {
      const { data } = await axios.get(`${API_URL}/data?ride_id=${ride_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOngoingRideData(data.ride);
      // console.log(ongoingRideData);
    } catch (error: any) {
      console.log(error);
      showNotification(error.response.data.msg, "error");
    }
  };

  return (
    <RideContext.Provider
      value={{
        rideData,
        rideRequest,
        rideStatus,
        setRideStatus,
        modalUp,
        setModalUp,
        cancelRideRequest,
        ongoingRideId,
        setOngoingRideId,
        ongoingRideData,
      }}
    >
      {children}
    </RideContext.Provider>
  );
};

export interface RideContextType {
  rideRequest: (
    pickup: { address: string; coordinates: [number, number] },
    destination: { address: string; coordinates: [number, number] }
  ) => Promise<void>;

  cancelRideRequest: (
    ride_id: string,
    by: "rider" | "driver",
    reason: string
  ) => Promise<void>;

  rideStatus: RideStatusType;
  setRideStatus: Dispatch<SetStateAction<RideStatusType>>;
  modalUp: boolean;
  setModalUp: Dispatch<SetStateAction<boolean>>;

  rideData: any;
  ongoingRideId: string | null;
  setOngoingRideId: Dispatch<SetStateAction<string | null>>;
  ongoingRideData: any;
}

export const useRideContext = () => {
  const context = useContext(RideContext);
  if (!context)
    throw new Error("Ride context must be used within ride provider");
  return context;
};
