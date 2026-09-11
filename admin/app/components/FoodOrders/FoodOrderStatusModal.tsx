"use client";

import { useEffect, useState } from "react";
import { FoodOrder, FoodOrderStatus } from "../../context/FoodOrderContext";
import { MdClose } from "react-icons/md";

interface FoodOrderStatusModalProps {
  order: FoodOrder;
  onClose: () => void;
  onConfirm: (id: string, status: FoodOrderStatus) => Promise<void>;
}

const ALL_STATUSES: { value: FoodOrderStatus; label: string }[] = [
  { value: "placed", label: "Placed" },
  { value: "preparing", label: "Preparing" },
  { value: "ready_for_pickup", label: "Ready for Pickup" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
];

const FoodOrderStatusModal = ({
  order,
  onClose,
  onConfirm,
}: FoodOrderStatusModalProps) => {
  const [selectedStatus, setSelectedStatus] = useState<FoodOrderStatus>(order.status);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleConfirm = async () => {
    if (selectedStatus === order.status) {
      onClose();
      return;
    }
    setLoading(true);
    await onConfirm(order._id, selectedStatus);
    setLoading(false);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 9500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "min(400px, 95vw)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
              Update Order Status
            </h2>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>
              {order.order_number}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <MdClose size={20} color="#374151" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px" }}>
          <p style={{ fontSize: 13, color: "#374151", marginBottom: 14 }}>
            Current status:{" "}
            <strong style={{ textTransform: "capitalize" }}>
              {order.status.replace(/_/g, " ")}
            </strong>
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ALL_STATUSES.map((s) => (
              <label
                key={s.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid",
                  borderColor:
                    selectedStatus === s.value ? "var(--primary, #4f46e5)" : "#e5e7eb",
                  background:
                    selectedStatus === s.value ? "#eef2ff" : "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: selectedStatus === s.value ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="status"
                  value={s.value}
                  checked={selectedStatus === s.value}
                  onChange={() => setSelectedStatus(s.value)}
                  style={{ accentColor: "var(--primary, #4f46e5)" }}
                />
                {s.label}
                {s.value === order.status && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 11,
                      color: "#9ca3af",
                      fontWeight: 400,
                    }}
                  >
                    current
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            padding: "14px 20px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: "#fff",
              color: "#374151",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || selectedStatus === order.status}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background:
                selectedStatus === order.status ? "#d1d5db" : "var(--primary, #4f46e5)",
              color: "#fff",
              cursor:
                selectedStatus === order.status ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Updating…" : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodOrderStatusModal;
