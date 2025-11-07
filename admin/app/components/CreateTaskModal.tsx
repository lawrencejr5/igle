"use client";

import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { TaskType } from "../data/tasks";

interface CreateTaskModalProps {
  onClose: () => void;
}

const CreateTaskModal = ({ onClose }: CreateTaskModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "ride" as TaskType,
    goalCount: 1,
    rewardAmount: 0,
    active: true,
    startAt: "",
    endAt: "",
    terms: "",
    maxPerUser: 1,
    totalBudget: "",
  });

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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : Number(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement API call to create task
    console.log("Creating task:", formData);
    onClose();
  };

  return (
    <>
      <div
        className="user-details-modal__backdrop user-details-modal__backdrop--open"
        onClick={onClose}
      />
      <div className="user-details-modal user-details-modal--open create-task-modal">
        <div className="user-details-modal__header">
          <h2 className="user-details-modal__title">Create New Task</h2>
          <button className="user-details-modal__close" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <div className="user-details-modal__content">
          <form onSubmit={handleSubmit} className="task-form">
            {/* Title */}
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Title <span className="required">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Complete 10 Rides"
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Brief description of the task"
                rows={3}
              />
            </div>

            {/* Type and Goal Count Row */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type" className="form-label">
                  Type <span className="required">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="ride">Ride</option>
                  <option value="delivery">Delivery</option>
                  <option value="streak">Streak</option>
                  <option value="referral">Referral</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="goalCount" className="form-label">
                  Goal Count <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="goalCount"
                  name="goalCount"
                  value={formData.goalCount}
                  onChange={handleChange}
                  className="form-input"
                  min="1"
                  required
                />
              </div>
            </div>

            {/* Reward Amount and Max Per User Row */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="rewardAmount" className="form-label">
                  Reward Amount (₦) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="rewardAmount"
                  name="rewardAmount"
                  value={formData.rewardAmount}
                  onChange={handleChange}
                  className="form-input"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="maxPerUser" className="form-label">
                  Max Per User
                </label>
                <input
                  type="number"
                  id="maxPerUser"
                  name="maxPerUser"
                  value={formData.maxPerUser}
                  onChange={handleChange}
                  className="form-input"
                  min="1"
                />
              </div>
            </div>

            {/* Date Range Row */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startAt" className="form-label">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  id="startAt"
                  name="startAt"
                  value={formData.startAt}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="endAt" className="form-label">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  id="endAt"
                  name="endAt"
                  value={formData.endAt}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            {/* Total Budget */}
            <div className="form-group">
              <label htmlFor="totalBudget" className="form-label">
                Total Budget (₦)
              </label>
              <input
                type="number"
                id="totalBudget"
                name="totalBudget"
                value={formData.totalBudget}
                onChange={handleChange}
                className="form-input"
                min="0"
                placeholder="Optional campaign budget"
              />
            </div>

            {/* Terms */}
            <div className="form-group">
              <label htmlFor="terms" className="form-label">
                Terms & Conditions
              </label>
              <textarea
                id="terms"
                name="terms"
                value={formData.terms}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Additional terms and conditions"
                rows={3}
              />
            </div>

            {/* Active Checkbox */}
            <div className="form-group form-group--checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="checkbox-input"
                />
                <span className="checkbox-text">Active (visible to users)</span>
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="form-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn btn--secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn--primary">
                Create Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateTaskModal;
