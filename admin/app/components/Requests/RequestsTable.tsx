"use client";

import { useState } from "react";
import ConfirmModal from "../ConfirmModal";
import { DriverRequest } from "../../data/requests";
import Pagination from "../Pagination";
import RequestDetailsModal from "./RequestDetailsModal";

interface RequestsTableProps {
  requests: DriverRequest[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onApprove?: (requestId: string) => void;
  onDecline?: (requestId: string) => void;
  onRefresh?: () => void;
}

const RequestsTable = ({
  requests,
  currentPage,
  totalPages,
  onPageChange,
  onApprove,
  onDecline,
  onRefresh,
}: RequestsTableProps) => {
  const [selectedRequest, setSelectedRequest] = useState<DriverRequest | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<"approve" | "decline" | null>(
    null
  );
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  const handleViewDetails = (requestId: string) => {
    const request = requests.find((r) => r.id === requestId);
    if (request) {
      setSelectedRequest(request);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedRequest(null);
    }, 300); // Wait for animation to complete
  };

  const handleApprove = (requestId: string) => {
    setConfirmType("approve");
    setPendingRequestId(requestId);
  };

  const handleDecline = (requestId: string) => {
    setConfirmType("decline");
    setPendingRequestId(requestId);
  };

  const handleConfirm = async () => {
    if (!pendingRequestId) return;
    if (confirmType === "approve" && onApprove) {
      await onApprove(pendingRequestId);
      handleCloseModal();
      if (onRefresh) onRefresh();
    } else if (confirmType === "decline" && onDecline) {
      await onDecline(pendingRequestId);
      handleCloseModal();
      if (onRefresh) onRefresh();
    }
    setConfirmType(null);
    setPendingRequestId(null);
  };

  const handleCancel = () => {
    setConfirmType(null);
    setPendingRequestId(null);
  };

  return (
    <>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Vehicle</th>
              <th>Request Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>
                  <div className="user-cell">
                    <div className="user-cell__avatar">
                      {request.fullname.charAt(0)}
                    </div>
                    <span className="user-cell__name">{request.fullname}</span>
                  </div>
                </td>
                <td>{request.email}</td>
                <td>{request.phone}</td>
                <td>
                  <span className="vehicle-info">
                    <span className="vehicle-info__type">
                      {request.vehicleType}
                    </span>
                    <span className="vehicle-info__name">
                      ({request.vehicleName})
                    </span>
                  </span>
                </td>
                <td>{new Date(request.requestDate).toLocaleDateString()}</td>
                <td>
                  <div className="request-actions">
                    <button
                      className="request-actions__button request-actions__button--view"
                      type="button"
                      onClick={() => handleViewDetails(request.id)}
                      title="View Details"
                      style={{ zIndex: 2 }}
                    >
                      View
                    </button>
                    <button
                      className="request-actions__button request-actions__button--approve"
                      type="button"
                      onClick={() => handleApprove(request.id)}
                      title="Approve Request"
                      style={{ zIndex: 2 }}
                    >
                      Approve
                    </button>
                    <button
                      className="request-actions__button request-actions__button--decline"
                      type="button"
                      onClick={() => handleDecline(request.id)}
                      title="Decline Request"
                      style={{ zIndex: 2 }}
                    >
                      Decline
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <RequestDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        request={selectedRequest}
        onApprove={handleApprove}
        onDecline={handleDecline}
      />
      <ConfirmModal
        isOpen={!!confirmType}
        title={
          confirmType === "approve"
            ? "Approve Application"
            : "Decline Application"
        }
        message={
          confirmType === "approve"
            ? "Are you sure you want to approve this driver application?"
            : "Are you sure you want to decline this driver application?"
        }
        confirmText={confirmType === "approve" ? "Approve" : "Decline"}
        cancelText="Cancel"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        variant={confirmType === "approve" ? "info" : "danger"}
      />
    </>
  );
};

export default RequestsTable;
