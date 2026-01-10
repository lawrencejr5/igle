"use client"; // Required for interactivity

import { useState } from "react";

export default function GetAppBtn() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="download-dropdown">
      <button className="header-btn" onClick={() => setIsOpen(!isOpen)}>
        Get App
        {/* Small chevron icon */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "0.2s",
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          {/* App Store Option */}
          <a href="#" className="dropdown-item">
            <img
              src="/icons/apple-black.png"
              alt="appstore icon"
              width={"20px"}
              height={"20px"}
            />
            <span>App Store</span>
          </a>

          {/* Google Play Option */}
          <a href="#" className="dropdown-item">
            <img
              src="/icons/google-play.png"
              alt="playstore icon"
              width={"20px"}
              height={"20px"}
            />
            <span>Google Play</span>
          </a>
        </div>
      )}
    </div>
  );
}
