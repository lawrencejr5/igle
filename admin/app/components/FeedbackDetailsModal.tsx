"use client";

import { useEffect } from "react";
import { IoClose } from "react-icons/io5";
import {
  MdPerson,
  MdFeedback,
  MdEmail,
  MdPhone,
  MdImage,
  MdBugReport,
  MdLightbulb,
  MdChat,
} from "react-icons/md";
import { Feedback } from "../data/feedbacks";

interface FeedbackDetailsModalProps {
  feedback: Feedback;
  onClose: () => void;
}

const FeedbackDetailsModal = ({
  feedback,
  onClose,
}: FeedbackDetailsModalProps) => {
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return <MdBugReport />;
      case "feature":
        return <MdLightbulb />;
      case "general":
        return <MdChat />;
      default:
        return <MdFeedback />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div
        className="user-details-modal__backdrop user-details-modal__backdrop--open"
        onClick={onClose}
      />
      <div className="user-details-modal user-details-modal--open">
        <div className="user-details-modal__header">
          <h2 className="user-details-modal__title">Feedback Details</h2>
          <button className="user-details-modal__close" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <div className="user-details-modal__content">
          <div className="modal-header__meta">
            <span className="modal-id">Feedback ID: {feedback._id}</span>
            <span className={getTypeClass(feedback.type)}>
              {getTypeIcon(feedback.type)} {feedback.type}
            </span>
          </div>

          {/* User Information */}
          <section className="modal-section">
            <h3 className="modal-section__title">
              <MdPerson /> User Information
            </h3>
            <div className="modal-section__content">
              {feedback.user ? (
                <div className="user-info-row">
                  <div className="modal-avatar">
                    {feedback.user.fullname.charAt(0)}
                  </div>
                  <div>
                    <div className="info-row">
                      <span className="info-label">Name:</span>
                      <span className="info-value">
                        {feedback.user.fullname}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">User ID:</span>
                      <span className="info-value info-value--muted">
                        {feedback.user._id}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="info-row">
                  <span className="anonymous-badge">Anonymous Feedback</span>
                </div>
              )}
            </div>
          </section>

          {/* Feedback Message */}
          <section className="modal-section">
            <h3 className="modal-section__title">
              <MdFeedback /> Feedback Message
            </h3>
            <div className="modal-section__content">
              <div className="feedback-message-full">{feedback.message}</div>
            </div>
          </section>

          {/* Contact Information */}
          {feedback.contact && (
            <section className="modal-section">
              <h3 className="modal-section__title">Contact Information</h3>
              <div className="modal-section__content">
                <div className="info-row">
                  {feedback.contact.includes("@") ? (
                    <>
                      <MdEmail className="info-icon" />
                      <span className="info-label">Email:</span>
                    </>
                  ) : (
                    <>
                      <MdPhone className="info-icon" />
                      <span className="info-label">Phone:</span>
                    </>
                  )}
                  <span className="info-value feedback-contact">
                    {feedback.contact}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Attached Images */}
          {feedback.images && feedback.images.length > 0 && (
            <section className="modal-section">
              <h3 className="modal-section__title">
                <MdImage /> Attached Images ({feedback.images.length})
              </h3>
              <div className="modal-section__content">
                <div className="feedback-images-grid">
                  {feedback.images.map((image, index) => (
                    <div key={index} className="feedback-image-wrapper">
                      <img
                        src={image}
                        alt={`Feedback attachment ${index + 1}`}
                        className="feedback-image"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Metadata */}
          {feedback.metadata && Object.keys(feedback.metadata).length > 0 && (
            <section className="modal-section">
              <h3 className="modal-section__title">Technical Details</h3>
              <div className="modal-section__content">
                {Object.entries(feedback.metadata).map(([key, value]) => (
                  <div key={key} className="info-row">
                    <span className="info-label">
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                      :
                    </span>
                    <span className="info-value info-value--muted">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Timeline */}
          <section className="modal-section">
            <h3 className="modal-section__title">Timeline</h3>
            <div className="modal-section__content">
              <div className="info-row">
                <span className="info-label">Submitted At:</span>
                <span className="info-value">
                  {formatDate(feedback.createdAt)}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Last Updated:</span>
                <span className="info-value">
                  {formatDate(feedback.updatedAt)}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default FeedbackDetailsModal;
