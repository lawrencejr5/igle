"use client";

import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import FilterButton from "../components/FilterButton";
import SearchBar from "../components/SearchBar";
import TransactionsTable from "../components/TransactionsTable";
import FilterDrawer, { FilterValues } from "../components/FilterDrawer";
import { useTransactionContext } from "../context/TransactionContext";

const ITEMS_PER_PAGE = 20;

const Transactions = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    status: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "",
  });

  const {
    transactions,
    fetchTransactions,
    totalPages: apiTotalPages,
  } = useTransactionContext();

  // Fetch transactions on mount and when page changes
  useEffect(() => {
    fetchTransactions(currentPage, ITEMS_PER_PAGE);
  }, [currentPage]);

  const handleFilterClick = () => {
    setIsFilterOpen((prev) => !prev);
  };

  const handleFilterClose = () => {
    setIsFilterOpen(false);
  };

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== "" ||
      filters.dateFrom !== "" ||
      filters.dateTo !== "" ||
      filters.sortBy !== ""
    );
  }, [filters]);

  const filteredTransactions = useMemo(() => {
    // Transform API transactions to UI format
    const transformedTransactions = transactions.map((transaction) => ({
      id: transaction._id,
      userId: transaction.wallet_id.owner_id._id,
      userName: transaction.wallet_id.owner_id.name || "Unknown User",
      userEmail: transaction.wallet_id.owner_id.email,
      userPhone: transaction.wallet_id.owner_id.phone,
      userProfilePic: transaction.wallet_id.owner_id.profile_pic,
      userType: (transaction.wallet_id.owner_type.toLowerCase() === "user"
        ? "rider"
        : "driver") as "rider" | "driver",
      walletId: transaction.wallet_id._id,
      walletBalance: transaction.wallet_id.balance,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      channel: transaction.channel,
      rideId: transaction.ride_id?._id,
      reference: transaction.reference,
      metadata: transaction.metadata,
      createdAt: new Date(transaction.createdAt),
      updatedAt: new Date(transaction.updatedAt),
    }));

    let result = [...transformedTransactions];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (transaction) =>
          transaction.id.toLowerCase().includes(query) ||
          transaction.userName.toLowerCase().includes(query) ||
          transaction.type.toLowerCase().includes(query) ||
          transaction.channel.toLowerCase().includes(query) ||
          transaction.status.toLowerCase().includes(query) ||
          (transaction.reference &&
            transaction.reference.toLowerCase().includes(query)) ||
          transaction.userType.toLowerCase().includes(query)
      );
    }

    if (filters.status) {
      result = result.filter(
        (transaction) => transaction.status === filters.status
      );
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      result = result.filter(
        (transaction) => new Date(transaction.createdAt) >= fromDate
      );
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(
        (transaction) => new Date(transaction.createdAt) <= toDate
      );
    }

    if (filters.sortBy) {
      switch (filters.sortBy) {
        case "name-asc":
          result.sort((a, b) => a.userName.localeCompare(b.userName));
          break;
        case "name-desc":
          result.sort((a, b) => b.userName.localeCompare(a.userName));
          break;
        case "rides-desc":
        case "deliveries-desc":
          result.sort((a, b) => b.amount - a.amount);
          break;
        case "rides-asc":
        case "deliveries-asc":
          result.sort((a, b) => a.amount - b.amount);
          break;
        case "date-desc":
          result.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        case "date-asc":
          result.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          break;
      }
    }

    return result;
  }, [transactions, searchQuery, filters]);

  // Use API pagination instead of client-side slicing
  const totalPages = apiTotalPages;
  const currentTransactions = filteredTransactions;

  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    fetchTransactions(currentPage, ITEMS_PER_PAGE);
  };

  return (
    <DashboardLayout>
      <h1 className="page-header">Transactions</h1>

      <div className="table-header">
        <FilterButton
          onClick={handleFilterClick}
          isOpen={isFilterOpen}
          hasActiveFilters={hasActiveFilters}
        />
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search transactions..."
        />
      </div>

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={handleFilterClose}
        onApply={handleApplyFilters}
        currentFilters={filters}
        statusOptions={[
          { value: "", label: "All Statuses" },
          { value: "success", label: "Success" },
          { value: "pending", label: "Pending" },
          { value: "failed", label: "Failed" },
        ]}
        sortOptions={[
          { value: "", label: "Default" },
          { value: "name-asc", label: "User Name (A-Z)" },
          { value: "name-desc", label: "User Name (Z-A)" },
          { value: "deliveries-desc", label: "Highest Amount" },
          { value: "deliveries-asc", label: "Lowest Amount" },
          { value: "date-desc", label: "Newest First" },
          { value: "date-asc", label: "Oldest First" },
        ]}
        dateLabel="Transaction Date"
      />

      <TransactionsTable
        transactions={currentTransactions}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onRefresh={handleRefresh}
      />
    </DashboardLayout>
  );
};

export default Transactions;
