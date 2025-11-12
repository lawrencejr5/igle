"use client";

import { useState } from "react";
import { UserTask } from "../../context/TaskContext";
import Pagination from "../Pagination";
import UserTaskActionsMenu from "./UserTaskActionsMenu";
import ConfirmModal from "../ConfirmModal";

interface UserTasksTableProps {
  userTasks: UserTask[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onDelete?: (userTaskId: string) => void;
  onEndTask?: (userTaskId: string) => void;
  onRestartTask?: (userTaskId: string) => void;
}

const UserTasksTable = ({
  userTasks,
  currentPage,
  totalPages,
  onPageChange,
  onDelete,
  onEndTask,
  onRestartTask,
}: UserTasksTableProps) => {
  const [userTaskToDelete, setUserTaskToDelete] = useState<UserTask | null>(
    null
  );
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [userTaskToEnd, setUserTaskToEnd] = useState<UserTask | null>(null);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [userTaskToRestart, setUserTaskToRestart] = useState<UserTask | null>(
    null
  );
  const [showConfirmRestart, setShowConfirmRestart] = useState(false);

  const handleDelete = (userTask: UserTask) => {
    setUserTaskToDelete(userTask);
    setShowConfirmDelete(true);
  };
  const handleEnd = (userTask: UserTask) => {
    setUserTaskToEnd(userTask);
    setShowConfirmEnd(true);
  };
  const handleRestart = (userTask: UserTask) => {
    setUserTaskToRestart(userTask);
    setShowConfirmRestart(true);
  };

  const handleConfirmDelete = async () => {
    if (userTaskToDelete && onDelete) {
      await onDelete(userTaskToDelete._id);
      setShowConfirmDelete(false);
      setUserTaskToDelete(null);
    }
  };
  const handleConfirmEnd = async () => {
    if (userTaskToEnd && onEndTask) {
      await onEndTask(userTaskToEnd._id);
      setShowConfirmEnd(false);
      setUserTaskToEnd(null);
    }
  };
  const handleConfirmRestart = async () => {
    if (userTaskToRestart && onRestartTask) {
      await onRestartTask(userTaskToRestart._id);
    }
    setShowConfirmRestart(false);
    setUserTaskToRestart(null);
  };
  const getStatusClass = (status: string) => {
    switch (status) {
      case "locked":
        return "user-task-status user-task-status--locked";
      case "in_progress":
        return "user-task-status user-task-status--in-progress";
      case "completed":
        return "user-task-status user-task-status--completed";
      case "claimed":
        return "user-task-status user-task-status--claimed";
      case "expired":
        return "user-task-status user-task-status--expired";
      default:
        return "user-task-status";
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateProgress = (progress: number, goalCount: number) => {
    return Math.min((progress / goalCount) * 100, 100);
  };

  return (
    <>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User Task ID</th>
              <th>User</th>
              <th>Task</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Claimed At</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {userTasks.map((userTask) => (
              <tr key={userTask._id}>
                <td>
                  <span className="user-task-id">{userTask._id}</span>
                </td>
                <td>
                  <div className="user-cell">
                    <div className="user-cell__avatar">
                      {userTask.user.name.charAt(0)}
                    </div>
                    <div>
                      <span className="user-cell__name">
                        {userTask.user.name}
                      </span>
                      <span className="user-cell__email">
                        {userTask.user.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="task-info">
                    <div className="task-info__title">
                      {userTask.task.title}
                    </div>
                    <div className="task-info__meta">
                      <span className="task-id">{userTask.task._id}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="progress-container">
                    <div className="progress-text">
                      {userTask.progress} / {userTask.task.goalCount}
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar__fill"
                        style={{
                          width: `${calculateProgress(
                            userTask.progress,
                            userTask.task.goalCount
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <div className="progress-percentage">
                      {calculateProgress(
                        userTask.progress,
                        userTask.task.goalCount
                      ).toFixed(0)}
                      %
                    </div>
                  </div>
                </td>
                <td>
                  <span className={getStatusClass(userTask.status)}>
                    {userTask.status.replace("_", " ")}
                  </span>
                </td>
                <td>{formatDate(userTask.claimedAt)}</td>
                <td>{formatDate(userTask.createdAt)}</td>
                <td>
                  <UserTaskActionsMenu
                    userTask={userTask}
                    onDelete={() => handleDelete(userTask)}
                    onEndTask={() => handleEnd(userTask)}
                    onRestartTask={() => handleRestart(userTask)}
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
      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Delete User Task"
        message="Are you sure you want to delete this user task? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowConfirmDelete(false);
          setUserTaskToDelete(null);
        }}
        variant="danger"
      />
      <ConfirmModal
        isOpen={showConfirmEnd}
        title="End User Task"
        message="Are you sure you want to end this user task? This will mark it as completed or expired."
        confirmText="End Task"
        cancelText="Cancel"
        onConfirm={handleConfirmEnd}
        onCancel={() => {
          setShowConfirmEnd(false);
          setUserTaskToEnd(null);
        }}
        variant="warning"
      />
      <ConfirmModal
        isOpen={showConfirmRestart}
        title="Restart User Task"
        message="Are you sure you want to restart this user task? This will reset its progress."
        confirmText="Restart"
        cancelText="Cancel"
        onConfirm={handleConfirmRestart}
        onCancel={() => {
          setShowConfirmRestart(false);
          setUserTaskToRestart(null);
        }}
        variant="info"
      />
    </>
  );
};

export default UserTasksTable;
