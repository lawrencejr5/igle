"use client";

import Image from "next/image";
import { IoSearchOutline } from "react-icons/io5";

const TopNav = () => {
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
        <span className="topnav__username">Admin User</span>
        <div className="topnav__avatar">
          <span>A</span>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
