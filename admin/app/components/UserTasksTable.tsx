"use client";

import { UserTask } from "../data/tasks";
import Pagination from "./Pagination";
import UserTaskActionsMenu from "./UserTaskActionsMenu";

interface UserTasksTableProps {
  userTasks: UserTask[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onDelete?: (userTaskId: string) => void;
  onEndTask?: (userTaskId: string) => void;
}

const UserTasksTable = ({
  userTasks,
  currentPage,
  totalPages,
  onPageChange,
  onDelete,
  onEndTask,
}: UserTasksTableProps) => {
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
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
                      {userTask.user.fullname.charAt(0)}
                    </div>
                    <div>
                      <span className="user-cell__name">
                        {userTask.user.fullname}
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
                    onDelete={onDelete}
                    onEndTask={onEndTask}
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
    </>
  );
};

export default UserTasksTable;
