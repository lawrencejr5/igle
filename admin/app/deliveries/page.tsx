"use client";

import { useState, useMemo } from "react";
import DashboardLayout from "../components/DashboardLayout";
import FilterButton from "../components/FilterButton";
import SearchBar from "../components/SearchBar";
import DeliveriesTable from "../components/DeliveriesTable";
import FilterDrawer, { FilterValues } from "../components/FilterDrawer";
import { deliveriesData } from "../data/deliveries";

const ITEMS_PER_PAGE = 10;

const Deliveries = () => {
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

  // Filter and sort deliveries
  const filteredDeliveries = useMemo(() => {
    let result = [...deliveriesData];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (delivery) =>
          delivery.id.toLowerCase().includes(query) ||
          delivery.senderName.toLowerCase().includes(query) ||
          (delivery.driverName &&
            delivery.driverName.toLowerCase().includes(query)) ||
          (delivery.to?.name &&
            delivery.to.name.toLowerCase().includes(query)) ||
          delivery.pickup.address.toLowerCase().includes(query) ||
          delivery.dropoff.address.toLowerCase().includes(query) ||
          delivery.status.toLowerCase().includes(query) ||
          delivery.vehicle.toLowerCase().includes(query) ||
          (delivery.package.type &&
            delivery.package.type.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (filters.status) {
      result = result.filter((delivery) => delivery.status === filters.status);
    }

    // Apply date filters
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      result = result.filter(
        (delivery) => new Date(delivery.createdAt) >= fromDate
      );
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      result = result.filter(
        (delivery) => new Date(delivery.createdAt) <= toDate
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case "name-asc":
          result.sort((a, b) => a.senderName.localeCompare(b.senderName));
          break;
        case "name-desc":
          result.sort((a, b) => b.senderName.localeCompare(a.senderName));
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
  const totalPages = Math.ceil(filteredDeliveries.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentDeliveries = filteredDeliveries.slice(startIndex, endIndex);

  // Reset to page 1 when search results change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <DashboardLayout>
      <h1 className="page-header">Deliveries</h1>

      <div className="table-header">
        <FilterButton
          onClick={handleFilterClick}
          hasActiveFilters={hasActiveFilters}
        />
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search deliveries..."
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
          { value: "name-asc", label: "Sender Name (A-Z)" },
          { value: "name-desc", label: "Sender Name (Z-A)" },
          { value: "deliveries-desc", label: "Highest Fare" },
          { value: "deliveries-asc", label: "Lowest Fare" },
          { value: "date-desc", label: "Newest First" },
          { value: "date-asc", label: "Oldest First" },
        ]}
        dateLabel="Delivery Date"
      />

      <DeliveriesTable
        deliveries={currentDeliveries}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </DashboardLayout>
  );
};

export default Deliveries;
