"use client";

import { useEffect, useState } from "react";
import { Restaurant, useRestaurantContext } from "../../context/RestaurantContext";
import { useMenuContext, MenuItem, MenuCategory } from "../../context/MenuContext";
import ConfirmModal from "../ConfirmModal";
import {
  MdClose,
  MdCheckCircle,
  MdCancel,
  MdBlock,
  MdDelete,
  MdToggleOn,
  MdToggleOff,
  MdOpenInNew,
  MdLocationOn,
  MdPhone,
  MdEmail,
  MdAccountBalance,
} from "react-icons/md";

interface RestaurantDetailDrawerProps {
  restaurant: Restaurant;
  onClose: () => void;
  onRefresh: () => void;
}

const DAYS_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const RestaurantDetailDrawer = ({
  restaurant,
  onClose,
  onRefresh,
}: RestaurantDetailDrawerProps) => {
  const { approveRestaurant, rejectRestaurant, blockRestaurant, deleteRestaurant } =
    useRestaurantContext();
  const { categories, menuItems, loading: menuLoading, fetchRestaurantMenu, toggleMenuItem, deleteMenuItem, clearMenu } =
    useMenuContext();

  const [activeTab, setActiveTab] = useState<"profile" | "menu">("profile");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Confirm modals
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [menuItemToDelete, setMenuItemToDelete] = useState<MenuItem | null>(null);

  // Load menu when switching to menu tab
  useEffect(() => {
    if (activeTab === "menu") {
      fetchRestaurantMenu(restaurant._id);
    }
  }, [activeTab, restaurant._id]);

  // Set default active category once categories load
  useEffect(() => {
    if (categories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(categories[0]._id);
    }
  }, [categories]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearMenu();
  }, []);

  const itemsForCategory = menuItems.filter(
    (item) => item.category?._id === activeCategoryId
  );

  const handleApprove = async () => {
    await approveRestaurant(restaurant._id);
    onRefresh();
    onClose();
  };

  const handleRejectConfirm = async () => {
    const ok = await rejectRestaurant(restaurant._id, rejectReason);
    if (ok) {
      setShowRejectModal(false);
      onRefresh();
      onClose();
    }
  };

  const handleBlockConfirm = async () => {
    const ok = await blockRestaurant(restaurant._id);
    if (ok) {
      setShowBlockModal(false);
      onRefresh();
    }
  };

  const handleDeleteConfirm = async () => {
    const ok = await deleteRestaurant(restaurant._id);
    if (ok) {
      setShowDeleteModal(false);
      onRefresh();
      onClose();
    }
  };

  const handleToggleItem = async (itemId: string) => {
    await toggleMenuItem(itemId);
  };

  const handleDeleteItemConfirm = async () => {
    if (!menuItemToDelete) return;
    const ok = await deleteMenuItem(menuItemToDelete._id);
    if (ok) setMenuItemToDelete(null);
  };

  const applicationBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      approved: "#16a34a",
      submitted: "#d97706",
      rejected: "#dc2626",
      pending: "#6366f1",
      none: "#9ca3af",
    };
    return (
      <span
        style={{
          background: colorMap[status] || "#9ca3af",
          color: "#fff",
          borderRadius: 20,
          padding: "3px 12px",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 9000,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(680px, 95vw)",
          background: "#fff",
          zIndex: 9100,
          overflowY: "auto",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid #e5e7eb",
            position: "sticky",
            top: 0,
            background: "#fff",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {restaurant.logo && (
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }}
              />
            )}
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                {restaurant.name}
              </h2>
              <div style={{ marginTop: 4 }}>
                {applicationBadge(restaurant.application)}
                {restaurant.is_blocked && (
                  <span
                    style={{
                      marginLeft: 6,
                      background: "#fee2e2",
                      color: "#dc2626",
                      borderRadius: 20,
                      padding: "3px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Blocked
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              borderRadius: 6,
              display: "flex",
            }}
          >
            <MdClose size={22} color="#374151" />
          </button>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "12px 24px",
            borderBottom: "1px solid #e5e7eb",
            flexWrap: "wrap",
          }}
        >
          {restaurant.application === "submitted" && (
            <>
              <button
                onClick={handleApprove}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "#16a34a",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <MdCheckCircle size={16} />
                Approve
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "#dc2626",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <MdCancel size={16} />
                Reject
              </button>
            </>
          )}
          <button
            onClick={() => setShowBlockModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              border: "1px solid #d97706",
              background: restaurant.is_blocked ? "#fff7ed" : "#fff",
              color: "#d97706",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <MdBlock size={16} />
            {restaurant.is_blocked ? "Unblock" : "Block"}
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              border: "1px solid #dc2626",
              background: "#fff",
              color: "#dc2626",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              marginLeft: "auto",
            }}
          >
            <MdDelete size={16} />
            Delete
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e5e7eb",
            padding: "0 24px",
          }}
        >
          {(["profile", "menu"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: "none",
                border: "none",
                padding: "12px 16px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                color: activeTab === tab ? "var(--primary, #4f46e5)" : "#6b7280",
                borderBottom: activeTab === tab ? "2px solid var(--primary, #4f46e5)" : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: "24px", flex: 1 }}>
          {activeTab === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Banner */}
              {restaurant.banner && (
                <img
                  src={restaurant.banner}
                  alt="banner"
                  style={{
                    width: "100%",
                    height: 140,
                    objectFit: "cover",
                    borderRadius: 10,
                  }}
                />
              )}

              {/* Basic Info */}
              <Section title="Basic Information">
                {restaurant.description && (
                  <InfoRow label="Description" value={restaurant.description} />
                )}
                <InfoRow
                  label="Category Tags"
                  value={restaurant.category_tags.join(", ") || "—"}
                />
                <InfoRow
                  label="Online Status"
                  value={
                    <span
                      style={{
                        color: restaurant.is_online ? "#16a34a" : "#6b7280",
                        fontWeight: 600,
                      }}
                    >
                      {restaurant.is_online ? "● Online" : "○ Offline"}
                    </span>
                  }
                />
                <InfoRow
                  label="Rating"
                  value={`${restaurant.rating?.toFixed(1) ?? "—"} (${restaurant.num_of_reviews ?? 0} reviews)`}
                />
                <InfoRow
                  label="Joined"
                  value={new Date(restaurant.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                />
              </Section>

              {/* Contact */}
              <Section title="Contact">
                <InfoRow icon={<MdPhone size={14} />} label="Phone" value={restaurant.phone} />
                <InfoRow icon={<MdEmail size={14} />} label="Email" value={restaurant.email} />
                {restaurant.user && (
                  <InfoRow label="Owner" value={`${(restaurant.user as any).name} (${(restaurant.user as any).email})`} />
                )}
              </Section>

              {/* Location */}
              <Section title="Location">
                <InfoRow icon={<MdLocationOn size={14} />} label="Address" value={restaurant.location?.address || "—"} />
                <InfoRow label="Landmark" value={restaurant.location?.landmark || "—"} />
                <InfoRow
                  label="Delivery Radius"
                  value={`${restaurant.location?.delivery_radius_km ?? "—"} km`}
                />
              </Section>

              {/* Operating Hours */}
              {restaurant.operating_hours?.length > 0 && (
                <Section title="Operating Hours">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                    {DAYS_ORDER.map((day) => {
                      const h = restaurant.operating_hours.find((d) => d.day === day);
                      return (
                        <div key={day} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                          <span style={{ color: "#374151", fontWeight: 500 }}>{day}</span>
                          <span style={{ color: h?.closed ? "#9ca3af" : "#111827" }}>
                            {h?.closed ? "Closed" : h ? `${h.open} – ${h.close}` : "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* Bank Details */}
              {restaurant.bank?.account_number && (
                <Section title="Bank Details">
                  <InfoRow icon={<MdAccountBalance size={14} />} label="Bank" value={restaurant.bank.bank_name} />
                  <InfoRow label="Account Name" value={restaurant.bank.account_name} />
                  <InfoRow label="Account Number" value={restaurant.bank.account_number} />
                </Section>
              )}

              {/* Verification Docs */}
              <Section title="Verification Documents">
                <InfoRow
                  label="CAC Verified"
                  value={
                    <span style={{ color: restaurant.verification?.is_cac_verified ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                      {restaurant.verification?.is_cac_verified ? "Yes" : "No"}
                    </span>
                  }
                />
                {restaurant.verification?.government_id && (
                  <InfoRow
                    label="Government ID"
                    value={
                      <a
                        href={restaurant.verification.government_id}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#4f46e5" }}
                      >
                        View Document <MdOpenInNew size={13} />
                      </a>
                    }
                  />
                )}
                {restaurant.verification?.cac_document && (
                  <InfoRow
                    label="CAC Document"
                    value={
                      <a
                        href={restaurant.verification.cac_document}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#4f46e5" }}
                      >
                        View Document <MdOpenInNew size={13} />
                      </a>
                    }
                  />
                )}
              </Section>
            </div>
          )}

          {activeTab === "menu" && (
            <div>
              {menuLoading ? (
                <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                  Loading menu…
                </div>
              ) : categories.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                  No menu categories found for this restaurant.
                </div>
              ) : (
                <>
                  {/* Category tabs */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      marginBottom: 20,
                      borderBottom: "1px solid #e5e7eb",
                      paddingBottom: 12,
                    }}
                  >
                    {categories.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() => setActiveCategoryId(cat._id)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 20,
                          border: "none",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          background:
                            activeCategoryId === cat._id
                              ? "var(--primary, #4f46e5)"
                              : "#f3f4f6",
                          color:
                            activeCategoryId === cat._id ? "#fff" : "#374151",
                          transition: "all 0.15s",
                        }}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  {/* Items list */}
                  {itemsForCategory.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}>
                      No items in this category.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {itemsForCategory.map((item) => (
                        <div
                          key={item._id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "12px 14px",
                            borderRadius: 10,
                            border: "1px solid #e5e7eb",
                            background: "#fafafa",
                          }}
                        >
                          {/* Image */}
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{
                                width: 52,
                                height: 52,
                                borderRadius: 8,
                                objectFit: "cover",
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 52,
                                height: 52,
                                borderRadius: 8,
                                background: "#e5e7eb",
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 20,
                              }}
                            >
                              🍽️
                            </div>
                          )}

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>
                              {item.name}
                            </div>
                            {item.description && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#6b7280",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {item.description}
                              </div>
                            )}
                            <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
                              <span style={{ fontWeight: 700, fontSize: 13, color: "#4f46e5" }}>
                                ₦{item.price.toLocaleString()}
                              </span>
                              {item.dietary_flags?.map((flag) => (
                                <span
                                  key={flag}
                                  style={{
                                    background: "#d1fae5",
                                    color: "#065f46",
                                    borderRadius: 10,
                                    padding: "1px 7px",
                                    fontSize: 11,
                                    fontWeight: 500,
                                  }}
                                >
                                  {flag}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            <button
                              title={item.is_available ? "Mark unavailable" : "Mark available"}
                              onClick={() => handleToggleItem(item._id)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 4,
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {item.is_available ? (
                                <MdToggleOn size={28} color="#16a34a" />
                              ) : (
                                <MdToggleOff size={28} color="#9ca3af" />
                              )}
                            </button>
                            <button
                              title="Delete item"
                              onClick={() => setMenuItemToDelete(item)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 4,
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <MdDelete size={18} color="#dc2626" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      <ConfirmModal
        isOpen={showRejectModal}
        title="Reject Restaurant Application"
        message={`Reject the application for "${restaurant.name}"? Please provide a reason.`}
        confirmText="Reject"
        onConfirm={handleRejectConfirm}
        onCancel={() => {
          setShowRejectModal(false);
          setRejectReason("");
        }}
        variant="danger"
        requireReason
        reason={rejectReason}
        onReasonChange={setRejectReason}
        reasonPlaceholder="Enter rejection reason..."
      />

      {/* Block Modal */}
      <ConfirmModal
        isOpen={showBlockModal}
        title={restaurant.is_blocked ? "Unblock Restaurant" : "Block Restaurant"}
        message={`Are you sure you want to ${restaurant.is_blocked ? "unblock" : "block"} "${restaurant.name}"?`}
        confirmText={restaurant.is_blocked ? "Unblock" : "Block"}
        onConfirm={handleBlockConfirm}
        onCancel={() => setShowBlockModal(false)}
        variant="warning"
      />

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Restaurant"
        message={`Permanently delete "${restaurant.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
        variant="danger"
      />

      {/* Menu Item Delete Modal */}
      <ConfirmModal
        isOpen={!!menuItemToDelete}
        title="Delete Menu Item"
        message={`Delete "${menuItemToDelete?.name}" from the menu? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteItemConfirm}
        onCancel={() => setMenuItemToDelete(null)}
        variant="danger"
      />
    </>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div>
    <h3
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 10,
      }}
    >
      {title}
    </h3>
    <div
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {children}
    </div>
  </div>
);

const InfoRow = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) => (
  <div style={{ display: "flex", gap: 12, fontSize: 13 }}>
    <span
      style={{
        color: "#6b7280",
        minWidth: 130,
        display: "flex",
        alignItems: "center",
        gap: 4,
        flexShrink: 0,
      }}
    >
      {icon}
      {label}
    </span>
    <span style={{ color: "#111827", fontWeight: 500, wordBreak: "break-word" }}>
      {value || "—"}
    </span>
  </div>
);

export default RestaurantDetailDrawer;
