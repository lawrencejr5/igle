"use client";

import React, { createContext, useContext, useState } from "react";
import axios from "axios";
import { useAlert } from "./AlertContext";

// Task type matching backend
export type TaskType = "ride" | "delivery" | "streak" | "referral" | "custom";

// UserTask status type
export type UserTaskStatus =
  | "locked"
  | "in_progress"
  | "completed"
  | "claimed"
  | "expired";

// Task interface matching backend model
export interface Task {
  _id: string;
  title: string;
  description?: string;
  type: TaskType;
  goalCount: number;
  rewardAmount: number;
  active: boolean;
  startAt?: Date | null;
  endAt?: Date | null;
  terms?: string;
  maxPerUser?: number;
  totalBudget?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// UserTask interface matching backend model
export interface UserTask {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  task: Task;
  progress: number;
  status: UserTaskStatus;
  claimedAt?: Date | null;
  attempts?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Create task payload
export interface CreateTaskPayload {
  title: string;
  description?: string;
  type: TaskType;
  goalCount: number;
  rewardAmount: number;
  active?: boolean;
  startAt?: Date | null;
  endAt?: Date | null;
  terms?: string;
  maxPerUser?: number;
  totalBudget?: number | null;
}

// Update task payload
export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  type?: TaskType;
  goalCount?: number;
  rewardAmount?: number;
  active?: boolean;
  startAt?: Date | null;
  endAt?: Date | null;
  terms?: string;
  maxPerUser?: number;
  totalBudget?: number | null;
}

// Context interface
interface TaskContextType {
  tasks: Task[];
  currentTask: Task | null;
  userTasks: UserTask[];
  loading: boolean;
  totalTasks: number;
  totalPages: number;
  currentPage: number;
  fetchTasks: (
    page?: number,
    limit?: number,
    filters?: {
      active?: boolean;
      type?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ) => Promise<void>;
  fetchTaskDetails: (taskId: string) => Promise<void>;
  createTask: (payload: CreateTaskPayload) => Promise<boolean>;
  updateTask: (taskId: string, payload: UpdateTaskPayload) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  fetchUserTasks: () => Promise<void>;
  endUserTask: (userTaskId: string) => Promise<boolean>;
  restartUserTask: (userTaskId: string) => Promise<boolean>;
  deleteUserTask: (userTaskId: string) => Promise<boolean>;
  toggleTaskActive: (task: Task) => Promise<boolean>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const { showAlert } = useAlert();

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const TASK_API_URL = `${API_BASE_URL}/tasks`;
  const USER_TASK_API_URL = `${API_BASE_URL}/user_tasks`;

  // Get admin token from localStorage
  const getAuthHeaders = () => {
    const admin_token = localStorage.getItem("admin_token");
    return {
      headers: {
        Authorization: `Bearer ${admin_token}`,
      },
    };
  };

  // Fetch tasks list with optional filters and pagination
  const fetchTasks = async (
    page: number = 1,
    limit: number = 10,
    filters?: {
      active?: boolean;
      type?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ) => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (filters?.active !== undefined) params.active = filters.active;
      if (filters?.type) params.type = filters.type;
      if (filters?.search) params.search = filters.search;
      if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters?.dateTo) params.dateTo = filters.dateTo;

      const response = await axios.get<{
        msg: string;
        tasks: Task[];
        total: number;
        page: number;
        pages: number;
      }>(TASK_API_URL, {
        ...getAuthHeaders(),
        params,
      });

      setTasks(response.data.tasks);
      setTotalTasks(response.data.total);
      setTotalPages(response.data.pages);
      setCurrentPage(response.data.page);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      showAlert(error.response?.data?.msg || "Failed to fetch tasks", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch single task details
  const fetchTaskDetails = async (taskId: string) => {
    setLoading(true);
    try {
      const response = await axios.get<{ msg: string; task: Task }>(
        `${TASK_API_URL}/${taskId}`,
        getAuthHeaders()
      );

      setCurrentTask(response.data.task);
    } catch (error: any) {
      console.error("Error fetching task details:", error);
      showAlert(
        error.response?.data?.msg || "Failed to fetch task details",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Create a new task
  const createTask = async (payload: CreateTaskPayload): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await axios.post<{ msg: string; task: Task }>(
        TASK_API_URL,
        payload,
        getAuthHeaders()
      );

      showAlert(response.data.msg || "Task created successfully", "success");
      // Refresh tasks list
      await fetchTasks();
      return true;
    } catch (error: any) {
      console.error("Error creating task:", error);
      showAlert(error.response?.data?.msg || "Failed to create task", "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update a task
  const updateTask = async (
    taskId: string,
    payload: UpdateTaskPayload
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await axios.put<{ msg: string; task: Task }>(
        `${TASK_API_URL}/${taskId}`,
        payload,
        getAuthHeaders()
      );

      showAlert(response.data.msg || "Task updated successfully", "success");
      // Refresh tasks list
      await fetchTasks();
      return true;
    } catch (error: any) {
      console.error("Error updating task:", error);
      showAlert(error.response?.data?.msg || "Failed to update task", "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete a task
  const deleteTask = async (taskId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await axios.delete<{ msg: string }>(
        `${TASK_API_URL}/${taskId}`,
        getAuthHeaders()
      );

      showAlert(response.data.msg || "Task deleted successfully", "success");
      // Refresh tasks list
      await fetchTasks();
      return true;
    } catch (error: any) {
      console.error("Error deleting task:", error);
      showAlert(error.response?.data?.msg || "Failed to delete task", "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ===== UserTask Functions =====

  // Fetch all user tasks (admin)
  const fetchUserTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get<{ msg: string; tasks: UserTask[] }>(
        `${USER_TASK_API_URL}/admin/all`,
        getAuthHeaders()
      );
      setUserTasks(response.data.tasks);
    } catch (error: any) {
      console.error("Error fetching user tasks:", error);
      showAlert(
        error.response?.data?.msg || "Failed to fetch user tasks",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Admin: End/complete a user task
  const endUserTask = async (userTaskId: string) => {
    setLoading(true);
    try {
      const response = await axios.patch<{ msg: string }>(
        `${USER_TASK_API_URL}/admin/usertasks/end`,
        { id: userTaskId },
        getAuthHeaders()
      );

      showAlert(response.data.msg || "User task ended successfully", "success");
      // Refresh user tasks list
      await fetchUserTasks();
      return true;
    } catch (error: any) {
      console.error("Error ending user task:", error);
      showAlert(
        error.response?.data?.msg || "Failed to end user task",
        "error"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Admin: Restart a user task (set progress/status back to in_progress)
  const restartUserTask = async (userTaskId: string) => {
    setLoading(true);
    try {
      const response = await axios.patch<{ msg: string }>(
        `${USER_TASK_API_URL}/admin/usertasks/restart`,
        { id: userTaskId },
        getAuthHeaders()
      );
      showAlert(response.data.msg || "User task restarted", "success");
      await fetchUserTasks();
      return true;
    } catch (error: any) {
      console.error("Error restarting user task:", error);
      showAlert(
        error.response?.data?.msg || "Failed to restart user task",
        "error"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Admin: Delete a user task
  const deleteUserTask = async (userTaskId: string) => {
    setLoading(true);
    try {
      const response = await axios.delete<{ msg: string }>(
        `${USER_TASK_API_URL}/admin/usertasks`,
        {
          ...getAuthHeaders(),
          data: { id: userTaskId },
        }
      );

      showAlert(
        response.data.msg || "User task deleted successfully",
        "success"
      );
      // Refresh user tasks list
      await fetchUserTasks();
      return true;
    } catch (error: any) {
      console.error("Error deleting user task:", error);
      showAlert(
        error.response?.data?.msg || "Failed to delete user task",
        "error"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Admin: Toggle task active status
  const toggleTaskActive = async (task: Task) => {
    setLoading(true);
    try {
      const response = await axios.put<{ msg: string; task: Task }>(
        `${TASK_API_URL}/${task._id}`,
        { active: !task.active },
        getAuthHeaders()
      );
      showAlert(
        response.data.msg ||
          `Task ${task.active ? "deactivated" : "activated"} successfully`,
        "success"
      );
      await fetchTasks();
      return true;
    } catch (error: any) {
      console.error("Error toggling task active status:", error);
      showAlert(
        error.response?.data?.msg || "Failed to toggle task active status",
        "error"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value: TaskContextType = {
    tasks,
    currentTask,
    userTasks,
    loading,
    totalTasks,
    totalPages,
    currentPage,
    fetchTasks,
    fetchTaskDetails,
    createTask,
    updateTask,
    deleteTask,
    fetchUserTasks,
    endUserTask,
    restartUserTask,
    deleteUserTask,
    toggleTaskActive,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
};
