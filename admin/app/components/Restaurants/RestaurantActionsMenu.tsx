"use client";

import { useState, useRef, useEffect } from "react";
import { FiMoreVertical } from "react-icons/fi";
import {
  IoEyeOutline,
  IoTrashOutline,
  IoBanOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
} from "react-icons/io5";

interface RestaurantActionsMenuProps {
  restaurantId: string;
  applicationStatus: string;
  isBlocked?: boolean;
  onViewDetails: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onBlock: (id: string) => void;
  onDelete: (id: string) => void;
}

const RestaurantActionsMenu = ({
  restaurantId,
  applicationStatus,
  isBlocked = false,
  onViewDetails,
  onApprove,
  onReject,
  onBlock,
  onDelete,
}: RestaurantActionsMenuProps) => {
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
      const dropdownHeight = 220;
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

  return (
    <div className="action-menu" ref={menuRef}>
      <button
        className="action-menu__trigger"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
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
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="action-menu__item"
            onClick={() => handleAction(() => onViewDetails(restaurantId))}
          >
            <IoEyeOutline />
            <span>View Details</span>
          </button>

          {applicationStatus === "submitted" && (
            <>
              {onApprove && (
                <button
                  className="action-menu__item"
                  style={{ color: "#10b981" }}
                  onClick={() => handleAction(() => onApprove(restaurantId))}
                >
                  <IoCheckmarkCircleOutline />
                  <span>Approve Application</span>
                </button>
              )}
              {onReject && (
                <button
                  className="action-menu__item action-menu__item--danger"
                  onClick={() => handleAction(() => onReject(restaurantId))}
                >
                  <IoCloseCircleOutline />
                  <span>Reject Application</span>
                </button>
              )}
            </>
          )}

          <button
            className="action-menu__item action-menu__item--warning"
            onClick={() => handleAction(() => onBlock(restaurantId))}
          >
            <IoBanOutline />
            <span>{isBlocked ? "Unblock" : "Block"}</span>
          </button>

          <button
            className="action-menu__item action-menu__item--danger"
            onClick={() => handleAction(() => onDelete(restaurantId))}
          >
            <IoTrashOutline />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default RestaurantActionsMenu;
