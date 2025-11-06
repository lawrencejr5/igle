"use client";

import { useState, useRef, useEffect } from "react";
import { FiMoreVertical } from "react-icons/fi";
import {
  IoEyeOutline,
  IoTrashOutline,
  IoBanOutline,
  IoCreateOutline,
} from "react-icons/io5";

interface ActionMenuProps {
  userId: string;
  onViewDetails?: (userId: string) => void;
  onEdit?: (userId: string) => void;
  onDelete?: (userId: string) => void;
  onBlock?: (userId: string) => void;
}

const ActionMenu = ({
  userId,
  onViewDetails,
  onEdit,
  onDelete,
  onBlock,
}: ActionMenuProps) => {
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
      const dropdownHeight = 200; // Approximate height of dropdown
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // If not enough space below and more space above, open upward
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
            onClick={() => handleAction(() => onViewDetails?.(userId))}
          >
            <IoEyeOutline />
            <span>View Details</span>
          </button>
          <button
            className="action-menu__item"
            onClick={() => handleAction(() => onEdit?.(userId))}
          >
            <IoCreateOutline />
            <span>Edit Details</span>
          </button>
          <button
            className="action-menu__item action-menu__item--danger"
            onClick={() => handleAction(() => onDelete?.(userId))}
          >
            <IoTrashOutline />
            <span>Delete</span>
          </button>
          <button
            className="action-menu__item action-menu__item--warning"
            onClick={() => handleAction(() => onBlock?.(userId))}
          >
            <IoBanOutline />
            <span>Block</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionMenu;
