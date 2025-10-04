import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
  Dispatch,
  SetStateAction,
  useRef,
} from "react";

import { Animated } from "react-native";
import * as Notifications from "expo-notifications";

// Status type
type StatusType = "error" | "success" | "";

// Notification type
export interface NotificationType {
  visible: boolean;
  message: string;
  status: StatusType;
}

// Context type
export interface NotificationContextType {
  notification: NotificationType;
  setNotification: Dispatch<SetStateAction<NotificationType>>;

  notify: () => void;
  closeNotify: () => void;

  position: any;
  scale: any;

  showNotification: (message: string, status: StatusType) => void;
}

// Creating context
const NotificationContext = createContext<NotificationContextType | null>(null);

// Context Provider
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  // Notification state
  const [notification, setNotification] = useState<NotificationType>({
    visible: false,
    message: "",
    status: "",
  });

  // Timeout function for closing notification
  useEffect(() => {
    const notiTimeout = setTimeout(() => {
      setNotification({ visible: false, message: "", status: "" });
      closeNotify();
    }, 2000);
    return () => clearTimeout(notiTimeout);
  }, [notification]);

  // Notification animation
  const position = useRef(new Animated.Value(-100)).current;
  const scale = useRef(new Animated.Value(0)).current;

  const notify = () => {
    Animated.parallel([
      Animated.spring(scale, {
        friction: 7,
        tension: 40,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(position, {
        duration: 300,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeNotify = () => {
    Animated.parallel([
      Animated.spring(scale, {
        friction: 7,
        tension: 40,
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(position, {
        duration: 300,
        toValue: -100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Showing notification function
  const showNotification = (message: string, status: StatusType): void => {
    setNotification({ visible: true, message, status });
    notify();
  };

  // Notification listeners (foreground receive + response)
  useEffect(() => {
    // Prevent the system from showing a native notification when app is foregrounded
    // Notifications.setNotificationHandler({
    //   handleNotification: async () => ({
    //     shouldShowAlert: false,
    //     shouldPlaySound: false,
    //     shouldSetBadge: false,
    //   }),
    // });

    const receivedListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        try {
          const content = notification.request.content;
          const body = content.body || content.title || "";
          // Use in-app notification UI
          if (body) showNotification(body, "success");
        } catch (e) {
          console.log("Error handling received notification:", e);
        }
      }
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        try {
          const data = response.notification.request.content.data;
          // Placeholder: future deep-linking / navigation can use `data`
          console.log("Notification response:", data);
        } catch (e) {
          console.log("Error handling notification response:", e);
        }
      });

    return () => {
      receivedListener.remove();
      responseListener.remove();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notification,
        setNotification,
        notify,
        closeNotify,
        position,
        scale,
        showNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error(
      "Notification context must be used within the notification provider"
    );
  return context;
};

export default NotificationProvider;
