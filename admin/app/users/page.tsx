"use client";

import { useState, useMemo } from "react";
import DashboardLayout from "../components/DashboardLayout";
import TabSwitcher from "../components/TabSwitcher";
import FilterButton from "../components/FilterButton";
import SearchBar from "../components/SearchBar";
import UsersTable from "../components/UsersTable";
import DriversTable from "../components/DriversTable";
import FilterDrawer, { FilterValues } from "../components/FilterDrawer";
import { usersData } from "../data/users";
import { driversData } from "../data/drivers";

const ITEMS_PER_PAGE = 10;

const Users = () => {
  const [activeTab, setActiveTab] = useState<"Users" | "Drivers">("Users");
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
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Check if there are active filters
  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== "" ||
      filters.dateFrom !== "" ||
      filters.dateTo !== "" ||
      filters.sortBy !== ""
    );
  }, [filters]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "Users" | "Drivers");
    setCurrentPage(1); // Reset to first page when switching tabs
    setSearchQuery(""); // Clear search query
    setFilters({
      status: "",
      dateFrom: "",
      dateTo: "",
      sortBy: "",
    }); // Reset filters
  };

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let result = [...usersData];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          user.fullname.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.phone.includes(query) ||
          user.status.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filters.status) {
      result = result.filter((user) => user.status === filters.status);
    }

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case "name-asc":
          result.sort((a, b) => a.fullname.localeCompare(b.fullname));
          break;
        case "name-desc":
          result.sort((a, b) => b.fullname.localeCompare(a.fullname));
          break;
        case "rides-desc":
          result.sort((a, b) => b.rides - a.rides);
          break;
        case "rides-asc":
          result.sort((a, b) => a.rides - b.rides);
          break;
        case "deliveries-desc":
          result.sort((a, b) => b.deliveries - a.deliveries);
          break;
        case "deliveries-asc":
          result.sort((a, b) => a.deliveries - b.deliveries);
          break;
      }
    }

    return result;
  }, [searchQuery, filters]);

  // Filter and sort drivers
  const filteredDrivers = useMemo(() => {
    let result = [...driversData];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (driver) =>
          driver.fullname.toLowerCase().includes(query) ||
          driver.email.toLowerCase().includes(query) ||
          driver.phone.includes(query) ||
          driver.vehicleType.toLowerCase().includes(query) ||
          driver.vehicleName.toLowerCase().includes(query) ||
          driver.status.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filters.status) {
      result = result.filter((driver) => driver.status === filters.status);
    }

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case "name-asc":
          result.sort((a, b) => a.fullname.localeCompare(b.fullname));
          break;
        case "name-desc":
          result.sort((a, b) => b.fullname.localeCompare(a.fullname));
          break;
        case "rides-desc":
        case "deliveries-desc":
          result.sort((a, b) => b.rating - a.rating);
          break;
        case "rides-asc":
        case "deliveries-asc":
          result.sort((a, b) => a.rating - b.rating);
          break;
      }
    }

    return result;
  }, [searchQuery, filters]);

  // Calculate pagination based on active tab
  const currentData = activeTab === "Users" ? filteredUsers : filteredDrivers;
  const totalPages = Math.ceil(currentData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);
  const currentDrivers = filteredDrivers.slice(startIndex, endIndex);

  // Reset to page 1 when search results change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <DashboardLayout>
      <h1 className="page-header">{activeTab}</h1>

      <TabSwitcher tabs={["Users", "Drivers"]} onTabChange={handleTabChange} />

      <div className="table-header">
        <FilterButton
          onClick={handleFilterClick}
          hasActiveFilters={hasActiveFilters}
        />
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={`Search ${activeTab.toLowerCase()}...`}
        />
      </div>

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={handleFilterClose}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />

      {activeTab === "Users" ? (
        <UsersTable
          users={currentUsers}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      ) : (
        <DriversTable
          drivers={currentDrivers}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </DashboardLayout>
  );
};

export default Users;
