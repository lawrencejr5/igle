"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import axios from "axios";
import { useAlert } from "./AlertContext";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Types matching backend model
export interface FareSettings {
  baseFare?: number;
  costPerKm?: number;
  costPerMinute?: number;
  minimumFare?: number;
  commissionRate?: number;
  cancellationFee?: number;
}

export interface DeliveryFareSettings {
  baseDeliveryFee?: number;
  costPerKm?: number;
  weightBasedFee?: number;
  minimumDeliveryFee?: number;
}

export interface SystemSettings {
  _id: string;
  rideFare: FareSettings;
  deliveryFare: DeliveryFareSettings;
  createdAt: Date;
  updatedAt: Date;
}

// Context interface
interface SystemSettingsContextType {
  settings: SystemSettings | null;
  loading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (
    rideFare?: FareSettings,
    deliveryFare?: DeliveryFareSettings
  ) => Promise<void>;
}

const SystemSettingsContext = createContext<SystemSettingsContextType | null>(
  null
);

export const SystemSettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  // Fetch system settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/system`);
      if (response.data?.settings) {
        setSettings(response.data.settings);
      }
    } catch (error: any) {
      console.error("Failed to fetch system settings:", error);
      showAlert(
        error.response?.data?.msg || "Failed to fetch system settings",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Update system settings
  const updateSettings = async (
    rideFare?: FareSettings,
    deliveryFare?: DeliveryFareSettings
  ) => {
    try {
      setLoading(true);
      const payload: any = {};
      if (rideFare) payload.rideFare = rideFare;
      if (deliveryFare) payload.deliveryFare = deliveryFare;

      const response = await axios.patch(`${API_BASE_URL}/system`, payload);
      if (response.data?.settings) {
        setSettings(response.data.settings);
        showAlert("System settings updated successfully", "success");
      }
    } catch (error: any) {
      console.error("Failed to update system settings:", error);
      showAlert(
        error.response?.data?.msg || "Failed to update system settings",
        "error"
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: SystemSettingsContextType = {
    settings,
    loading,
    fetchSettings,
    updateSettings,
  };

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error(
      "useSystemSettings must be used within SystemSettingsProvider"
    );
  }
  return context;
};

export default SystemSettingsProvider;
