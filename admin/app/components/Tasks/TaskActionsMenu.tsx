"use client";

import { useState, useRef, useEffect } from "react";
import { FiMoreVertical } from "react-icons/fi";
import {
  IoEyeOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoToggle,
} from "react-icons/io5";
import { Task } from "../../context/TaskContext";

interface TaskActionsMenuProps {
  task: Task;
  onViewDetails: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onToggleActive?: (task: Task) => void;
}

const TaskActionsMenu = ({
  task,
  onViewDetails,
  onDelete,
  onToggleActive,
}: TaskActionsMenuProps) => {
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
        onViewDetails(task);
        break;
      case "edit":
        console.log("Edit task:", task._id);
        // TODO: Implement edit logic
        break;
      case "toggle":
        if (onToggleActive) {
          onToggleActive(task);
        } else {
          console.log("Toggle active status:", task._id);
        }
        break;
      case "delete":
        if (onDelete) {
          onDelete(task);
        } else {
          console.log("Delete task:", task._id);
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

          <button
            className="action-menu__item"
            onClick={() => handleAction("edit")}
          >
            <IoCreateOutline />
            <span>Edit Task</span>
          </button>

          <button
            className="action-menu__item"
            onClick={() => handleAction("toggle")}
          >
            <IoToggle />
            <span>{task.active ? "Deactivate" : "Activate"}</span>
          </button>

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

export default TaskActionsMenu;
