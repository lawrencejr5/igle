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
import { useLoading } from "./LoadingContext";

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
    setPickupCoords,
    setRideDetails,
    mapRef,
    region,
    set_user_location,
  } = useMapContext();
  const { getWalletBalance } = useWalletContext();

  const [ongoingRideData, setOngoingRideData] = useState<any>(null);
  const [rideData, setRideData] = useState<any>(null);

  const [rideStatus, setRideStatus] = useState<RideStatusType>("");
  const [modalUp, setModalUp] = useState<boolean>(false);

  const { getDriverData } = useDriverAuthContext();
  const { setLoadingState, setRideDetailsLoading } = useLoading();

  const { userSocket, signedIn } = useAuthContext();

  useEffect(() => {
    getUserCompletedRides();
    getUserCancelledRides();
  }, [signedIn]);

  useEffect(() => {
    if (!userSocket) return;

    const onRideAccepted = async (data: any) => {
      const { driver_id, ride_id } = data;
      showNotification("Ride has been accepted", "success");
      try {
        await fetchOngoingRideData(ride_id);
        await getDriverData(driver_id);
        setModalUp(true);
        setRideStatus("accepted");
        console.log("accepted", data);
      } catch (error: any) {
        throw new Error("An error occured");
      }
    };

    const onRideTimeout = async (data: any) => {
      const { ride_id } = data;
      showNotification("Ride timed out", "error");
      try {
        setOngoingRideData((prev: any) => {
          if (prev._id === ride_id) {
            return { ...prev, status: "expired" };
          }
          return;
        });
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
      resetRide();
      showNotification("Your ride has been completed", "success");

      await set_user_location();

      if (region) mapRef.current.animateToRegion(region, 1000);
    };

    userSocket.on("ride_accepted", onRideAccepted);
    userSocket.on("ride_timeout", onRideTimeout);
    userSocket.on("ride_arrival", onRideArrival);
    userSocket.on("ride_in_progress", onRideStarted);
    userSocket.on("ride_completed", onRideCompleted);
    return () => {
      userSocket.off("ride_accepted", onRideAccepted);
      userSocket.off("ride_timeout", onRideTimeout);
      userSocket.off("ride_arrival", onRideArrival);
      userSocket.off("ride_in_progree", onRideStarted);
      userSocket.off("ride_completed", onRideCompleted);
    };
  }, [userSocket]);

  useEffect(() => {
    getUserCancelledRides();
    getUserCompletedRides();
  }, []);

  useEffect(() => {
    const loadOngoingRide = async () => {
      try {
        await getActiveRide();
      } catch (error: any) {
        const errMsg = error.response.data.msg;
        console.log("Error loading ongoing ride:", errMsg);
      }
    };

    loadOngoingRide();
  }, []);

  const API_URL = API_URLS.rides;

  const resetRide = () => {
    setOngoingRideData(null);
    setRideData(null);
    setRideStatus("");
    setRideDetails(null);
    setDestinationCoords(null);
    setDestination("");
    setModalUp(false);
    setPickupCoords(null);

    mapRef.current.animateToRegion(region, 100);
  };

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
      setOngoingRideData(data.ride);
      showNotification(data.msg, "success");
    } catch (error: any) {
      throw new Error(error.response.data.message);
    }
  };

  const [retrying, setRetrying] = useState(false);
  const retryRideRequest = async () => {
    const token = await AsyncStorage.getItem("token");
    const ride_id = ongoingRideData._id;

    setRetrying(true);
    try {
      const { data } = await axios.patch(
        `${API_URL}/retry?ride_id=${ride_id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOngoingRideData(data.ride);
      showNotification(data.msg, "success");
    } catch (error: any) {
      throw new Error(error.response.data.msg);
    } finally {
      setRetrying(false);
    }
  };

  const [rebooking, setRebooking] = useState(false);

  const rebookRideRequest = async (ride_id: string) => {
    const token = await AsyncStorage.getItem("token");
    setRebooking(true);
    try {
      const { data } = await axios.post(
        `${API_URL}/rebook?ride_id=${ride_id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOngoingRideData(data.ride);
      showNotification(data.msg, "success");
    } catch (error: any) {
      throw new Error(error.response.data.message);
    } finally {
      setRebooking(false);
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
      resetRide();
      await getUserCancelledRides();
      showNotification("Ride request cancelled", "error");
    } catch (error: any) {
      console.log(error);
      showNotification(error.response.data.msg, "error");
    } finally {
      setCancelling(false);
    }
  };

  const fetchRideData = async (ride_id: string): Promise<any> => {
    const token = await AsyncStorage.getItem("token");
    try {
      const { data } = await axios.get(`${API_URL}/data?ride_id=${ride_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data) return data.ride;
    } catch (error: any) {
      console.log(error);
      showNotification(error.response.data.msg, "error");
    }
  };
  const fetchOngoingRideData = async (ride_id: string): Promise<void> => {
    try {
      const ride = await fetchRideData(ride_id);
      setOngoingRideData(ride);
    } catch (error: any) {
      console.log(error);
      showNotification(error.response.data.msg, "error");
    }
  };
  const fetchRideDetails = async (ride_id: string): Promise<void> => {
    setRideDetailsLoading(true);
    try {
      const ride = await fetchRideData(ride_id);
      if (ride) setRideData(ride);
    } catch (error: any) {
      console.log(error);
      showNotification(error.response.data.msg, "error");
    } finally {
      setRideDetailsLoading(false);
    }
  };

  const getActiveRide = async (): Promise<void> => {
    const token = await AsyncStorage.getItem("token");
    try {
      const { data } = await axios.get(`${API_URL}/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOngoingRideData(data.ride);
    } catch (error: any) {
      console.log(error);
      showNotification(error.response.data.msg, "error");
    }
  };

  const payForRide = async (): Promise<void> => {
    const token = await AsyncStorage.getItem("token");
    try {
      await axios.post(
        `${API_URL}/pay?ride_id=${ongoingRideData._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await getWalletBalance("User");
      await fetchOngoingRideData(ongoingRideData._id);
      setModalUp(false);
      setRideStatus("paid");
      showNotification("Payment successfull", "success");
    } catch (error: any) {
      console.log(error);
      showNotification(error.response.data.msg, "error");
    }
  };

  const fetchUserRides = async (
    status: "completed" | "cancelled"
  ): Promise<any> => {
    const token = await AsyncStorage.getItem("token");
    try {
      const { data } = await axios.get(`${API_URL}/user?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.rides) return data.rides;
      else throw new Error("An error occured");
    } catch (error: any) {
      const errMsg = error.response.data.msg || "Couldn't fetch rides";
      throw new Error(errMsg);
    }
  };

  const [userCompletedRides, setUserCompletedRides] = useState<any>(null);
  const getUserCompletedRides = async (): Promise<void> => {
    setLoadingState((prev: any) => ({ ...prev, completedRides: true }));
    try {
      const rides = await fetchUserRides("completed");
      setUserCompletedRides(rides);
    } catch (error: any) {
      console.log(error.message);
    } finally {
      setLoadingState((prev: any) => ({ ...prev, completedRides: false }));
    }
  };

  const [userCancelledRides, setUserCancelledRides] = useState<any>(null);
  const getUserCancelledRides = async (): Promise<void> => {
    setLoadingState((prev: any) => ({ ...prev, cancelledRides: true }));
    try {
      const rides = await fetchUserRides("cancelled");
      setUserCancelledRides(rides);
    } catch (error: any) {
      console.log(error.message);
    } finally {
      setLoadingState((prev: any) => ({ ...prev, cancelledRides: false }));
    }
  };

  return (
    <RideContext.Provider
      value={{
        rideData,
        fetchRideDetails,
        rideRequest,
        rebookRideRequest,
        retryRideRequest,
        retrying,
        rebooking,
        payForRide,
        rideStatus,
        setRideStatus,
        modalUp,
        setModalUp,
        cancelRideRequest,
        ongoingRideData,
        resetRide,
        cancelling,
        setCancelling,
        userCancelledRides,
        userCompletedRides,
        setUserCancelledRides,
        setUserCompletedRides,
        getUserCompletedRides,
        getUserCancelledRides,
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

  retrying: boolean;
  rebooking: boolean;
  retryRideRequest: () => Promise<void>;
  rebookRideRequest: (ride_id: string) => Promise<void>;

  cancelRideRequest: (
    ride_id: string,
    by: "rider" | "driver",
    reason: string
  ) => Promise<void>;
  cancelling: boolean;
  setCancelling: Dispatch<SetStateAction<boolean>>;

  resetRide: () => void;

  payForRide: () => Promise<void>;

  rideStatus: RideStatusType;
  setRideStatus: Dispatch<SetStateAction<RideStatusType>>;
  modalUp: boolean;
  setModalUp: Dispatch<SetStateAction<boolean>>;

  rideData: any;
  ongoingRideData: any;
  fetchRideDetails: (ride_id: string) => Promise<void>;

  userCompletedRides: any;
  setUserCompletedRides: Dispatch<SetStateAction<any>>;
  getUserCompletedRides: () => Promise<void>;
  userCancelledRides: any;
  setUserCancelledRides: Dispatch<SetStateAction<any>>;
  getUserCancelledRides: () => Promise<void>;
}

export const useRideContext = () => {
  const context = useContext(RideContext);
  if (!context)
    throw new Error("Ride context must be used within ride provider");
  return context;
};

export default RideContextProvider;
