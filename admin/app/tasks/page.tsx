"use client";

import { useState, useMemo, useEffect } from "react";
import { IoAdd } from "react-icons/io5";
import DashboardLayout from "../components/DashboardLayout";
import TabSwitcher from "../components/TabSwitcher";
import SearchBar from "../components/SearchBar";
import FilterButton from "../components/FilterButton";
import TasksTable from "../components/Tasks/TasksTable";
import UserTasksTable from "../components/UserTasks/UserTasksTable";
import CreateTaskModal from "../components/Tasks/CreateTaskModal";
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
    restartUserTask,
    totalPages,
    currentPage,
  } = useTaskContext();

  // Fetch tasks with filters whenever dependencies change
  useEffect(() => {
    if (activeTab === "tasks") {
      const filterParams: any = {};
      if (taskFilters.status === "active") filterParams.active = true;
      if (taskFilters.status === "inactive") filterParams.active = false;
      if (taskTypeFilter !== "all") filterParams.type = taskTypeFilter;
      if (taskFilters.dateFrom) filterParams.dateFrom = taskFilters.dateFrom;
      if (taskFilters.dateTo) filterParams.dateTo = taskFilters.dateTo;
      if (searchQuery.trim()) filterParams.search = searchQuery.trim();

      fetchTasks(currentTasksPage, itemsPerPage, filterParams);
    }
  }, [activeTab, currentTasksPage, searchQuery, taskFilters, taskTypeFilter]);

  // Fetch user tasks on mount
  useEffect(() => {
    if (activeTab === "userTasks") {
      fetchUserTasks();
    }
  }, [activeTab]);

  // Sort tasks (client-side sorting only, filtering is done on backend)
  const displayTasks = useMemo(() => {
    let result = [...tasks];

    if (taskFilters.sortBy) {
      result.sort((a, b) => {
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

    return result;
  }, [tasks, taskFilters.sortBy]);

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

  // Calculate pagination based on which tab is active
  const totalTasksPages =
    activeTab === "tasks"
      ? totalPages
      : Math.ceil(filteredUserTasks.length / itemsPerPage);

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

  const handleRestartUserTask = async (userTaskId: string) => {
    console.log("Restarting user task:", userTaskId);
    await restartUserTask(userTaskId);
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
          activeTab={
            activeTab === "tasks"
              ? `Tasks (${tasks.length})`
              : `User Tasks (${filteredUserTasks.length})`
          }
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
          {activeTab === "tasks" ? tasks.length : filteredUserTasks.length}{" "}
          {activeTab === "tasks" ? "tasks" : "user tasks"}
        </div>

        {activeTab === "tasks" ? (
          <TasksTable
            tasks={displayTasks}
            currentPage={currentTasksPage}
            totalPages={totalTasksPages}
            onPageChange={setCurrentTasksPage}
          />
        ) : (
          <UserTasksTable
            userTasks={paginatedUserTasks}
            currentPage={currentUserTasksPage}
            totalPages={totalTasksPages}
            onPageChange={setCurrentUserTasksPage}
            onDelete={handleDeleteUserTask}
            onEndTask={handleEndUserTask}
            onRestartTask={handleRestartUserTask}
          />
        )}

        {showCreateModal && (
          <CreateTaskModal
            onClose={() => setShowCreateModal(false)}
            onTaskCreated={() => fetchTasks(currentTasksPage, itemsPerPage)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default TasksPage;
