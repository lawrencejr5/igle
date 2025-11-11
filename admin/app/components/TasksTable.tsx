"use client";

import { useState } from "react";
import { Task } from "../context/TaskContext";
import TaskActionsMenu from "./TaskActionsMenu";
import TaskDetailsModal from "./TaskDetailsModal";
import Pagination from "./Pagination";

interface TasksTableProps {
  tasks: Task[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const TasksTable = ({
  tasks,
  currentPage,
  totalPages,
  onPageChange,
}: TasksTableProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
  };

  const getTypeClass = (type: string) => {
    switch (type) {
      case "ride":
        return "task-type task-type--ride";
      case "delivery":
        return "task-type task-type--delivery";
      case "streak":
        return "task-type task-type--streak";
      case "referral":
        return "task-type task-type--referral";
      case "custom":
        return "task-type task-type--custom";
      default:
        return "task-type";
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "No limit";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Task ID</th>
              <th>Title</th>
              <th>Type</th>
              <th>Goal</th>
              <th>Reward</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Max/User</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task._id}>
                <td>
                  <span className="task-id">{task._id}</span>
                </td>
                <td>
                  <div className="task-title">{task.title}</div>
                </td>
                <td>
                  <span className={getTypeClass(task.type)}>{task.type}</span>
                </td>
                <td>
                  <span className="task-goal">{task.goalCount}</span>
                </td>
                <td>
                  <span className="task-reward">
                    {formatCurrency(task.rewardAmount)}
                  </span>
                </td>
                <td>
                  <span
                    className={`task-status ${
                      task.active
                        ? "task-status--active"
                        : "task-status--inactive"
                    }`}
                  >
                    {task.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{formatDate(task.startAt)}</td>
                <td>{formatDate(task.endAt)}</td>
                <td>
                  <span className="task-max-user">
                    {task.maxPerUser || "∞"}
                  </span>
                </td>
                <td>
                  <TaskActionsMenu
                    task={task}
                    onViewDetails={handleViewDetails}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}

      {selectedTask && (
        <TaskDetailsModal task={selectedTask} onClose={handleCloseModal} />
      )}
    </>
  );
};

export default TasksTable;
