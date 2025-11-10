"use client";

import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import FilterButton from "../components/FilterButton";
import SearchBar from "../components/SearchBar";
import RidesTable from "../components/RidesTable";
import FilterDrawer, { FilterValues } from "../components/FilterDrawer";
import { useRideContext, Ride as ApiRide } from "../context/RideContext";

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

  // Fetch rides when component mounts or page changes
  useEffect(() => {
    fetchRides(currentPage, ITEMS_PER_PAGE);
  }, [currentPage]);

  const handleRefresh = () => {
    fetchRides(currentPage, ITEMS_PER_PAGE);
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

  // Filter and sort rides
  const filteredRides = useMemo(() => {
    // Convert API rides to display format matching Ride interface
    let result = apiRides.map((ride) => ({
      id: ride._id,
      riderId: ride.rider._id,
      riderName: ride.rider.name,
      driverId: ride.driver?._id,
      driverName: ride.driver?.user.name,
      pickup: {
        address: ride.pickup.address,
        coordinates: ride.pickup.coordinates,
      },
      destination: {
        address: ride.destination.address,
        coordinates: ride.destination.coordinates,
      },
      status: ride.status,
      fare: ride.fare,
      vehicle: ride.vehicle,
      distance_km: ride.distance_km,
      duration_mins: ride.duration_mins,
      payment_status: ride.payment_status,
      payment_method: ride.payment_method,
      driver_earnings: ride.driver_earnings,
      driver_paid: ride.driver_paid,
      commission: ride.commission,
      scheduled: ride.scheduled,
      scheduled_time: ride.scheduled_time
        ? new Date(ride.scheduled_time)
        : null,
      cancelled: ride.cancelled,
      timestamps: {
        accepted_at: ride.timestamps?.accepted_at
          ? new Date(ride.timestamps.accepted_at)
          : undefined,
        arrived_at: ride.timestamps?.arrived_at
          ? new Date(ride.timestamps.arrived_at)
          : undefined,
        started_at: ride.timestamps?.started_at
          ? new Date(ride.timestamps.started_at)
          : undefined,
        completed_at: ride.timestamps?.completed_at
          ? new Date(ride.timestamps.completed_at)
          : undefined,
        cancelled_at: ride.timestamps?.cancelled_at
          ? new Date(ride.timestamps.cancelled_at)
          : undefined,
      },
      createdAt: new Date(ride.createdAt),
    }));

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
      toDate.setHours(23, 59, 59, 999);
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
  }, [apiRides, searchQuery, filters]);

  // Use API pagination
  const totalPages = apiTotalPages;
  const currentRides = filteredRides;

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
        rides={currentRides}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onRefresh={handleRefresh}
      />
    </DashboardLayout>
  );
};

export default Rides;
