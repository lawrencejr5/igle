"use client";

import { useState, useRef, useEffect } from "react";
import { FiMoreVertical } from "react-icons/fi";
import {
  IoEyeOutline,
  IoCheckmarkDone,
  IoClose,
  IoTrashOutline,
} from "react-icons/io5";
import { MdSearch } from "react-icons/md";
import { Report } from "../../context/ReportContext";

interface ReportActionsMenuProps {
  report: Report;
  onViewDetails: (report: Report) => void;
  onUpdateStatus?: (
    report: Report,
    status: "new" | "investigating" | "resolved" | "dismissed"
  ) => void;
  onDelete?: (report: Report) => void;
}

const ReportActionsMenu = ({
  report,
  onViewDetails,
  onUpdateStatus,
  onDelete,
}: ReportActionsMenuProps) => {
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
        onViewDetails(report);
        break;
      case "investigate":
        if (onUpdateStatus) {
          onUpdateStatus(report, "investigating");
        }
        break;
      case "resolve":
        if (onUpdateStatus) {
          onUpdateStatus(report, "resolved");
        }
        break;
      case "dismiss":
        if (onUpdateStatus) {
          onUpdateStatus(report, "dismissed");
        }
        break;
      case "delete":
        if (onDelete) {
          onDelete(report);
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

          {report.status === "new" && (
            <button
              className="action-menu__item"
              onClick={() => handleAction("investigate")}
            >
              <MdSearch />
              <span>Mark as Investigating</span>
            </button>
          )}

          {(report.status === "new" || report.status === "investigating") && (
            <>
              <button
                className="action-menu__item"
                onClick={() => handleAction("resolve")}
              >
                <IoCheckmarkDone />
                <span>Mark as Resolved</span>
              </button>
              <button
                className="action-menu__item"
                onClick={() => handleAction("dismiss")}
              >
                <IoClose />
                <span>Dismiss Report</span>
              </button>
            </>
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

export default ReportActionsMenu;
