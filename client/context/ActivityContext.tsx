import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  FC,
  ReactNode,
} from "react";

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URLS } from "../data/constants";

import { useNotificationContext } from "./NotificationContext";

export interface ActivityType {
  _id: string;
  type:
    | "ride"
    | "scheduled_ride"
    | "wallet_funding"
    | "transaction"
    | "system"
    | "security"
    | "user_details";
  user: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  is_read: boolean;
}

const ActivityContext = createContext<ActivityContextType | null>(null);

const ActivityProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<ActivityType[] | null>(null);
  const [loading, setLoading] = useState(false);

  const { showNotification } = useNotificationContext();

  const API_URL = API_URLS.activity;

  const fetchActivities = async (): Promise<void> => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivities(data.activities || null);
    } catch (error: any) {
      showNotification("Failed to fetch activities", "error");
    } finally {
      setLoading(false);
    }
  };

  const createActivity = async (
    type: ActivityType["type"],
    title: string,
    message?: string,
    metadata?: Record<string, any>
  ): Promise<void> => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.post(
        API_URL,
        { type, title, message, metadata },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Activity created");
      await fetchActivities();
    } catch (error: any) {
      console.log("Failed to create activity");
    } finally {
      setLoading(false);
    }
  };

  const removeActivity = async (activity_id: string): Promise<void> => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.delete(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params: { activity_id },
      });
      showNotification("Activity deleted", "success");
      await fetchActivities();
    } catch (error: any) {
      showNotification("Failed to delete activity", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return (
    <ActivityContext.Provider
      value={{
        activities,
        loading,
        fetchActivities,
        createActivity,
        removeActivity,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
};

export default ActivityProvider;

interface ActivityContextType {
  activities: ActivityType[] | null;
  loading: boolean;
  fetchActivities: () => Promise<void>;
  createActivity: (
    type: ActivityType["type"],
    title: string,
    message?: string,
    metadata?: Record<string, any>
  ) => Promise<void>;
  removeActivity: (activity_id: string) => Promise<void>;
}

export const useActivityContext = () =>
  useContext(ActivityContext) as ActivityContextType;
