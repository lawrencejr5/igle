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
    | "cancelled_ride"
    | "scheduled_ride"
    | "wallet_funding"
    | "ride_payment"
    | "system"
    | "security"
    | "email_update"
    | "phone_update";
  user: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  is_read: boolean;
  createdAt: Date;
}

const ActivityContext = createContext<ActivityContextType | null>(null);

const ActivityProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<ActivityType[] | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  const { showNotification } = useNotificationContext();

  const API_URL = API_URLS.activity;

  const fetchActivities = async (): Promise<void> => {
    setActivityLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivities(data.activities || null);
    } catch (error: any) {
      showNotification("Failed to fetch activities", "error");
    } finally {
      setActivityLoading(false);
    }
  };

  const createActivity = async (
    type: ActivityType["type"],
    title: string,
    message?: string,
    metadata?: Record<string, any>
  ): Promise<void> => {
    setActivityLoading(true);
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
      setActivityLoading(false);
    }
  };

  const removeActivity = async (activity_id: string): Promise<void> => {
    setActivityLoading(true);
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
      setActivityLoading(false);
    }
  };

  const formatTime = (createdAt: Date): string => {
    if (!createdAt) return "just now";

    const commentDate = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - commentDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
      return "just now";
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    }

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) {
      return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
    }

    const diffMonths = Math.floor(diffWeeks / 4);
    if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
    }

    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} year${diffYears !== 1 ? "s" : ""} ago`;
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return (
    <ActivityContext.Provider
      value={{
        activities,
        activityLoading,
        fetchActivities,
        createActivity,
        removeActivity,
        formatTime,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
};

export default ActivityProvider;

interface ActivityContextType {
  activities: ActivityType[] | null;
  activityLoading: boolean;
  fetchActivities: () => Promise<void>;
  createActivity: (
    type: ActivityType["type"],
    title: string,
    message?: string,
    metadata?: Record<string, any>
  ) => Promise<void>;
  removeActivity: (activity_id: string) => Promise<void>;
  formatTime: (createdAt: Date) => string;
}

export const useActivityContext = () =>
  useContext(ActivityContext) as ActivityContextType;
