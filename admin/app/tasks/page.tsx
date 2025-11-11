"use client";

import { useState, useMemo, useEffect } from "react";
import { IoAdd } from "react-icons/io5";
import DashboardLayout from "../components/DashboardLayout";
import TabSwitcher from "../components/TabSwitcher";
import SearchBar from "../components/SearchBar";
import FilterButton from "../components/FilterButton";
import TasksTable from "../components/TasksTable";
import UserTasksTable from "../components/UserTasksTable";
import CreateTaskModal from "../components/CreateTaskModal";
import FilterDrawer, { FilterValues } from "../components/FilterDrawer";
import { useTaskContext } from "../context/TaskContext";

const TasksPage = () => {
  const [activeTab, setActiveTab] = useState<"tasks" | "userTasks">("tasks");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [taskFilters, setTaskFilters] = useState<FilterValues>({
    status: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "",
  });

  const [userTaskFilters, setUserTaskFilters] = useState<FilterValues>({
    status: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "",
  });

  const [taskTypeFilter, setTaskTypeFilter] = useState<string>("all");
  const [currentTasksPage, setCurrentTasksPage] = useState(1);
  const [currentUserTasksPage, setCurrentUserTasksPage] = useState(1);
  const itemsPerPage = 10;

  const {
    tasks,
    fetchTasks,
    userTasks,
    fetchUserTasks,
    endUserTask,
    deleteUserTask,
  } = useTaskContext();

  // Fetch tasks and user tasks on mount
  useEffect(() => {
    fetchTasks();
    fetchUserTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        !taskFilters.status ||
        (taskFilters.status === "active" && task.active) ||
        (taskFilters.status === "inactive" && !task.active);

      const matchesType =
        taskTypeFilter === "all" || task.type === taskTypeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });

    if (taskFilters.sortBy) {
      filtered.sort((a, b) => {
        if (taskFilters.sortBy === "newest") {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        } else if (taskFilters.sortBy === "oldest") {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        } else if (taskFilters.sortBy === "reward_high") {
          return b.rewardAmount - a.rewardAmount;
        } else if (taskFilters.sortBy === "reward_low") {
          return a.rewardAmount - b.rewardAmount;
        }
        return 0;
      });
    }

    return filtered;
  }, [tasks, searchQuery, taskFilters, taskTypeFilter]);

  const filteredUserTasks = useMemo(() => {
    let filtered = userTasks.filter((userTask) => {
      const matchesSearch =
        userTask.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        userTask.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        userTask.task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        userTask._id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        !userTaskFilters.status || userTask.status === userTaskFilters.status;

      return matchesSearch && matchesStatus;
    });

    if (userTaskFilters.sortBy) {
      filtered.sort((a, b) => {
        if (userTaskFilters.sortBy === "newest") {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        } else if (userTaskFilters.sortBy === "oldest") {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        } else if (userTaskFilters.sortBy === "progress_high") {
          return b.progress / b.task.goalCount - a.progress / a.task.goalCount;
        } else if (userTaskFilters.sortBy === "progress_low") {
          return a.progress / a.task.goalCount - b.progress / b.task.goalCount;
        }
        return 0;
      });
    }

    return filtered;
  }, [userTasks, searchQuery, userTaskFilters]);

  const totalTasksPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = filteredTasks.slice(
    (currentTasksPage - 1) * itemsPerPage,
    currentTasksPage * itemsPerPage
  );

  const totalUserTasksPages = Math.ceil(
    filteredUserTasks.length / itemsPerPage
  );
  const paginatedUserTasks = filteredUserTasks.slice(
    (currentUserTasksPage - 1) * itemsPerPage,
    currentUserTasksPage * itemsPerPage
  );

  const handleTaskFiltersApply = (filters: FilterValues) => {
    setTaskFilters(filters);
    setCurrentTasksPage(1);
  };

  const handleUserTaskFiltersApply = (filters: FilterValues) => {
    setUserTaskFilters(filters);
    setCurrentUserTasksPage(1);
  };

  const handleTabSwitch = (tab: string) => {
    if (tab === "Tasks") {
      setActiveTab("tasks");
    } else {
      setActiveTab("userTasks");
    }
    setSearchQuery("");
    setCurrentTasksPage(1);
    setCurrentUserTasksPage(1);
  };

  const handleDeleteUserTask = async (userTaskId: string) => {
    await deleteUserTask(userTaskId);
  };

  const handleEndUserTask = async (userTaskId: string) => {
    await endUserTask(userTaskId);
  };

  // Check if there are active filters
  const hasActiveFilters = useMemo(() => {
    const currentFilters =
      activeTab === "tasks" ? taskFilters : userTaskFilters;
    return (
      currentFilters.status !== "" ||
      currentFilters.dateFrom !== "" ||
      currentFilters.dateTo !== "" ||
      currentFilters.sortBy !== ""
    );
  }, [activeTab, taskFilters, userTaskFilters]);

  return (
    <DashboardLayout>
      <div className="page">
        <div className="page__header">
          <div className="page__header-main">
            <h1 className="page__title">Tasks Management</h1>
            <p className="page__subtitle">
              Manage challenges and track user progress
            </p>
          </div>
          {activeTab === "tasks" && (
            <button
              className="btn btn--dark btn--with-icon"
              onClick={() => setShowCreateModal(true)}
            >
              <IoAdd />
              <span>Create New Task</span>
            </button>
          )}
        </div>

        <TabSwitcher
          tabs={[
            `Tasks (${tasks.length})`,
            `User Tasks (${filteredUserTasks.length})`,
          ]}
          onTabChange={handleTabSwitch}
        />

        <div className="table-header">
          <FilterButton
            onClick={() => setShowFilters((prev) => !prev)}
            isOpen={showFilters}
            hasActiveFilters={hasActiveFilters}
          />
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={
              activeTab === "tasks"
                ? "Search by task ID, title, or description..."
                : "Search by user, task, or ID..."
            }
          />
        </div>

        <FilterDrawer
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          onApply={
            activeTab === "tasks"
              ? handleTaskFiltersApply
              : handleUserTaskFiltersApply
          }
          currentFilters={activeTab === "tasks" ? taskFilters : userTaskFilters}
          statusOptions={
            activeTab === "tasks"
              ? [
                  { value: "", label: "All Status" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]
              : [
                  { value: "", label: "All Status" },
                  { value: "locked", label: "Locked" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "completed", label: "Completed" },
                  { value: "claimed", label: "Claimed" },
                  { value: "expired", label: "Expired" },
                ]
          }
          sortOptions={
            activeTab === "tasks"
              ? [
                  { value: "", label: "Default" },
                  { value: "newest", label: "Newest First" },
                  { value: "oldest", label: "Oldest First" },
                  { value: "reward_high", label: "Highest Reward" },
                  { value: "reward_low", label: "Lowest Reward" },
                ]
              : [
                  { value: "", label: "Default" },
                  { value: "newest", label: "Newest First" },
                  { value: "oldest", label: "Oldest First" },
                  { value: "progress_high", label: "Highest Progress" },
                  { value: "progress_low", label: "Lowest Progress" },
                ]
          }
          dateLabel="Created"
        />

        <div className="results-info">
          Showing{" "}
          {activeTab === "tasks"
            ? filteredTasks.length
            : filteredUserTasks.length}{" "}
          {activeTab === "tasks" ? "tasks" : "user tasks"}
        </div>

        {activeTab === "tasks" ? (
          <TasksTable
            tasks={paginatedTasks}
            currentPage={currentTasksPage}
            totalPages={totalTasksPages}
            onPageChange={setCurrentTasksPage}
          />
        ) : (
          <UserTasksTable
            userTasks={paginatedUserTasks}
            currentPage={currentUserTasksPage}
            totalPages={totalUserTasksPages}
            onPageChange={setCurrentUserTasksPage}
            onDelete={handleDeleteUserTask}
            onEndTask={handleEndUserTask}
          />
        )}

        {showCreateModal && (
          <CreateTaskModal
            onClose={() => setShowCreateModal(false)}
            onTaskCreated={() => fetchTasks()}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default TasksPage;
