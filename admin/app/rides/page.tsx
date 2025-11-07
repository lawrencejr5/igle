"use client";

import { useState, useMemo } from "react";
import DashboardLayout from "../components/DashboardLayout";
import FilterButton from "../components/FilterButton";
import SearchBar from "../components/SearchBar";
import RidesTable from "../components/RidesTable";
import FilterDrawer, { FilterValues } from "../components/FilterDrawer";
import { ridesData } from "../data/rides";

const ITEMS_PER_PAGE = 10;

const Rides = () => {
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

  // Filter and sort rides
  const filteredRides = useMemo(() => {
    let result = [...ridesData];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (ride) =>
          ride.id.toLowerCase().includes(query) ||
          ride.riderName.toLowerCase().includes(query) ||
          (ride.driverName && ride.driverName.toLowerCase().includes(query)) ||
          ride.pickup.address.toLowerCase().includes(query) ||
          ride.destination.address.toLowerCase().includes(query) ||
          ride.status.toLowerCase().includes(query) ||
          ride.vehicle.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filters.status) {
      result = result.filter((ride) => ride.status === filters.status);
    }

    // Apply date filters
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      result = result.filter((ride) => new Date(ride.createdAt) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      result = result.filter((ride) => new Date(ride.createdAt) <= toDate);
    }

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case "name-asc":
          result.sort((a, b) => a.riderName.localeCompare(b.riderName));
          break;
        case "name-desc":
          result.sort((a, b) => b.riderName.localeCompare(a.riderName));
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
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          break;
      }
    }

    return result;
  }, [searchQuery, filters]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredRides.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentRides = filteredRides.slice(startIndex, endIndex);

  // Reset to page 1 when search results change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <DashboardLayout>
      <h1 className="page-header">Rides</h1>

      <div className="table-header">
        <FilterButton
          onClick={handleFilterClick}
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
        rides={currentRides}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </DashboardLayout>
  );
};

export default Rides;
