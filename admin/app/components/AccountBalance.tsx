"use client";

import { useState, useEffect } from "react";
import { FaWallet, FaEye, FaEyeSlash } from "react-icons/fa";
import { useAdminContext } from "../context/AdminContext";

const AccountBalance = () => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const { appWallet, fetchAppWallet } = useAdminContext();

  useEffect(() => {
    fetchAppWallet();
  }, []);

  const balance = appWallet?.balance || 0;

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
  };

  const formatBalance = (amount: number) => {
    // Format as Nigerian Naira
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
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
