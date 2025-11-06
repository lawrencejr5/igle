"use client";

import { useState } from "react";
import Image from "next/image";
import { Report } from "../data/reports";
import ReportActionsMenu from "./ReportActionsMenu";
import ReportDetailsModal from "./ReportDetailsModal";
import Pagination from "./Pagination";

interface ReportsTableProps {
  reports: Report[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ReportsTable = ({
  reports,
  currentPage,
  totalPages,
  onPageChange,
}: ReportsTableProps) => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const handleViewDetails = (report: Report) => {
    setSelectedReport(report);
  };

  const handleCloseModal = () => {
    setSelectedReport(null);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
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
                    <span className="anonymous-badge">Anonymous</span>
                  ) : report.reporter ? (
                    <div className="user-cell">
                      <Image
                        src={report.reporter.avatar}
                        alt={report.reporter.fullname}
                        width={32}
                        height={32}
                        className="user-avatar"
                      />
                      <span>{report.reporter.fullname}</span>
                    </div>
                  ) : (
                    <span className="text-muted">N/A</span>
                  )}
                </td>
                <td>
                  <div className="user-cell">
                    <Image
                      src={report.driver.avatar}
                      alt={report.driver.fullname}
                      width={32}
                      height={32}
                      className="user-avatar"
                    />
                    <span>{report.driver.fullname}</span>
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
          report={selectedReport}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default ReportsTable;
