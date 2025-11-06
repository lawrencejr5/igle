"use client";

import { useEffect } from "react";
import Image from "next/image";
import { IoClose } from "react-icons/io5";
import {
  MdPerson,
  MdDirectionsCar,
  MdLocationOn,
  MdWarning,
} from "react-icons/md";
import { Report } from "../data/reports";

interface ReportDetailsModalProps {
  report: Report;
  onClose: () => void;
}

const ReportDetailsModal = ({ report, onClose }: ReportDetailsModalProps) => {
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

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "new":
        return "status status--new";
      case "investigating":
        return "status status--investigating";
      case "resolved":
        return "status status--resolved";
      case "dismissed":
        return "status status--dismissed";
      default:
        return "status";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "new":
        return "🆕";
      case "investigating":
        return "🔍";
      case "resolved":
        return "✅";
      case "dismissed":
        return "❌";
      default:
        return "📋";
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <IoClose />
        </button>

        <div className="modal-header">
          <h2>Report Details</h2>
          <div className="modal-header__meta">
            <span className="modal-id">Report ID: {report._id}</span>
            <span className={getStatusClass(report.status)}>
              {getStatusIcon(report.status)} {report.status}
            </span>
          </div>
        </div>

        <div className="modal-body">
          {/* Reporter Information */}
          <section className="modal-section">
            <h3 className="modal-section__title">
              <MdPerson /> Reporter Information
            </h3>
            <div className="modal-section__content">
              {report.anonymous ? (
                <div className="info-row">
                  <span className="info-label">Reporter:</span>
                  <span className="anonymous-badge">Anonymous Report</span>
                </div>
              ) : report.reporter ? (
                <>
                  <div className="user-info-row">
                    <Image
                      src={report.reporter.avatar}
                      alt={report.reporter.fullname}
                      width={48}
                      height={48}
                      className="user-avatar--large"
                    />
                    <div>
                      <div className="info-row">
                        <span className="info-label">Name:</span>
                        <span className="info-value">
                          {report.reporter.fullname}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">User ID:</span>
                        <span className="info-value info-value--muted">
                          {report.reporter._id}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="info-row">
                  <span className="info-label">Reporter:</span>
                  <span className="text-muted">Not available</span>
                </div>
              )}
            </div>
          </section>

          {/* Driver Information */}
          <section className="modal-section">
            <h3 className="modal-section__title">
              <MdDirectionsCar /> Reported Driver
            </h3>
            <div className="modal-section__content">
              <div className="user-info-row">
                <Image
                  src={report.driver.avatar}
                  alt={report.driver.fullname}
                  width={48}
                  height={48}
                  className="user-avatar--large"
                />
                <div>
                  <div className="info-row">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{report.driver.fullname}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Driver ID:</span>
                    <span className="info-value info-value--muted">
                      {report.driver._id}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Ride Information */}
          {report.ride && (
            <section className="modal-section">
              <h3 className="modal-section__title">
                <MdLocationOn /> Associated Ride
              </h3>
              <div className="modal-section__content">
                <div className="info-row">
                  <span className="info-label">Ride ID:</span>
                  <span className="ride-id">{report.ride._id}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Pickup:</span>
                  <span className="info-value">{report.ride.pickup}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Destination:</span>
                  <span className="info-value">{report.ride.destination}</span>
                </div>
              </div>
            </section>
          )}

          {/* Report Details */}
          <section className="modal-section">
            <h3 className="modal-section__title">
              <MdWarning /> Report Details
            </h3>
            <div className="modal-section__content">
              <div className="info-row">
                <span className="info-label">Category:</span>
                <span className="report-category">{report.category}</span>
              </div>
              <div className="info-row info-row--column">
                <span className="info-label">Description:</span>
                <div className="report-description-full">
                  {report.description || "No description provided"}
                </div>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="modal-section">
            <h3 className="modal-section__title">Timeline</h3>
            <div className="modal-section__content">
              <div className="info-row">
                <span className="info-label">Reported At:</span>
                <span className="info-value">
                  {formatDate(report.createdAt)}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Last Updated:</span>
                <span className="info-value">
                  {formatDate(report.updatedAt)}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailsModal;
