"use client";

import { useState } from "react";
import Image from "next/image";
import { FiUpload, FiSave } from "react-icons/fi";
import { FaImage } from "react-icons/fa";

const ProfileSettings = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState("Admin User");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    // TODO: Implement API call to update profile
    console.log("Saving profile:", { username, profileImage });
  };

  const handleChangePassword = () => {
    // TODO: Implement API call to change password
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    console.log("Changing password");
  };

  const handleSaveProfileImage = () => {
    // TODO: Implement API call to save profile image
    console.log("Saving profile image", profileImage);
    alert("Profile image saved (demo)");
  };

  return (
    <div className="settings-content profile-settings">
      {/* Profile Image Section */}
      <div className="settings-section">
        <h3 className="settings-section__title">Profile Image</h3>
        <div className="profile-image-upload">
          <div className="profile-image-upload__preview">
            {profileImage ? (
              <Image
                src={profileImage}
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
            <div>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSaveProfileImage}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Username Section */}
      <div className="settings-section">
        <h3 className="settings-section__title">Username</h3>
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
          />
        </div>
        <button className="btn btn--primary" onClick={handleSaveProfile}>
          <FiSave />
          Save Changes
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
          />
        </div>
        <button className="btn btn--primary" onClick={handleChangePassword}>
          <FiSave />
          Update Password
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;
