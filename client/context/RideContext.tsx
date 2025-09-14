import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  FC,
  Dispatch,
  SetStateAction,
  ReactNode,
  useRef,
  useMemo,
} from "react";

import { TextInput, Platform, BackHandler } from "react-native";

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useNotificationContext } from "./NotificationContext";
import { useMapContext } from "./MapContext";
import { useDriverAuthContext } from "./DriverAuthContext";
import { useAuthContext } from "./AuthContext";
import { useWalletContext } from "./WalletContext";
import { useLoading } from "./LoadingContext";
import { useHistoryContext } from "./HistoryContext";

import { useNavigation } from "expo-router";

import { API_URLS } from "../data/constants";
import BottomSheet from "@gorhom/bottom-sheet";
import { useActivityContext } from "./ActivityContext";

const RideContext = createContext<RideContextType | null>(null);

type RideStatusType =
  | ""
  | "booking"
  | "choosing_car"
  | "searching"
  | "accepted"
  | "pay"
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
    getPlaceCoords,
    pickupCoords,
    setUserAddress,
    setPickupSuggestions,
    setDestinationSuggestions,
  } = useMapContext();
  const { getWalletBalance } = useWalletContext();
  const { getRideHistory, addRideHistory } = useHistoryContext();
  const { createActivity } = useActivityContext();

  const [ongoingRideData, setOngoingRideData] = useState<any>(null);
  const [rideData, setRideData] = useState<any>(null);

  const [rideStatus, setRideStatus] = useState<RideStatusType>("");
  const [modalUp, setModalUp] = useState<boolean>(false);
  const routeModalRef = useRef<BottomSheet>(null);

  const { getDriverData } = useDriverAuthContext();
  const { setLoadingState, setRideDetailsLoading } = useLoading();
  const { fetchActivities } = useActivityContext();

  const { userSocket, signedIn } = useAuthContext();

  useEffect(() => {
    getUserCompletedRides();
    getUserCancelledRides();
    getRideHistory();
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
      setModalUp(false);
      setRideStatus("pay");
    };

    const onRideStarted = async (data: any) => {
      showNotification("Your ride has started", "success");
      console.log("Your ride has started");
    };

    const onRideCompleted = async (data: any) => {
      resetRide();
      showNotification("Your ride has been completed", "success");

      await set_user_location();
      await getUserCompletedRides();
      await fetchActivities();

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
      userSocket.off("ride_in_progress", onRideStarted);
      userSocket.off("ride_completed", onRideCompleted);
    };
  }, [userSocket]);

  useEffect(() => {
    if (rideStatus === "") {
      routeModalRef.current?.snapToIndex(1);
    }
    if (rideStatus === "booking") {
      routeModalRef.current?.snapToIndex(5);
    }
    if (rideStatus === "choosing_car") {
      routeModalRef.current?.snapToIndex(1);
    }
    if (rideStatus === "searching") {
      routeModalRef.current?.snapToIndex(1);
    }
    if (rideStatus === "accepted") {
      routeModalRef.current?.snapToIndex(4);
    }
    if (rideStatus === "pay") {
      routeModalRef.current?.snapToIndex(1);
    }
    if (rideStatus === "paying") {
      routeModalRef.current?.snapToIndex(1);
    }
  }, [rideStatus]);

  const navigation = useNavigation();
  const handleBackAction = (e?: any) => {
    if (e) e.preventDefault();
    if (rideStatus === "booking") {
      setRideStatus("");
      resetRide();
      return true;
    }
    if (rideStatus === "choosing_car") {
      setRideStatus("booking");
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
  }, [navigation, rideStatus]);

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
    setPickupTime("now");
    setScheduledTime(new Date());
    setScheduledTimeDif("");

    mapRef.current && mapRef.current.animateToRegion(region, 100);
  };

  const [scheduledTime, setScheduledTime] = useState<Date>(new Date());

  useEffect(() => {
    if (scheduledTime) {
      getTimeDifference(scheduledTime);
      const time_dif_interval = setInterval(() => {
        getTimeDifference(scheduledTime);
      }, 60000);

      return () => clearInterval(time_dif_interval);
    }
  }, [scheduledTime]);

  const [scheduledTimeDif, setScheduledTimeDif] = useState<string>("");
  const getTimeDifference = (targetDate: Date) => {
    const now = new Date();
    const diffMs = targetDate.getTime() - now.getTime(); // difference in ms

    if (diffMs <= 0) {
      return "In the past";
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      const dif = `${diffDays} day${diffDays > 1 ? "s" : ""} ${
        diffHours % 24
      } hr${diffHours % 24 > 1 ? "s" : ""}`;
      setScheduledTimeDif(dif);
    } else if (diffHours > 0) {
      const dif = `${diffHours} hr${diffHours > 1 ? "s" : ""} ${
        diffMinutes % 60
      } min${diffMinutes % 60 > 1 ? "s" : ""}`;
      setScheduledTimeDif(dif);
    } else {
      const dif = `${diffMinutes} min${diffMinutes > 1 ? "s" : ""}`;
      setScheduledTimeDif(dif);
    }
  };

  const rideRequest = async (
    pickup: { address: string; coordinates: [number, number] },
    destination: { address: string; coordinates: [number, number] },
    scheduled_time?: Date
  ): Promise<void> => {
    const token = await AsyncStorage.getItem("token");
    try {
      const distance_and_duration = await calculateRide(
        pickup.coordinates,
        destination.coordinates
      );
      const distanceKm = distance_and_duration?.distanceKm;
      const durationMins = distance_and_duration?.durationMins;

      // build base url
      let url = `${API_URL}/request?km=${distanceKm}&min=${durationMins}`;

      // only append scheduled_time if it exists
      if (scheduled_time) {
        url += `&scheduled_time=${encodeURIComponent(
          scheduled_time.toISOString()
        )}`;
      }

      const { data } = await axios.post(
        url,
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
      const { data } = await axios.patch(
        `${API_URL}/cancel?ride_id=${ride_id}`,
        { reason, by },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      resetRide();
      await createActivity(
        "cancelled_ride",
        "Cancelled ride",
        `You cancelled your ride to ${data.ride.destination.address}`,
        { ride_id: data.ride._id }
      );
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

      await createActivity(
        "ride_payment",
        "Payment for ride",
        `${ongoingRideData.fare} was debitted from ur wallet`
      );

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

  const [activeSuggestion, setActiveSuggestion] = useState<
    "pickup" | "destination" | ""
  >("");
  const pickupFocus = () => {
    setActiveSuggestion("pickup");
    setPickupSuggestions(null);
    setDestinationSuggestions(null);
  };
  const destinationFocus = () => {
    setActiveSuggestion("");
    setPickupSuggestions(null);
    setDestinationSuggestions(null);
  };

  const pickupRef = useRef<TextInput>(null);
  const destinationRef = useRef<TextInput>(null);

  const [dateTimeModal, setDateTimeModal] = useState<boolean>(false);

  const [placeId, setPlaceId] = useState<string>("");

  const set_destination_func = async (
    place_id: string,
    place_name: string,
    place_sub_name: string
  ) => {
    await addRideHistory(place_id, place_name, place_sub_name);
    if (pickupTime === "later") {
      setDestination(place_name);
      setPlaceId(place_id);
      setDateTimeModal(true);
    } else {
      setDestination(place_name);
      setModalUp(false);
      setRideStatus("choosing_car");

      const coords = await getPlaceCoords(place_id);
      if (coords) {
        setDestinationCoords(coords);
        await calculateRide(
          pickupCoords || [region.latitude, region.longitude],
          [...coords]
        );
      }
    }
  };

  const set_pickup_func = async (place_id: string, place_name: string) => {
    setUserAddress(place_name);
    destinationRef.current?.focus();

    const coords = await getPlaceCoords(place_id);
    if (coords) {
      setPickupCoords(coords);
      setDestination("");
    }
  };

  const [pickupTime, setPickupTime] = useState<"now" | "later">("now");
  const [pickupModal, setPickupModal] = useState<boolean>(false);

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
        routeModalRef,
        cancelRideRequest,
        placeId,
        pickupRef,
        destinationRef,
        dateTimeModal,
        setDateTimeModal,
        set_destination_func,
        set_pickup_func,
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
        pickupTime,
        pickupModal,
        setPickupTime,
        setPickupModal,
        scheduledTime,
        setScheduledTime,
        scheduledTimeDif,
        setScheduledTimeDif,
        getTimeDifference,
      }}
    >
      {children}
    </RideContext.Provider>
  );
};

export interface RideContextType {
  rideRequest: (
    pickup: { address: string; coordinates: [number, number] },
    destination: { address: string; coordinates: [number, number] },
    scheduled_time?: Date
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
  routeModalRef: any;

  rideData: any;
  ongoingRideData: any;
  fetchRideDetails: (ride_id: string) => Promise<void>;

  placeId: string;
  pickupRef: any;
  destinationRef: any;
  dateTimeModal: boolean;
  setDateTimeModal: Dispatch<SetStateAction<boolean>>;
  set_destination_func: (
    place_id: string,
    place_name: string,
    place_sub_name: string
  ) => Promise<void>;
  set_pickup_func: (place_id: string, place_name: string) => Promise<void>;

  userCompletedRides: any;
  setUserCompletedRides: Dispatch<SetStateAction<any>>;
  getUserCompletedRides: () => Promise<void>;
  userCancelledRides: any;
  setUserCancelledRides: Dispatch<SetStateAction<any>>;
  getUserCancelledRides: () => Promise<void>;

  pickupTime: "now" | "later";
  setPickupTime: Dispatch<SetStateAction<"now" | "later">>;
  pickupModal: boolean;
  setPickupModal: Dispatch<SetStateAction<boolean>>;

  scheduledTime: Date;
  setScheduledTime: Dispatch<SetStateAction<Date>>;
  scheduledTimeDif: string;
  setScheduledTimeDif: Dispatch<SetStateAction<string>>;
  getTimeDifference: (targetDate: Date) => void;
}

export const useRideContext = () => {
  const context = useContext(RideContext);
  if (!context)
    throw new Error("Ride context must be used within ride provider");
  return context;
};

export default RideContextProvider;
