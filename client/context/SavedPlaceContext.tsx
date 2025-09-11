import { StyleSheet, Text, View } from "react-native";
import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  FC,
  ReactNode,
} from "react";

import axios from "axios";
import { API_URLS } from "../data/constants";
import { useNotificationContext } from "./NotificationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMapContext } from "./MapContext";

interface SavedPlace {
  _id: string;
  place_id: string;
  place_name: string;
  place_header: string;
  place_sub_name: string;
  place_coords: [number, number];
}

interface SavedPlaceContextType {
  savedPlaces: SavedPlace[];
  savePlace: (
    place_header: string,
    place_id: string,
    place_name: string,
    place_sub_name: string,
    place_coords: [number, number]
  ) => Promise<void>;
  getSavedPlaces: () => Promise<void>;
  deleteSavedPlace: (place_header: string) => Promise<void>;
  searchPlace: (query: string) => Promise<void>;
  searchResults: any[];
  loading: boolean;
}

const SavedPlaceContext = createContext<SavedPlaceContextType | null>(null);

const SavedPlaceProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const API_URL = API_URLS.saved_place;
  const { showNotification } = useNotificationContext();
  const { getSuggestions } = useMapContext();

  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(false);

  // New state for search results
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Function to search for a place using getSuggestions from MapContext
  const searchPlace = async (query: string): Promise<void> => {
    setLoading(true);
    try {
      const results = await getSuggestions(query);
      setSearchResults(results || []);
    } catch (error: any) {
      showNotification("Failed to search for places", "error");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const savePlace = async (
    place_header: string,
    place_id: string,
    place_name: string,
    place_sub_name: string,
    place_coords: [number, number]
  ): Promise<void> => {
    const token = await AsyncStorage.getItem("token");
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${API_URL}/`,
        { place_header, place_id, place_name, place_sub_name, place_coords },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showNotification(data.msg, "success");
      await getSavedPlaces();
    } catch (error: any) {
      const errMsg = error.response?.data?.msg;
      showNotification(errMsg || "An error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  const getSavedPlaces = async (): Promise<void> => {
    const token = await AsyncStorage.getItem("token");
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedPlaces(data.saved_places || []);
    } catch (error: any) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSavedPlace = async (place_header: string): Promise<void> => {
    const token = await AsyncStorage.getItem("token");
    setLoading(true);
    try {
      const { data } = await axios.delete(
        `${API_URL}?place_header=${place_header}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      showNotification(data.msg, "success");
      await getSavedPlaces();
    } catch (error: any) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSavedPlaces();
  }, []);

  return (
    <SavedPlaceContext.Provider
      value={{
        savedPlaces,
        savePlace,
        getSavedPlaces,
        deleteSavedPlace,
        searchPlace,
        searchResults,
        loading,
      }}
    >
      {children}
    </SavedPlaceContext.Provider>
  );
};

export const useSavedPlaceContext = () =>
  useContext(SavedPlaceContext) as SavedPlaceContextType;

export default SavedPlaceProvider;
