"use client";

import { useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
  requireReason?: boolean;
  reason?: string;
  onReasonChange?: (reason: string) => void;
  reasonPlaceholder?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger",
  requireReason = false,
  reason = "",
  onReasonChange,
  reasonPlaceholder = "Enter reason...",
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getVariantColor = () => {
    switch (variant) {
      case "danger":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      case "info":
        return "#3b82f6";
      default:
        return "#ef4444";
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 12000, // higher than any other modal
      }}
    >
      <div
        className="confirm-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          padding: 24,
          maxWidth: 450,
          width: "90%",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 8,
              color: "#111",
            }}
          >
            {title}
          </h2>
          <p style={{ color: "#666", fontSize: 14, lineHeight: 1.5 }}>
            {message}
          </p>
        </div>

        {requireReason && (
          <div style={{ marginBottom: 16 }}>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange?.(e.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #ddd",
                fontSize: 14,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            marginTop: 24,
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #ddd",
              backgroundColor: "white",
              color: "#333",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={requireReason && !reason.trim()}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              backgroundColor:
                requireReason && !reason.trim() ? "#ccc" : getVariantColor(),
              color: "white",
              cursor: requireReason && !reason.trim() ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 500,
              opacity: requireReason && !reason.trim() ? 0.6 : 1,
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
