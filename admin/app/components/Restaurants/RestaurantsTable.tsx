"use client";

import { useState } from "react";
import { Restaurant, useRestaurantContext } from "../../context/RestaurantContext";
import Pagination from "../Pagination";
import ConfirmModal from "../ConfirmModal";
import RestaurantActionsMenu from "./RestaurantActionsMenu";

interface RestaurantsTableProps {
  restaurants: Restaurant[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onRowClick: (id: string) => void;
}

const getApplicationBadgeClass = (status: string) => {
  switch (status) {
    case "approved":
      return "status-badge--active";
    case "submitted":
      return "status-badge--suspended";
    case "rejected":
      return "status-badge--inactive";
    default:
      return "status-badge--inactive";
  }
};

const RestaurantsTable = ({
  restaurants,
  currentPage,
  totalPages,
  onPageChange,
  onRefresh,
  onRowClick,
}: RestaurantsTableProps) => {
  const { approveRestaurant, rejectRestaurant, blockRestaurant, deleteRestaurant } =
    useRestaurantContext();

  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [blockModal, setBlockModal] = useState<{ id: string; name: string; blocked: boolean } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);

  const handleApprove = async (id: string) => {
    await approveRestaurant(id);
    onRefresh();
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    const ok = await rejectRestaurant(rejectModal.id, rejectReason);
    if (ok) {
      setRejectModal(null);
      setRejectReason("");
      onRefresh();
    }
  };

  const handleBlockConfirm = async () => {
    if (!blockModal) return;
    const ok = await blockRestaurant(blockModal.id);
    if (ok) {
      setBlockModal(null);
      onRefresh();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;
    const ok = await deleteRestaurant(deleteModal.id);
    if (ok) {
      setDeleteModal(null);
      onRefresh();
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Restaurant</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Status</th>
              <th>Online</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
                  No restaurants found
                </td>
              </tr>
            ) : (
              restaurants.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div
                      className="user-cell"
                      onClick={() => onRowClick(r._id)}
                      style={{ cursor: "pointer" }}
                    >
                      {r.logo ? (
                        <img
                          src={r.logo}
                          alt={r.name}
                          className="user-cell__avatar"
                          style={{ objectFit: "cover", borderRadius: 8 }}
                        />
                      ) : (
                        <div className="user-cell__avatar">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="user-cell__name">
                        {r.name}
                      </span>
                    </div>
                  </td>
                  <td>{r.phone}</td>
                  <td style={{ fontSize: "0.85rem" }}>{r.email}</td>
                  <td>
                    <span className={`status-badge ${getApplicationBadgeClass(r.application)}`}>
                      {r.application.charAt(0).toUpperCase() + r.application.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        r.is_online ? "status-badge--active" : "status-badge--inactive"
                      }`}
                    >
                      {r.is_online ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                    {formatDate(r.createdAt)}
                  </td>
                  <td>
                    <RestaurantActionsMenu
                      restaurantId={r._id}
                      applicationStatus={r.application}
                      isBlocked={r.is_blocked}
                      onViewDetails={onRowClick}
                      onApprove={handleApprove}
                      onReject={(id) => setRejectModal({ id, name: r.name })}
                      onBlock={(id) => setBlockModal({ id, name: r.name, blocked: !!r.is_blocked })}
                      onDelete={(id) => setDeleteModal({ id, name: r.name })}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />

      <ConfirmModal
        isOpen={!!rejectModal}
        title="Reject Restaurant"
        message={`Reject the application for "${rejectModal?.name}"? Please provide a reason.`}
        confirmText="Reject"
        onConfirm={handleRejectConfirm}
        onCancel={() => { setRejectModal(null); setRejectReason(""); }}
        variant="danger"
        requireReason
        reason={rejectReason}
        onReasonChange={setRejectReason}
        reasonPlaceholder="Enter rejection reason..."
      />

      <ConfirmModal
        isOpen={!!blockModal}
        title={blockModal?.blocked ? "Unblock Restaurant" : "Block Restaurant"}
        message={`Are you sure you want to ${blockModal?.blocked ? "unblock" : "block"} "${blockModal?.name}"?`}
        confirmText={blockModal?.blocked ? "Unblock" : "Block"}
        onConfirm={handleBlockConfirm}
        onCancel={() => setBlockModal(null)}
        variant="warning"
      />

      <ConfirmModal
        isOpen={!!deleteModal}
        title="Delete Restaurant"
        message={`Permanently delete "${deleteModal?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal(null)}
        variant="danger"
      />
    </>
  );
};

export default RestaurantsTable;
