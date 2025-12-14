import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router"; // 👈 Added router import
import { registerForPushNotificationsAsync } from "../utils/registerPushNotification";

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const usePushNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a PushNotificationProvider"
    );
  }
  return context;
};

interface PushNotificationProviderProps {
  children: ReactNode;
}

export const PushNotificationProvider: React.FC<
  PushNotificationProviderProps
> = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // 1. Register for the Token immediately on mount
    registerForPushNotificationsAsync()
      .then((token) => {
        setExpoPushToken(token ?? null);
        if (token) {
          console.log("Token received:", token);
        }
      })
      .catch((err) => {
        setError(err);
        console.error("Failed to get push token", err);
      });

    // 2. Listener: Handle notifications received while app is open
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
        // You can trigger custom logic here, like refreshing the 'Rides' list
        console.log("Foreground notification received:", notification);
      });

    // 3. Listener: Handle user tapping on a notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log("User interacted with notification. Payload:", data);
        try {
          if (data?.role === "driver") {
            if (data?.type === "delivery_cancelled") {
              router.push(`/(driver)/deliveries`);
            }
            if (data?.type === "ride_cancelled") {
              router.push(`/(driver)/rides`);
            }
          } else {
            if (data?.type === "ride_booking") {
              router.push("/(book)/book_ride");
            }
            if (data?.type === "delivery_booking") {
              router.push("/(book)/book_delivery");
            }

            // Delivery cancelled or completed
            if (
              ["delivery_cancelled", "delivery_completed"].includes(
                data?.type as any
              )
            ) {
              if (data.delivery_id) {
                router.push({
                  pathname: "/(tabs)/delivery/delivery_detail/[delivery_id]", // Note: Use the bracket name here
                  params: { delivery_id: data.delivery_id as any },
                });
              } else {
                router.push("/(tabs)/delivery");
              }
            }

            // Ride cancelled or completed
            if (
              ["ride_cancelled", "ride_completed"].includes(data?.type as any)
            ) {
              if (data.ride_id) {
                router.push({
                  pathname: "/(tabs)/rides/ride_detail/[ride_id]",
                  params: { ride_id: data.ride_id as any },
                });
              } else {
                console.warn("Missing ride_id in notification payload");
              }
            }
          }
        } catch (error) {
          console.log("Navigation failed", error);
        }
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{ expoPushToken, notification, error }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
