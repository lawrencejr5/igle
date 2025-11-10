"use client";

import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import FilterButton from "../components/FilterButton";
import SearchBar from "../components/SearchBar";
import DeliveriesTable from "../components/DeliveriesTable";
import FilterDrawer, { FilterValues } from "../components/FilterDrawer";
import { useDeliveryContext } from "../context/DeliveryContext";

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

  const { deliveries, fetchDeliveries, totalPages: apiTotalPages } =
    useDeliveryContext();

  // Fetch deliveries on mount and when page changes
  useEffect(() => {
    fetchDeliveries(currentPage, ITEMS_PER_PAGE);
  }, [currentPage]);

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

  // Filter and sort deliveries - Transform API data to match UI Delivery interface
  const filteredDeliveries = useMemo(() => {
    // Transform API deliveries to UI format
    const transformedDeliveries = deliveries.map((delivery) => ({
      id: delivery._id,
      senderId: delivery.sender._id,
      senderName: delivery.sender.name,
      senderPhone: delivery.sender.phone,
      senderProfilePic: delivery.sender.profile_pic,
      driverId: delivery.driver?._id,
      driverName: delivery.driver?.user.name,
      driverPhone: delivery.driver?.user.phone,
      driverProfilePic: delivery.driver?.user.profile_pic,
      pickup: delivery.pickup,
      dropoff: delivery.dropoff,
      to: delivery.to,
      package: delivery.package,
      status: delivery.status,
      fare: delivery.fare,
      distance_km: delivery.distance_km,
      duration_mins: delivery.duration_mins,
      vehicle: delivery.vehicle,
      payment_status: delivery.payment_status,
      payment_method: delivery.payment_method,
      timestamps: {
        accepted_at: delivery.timestamps.accepted_at
          ? new Date(delivery.timestamps.accepted_at)
          : undefined,
        picked_up_at: delivery.timestamps.picked_up_at
          ? new Date(delivery.timestamps.picked_up_at)
          : undefined,
        delivered_at: delivery.timestamps.delivered_at
          ? new Date(delivery.timestamps.delivered_at)
          : undefined,
        cancelled_at: delivery.timestamps.cancelled_at
          ? new Date(delivery.timestamps.cancelled_at)
          : undefined,
      },
      cancelled: delivery.cancelled,
      driver_earnings: delivery.driver_earnings,
      commission: delivery.commission,
      scheduled: delivery.scheduled,
      scheduled_time: delivery.scheduled_time
        ? new Date(delivery.scheduled_time)
        : null,
      createdAt: new Date(delivery.createdAt),
      updatedAt: new Date(delivery.updatedAt),
    }));

    let result = [...transformedDeliveries];

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
  }, [deliveries, searchQuery, filters]);

  // Use API pagination instead of client-side slicing
  const totalPages = apiTotalPages;
  const currentDeliveries = filteredDeliveries;

  // Reset to page 1 when search results change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    fetchDeliveries(currentPage, ITEMS_PER_PAGE);
  };

  return (
    <DashboardLayout>
      <h1 className="page-header">Deliveries</h1>

      <div className="table-header">
        <FilterButton
          onClick={handleFilterClick}
          isOpen={isFilterOpen}
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
        onRefresh={handleRefresh}
      />
    </DashboardLayout>
  );
};

export default Deliveries;
