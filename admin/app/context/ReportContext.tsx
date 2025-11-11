"use client";

import React, { createContext, useContext, useState } from "react";
import axios from "axios";
import { useAlert } from "./AlertContext";

// Report status type
export type ReportStatus = "new" | "investigating" | "resolved" | "dismissed";

// Report interface matching backend model
export interface Report {
  _id: string;
  reporter?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    profile_pic?: string;
  } | null;
  driver: {
    _id: string;
    user: {
      _id: string;
      name: string;
      email: string;
      phone?: string;
    };
  };
  ride?: {
    _id: string;
    pickup?: string;
    destination?: string;
    fare?: number;
  } | null;
  category: string;
  description?: string;
  anonymous: boolean;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Context interface
interface ReportContextType {
  reports: Report[];
  currentReport: Report | null;
  loading: boolean;
  totalReports: number;
  totalPages: number;
  currentPage: number;
  fetchReports: (
    page?: number,
    limit?: number,
    filters?: {
      status?: string;
      category?: string;
      reporter?: string;
    }
  ) => Promise<void>;
  fetchReportDetail: (reportId: string) => Promise<void>;
  updateReportStatus: (
    reportId: string,
    status: ReportStatus
  ) => Promise<boolean>;
  deleteReport: (reportId: string) => Promise<boolean>;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const ReportProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalReports, setTotalReports] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const { showAlert } = useAlert();

  const API_BASE = "http://localhost:5000/api/v1/report/admin/reports";

  // Get admin token from localStorage
  const getAuthHeaders = () => {
    const admin_token = localStorage.getItem("admin_token");
    return {
      headers: {
        Authorization: `Bearer ${admin_token}`,
      },
    };
  };

  // Fetch reports list with optional filters
  const fetchReports = async (
    page: number = 1,
    limit: number = 10,
    filters?: {
      status?: string;
      category?: string;
      reporter?: string;
    }
  ) => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (filters?.status) params.status = filters.status;
      if (filters?.category) params.category = filters.category;
      if (filters?.reporter) params.reporter = filters.reporter;

      const response = await axios.get<{
        msg: string;
        reports: Report[];
        total: number;
        page: number;
        pages: number;
      }>(API_BASE, {
        ...getAuthHeaders(),
        params,
      });

      setReports(response.data.reports);
      setTotalReports(response.data.total);
      setTotalPages(response.data.pages);
      setCurrentPage(response.data.page);
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      showAlert(
        error.response?.data?.msg || "Failed to fetch reports",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch single report details
  const fetchReportDetail = async (reportId: string) => {
    setLoading(true);
    try {
      const response = await axios.get<{ msg: string; report: Report }>(
        `${API_BASE}/data`,
        {
          ...getAuthHeaders(),
          params: { id: reportId },
        }
      );

      setCurrentReport(response.data.report);
    } catch (error: any) {
      console.error("Error fetching report details:", error);
      showAlert(
        error.response?.data?.msg || "Failed to fetch report details",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Update report status
  const updateReportStatus = async (
    reportId: string,
    status: ReportStatus
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await axios.patch<{ msg: string; report: Report }>(
        `${API_BASE}/status`,
        { id: reportId, status },
        getAuthHeaders()
      );

      showAlert(
        response.data.msg || "Report status updated successfully",
        "success"
      );
      // Refresh reports list
      await fetchReports(currentPage);
      return true;
    } catch (error: any) {
      console.error("Error updating report status:", error);
      showAlert(
        error.response?.data?.msg || "Failed to update report status",
        "error"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete a report
  const deleteReport = async (reportId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await axios.delete<{ msg: string }>(API_BASE, {
        ...getAuthHeaders(),
        data: { id: reportId },
      });

      showAlert(response.data.msg || "Report deleted successfully", "success");
      // Refresh reports list
      await fetchReports(currentPage);
      return true;
    } catch (error: any) {
      console.error("Error deleting report:", error);
      showAlert(
        error.response?.data?.msg || "Failed to delete report",
        "error"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value: ReportContextType = {
    reports,
    currentReport,
    loading,
    totalReports,
    totalPages,
    currentPage,
    fetchReports,
    fetchReportDetail,
    updateReportStatus,
    deleteReport,
  };

  return (
    <ReportContext.Provider value={value}>{children}</ReportContext.Provider>
  );
};

export const useReportContext = () => {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error("useReportContext must be used within a ReportProvider");
  }
  return context;
};
