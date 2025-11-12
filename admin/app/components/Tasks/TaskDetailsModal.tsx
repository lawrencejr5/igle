"use client";

import { useEffect } from "react";
import { IoClose } from "react-icons/io5";
import {
  MdTask,
  MdTrendingUp,
  MdAttachMoney,
  MdCalendarToday,
  MdPeople,
  MdDescription,
} from "react-icons/md";
import { Task } from "../../context/TaskContext";

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
}

const TaskDetailsModal = ({ task, onClose }: TaskDetailsModalProps) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

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
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
      <div
        className="user-details-modal__backdrop user-details-modal__backdrop--open"
        onClick={onClose}
      />
      <div className="user-details-modal user-details-modal--open">
        <div className="user-details-modal__header">
          <h2 className="user-details-modal__title">Task Details</h2>
          <button className="user-details-modal__close" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <div className="user-details-modal__content">
          <div className="modal-header__meta">
            <span className="modal-id">Task ID: {task._id}</span>
            <span className={getTypeClass(task.type)}>{task.type}</span>
            <span
              className={`task-status ${
                task.active ? "task-status--active" : "task-status--inactive"
              }`}
            >
              {task.active ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Basic Information */}
          <section className="modal-section">
            <h3 className="modal-section__title">
              <MdTask /> Task Information
            </h3>
            <div className="modal-section__content">
              <div className="info-row">
                <span className="info-label">Title:</span>
                <span className="info-value">{task.title}</span>
              </div>
              {task.description && (
                <div className="info-row info-row--column">
                  <span className="info-label">Description:</span>
                  <div className="task-description-full">
                    {task.description}
                  </div>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Type:</span>
                <span className={getTypeClass(task.type)}>{task.type}</span>
              </div>
            </div>
          </section>

          {/* Goal & Rewards */}
          <section className="modal-section">
            <h3 className="modal-section__title">
              <MdTrendingUp /> Goal & Rewards
            </h3>
            <div className="modal-section__content">
              <div className="info-row">
                <span className="info-label">Goal Count:</span>
                <span className="info-value task-goal-highlight">
                  {task.goalCount} {task.type}(s)
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Reward Amount:</span>
                <span className="info-value task-reward-highlight">
                  {formatCurrency(task.rewardAmount)}
                </span>
              </div>
              {task.totalBudget && (
                <div className="info-row">
                  <span className="info-label">Total Budget:</span>
                  <span className="info-value">
                    {formatCurrency(task.totalBudget)}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Availability */}
          <section className="modal-section">
            <h3 className="modal-section__title">
              <MdCalendarToday /> Availability
            </h3>
            <div className="modal-section__content">
              <div className="info-row">
                <span className="info-label">Start Date:</span>
                <span className="info-value">{formatDate(task.startAt)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">End Date:</span>
                <span className="info-value">{formatDate(task.endAt)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Created At:</span>
                <span className="info-value">{formatDate(task.createdAt)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Last Updated:</span>
                <span className="info-value">{formatDate(task.updatedAt)}</span>
              </div>
            </div>
          </section>

          {/* User Limits */}
          <section className="modal-section">
            <h3 className="modal-section__title">
              <MdPeople /> User Limits
            </h3>
            <div className="modal-section__content">
              <div className="info-row">
                <span className="info-label">Max Per User:</span>
                <span className="info-value">
                  {task.maxPerUser ? `${task.maxPerUser} time(s)` : "Unlimited"}
                </span>
              </div>
            </div>
          </section>

          {/* Terms & Conditions */}
          {task.terms && (
            <section className="modal-section">
              <h3 className="modal-section__title">
                <MdDescription /> Terms & Conditions
              </h3>
              <div className="modal-section__content">
                <div className="task-terms-full">{task.terms}</div>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export default TaskDetailsModal;
