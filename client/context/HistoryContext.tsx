import { StyleSheet, Text, View } from "react-native";
import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  FC,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

import axios from "axios";

import { API_URLS } from "../data/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HistoryContext = createContext<HistoryContextType | null>(null);

const HistoryProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [rideHistory, setRideHistory] = useState<{
    place_id: string;
    place_name: string;
  } | null>(null);

  const api_url = API_URLS.history;

  const getRideHistory = async (): Promise<void> => {
    const token = await AsyncStorage.getItem("token");
    try {
      const { data } = await axios.get(api_url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.history) setRideHistory(data.history);
    } catch (error: any) {
      const errMsg = error.response.data.msg;
      throw new Error(
        errMsg || "An error occured while fetching user ride history"
      );
    }
  };

  const addRideHistory = async (
    place_id: string,
    place_name: string
  ): Promise<void> => {
    const token = await AsyncStorage.getItem("token");
    try {
      await axios.post(
        api_url,
        { place_id, place_name },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await getRideHistory();
    } catch (error: any) {
      const errMsg = error.response.data.msg;
      throw new Error(
        errMsg || "An error occured while fetching user ride history"
      );
    }
  };

  const deleteRideHistory = async (place_id: string): Promise<void> => {
    const token = await AsyncStorage.getItem("token");
    try {
      await axios.delete(`${api_url}?place_id=${place_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await getRideHistory();
    } catch (error: any) {
      const errMsg = error.response.data.msg;
      throw new Error(
        errMsg || "An error occured while fetching user ride history"
      );
    }
  };

  return (
    <HistoryContext.Provider
      value={{
        rideHistory,
        setRideHistory,
        getRideHistory,
        addRideHistory,
        deleteRideHistory,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

interface HistoryContextType {
  rideHistory: {
    place_id: string;
    place_name: string;
  } | null;
  setRideHistory: Dispatch<
    SetStateAction<{
      place_id: string;
      place_name: string;
    } | null>
  >;
  getRideHistory: () => Promise<void>;
  addRideHistory: (place_name: string, place_id: string) => Promise<void>;
  deleteRideHistory: (place_id: string) => Promise<void>;
}

export const useHistoryContext = () => {
  const context = useContext(HistoryContext);
  if (!context)
    throw new Error(
      "History context must be used within the History context provider"
    );
  return context;
};

export default HistoryProvider;
