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
  return useContext(NotificationContext);
};
