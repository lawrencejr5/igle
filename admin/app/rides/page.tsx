"use client";

import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import FilterButton from "../components/FilterButton";
import SearchBar from "../components/SearchBar";
import RidesTable from "../components/Rides/RidesTable";
import FilterDrawer, { FilterValues } from "../components/FilterDrawer";
import { useRideContext, Ride } from "../context/RideContext";

const ITEMS_PER_PAGE = 10;

const Rides = () => {
  const {
    rides: apiRides,
    totalRides,
    totalPages: apiTotalPages,
    loading,
    fetchRides,
  } = useRideContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    status: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "",
  });

  // Fetch rides whenever page, search, or filters change
  useEffect(() => {
    const filterParams: any = {};
    if (filters.status) filterParams.status = filters.status;
    if (filters.dateFrom) filterParams.dateFrom = filters.dateFrom;
    if (filters.dateTo) filterParams.dateTo = filters.dateTo;
    if (searchQuery.trim()) filterParams.search = searchQuery.trim();

    fetchRides(currentPage, ITEMS_PER_PAGE, filterParams);
  }, [currentPage, searchQuery, filters]);

  const handleRefresh = () => {
    const filterParams: any = {};
    if (filters.status) filterParams.status = filters.status;
    if (filters.dateFrom) filterParams.dateFrom = filters.dateFrom;
    if (filters.dateTo) filterParams.dateTo = filters.dateTo;
    if (searchQuery.trim()) filterParams.search = searchQuery.trim();

    fetchRides(currentPage, ITEMS_PER_PAGE, filterParams);
  };

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

  // Apply client-side sorting only (filtering/search now handled by backend)
  const displayRides = useMemo(() => {
    let result = [...apiRides];

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case "name-asc":
          result.sort((a, b) => a.rider.name.localeCompare(b.rider.name));
          break;
        case "name-desc":
          result.sort((a, b) => b.rider.name.localeCompare(a.rider.name));
          break;
        case "rides-desc":
        case "deliveries-desc":
          result.sort((a, b) => b.fare - a.fare);
          break;
        case "rides-asc":
        case "deliveries-asc":
          result.sort((a, b) => a.fare - b.fare);
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
              new Date(a.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
      }
    }

    return result;
  }, [apiRides, filters.sortBy]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <DashboardLayout>
      <h1 className="page-header">Rides</h1>

      <div className="table-header">
        <FilterButton
          onClick={handleFilterClick}
          isOpen={isFilterOpen}
          hasActiveFilters={hasActiveFilters}
        />
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search rides..."
        />
      </div>

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={handleFilterClose}
        onApply={handleApplyFilters}
        currentFilters={filters}
        statusOptions={[
          { value: "", label: "All Statuses" },
          { value: "completed", label: "Completed" },
          { value: "ongoing", label: "Ongoing" },
          { value: "accepted", label: "Accepted" },
          { value: "arrived", label: "Arrived" },
          { value: "pending", label: "Pending" },
          { value: "scheduled", label: "Scheduled" },
          { value: "cancelled", label: "Cancelled" },
          { value: "expired", label: "Expired" },
        ]}
        sortOptions={[
          { value: "", label: "Default" },
          { value: "name-asc", label: "Rider Name (A-Z)" },
          { value: "name-desc", label: "Rider Name (Z-A)" },
          { value: "rides-desc", label: "Highest Fare" },
          { value: "rides-asc", label: "Lowest Fare" },
          { value: "date-desc", label: "Newest First" },
          { value: "date-asc", label: "Oldest First" },
        ]}
        dateLabel="Ride Date"
      />

      <RidesTable
        rides={displayRides}
        currentPage={currentPage}
        totalPages={apiTotalPages}
        onPageChange={handlePageChange}
        onRefresh={handleRefresh}
      />
    </DashboardLayout>
  );
};

export default Rides;
