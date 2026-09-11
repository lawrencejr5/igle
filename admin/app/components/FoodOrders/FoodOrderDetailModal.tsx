"use client";

import { useEffect } from "react";
import { FoodOrder } from "../../context/FoodOrderContext";
import { MdClose, MdLocationOn, MdPhone, MdStore } from "react-icons/md";

interface FoodOrderDetailModalProps {
  order: FoodOrder;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  placed: "Placed",
  preparing: "Preparing",
  ready_for_pickup: "Ready for Pickup",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<string, string> = {
  placed: "#6366f1",
  preparing: "#d97706",
  ready_for_pickup: "#ea580c",
  in_transit: "#2563eb",
  delivered: "#16a34a",
  cancelled: "#dc2626",
  rejected: "#dc2626",
};

const FoodOrderDetailModal = ({ order, onClose }: FoodOrderDetailModalProps) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const timestamps = order.status_timestamps || {};
  const timeline = [
    { label: "Placed", time: timestamps.placed_at },
    { label: "Preparing", time: timestamps.preparing_at },
    { label: "Ready for Pickup", time: timestamps.ready_at },
    { label: "In Transit", time: timestamps.in_transit_at },
    { label: "Delivered", time: timestamps.delivered_at },
    { label: "Cancelled", time: timestamps.cancelled_at },
  ].filter((t) => t.time);

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
          width: "min(640px, 95vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 24px",
            borderBottom: "1px solid #e5e7eb",
            position: "sticky",
            top: 0,
            background: "#fff",
            zIndex: 10,
          }}
        >
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
              Order {order.order_number}
            </h2>
            <span
              style={{
                display: "inline-block",
                marginTop: 4,
                padding: "2px 10px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                background: STATUS_COLORS[order.status] + "20",
                color: STATUS_COLORS[order.status],
              }}
            >
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <MdClose size={22} color="#374151" />
          </button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Customer + Restaurant */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card title="Customer">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {order.customer?.profile_pic ? (
                  <img
                    src={order.customer.profile_pic}
                    style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {order.customer?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{order.customer?.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                    <MdPhone size={11} /> {order.customer?.phone || "—"}
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Restaurant">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {order.restaurant?.logo && (
                  <img
                    src={order.restaurant.logo}
                    style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }}
                  />
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{order.restaurant?.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                    <MdPhone size={11} /> {order.restaurant?.phone || order.restaurant_address?.phone || "—"}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Delivery Address */}
          <Card title="Delivery Address">
            <div style={{ display: "flex", gap: 8, fontSize: 13 }}>
              <MdLocationOn size={16} color="#6b7280" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div>{order.delivery_address?.address}</div>
                {order.delivery_address?.landmark && (
                  <div style={{ color: "#6b7280" }}>Landmark: {order.delivery_address.landmark}</div>
                )}
                <div style={{ color: "#6b7280", marginTop: 4 }}>
                  Contact: {order.delivery_address?.contact_name} · {order.delivery_address?.contact_phone}
                </div>
              </div>
            </div>
          </Card>

          {/* Order Items */}
          <Card title={`Items (${order.items?.length})`}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {order.items?.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 13,
                    padding: "6px 0",
                    borderBottom: idx < order.items.length - 1 ? "1px solid #f3f4f6" : "none",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                    <span style={{ color: "#6b7280", marginLeft: 6 }}>×{item.quantity}</span>
                    {item.special_instructions && (
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                        Note: {item.special_instructions}
                      </div>
                    )}
                  </div>
                  <span style={{ fontWeight: 600, color: "#374151" }}>
                    ₦{item.item_total?.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Pricing Breakdown */}
          <Card title="Pricing Breakdown">
            <PriceRow label="Subtotal" value={order.pricing?.subtotal} />
            <PriceRow label="Delivery Fee" value={order.pricing?.delivery_fee} />
            <PriceRow label="Service Fee" value={order.pricing?.service_fee} />
            {order.pricing?.discount > 0 && (
              <PriceRow label="Discount" value={-order.pricing.discount} color="#16a34a" />
            )}
            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                marginTop: 8,
                paddingTop: 8,
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              <span>Total</span>
              <span style={{ color: "#4f46e5" }}>₦{order.pricing?.total?.toLocaleString()}</span>
            </div>
          </Card>

          {/* Payment Info */}
          <Card title="Payment">
            <InfoRow label="Method" value={order.payment?.method?.toUpperCase() || "—"} />
            <InfoRow
              label="Status"
              value={
                <span
                  style={{
                    color: order.payment?.status === "paid" ? "#16a34a" : "#dc2626",
                    fontWeight: 600,
                    textTransform: "capitalize",
                  }}
                >
                  {order.payment?.status || "—"}
                </span>
              }
            />
            <InfoRow label="Reference" value={order.payment?.transaction_reference || "—"} />
          </Card>

          {/* Status Timeline */}
          {timeline.length > 0 && (
            <Card title="Status Timeline">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {timeline.map((t, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 12, fontSize: 13 }}>
                    <span
                      style={{
                        minWidth: 130,
                        color: "#6b7280",
                        fontWeight: 500,
                      }}
                    >
                      {t.label}
                    </span>
                    <span style={{ color: "#111827" }}>{formatDate(t.time)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Cancellation Info */}
          {order.cancellation?.reason && (
            <Card title="Cancellation">
              <InfoRow
                label="Cancelled by"
                value={
                  <span style={{ textTransform: "capitalize" }}>
                    {order.cancellation.cancelled_by}
                  </span>
                }
              />
              <InfoRow label="Reason" value={order.cancellation.reason} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div
    style={{
      border: "1px solid #e5e7eb",
      borderRadius: 10,
      padding: "14px 16px",
    }}
  >
    <h4
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: "#9ca3af",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 10,
      }}
    >
      {title}
    </h4>
    {children}
  </div>
);

const PriceRow = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      fontSize: 13,
      color: color || "#374151",
    }}
  >
    <span style={{ color: "#6b7280" }}>{label}</span>
    <span>₦{Math.abs(value)?.toLocaleString()}</span>
  </div>
);

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div style={{ display: "flex", gap: 12, fontSize: 13 }}>
    <span style={{ color: "#6b7280", minWidth: 110, flexShrink: 0 }}>{label}</span>
    <span style={{ color: "#111827", fontWeight: 500 }}>{value || "—"}</span>
  </div>
);

export default FoodOrderDetailModal;
