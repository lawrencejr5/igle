"use client";

import Image from "next/image";
import { IoSearchOutline } from "react-icons/io5";

import { useRouter } from "next/navigation";
import { useAuthContext } from "../context/AuthContext";
import { FiPower } from "react-icons/fi";

const TopNav = () => {
  const { admin, logout } = useAuthContext();
  const router = useRouter();

  const username = admin?.username || "Admin";
  const profilePic = admin?.profile_pic;
  const avatarLetter = username.charAt(0).toUpperCase();

  return (
    <header className="topnav">
      <div className="topnav__logo">
        <Image
          src="/images/Igle.png"
          alt="Igle Logo"
          width={120}
          height={40}
          priority
        />
      </div>

      <div className="topnav__search">
        <IoSearchOutline className="topnav__search-icon" />
        <input
          type="text"
          placeholder="Search..."
          className="topnav__search-input"
        />
      </div>

      <div
        className="topnav__profile"
        style={{ cursor: "pointer" }}
        onClick={() => router.push("/settings")}
        title="Go to settings"
      >
        <span
          className="topnav__username"
          style={{ textTransform: "capitalize" }}
        >
          Admin {username}
        </span>
        <div className="topnav__avatar">
          {profilePic ? (
            <Image
              src={profilePic}
              alt={username}
              width={36}
              height={36}
              style={{ borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <span>{avatarLetter}</span>
          )}
        </div>
        <button
          className="topnav__logout"
          onClick={(e) => {
            e.stopPropagation();
            logout();
          }}
          style={{
            marginLeft: 16,
            background: "none",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            padding: 8,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
          title="Logout"
        >
          <FiPower />
        </button>
      </div>
    </header>
  );
};

export default TopNav;
