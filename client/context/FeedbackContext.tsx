import React, { createContext, useContext, useState, ReactNode } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URLS } from "../data/constants";
import { useNotificationContext } from "./NotificationContext";

type FeedbackType = "bug" | "feature" | "general";

export interface FeedbackItem {
  _id: string;
  user?: any;
  type: FeedbackType;
  message: string;
  images?: string[];
  contact?: string;
  createdAt?: string;
}

export interface FeedbackContextType {
  feedbacks: FeedbackItem[];
  fetching: boolean;
  sending: boolean;
  getUserFeedbacks: () => Promise<void>;
  sendFeedback: (payload: {
    type: FeedbackType;
    message: string;
    images?: { uri: string }[];
    contact?: string;
  }) => Promise<void>;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

const FeedbackProvider = ({ children }: { children: ReactNode }) => {
  const { showNotification } = useNotificationContext();

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [fetching, setFetching] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);

  const FEEDBACK_URL = API_URLS.feeedback;

  const getUserFeedbacks = async (): Promise<void> => {
    try {
      setFetching(true);
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.get(`${FEEDBACK_URL}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data && data.feedbacks) setFeedbacks(data.feedbacks);
    } catch (err: any) {
      console.log(
        "Failed to fetch feedbacks:",
        err?.response || err.message || err
      );
      showNotification(
        err?.response?.data?.msg || "Failed to fetch feedbacks",
        "error"
      );
      throw err;
    } finally {
      setFetching(false);
    }
  };

  const sendFeedback = async (payload: {
    type: FeedbackType;
    message: string;
    images?: { uri: string }[];
    contact?: string;
  }): Promise<void> => {
    const { type, message, images = [], contact } = payload;
    if (!message || !type) {
      showNotification("Type and message are required", "error");
      throw new Error("Type and message are required");
    }

    setSending(true);
    try {
      const token = await AsyncStorage.getItem("token");

      const form = new FormData();
      form.append("type", type);
      form.append("message", message);
      if (contact) form.append("contact", contact);

      images.forEach((img, idx) => {
        const uri = img.uri;
        const name = uri.split("/").pop() || `image_${idx}.jpg`;
        const match = name.match(/\.([0-9a-z]+)(?:[?#]|$)/i);
        const ext = match ? match[1] : "jpg";
        const typeHeader = `image/${ext === "jpg" ? "jpeg" : ext}`;

        // @ts-ignore - React Native FormData file shape
        form.append("images", {
          uri,
          name,
          type: typeHeader,
        });
      });

      const { data } = await axios.post(FEEDBACK_URL, form, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "multipart/form-data",
        },
      });

      if (data && data.msg) showNotification(data.msg, "success");

      // refresh user's feedbacks
      await getUserFeedbacks();
    } catch (err: any) {
      console.log(
        "Failed to send feedback:",
        err?.response || err.message || err
      );
      showNotification(
        err?.response?.data?.msg || "Failed to send feedback",
        "error"
      );
      throw err;
    } finally {
      setSending(false);
    }
  };

  return (
    <FeedbackContext.Provider
      value={{ feedbacks, fetching, sending, getUserFeedbacks, sendFeedback }}
    >
      {children}
    </FeedbackContext.Provider>
  );
};

export const useFeedbackContext = () => {
  const ctx = useContext(FeedbackContext);
  if (!ctx)
    throw new Error("Feedback context must be used within FeedbackProvider");
  return ctx;
};

export default FeedbackProvider;
