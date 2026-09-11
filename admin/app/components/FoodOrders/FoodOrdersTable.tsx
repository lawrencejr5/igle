"use client";

import { FoodOrder } from "../../context/FoodOrderContext";
import Pagination from "../Pagination";
import {
  MdVisibility,
  MdEdit,
  MdCancel,
  MdDelete,
} from "react-icons/md";

interface FoodOrdersTableProps {
  orders: FoodOrder[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onView: (order: FoodOrder) => void;
  onEdit: (order: FoodOrder) => void;
  onCancel: (order: FoodOrder) => void;
  onDelete: (order: FoodOrder) => void;
}

const STATUS_LABELS: Record<string, string> = {
  placed: "Placed",
  preparing: "Preparing",
  ready_for_pickup: "Ready",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

const getStatusClass = (status: string) => {
  switch (status) {
    case "delivered":
      return "status-badge--active";
    case "cancelled":
    case "rejected":
      return "status-badge--inactive";
    case "placed":
    case "preparing":
    case "ready_for_pickup":
    case "in_transit":
    default:
      return "status-badge--suspended";
  }
};

const FoodOrdersTable = ({
  orders,
  currentPage,
  totalPages,
  onPageChange,
  onRefresh,
  onView,
  onEdit,
  onCancel,
  onDelete,
}: FoodOrdersTableProps) => {
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const isCancellable = (status: string) =>
    !["delivered", "cancelled", "rejected"].includes(status);

  return (
    <>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Restaurant</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
                  No food orders found
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <span
                      style={{
                        fontWeight: 700,
                        fontFamily: "monospace",
                        fontSize: "0.85rem",
                        color: "var(--color-secondary)",
                      }}
                    >
                      {order.order_number}
                    </span>
                  </td>
                  <td>
                    <div className="user-cell">
                      <div className="user-cell__avatar">
                        {order.customer?.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <span className="user-cell__name">{order.customer?.name || "—"}</span>
                        {order.customer?.phone && (
                          <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                            {order.customer.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="user-cell">
                      {order.restaurant?.logo && (
                        <img
                          src={order.restaurant.logo}
                          alt={order.restaurant.name}
                          className="user-cell__avatar"
                          style={{ borderRadius: 6, objectFit: "cover" }}
                        />
                      )}
                      <span className="user-cell__name">{order.restaurant?.name || "—"}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>{order.items?.length ?? 0}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: "var(--color-secondary)" }}>
                      ₦{order.pricing?.total?.toLocaleString() ?? "—"}
                    </span>
                  </td>
                  <td style={{ textTransform: "capitalize", fontSize: "0.875rem" }}>
                    {order.payment?.method || "—"}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                    {formatDate(order.createdAt)}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                      <button
                        className="action-button"
                        title="View details"
                        onClick={() => onView(order)}
                      >
                        <MdVisibility />
                      </button>
                      <button
                        className="action-button"
                        title="Edit status"
                        onClick={() => onEdit(order)}
                        style={{ color: "#f59e0b" }}
                      >
                        <MdEdit />
                      </button>
                      {isCancellable(order.status) && (
                        <button
                          className="action-button"
                          title="Cancel order"
                          onClick={() => onCancel(order)}
                          style={{ color: "#ef4444" }}
                        >
                          <MdCancel />
                        </button>
                      )}
                      <button
                        className="action-button"
                        title="Delete order"
                        onClick={() => onDelete(order)}
                        style={{ color: "#ef4444" }}
                      >
                        <MdDelete />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
    </>
  );
};

export default FoodOrdersTable;
