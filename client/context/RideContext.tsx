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
import { useWalletContext } from "./WalletContext";
import { API_URLS } from "../data/constants";

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
  const {
    calculateRide,
    setDestination,
    setDestinationCoords,
    setRideDetails,
    mapRef,
    region,
    set_user_location,
  } = useMapContext();
  const { getWalletBalance } = useWalletContext();

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
      showNotification("Ride has been accepted", "success");
      try {
        fetchOngoingRideData(ride_id);
        await AsyncStorage.setItem("ongoingRideId", ride_id);
        await getDriverData(driver_id);
        setModalUp(true);
        setRideStatus("accepted");
        console.log("accepted", data);
      } catch (error: any) {
        throw new Error("An error occured");
      }
    };

    const onRideArrival = async (data: any) => {
      showNotification("Your ride has arrived", "success");
      console.log("Your ride has arrived");
    };
    const onRideStarted = async (data: any) => {
      showNotification("Your ride has started", "success");
      console.log("Your ride has started");
    };
    const onRideCompleted = async (data: any) => {
      await AsyncStorage.removeItem("ongoingRideId");

      setOngoingRideId(null);
      setRideData(null);
      setRideStatus("");
      setRideDetails(null);
      setDestinationCoords(null);
      setDestination("");
      setModalUp(false);
      showNotification("Your ride has been completed", "success");

      await set_user_location();

      if (region) mapRef.current.animateToRegion(region, 1000);
    };

    userSocket.on("ride_accepted", onRideAccepted);
    userSocket.on("ride_arrival", onRideArrival);
    userSocket.on("ride_in_progress", onRideStarted);
    userSocket.on("ride_completed", onRideCompleted);
    return () => {
      userSocket.off("ride_accepted", onRideAccepted);
      userSocket.off("ride_arrival", onRideArrival);
      userSocket.off("ride_in_progree", onRideStarted);
      userSocket.off("ride_completed", onRideCompleted);
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

  const API_URL = API_URLS.rides;

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

  const [cancelling, setCancelling] = useState<boolean>(false);
  const cancelRideRequest = async (
    ride_id: string,
    by: "rider" | "driver",
    reason: string
  ): Promise<void> => {
    setCancelling(true);
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
      setRideDetails(null);
      setDestinationCoords(null);
      setDestination("");
      setModalUp(false);
    } catch (error: any) {
      console.log(error);
      showNotification(error.response.data.msg, "error");
    } finally {
      setCancelling(false);
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

  const payForRide = async (): Promise<void> => {
    const token = await AsyncStorage.getItem("token");
    try {
      await axios.post(
        `${API_URL}/pay?ride_id=${ongoingRideId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await getWalletBalance("User");
      await fetchOngoingRideData(ongoingRideId!);
      setModalUp(false);
      setRideStatus("paid");
      showNotification("Payment successfull", "success");
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
        payForRide,
        rideStatus,
        setRideStatus,
        modalUp,
        setModalUp,
        cancelRideRequest,
        ongoingRideId,
        setOngoingRideId,
        ongoingRideData,
        cancelling,
        setCancelling,
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
  cancelling: boolean;
  setCancelling: Dispatch<SetStateAction<boolean>>;

  payForRide: () => Promise<void>;

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

export default RideContextProvider;
