"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FiUpload, FiSave, FiTrash2 } from "react-icons/fi";
import { FaImage } from "react-icons/fa";
import { useAdminContext } from "../context/AdminContext";

const ProfileSettings = () => {
  const {
    profile,
    loading,
    updateProfile,
    updatePassword,
    uploadProfilePic,
    removeProfilePic,
  } = useAdminContext();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setEmail(profile.email || "");
      setPreviewImage(profile.profile_pic || null);
    }
  }, [profile]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(username, email);
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      await updatePassword(currentPassword, newPassword, confirmPassword);
      // Clear password fields on success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Failed to change password:", error);
    }
  };

  const handleSaveProfileImage = async () => {
    if (!selectedFile) {
      alert("Please select an image first");
      return;
    }
    try {
      await uploadProfilePic(selectedFile);
      setSelectedFile(null);
    } catch (error) {
      console.error("Failed to save profile image:", error);
    }
  };

  const handleRemoveProfileImage = async () => {
    if (
      !window.confirm("Are you sure you want to remove your profile picture?")
    ) {
      return;
    }
    try {
      await removeProfilePic();
      setPreviewImage(null);
      setSelectedFile(null);
    } catch (error) {
      console.error("Failed to remove profile image:", error);
    }
  };

  return (
    <div className="settings-content profile-settings">
      {/* Profile Image Section */}
      <div className="settings-section">
        <h3 className="settings-section__title">Profile Image</h3>
        <div className="profile-image-upload">
          <div className="profile-image-upload__preview">
            {previewImage ? (
              <Image
                src={previewImage}
                alt="Profile"
                width={120}
                height={120}
                className="profile-image-upload__img"
              />
            ) : (
              <div className="profile-image-upload__placeholder">
                <FaImage size={32} />
                <span>No image</span>
              </div>
            )}
          </div>
          <div className="profile-image-upload__actions">
            <label htmlFor="profile-image-input" className="btn btn--secondary">
              <FiUpload />
              Choose Image
            </label>
            <input
              id="profile-image-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="profile-image-upload__input"
            />
            <div className="profile-image-upload__buttons">
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSaveProfileImage}
                disabled={!selectedFile || loading}
              >
                <FiSave />
                {loading ? "Saving..." : "Save Image"}
              </button>
              {profile?.profile_pic && (
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={handleRemoveProfileImage}
                  disabled={loading}
                >
                  <FiTrash2 />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Info Section */}
      <div className="settings-section">
        <h3 className="settings-section__title">Profile Information</h3>
        <div className="settings-form-group">
          <label htmlFor="username" className="settings-form-group__label">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="settings-form-group__input"
            placeholder="Enter your username"
            disabled={loading}
          />
        </div>
        <div className="settings-form-group">
          <label htmlFor="email" className="settings-form-group__label">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="settings-form-group__input"
            placeholder="Enter your email"
            disabled={loading}
          />
        </div>
        <button
          className="btn btn--primary"
          onClick={handleSaveProfile}
          disabled={loading}
        >
          <FiSave />
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Password Section */}
      <div className="settings-section">
        <h3 className="settings-section__title">Change Password</h3>
        <div className="settings-form-group">
          <label
            htmlFor="current-password"
            className="settings-form-group__label"
          >
            Current Password
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="settings-form-group__input"
            placeholder="Enter current password"
            disabled={loading}
          />
        </div>
        <div className="settings-form-group">
          <label htmlFor="new-password" className="settings-form-group__label">
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="settings-form-group__input"
            placeholder="Enter new password"
            disabled={loading}
          />
        </div>
        <div className="settings-form-group">
          <label
            htmlFor="confirm-password"
            className="settings-form-group__label"
          >
            Confirm New Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="settings-form-group__input"
            placeholder="Confirm new password"
            disabled={loading}
          />
        </div>
        <button
          className="btn btn--primary"
          onClick={handleChangePassword}
          disabled={loading}
        >
          <FiSave />
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;
