"use client";

import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import FilterButton from "../components/FilterButton";
import SearchBar from "../components/SearchBar";
import FilterDrawer, { FilterValues } from "../components/FilterDrawer";
import RestaurantsTable from "../components/Restaurants/RestaurantsTable";
import RestaurantDetailDrawer from "../components/Restaurants/RestaurantDetailDrawer";
import { useRestaurantContext } from "../context/RestaurantContext";

const ITEMS_PER_PAGE = 10;

const RestaurantsPage = () => {
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
    restaurants,
    totalPages: apiTotalPages,
    currentRestaurant,
    fetchRestaurants,
    fetchRestaurantById,
    clearCurrentRestaurant,
  } = useRestaurantContext();

  useEffect(() => {
    const params: any = {};
    if (filters.status) params.status = filters.status;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    fetchRestaurants(currentPage, ITEMS_PER_PAGE, params);
  }, [currentPage, searchQuery, filters]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== "" ||
      filters.dateFrom !== "" ||
      filters.dateTo !== "" ||
      filters.sortBy !== ""
    );
  }, [filters]);

  const displayRestaurants = useMemo(() => {
    let result = [...restaurants];
    if (filters.sortBy === "name-asc")
      result.sort((a, b) => a.name.localeCompare(b.name));
    else if (filters.sortBy === "name-desc")
      result.sort((a, b) => b.name.localeCompare(a.name));
    else if (filters.sortBy === "date-desc")
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    else if (filters.sortBy === "date-asc")
      result.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    return result;
  }, [restaurants, filters.sortBy]);

  const handleRefresh = () => {
    const params: any = {};
    if (filters.status) params.status = filters.status;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    fetchRestaurants(currentPage, ITEMS_PER_PAGE, params);
  };

  return (
    <DashboardLayout>
      <h1 className="page-header">Restaurants</h1>

      <div className="table-header">
        <FilterButton
          onClick={() => setIsFilterOpen((p) => !p)}
          isOpen={isFilterOpen}
          hasActiveFilters={hasActiveFilters}
        />
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search restaurants..."
        />
      </div>

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={(f) => {
          setFilters(f);
          setCurrentPage(1);
        }}
        currentFilters={filters}
        statusOptions={[
          { value: "", label: "All Statuses" },
          { value: "pending", label: "Pending" },
          { value: "submitted", label: "Submitted" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
        ]}
        sortOptions={[
          { value: "", label: "Default" },
          { value: "name-asc", label: "Name (A–Z)" },
          { value: "name-desc", label: "Name (Z–A)" },
          { value: "date-desc", label: "Newest First" },
          { value: "date-asc", label: "Oldest First" },
        ]}
        dateLabel="Registration Date"
      />

      <RestaurantsTable
        restaurants={displayRestaurants}
        currentPage={currentPage}
        totalPages={apiTotalPages}
        onPageChange={setCurrentPage}
        onRefresh={handleRefresh}
        onRowClick={(id) => fetchRestaurantById(id)}
      />

      {currentRestaurant && (
        <RestaurantDetailDrawer
          restaurant={currentRestaurant}
          onClose={clearCurrentRestaurant}
          onRefresh={handleRefresh}
        />
      )}
    </DashboardLayout>
  );
};

export default RestaurantsPage;
