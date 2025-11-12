"use client";

import { useState, useRef, useEffect } from "react";
import { FiMoreVertical } from "react-icons/fi";
import { IoEyeOutline, IoRefreshOutline, IoCashOutline } from "react-icons/io5";

interface TransactionActionsMenuProps {
  transactionId: string;
  transactionStatus: string;
  transactionType: string;
  onViewDetails?: (transactionId: string) => void;
  onRetry?: (transactionId: string) => void;
  onRefund?: (transactionId: string) => void;
}

const TransactionActionsMenu = ({
  transactionId,
  transactionStatus,
  transactionType,
  onViewDetails,
  onRetry,
  onRefund,
}: TransactionActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const dropdownHeight = 200;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  // Determine which actions to show based on transaction status and type
  const canRetry = transactionStatus === "failed";
  const canRefund =
    transactionStatus === "success" &&
    (transactionType === "payment" || transactionType === "funding");

  return (
    <div className="action-menu" ref={menuRef}>
      <button
        className="action-menu__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="More actions"
      >
        <FiMoreVertical />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`action-menu__dropdown ${
            openUpward ? "action-menu__dropdown--upward" : ""
          }`}
        >
          <button
            className="action-menu__item"
            onClick={() => handleAction(() => onViewDetails?.(transactionId))}
          >
            <IoEyeOutline />
            <span>View Details</span>
          </button>

          {canRetry && (
            <button
              className="action-menu__item"
              onClick={() => handleAction(() => onRetry?.(transactionId))}
            >
              <IoRefreshOutline />
              <span>Retry Transaction</span>
            </button>
          )}

          {canRefund && (
            <button
              className="action-menu__item action-menu__item--warning"
              onClick={() => handleAction(() => onRefund?.(transactionId))}
            >
              <IoCashOutline />
              <span>Process Refund</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionActionsMenu;
