"use client";

import { useState, useRef, useEffect } from "react";
import { FiMoreVertical } from "react-icons/fi";
import {
  IoEyeOutline,
  IoTrashOutline,
  IoCreateOutline,
  IoCloseCircleOutline,
} from "react-icons/io5";
import { FoodOrder } from "../../context/FoodOrderContext";

interface FoodOrderActionsMenuProps {
  order: FoodOrder;
  onViewDetails: (order: FoodOrder) => void;
  onUpdateStatus: (order: FoodOrder) => void;
  onCancel?: (order: FoodOrder) => void;
  onDelete: (order: FoodOrder) => void;
}

const FoodOrderActionsMenu = ({
  order,
  onViewDetails,
  onUpdateStatus,
  onCancel,
  onDelete,
}: FoodOrderActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isCancellable = !["delivered", "cancelled", "rejected"].includes(
    order.status
  );

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
      const dropdownHeight = dropdownRef.current
        ? dropdownRef.current.offsetHeight
        : 200;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      const tableContainer = menuRef.current.closest(".table-container");
      let containerSpaceBelow = spaceBelow;
      if (tableContainer) {
        const containerRect = tableContainer.getBoundingClientRect();
        containerSpaceBelow = containerRect.bottom - rect.bottom;
      }

      if (
        (spaceBelow < dropdownHeight || containerSpaceBelow < dropdownHeight) &&
        spaceAbove > spaceBelow
      ) {
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
            onClick={() => handleAction(() => onViewDetails(order))}
          >
            <IoEyeOutline />
            <span>View Details</span>
          </button>

          <button
            className="action-menu__item action-menu__item--warning"
            onClick={() => handleAction(() => onUpdateStatus(order))}
          >
            <IoCreateOutline />
            <span>Update Status</span>
          </button>

          {isCancellable && onCancel && (
            <button
              className="action-menu__item action-menu__item--danger"
              onClick={() => handleAction(() => onCancel(order))}
            >
              <IoCloseCircleOutline />
              <span>Cancel Order</span>
            </button>
          )}

          <button
            className="action-menu__item action-menu__item--danger"
            onClick={() => handleAction(() => onDelete(order))}
          >
            <IoTrashOutline />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FoodOrderActionsMenu;
