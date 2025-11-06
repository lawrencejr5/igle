"use client";

import { useState, useRef, useEffect } from "react";
import { FiMoreVertical } from "react-icons/fi";
import { IoEyeOutline, IoTrashOutline, IoBanOutline } from "react-icons/io5";

interface ActionMenuProps {
  userId: string;
  onViewDetails?: (userId: string) => void;
  onDelete?: (userId: string) => void;
  onBlock?: (userId: string) => void;
}

const ActionMenu = ({
  userId,
  onViewDetails,
  onDelete,
  onBlock,
}: ActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
        <div className="action-menu__dropdown">
          <button
            className="action-menu__item"
            onClick={() => handleAction(() => onViewDetails?.(userId))}
          >
            <IoEyeOutline />
            <span>View Details</span>
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
