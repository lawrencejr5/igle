"use client";

import { useState } from "react";
import { Report } from "../../context/ReportContext";
import ReportActionsMenu from "./ReportActionsMenu";
import ReportDetailsModal from "./ReportDetailsModal";
import Pagination from "../Pagination";
import ConfirmModal from "../ConfirmModal";

interface ReportsTableProps {
  reports: Report[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onUpdateStatus?: (
    reportId: string,
    status: "new" | "investigating" | "resolved" | "dismissed"
  ) => void;
  onDelete?: (reportId: string) => void;
}

const ReportsTable = ({
  reports,
  currentPage,
  totalPages,
  onPageChange,
  onUpdateStatus,
  onDelete,
}: ReportsTableProps) => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleViewDetails = (report: Report) => {
    setSelectedReport(report);
  };

  const handleCloseModal = () => {
    setSelectedReport(null);
  };

  const handleUpdateStatus = (
    report: Report,
    status: "new" | "investigating" | "resolved" | "dismissed"
  ) => {
    if (onUpdateStatus) {
      onUpdateStatus(report._id, status);
    }
  };

  const handleDelete = (report: Report) => {
    setReportToDelete(report);
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (reportToDelete && onDelete) {
      await onDelete(reportToDelete._id);
      setShowConfirmDelete(false);
      setReportToDelete(null);
    }
  };

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

  const getCategoryClass = (category: string) => {
    return "report-category";
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Report ID</th>
              <th>Reporter</th>
              <th>Driver</th>
              <th>Ride ID</th>
              <th>Category</th>
              <th>Description</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report._id}>
                <td>
                  <span className="report-id">{report._id}</span>
                </td>
                <td>
                  {report.anonymous ? (
                    <div className="user-cell user-cell--anonymous">
                      <div className="user-cell__avatar">A</div>
                      <span className="user-cell__name">Anonymous</span>
                    </div>
                  ) : report.reporter ? (
                    <div className="user-cell">
                      <div className="user-cell__avatar">
                        {report.reporter.name.charAt(0)}
                      </div>
                      <span className="user-cell__name">
                        {report.reporter.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted">N/A</span>
                  )}
                </td>
                <td>
                  <div className="user-cell">
                    <div className="user-cell__avatar">
                      {report.driver.user.name.charAt(0)}
                    </div>
                    <span className="user-cell__name">
                      {report.driver.user.name}
                    </span>
                  </div>
                </td>
                <td>
                  {report.ride ? (
                    <span className="ride-id">{report.ride._id}</span>
                  ) : (
                    <span className="text-muted">N/A</span>
                  )}
                </td>
                <td>
                  <span className={getCategoryClass(report.category)}>
                    {report.category}
                  </span>
                </td>
                <td>
                  <div className="report-description">
                    {report.description || "No description provided"}
                  </div>
                </td>
                <td>
                  <span className={getStatusClass(report.status)}>
                    {report.status}
                  </span>
                </td>
                <td>{formatDate(report.createdAt)}</td>
                <td>
                  <ReportActionsMenu
                    report={report}
                    onViewDetails={handleViewDetails}
                    onUpdateStatus={handleUpdateStatus}
                    onDelete={handleDelete}
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

      {selectedReport && (
        <ReportDetailsModal
          report={selectedReport as any}
          onClose={handleCloseModal}
        />
      )}

      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Delete Report"
        message="Are you sure you want to delete this report? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowConfirmDelete(false);
          setReportToDelete(null);
        }}
        variant="danger"
      />
    </>
  );
};

export default ReportsTable;
