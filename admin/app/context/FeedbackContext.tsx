"use client";

import React, { createContext, useContext, useState } from "react";
import axios from "axios";
import { useAlert } from "./AlertContext";

// Feedback type
export type FeedbackType = "bug" | "feature" | "general";

// Feedback interface matching backend model
export interface Feedback {
  _id: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    profile_pic?: string;
  } | null;
  type: FeedbackType;
  message: string;
  images?: string[];
  contact?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Context interface
interface FeedbackContextType {
  feedbacks: Feedback[];
  currentFeedback: Feedback | null;
  loading: boolean;
  totalFeedbacks: number;
  totalPages: number;
  currentPage: number;
  fetchFeedbacks: (
    page?: number,
    limit?: number,
    filters?: {
      type?: string;
      user?: string;
    }
  ) => Promise<void>;
  fetchFeedbackDetail: (feedbackId: string) => Promise<void>;
  deleteFeedback: (feedbackId: string) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(
  undefined
);

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalFeedbacks, setTotalFeedbacks] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const { showAlert } = useAlert();

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const API_URL = `${API_BASE_URL}/feedback/admin/feedbacks`;

  // Get admin token from localStorage
  const getAuthHeaders = () => {
    const admin_token = localStorage.getItem("admin_token");
    return {
      headers: {
        Authorization: `Bearer ${admin_token}`,
      },
    };
  };

  // Fetch feedbacks list with optional filters
  const fetchFeedbacks = async (
    page: number = 1,
    limit: number = 10,
    filters?: {
      type?: string;
      user?: string;
    }
  ) => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (filters?.type) params.type = filters.type;
      if (filters?.user) params.user = filters.user;

      const response = await axios.get<{
        msg: string;
        feedbacks: Feedback[];
        total: number;
        page: number;
        pages: number;
      }>(API_URL, {
        ...getAuthHeaders(),
        params,
      });

      setFeedbacks(response.data.feedbacks);
      setTotalFeedbacks(response.data.total);
      setTotalPages(response.data.pages);
      setCurrentPage(response.data.page);
    } catch (error: any) {
      console.error("Error fetching feedbacks:", error);
      showAlert(
        error.response?.data?.msg || "Failed to fetch feedbacks",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch single feedback details
  const fetchFeedbackDetail = async (feedbackId: string) => {
    setLoading(true);
    try {
      const response = await axios.get<{ msg: string; feedback: Feedback }>(
        `${API_URL}/data`,
        {
          ...getAuthHeaders(),
          params: { id: feedbackId },
        }
      );

      setCurrentFeedback(response.data.feedback);
    } catch (error: any) {
      console.error("Error fetching feedback details:", error);
      showAlert(
        error.response?.data?.msg || "Failed to fetch feedback details",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Delete a feedback
  const deleteFeedback = async (feedbackId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await axios.delete<{ msg: string }>(API_URL, {
        ...getAuthHeaders(),
        data: { id: feedbackId },
      });

      showAlert(
        response.data.msg || "Feedback deleted successfully",
        "success"
      );
      // Refresh feedbacks list
      await fetchFeedbacks(currentPage);
      return true;
    } catch (error: any) {
      console.error("Error deleting feedback:", error);
      showAlert(
        error.response?.data?.msg || "Failed to delete feedback",
        "error"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value: FeedbackContextType = {
    feedbacks,
    currentFeedback,
    loading,
    totalFeedbacks,
    totalPages,
    currentPage,
    fetchFeedbacks,
    fetchFeedbackDetail,
    deleteFeedback,
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
};

export const useFeedbackContext = () => {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error(
      "useFeedbackContext must be used within a FeedbackProvider"
    );
  }
  return context;
};
