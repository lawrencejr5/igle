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

const ReportContext = createContext<ReportContextType | null>(null);

const ReportProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [reports, setReports] = useState<ReportType[] | null>(null);

  const api_url = API_URLS.report;

  const submitReport = async (
    driver_id: string,
    ride_id: string | undefined | null,
    category: string,
    description?: string,
    anonymous = true
  ): Promise<ReportType> => {
    const token = await AsyncStorage.getItem("token");
    try {
      const { data } = await axios.post(
        api_url,
        { driver_id, ride_id, category, description, anonymous },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Optionally update local list
      if (data.report) {
        setReports((prev) => (prev ? [data.report, ...prev] : [data.report]));
      }

      return data.report;
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.msg || error.message || "Server error";
      throw new Error(errMsg);
    }
  };

  const getReports = async (): Promise<void> => {
    const token = await AsyncStorage.getItem("token");
    try {
      const { data } = await axios.get(api_url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.reports) setReports(data.reports);
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.msg || error.message || "Server error";
      throw new Error(errMsg);
    }
  };

  return (
    <ReportContext.Provider
      value={{ reports, setReports, submitReport, getReports }}
    >
      {children}
    </ReportContext.Provider>
  );
};

interface ReportContextType {
  reports: ReportType[] | null;
  setReports: Dispatch<SetStateAction<ReportType[] | null>>;
  submitReport: (
    driver_id: string,
    ride_id: string | undefined | null,
    category: string,
    description?: string,
    anonymous?: boolean
  ) => Promise<ReportType>;
  getReports: () => Promise<void>;
}

export interface ReportType {
  _id: string;
  reporter?: string | null;
  driver: string;
  ride?: string | null;
  category: string;
  description?: string;
  anonymous: boolean;
  status: string;
  createdAt: string;
}

export const useReportContext = () => {
  const context = useContext(ReportContext);
  if (!context)
    throw new Error("Report context must be used within the ReportProvider");
  return context;
};

export default ReportProvider;
