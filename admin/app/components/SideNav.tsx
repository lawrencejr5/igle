"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MdDashboard,
  MdPeople,
  MdDirectionsCar,
  MdLocalShipping,
  MdPayment,
  MdDescription,
  MdEmojiEvents,
} from "react-icons/md";
import { FiSidebar } from "react-icons/fi";

interface SideNavProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const SideNav = ({ isCollapsed, onToggle }: SideNavProps) => {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", path: "/", icon: MdDashboard },
    { name: "Users", path: "/users", icon: MdPeople },
    { name: "Rides", path: "/rides", icon: MdDirectionsCar },
    { name: "Deliveries", path: "/deliveries", icon: MdLocalShipping },
    { name: "Transactions", path: "/transactions", icon: MdPayment },
    { name: "Tasks", path: "/tasks", icon: MdEmojiEvents },
    { name: "Report and Feedbacks", path: "/logs", icon: MdDescription },
  ];

  return (
    <aside className={`sidenav ${isCollapsed ? "sidenav--collapsed" : ""}`}>
      <div className="sidenav__toggle" onClick={onToggle}>
        <FiSidebar className="sidenav__toggle-icon" />
      </div>
      <nav className="sidenav__nav">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`sidenav__item ${
                pathname === item.path ? "sidenav__item--active" : ""
              }`}
            >
              <IconComponent className="sidenav__icon" />
              {!isCollapsed && (
                <span className="sidenav__text">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default SideNav;
