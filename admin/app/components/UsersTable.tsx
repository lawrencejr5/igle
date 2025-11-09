"use client";

import { useState } from "react";
import { User } from "../data/users";
import Pagination from "./Pagination";
import ActionMenu from "./ActionMenu";
import UserDetailsModal from "./UserDetailsModal";
import EditUserModal from "./EditUserModal";
import ConfirmModal from "./ConfirmModal";
import { useUserContext } from "../context/UserContext";
import { useAlert } from "../context/AlertContext";

interface UsersTableProps {
  users: User[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh?: () => void;
}

const UsersTable = ({
  users,
  currentPage,
  totalPages,
  onPageChange,
  onRefresh,
}: UsersTableProps) => {
  const { fetchUserDetails, editUser, deleteUser, blockUser } =
    useUserContext();
  const { showAlert } = useAlert();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Online":
        return "status-badge--active";
      case "Offline":
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

  const handleSaveUser = async (updatedUser: User) => {
    try {
      await editUser(updatedUser.id, {
        name: updatedUser.fullname,
        email: updatedUser.email,
        phone: updatedUser.phone,
      });
      handleCloseEditModal();
    } catch (error) {
      // Error is handled in context with alert
    }
  };

  const handleDelete = (userId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete User",
      message:
        "Are you sure you want to delete this user? This action cannot be undone.",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteUser(userId);
          setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (error) {
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      },
    });
  };

  const handleBlock = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    const isBlocked = user?.status === "Suspended";
    const action = isBlocked ? "unblock" : "block";

    setConfirmModal({
      isOpen: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      message: `Are you sure you want to ${action} this user?`,
      variant: isBlocked ? "info" : "warning",
      onConfirm: async () => {
        try {
          await blockUser(userId, !isBlocked);
          setConfirmModal({ ...confirmModal, isOpen: false });
          // Refresh the table data
          if (onRefresh) {
            onRefresh();
          }
        } catch (error) {
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      },
    });
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
                    userStatus={user.status}
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

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </>
  );
};

export default UsersTable;
