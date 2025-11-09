"use client";

import Image from "next/image";
import { IoSearchOutline } from "react-icons/io5";
import { useAuthContext } from "../context/AuthContext";
import { FiPower } from "react-icons/fi";

const TopNav = () => {
  const { admin, logout } = useAuthContext();

  const username = admin?.username || "Admin";
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

      <div className="topnav__profile">
        <span
          className="topnav__username"
          style={{ textTransform: "capitalize" }}
        >
          Admin {username}
        </span>
        <div className="topnav__avatar">
          <span>{avatarLetter}</span>
        </div>
        <button
          className="topnav__logout"
          onClick={logout}
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
