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

const RideContext = createContext<RideContextType | null>(null);

export const RideContextProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { showNotification } = useNotificationContext();

  const API_URL = "http://192.168.10.123:5000/api/v1/rides";

  const getRideKmMins = async (
    pickup: [number, number],
    destination: [number, number]
  ): Promise<{ distanceKm: number; durationMins: number } | undefined> => {
    try {
      const apiKey = "AIzaSyDdZZ0ji5pbx3ddhhlvYugGNvSxOOC3Zss";
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${pickup[0]},${pickup[1]}&destinations=${destination[0]},${destination[1]}&key=${apiKey}`;

      const { data } = await axios.get(url);

      if (data.rows[0].elements[0].status === "OK") {
        const distanceMeters = data.rows[0].elements[0].distance.value; // in meters
        const durationSeconds = data.rows[0].elements[0].duration.value; // in seconds

        return {
          distanceKm: distanceMeters / 1000,
          durationMins: durationSeconds / 60,
        };
      }
    } catch (error) {
      console.error("Error fetching ride info:", error);
    }
  };

  const rideRequest = async (
    pickup: { address: string; coordinates: [number, number] },
    destination: { address: string; coordinates: [number, number] }
  ): Promise<void> => {
    const token = await AsyncStorage.getItem("token");
    try {
      const distance_and_duration = await getRideKmMins(
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
    <RideContext.Provider value={{ rideRequest }}>
      {children}
    </RideContext.Provider>
  );
};

export interface RideContextType {
  rideRequest: (
    pickup: { address: string; coordinates: [number, number] },
    destination: { address: string; coordinates: [number, number] }
  ) => Promise<void>;
}

export const useRideContext = () => {
  const context = useContext(RideContext);
  if (!context)
    throw new Error("Ride context must be used within ride provider");
  return context;
};
