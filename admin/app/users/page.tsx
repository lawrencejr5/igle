"use client";

import { useState, useMemo } from "react";
import DashboardLayout from "../components/DashboardLayout";
import TabSwitcher from "../components/TabSwitcher";
import FilterButton from "../components/FilterButton";
import SearchBar from "../components/SearchBar";
import UsersTable from "../components/UsersTable";
import { usersData } from "../data/users";

const ITEMS_PER_PAGE = 10;

const Users = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const handleFilterClick = () => {
    // Add filter logic here
    console.log("Filter clicked");
  };

  const handleTabChange = (activeTab: string) => {
    // Handle tab change logic here
    console.log("Active tab:", activeTab);
    setCurrentPage(1); // Reset to first page when switching tabs
  };

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return usersData;
    }

    const query = searchQuery.toLowerCase();
    return usersData.filter(
      (user) =>
        user.fullname.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.includes(query) ||
        user.status.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when search results change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <DashboardLayout>
      <h1 className="page-header">Users</h1>

      <TabSwitcher tabs={["Users", "Drivers"]} onTabChange={handleTabChange} />

      <div className="table-header">
        <FilterButton onClick={handleFilterClick} />
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search users..."
        />
      </div>

      <UsersTable
        users={currentUsers}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </DashboardLayout>
  );
};

export default Users;
