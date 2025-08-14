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

export const RideContextProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { showNotification } = useNotificationContext();
  const { calculateRide } = useMapContext();

  const [rideStatus, setRideStatus] = useState<RideStatusType>("");
  const [modalUp, setModalUp] = useState<boolean>(false);

  const { getDriverData } = useDriverAuthContext();

  const { userSocket } = useAuthContext();

  useEffect(() => {
    if (!userSocket) return;

    const onRideAccepted = async (data: any) => {
      const { driver_id } = data;
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

  const API_URL = "http://192.168.26.123:5000/api/v1/rides";

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

      showNotification(data.msg, "success");
    } catch (error: any) {
      throw new Error(error.response.data.message);
    }
  };

  return (
    <RideContext.Provider
      value={{ rideRequest, rideStatus, setRideStatus, modalUp, setModalUp }}
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

  rideStatus: RideStatusType;
  setRideStatus: Dispatch<SetStateAction<RideStatusType>>;
  modalUp: boolean;
  setModalUp: Dispatch<SetStateAction<boolean>>;
}

export const useRideContext = () => {
  const context = useContext(RideContext);
  if (!context)
    throw new Error("Ride context must be used within ride provider");
  return context;
};
