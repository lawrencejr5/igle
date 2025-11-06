"use client";

import { FiMoreVertical } from "react-icons/fi";
import { User } from "../data/users";
import Pagination from "./Pagination";

interface UsersTableProps {
  users: User[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const UsersTable = ({
  users,
  currentPage,
  totalPages,
  onPageChange,
}: UsersTableProps) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case "Active":
        return "status-badge--active";
      case "Inactive":
        return "status-badge--inactive";
      case "Suspended":
        return "status-badge--suspended";
      default:
        return "";
    }
  };

  return (
    <>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Rides</th>
              <th>Deliveries</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-cell">
                    <div className="user-cell__avatar">
                      {user.fullname.charAt(0)}
                    </div>
                    <span className="user-cell__name">{user.fullname}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>{user.rides}</td>
                <td>{user.deliveries}</td>
                <td>
                  <span
                    className={`status-badge ${getStatusClass(user.status)}`}
                  >
                    {user.status}
                  </span>
                </td>
                <td>
                  <button className="action-button" aria-label="More actions">
                    <FiMoreVertical />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
};

export default UsersTable;
