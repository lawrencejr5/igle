import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URLS } from "../data/constants";
import { useNotificationContext } from "./NotificationContext";
import type {
  RewardInstance,
  RewardStatus,
  ProgressSource,
} from "../types/rewards";

type ServerTask = {
  _id: string;
  title: string;
  description?: string;
  type: "ride" | "delivery" | "streak" | "referral" | "custom";
  goalCount: number;
  rewardAmount: number;
  terms?: string;
  active: boolean;
};

type ServerUserTask = {
  _id: string;
  user: string;
  task: ServerTask; // populated in our API
  progress: number;
  status: RewardStatus; // aligns with our client statuses
  claimedAt?: string | null;
};

type TaskContextType = {
  loading: boolean;
  tasks: RewardInstance[];
  refresh: () => Promise<void>;
  claimTask: (taskId: string) => Promise<boolean>;
};

const TaskContext = createContext<TaskContextType | null>(null);

const typeToSource = (type: ServerTask["type"]): ProgressSource => {
  switch (type) {
    case "ride":
      return "rides_completed";
    case "delivery":
      return "deliveries_completed";
    case "streak":
      return "weekly_streak";
    case "referral":
      return "referrals";
    default:
      return "rides_completed";
  }
};

const typeToIcon = (type: ServerTask["type"]): string => {
  switch (type) {
    case "ride":
      return "🚗";
    case "delivery":
      return "📦";
    case "streak":
      return "🔥";
    case "referral":
      return "👥";
    default:
      return "🎁";
  }
};

const mapToReward = (
  task: ServerTask,
  userTask?: ServerUserTask
): RewardInstance => {
  const progress = userTask?.progress ?? 0;
  const status: RewardStatus =
    userTask?.status ?? (progress > 0 ? "in_progress" : "locked");
  return {
    id: task._id,
    title: task.title,
    description: task.description || "",
    target: task.goalCount,
    source: typeToSource(task.type),
    action: {
      type: "credit_wallet",
      currency: "NGN",
      amount: task.rewardAmount,
    },
    progress,
    status,
    terms: task.terms,
    icon: typeToIcon(task.type),
  };
};

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const { showNotification } = useNotificationContext();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<RewardInstance[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setTasks([]);
        return;
      }

      // Fetch active tasks and user tasks in parallel
      const headers = { Authorization: `Bearer ${token}` };
      const [tasksRes, userTasksRes] = await Promise.all([
        axios.get(`${API_URLS.tasks}?active=true`, { headers }),
        axios.get(`${API_URLS.user_tasks}`, { headers }),
      ]);

      const allTasks: ServerTask[] = tasksRes.data.tasks || [];
      const userTasks: ServerUserTask[] = userTasksRes.data.tasks || [];

      // Build map for quick lookup
      const userMap = new Map<string, ServerUserTask>();
      userTasks.forEach((ut) => {
        if (ut.task?._id) userMap.set(ut.task._id, ut);
      });

      // Combine into RewardInstance[]
      const combined = allTasks.map((t) => mapToReward(t, userMap.get(t._id)));
      // Include any user tasks pointing to tasks that might be inactive but should still be shown (optional)
      // const extras = userTasks
      //   .filter((ut) => !userMap.has(ut.task._id))
      //   .map((ut) => mapToReward(ut.task, ut));

      setTasks(combined);
    } catch (err) {
      console.log("Failed to fetch tasks:", err);
      showNotification("Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const claimTask = async (taskId: string): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${API_URLS.user_tasks}/${taskId}/claim`,
        {},
        { headers }
      );
      // Optimistically update local state
      setTasks((prev) =>
        prev.map((r) => (r.id === taskId ? { ...r, status: "claimed" } : r))
      );
      showNotification("Task claimed", "success");
      return true;
    } catch (err: any) {
      const msg = err?.response?.data?.msg || "Failed to claim task";
      showNotification(msg, "error");
      return false;
    }
  };

  const value = useMemo(
    () => ({ loading, tasks, refresh: fetchData, claimTask }),
    [loading, tasks]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export default TaskProvider;

export const useTaskContext = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("TaskContext must be used within TaskProvider");
  return ctx;
};
