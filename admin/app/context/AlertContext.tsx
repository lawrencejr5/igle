"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";


type AlertType = "success" | "error" | "info" | "warning";

interface Alert {
  id: string;
  message: string;
  type: AlertType;
}

interface AlertContextType {
  showAlert: (message: string, type: AlertType) => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const showAlert = useCallback(
    (message: string, type: AlertType = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      const newAlert: Alert = { id, message, type };

      setAlerts((prev) => [...prev, newAlert]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setAlerts((prev) => prev.filter((n) => n.id !== id));
      }, 5000);
    },
    []
  );

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {alerts.map((alert) => (
          <AlertItem
            key={alert.id}
            alert={alert}
            onClose={() => removeAlert(alert.id)}
          />
        ))}
      </div>
    </AlertContext.Provider>
  );
};

interface AlertItemProps {
  alert: Alert;
  onClose: () => void;
}

const AlertItem: React.FC<AlertItemProps> = ({
  alert,
  onClose,
}) => {
  const getBackgroundColor = () => {
    switch (alert.type) {
      case "success":
        return "#10b981";
      case "error":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      case "info":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const getIcon = () => {
    switch (alert.type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      case "info":
        return "ℹ";
      default:
        return "•";
    }
  };

  return (
    <div
      style={{
        backgroundColor: getBackgroundColor(),
        color: "white",
        padding: "12px 16px",
        borderRadius: 8,
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        minWidth: 300,
        maxWidth: 400,
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <span style={{ fontSize: 18, fontWeight: "bold" }}>{getIcon()}</span>
      <span style={{ flex: 1, fontSize: 14 }}>{alert.message}</span>
      <button
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          color: "white",
          cursor: "pointer",
          fontSize: 18,
          padding: 0,
          lineHeight: 1,
        }}
      >
        ×
      </button>
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return context;
};

export default AlertProvider;
