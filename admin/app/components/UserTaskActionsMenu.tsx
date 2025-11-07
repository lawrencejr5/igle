"use client";

import { useState, useRef, useEffect } from "react";
import { FiMoreVertical } from "react-icons/fi";
import { IoTrashOutline, IoStopCircleOutline } from "react-icons/io5";
import { UserTask } from "../data/tasks";

interface UserTaskActionsMenuProps {
  userTask: UserTask;
  onDelete?: (userTaskId: string) => void;
  onEndTask?: (userTaskId: string) => void;
}

const UserTaskActionsMenu = ({
  userTask,
  onDelete,
  onEndTask,
}: UserTaskActionsMenuProps) => {
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
      case "end":
        if (onEndTask) {
          onEndTask(userTask._id);
        } else {
          console.log("End task:", userTask._id);
        }
        break;
      case "delete":
        if (onDelete) {
          onDelete(userTask._id);
        } else {
          console.log("Delete user task:", userTask._id);
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
            onClick={() => handleAction("end")}
          >
            <IoStopCircleOutline />
            <span>End Task</span>
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

export default UserTaskActionsMenu;
