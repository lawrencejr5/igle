"use client";

import { useState } from "react";
import { User } from "../data/users";
import Pagination from "./Pagination";
import ActionMenu from "./ActionMenu";
import UserDetailsModal from "./UserDetailsModal";
import EditUserModal from "./EditUserModal";

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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

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

  const handleViewDetails = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedUser(null);
    }, 300); // Wait for animation to complete
  };

  const handleEdit = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setEditingUser(user);
      setIsEditModalOpen(true);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setTimeout(() => {
      setEditingUser(null);
    }, 300); // Wait for animation to complete
  };

  const handleSaveUser = (updatedUser: User) => {
    console.log("Save user:", updatedUser);
    // TODO: Implement save logic (update local state or call API)
    handleCloseEditModal();
  };

  const handleDelete = (userId: string) => {
    console.log("Delete user:", userId);
    // TODO: Implement delete logic with confirmation
  };

  const handleBlock = (userId: string) => {
    console.log("Block user:", userId);
    // TODO: Implement block logic
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
                  <ActionMenu
                    userId={user.id}
                    onViewDetails={handleViewDetails}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onBlock={handleBlock}
                  />
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

      <UserDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        user={selectedUser}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        user={editingUser}
        onSave={handleSaveUser}
      />
    </>
  );
};

export default UsersTable;
