"use client";

import { useState } from "react";
import { FaWallet, FaEye, FaEyeSlash } from "react-icons/fa";

const AccountBalance = () => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const balance = 125430.5; // Replace with actual balance from your data source

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="account-balance">
      <div className="account-balance__icon">
        <FaWallet />
      </div>
      <div className="account-balance__content">
        <p className="account-balance__label">Account Balance</p>
        <h2 className="account-balance__amount">
          {isBalanceVisible ? formatBalance(balance) : "••••"}
        </h2>
      </div>
      <button
        className="account-balance__toggle"
        onClick={toggleBalanceVisibility}
        aria-label={isBalanceVisible ? "Hide balance" : "Show balance"}
      >
        {isBalanceVisible ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
};

export default AccountBalance;
