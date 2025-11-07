"use client";

import { useState } from "react";
import { Feedback } from "../data/feedbacks";
import FeedbackActionsMenu from "./FeedbackActionsMenu";
import FeedbackDetailsModal from "./FeedbackDetailsModal";
import Pagination from "./Pagination";

interface FeedbacksTableProps {
  feedbacks: Feedback[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const FeedbacksTable = ({
  feedbacks,
  currentPage,
  totalPages,
  onPageChange,
}: FeedbacksTableProps) => {
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );

  const handleViewDetails = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
  };

  const handleCloseModal = () => {
    setSelectedFeedback(null);
  };

  const getTypeClass = (type: string) => {
    switch (type) {
      case "bug":
        return "feedback-type feedback-type--bug";
      case "feature":
        return "feedback-type feedback-type--feature";
      case "general":
        return "feedback-type feedback-type--general";
      default:
        return "feedback-type";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateMessage = (message: string, maxLength: number = 80) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  return (
    <>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Feedback ID</th>
              <th>User</th>
              <th>Type</th>
              <th>Message</th>
              <th>Contact</th>
              <th>Images</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((feedback) => (
              <tr key={feedback._id}>
                <td>
                  <span className="feedback-id">{feedback._id}</span>
                </td>
                <td>
                  {feedback.user ? (
                    <div className="user-cell">
                      <div className="user-cell__avatar">
                        {feedback.user.fullname.charAt(0)}
                      </div>
                      <span className="user-cell__name">
                        {feedback.user.fullname}
                      </span>
                    </div>
                  ) : (
                    <div className="user-cell user-cell--anonymous">
                      <div className="user-cell__avatar">A</div>
                      <span className="user-cell__name">Anonymous</span>
                    </div>
                  )}
                </td>
                <td>
                  <span className={getTypeClass(feedback.type)}>
                    {feedback.type}
                  </span>
                </td>
                <td>
                  <div className="feedback-message">
                    {truncateMessage(feedback.message)}
                  </div>
                </td>
                <td>
                  {feedback.contact ? (
                    <span className="feedback-contact">{feedback.contact}</span>
                  ) : (
                    <span className="text-muted">N/A</span>
                  )}
                </td>
                <td>
                  {feedback.images && feedback.images.length > 0 ? (
                    <span className="feedback-images-badge">
                      {feedback.images.length} image
                      {feedback.images.length > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-muted">None</span>
                  )}
                </td>
                <td>{formatDate(feedback.createdAt)}</td>
                <td>
                  <FeedbackActionsMenu
                    feedback={feedback}
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

      {selectedFeedback && (
        <FeedbackDetailsModal
          feedback={selectedFeedback}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default FeedbacksTable;
