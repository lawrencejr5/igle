"use client";

import { useState, useRef, useEffect } from "react";
import { FiMoreVertical } from "react-icons/fi";
import { IoEyeOutline, IoTrashOutline, IoMailOutline } from "react-icons/io5";
import { Feedback } from "../context/FeedbackContext";

interface FeedbackActionsMenuProps {
  feedback: Feedback;
  onViewDetails: (feedback: Feedback) => void;
  onDelete?: (feedback: Feedback) => void;
}

const FeedbackActionsMenu = ({
  feedback,
  onViewDetails,
  onDelete,
}: FeedbackActionsMenuProps) => {
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

  const handleAction = (action: string) => {
    setIsOpen(false);
    switch (action) {
      case "view":
        onViewDetails(feedback);
        break;
      case "reply":
        console.log("Reply to feedback:", feedback._id);
        // TODO: Implement reply logic
        break;
      case "delete":
        if (onDelete) {
          onDelete(feedback);
        }
        break;
    }
  };

  return (
    <div className="action-menu" ref={menuRef}>
      <button
        className="action-menu__trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FiMoreVertical />
      </button>

      {isOpen && (
        <div className="action-menu__dropdown">
          <button
            className="action-menu__item"
            onClick={() => handleAction("view")}
          >
            <IoEyeOutline />
            <span>View Details</span>
          </button>

          {feedback.contact && (
            <button
              className="action-menu__item"
              onClick={() => handleAction("reply")}
            >
              <IoMailOutline />
              <span>Reply to User</span>
            </button>
          )}

          <button
            className="action-menu__item action-menu__item--danger"
            onClick={() => handleAction("delete")}
          >
            <IoTrashOutline />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FeedbackActionsMenu;
