"use client";

import { useState, useMemo } from "react";
import DashboardLayout from "../components/DashboardLayout";
import FilterButton from "../components/FilterButton";
import SearchBar from "../components/SearchBar";
import TransactionsTable from "../components/TransactionsTable";
import FilterDrawer, { FilterValues } from "../components/FilterDrawer";
import { transactionsData } from "../data/transactions";

const ITEMS_PER_PAGE = 10;

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
    let result = [...transactionsData];

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
  }, [searchQuery, filters]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <DashboardLayout>
      <h1 className="page-header">Transactions</h1>

      <div className="table-header">
        <FilterButton
          onClick={handleFilterClick}
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
      />
    </DashboardLayout>
  );
};

export default Transactions;
