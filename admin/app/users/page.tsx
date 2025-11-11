"use client";

import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import TabSwitcher from "../components/TabSwitcher";
import FilterButton from "../components/FilterButton";
import SearchBar from "../components/SearchBar";
import UsersTable from "../components/UsersTable";
import DriversTable from "../components/DriversTable";
import RequestsTable from "../components/RequestsTable";
import FilterDrawer, { FilterValues } from "../components/FilterDrawer";
import { requestsData } from "../data/requests";
import { useUserContext, User as ApiUser } from "../context/UserContext";
import {
  useDriverContext,
  Driver as ApiDriver,
} from "../context/DriverContext";

const ITEMS_PER_PAGE = 10;

const Users = () => {
  const {
    users: apiUsers,
    totalUsers,
    totalPages: apiTotalPages,
    currentPage: apiCurrentPage,
    loading,
    fetchUsers,
  } = useUserContext();

  const {
    drivers: apiDrivers,
    applications: apiApplications,
    totalDrivers,
    totalApplications,
    totalPages: driverTotalPages,
    fetchDrivers,
    fetchDriverApplications,
    processDriverApplication,
    loading: driversLoading,
  } = useDriverContext();

  const [activeTab, setActiveTab] = useState<"Users" | "Drivers" | "Requests">(
    "Users"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    status: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "",
  });

  // Fetch applications on mount to ensure Requests tab visibility is accurate
  useEffect(() => {
    fetchDriverApplications(1, ITEMS_PER_PAGE);
  }, []);

  // Fetch users when component mounts or page changes
  useEffect(() => {
    if (activeTab === "Users") {
      fetchUsers(currentPage, ITEMS_PER_PAGE);
    } else if (activeTab === "Drivers") {
      fetchDrivers(currentPage, ITEMS_PER_PAGE);
    } else if (activeTab === "Requests") {
      fetchDriverApplications(currentPage, ITEMS_PER_PAGE);
    }
  }, [activeTab, currentPage]);

  const handleRefreshUsers = () => {
    fetchUsers(currentPage, ITEMS_PER_PAGE);
  };

  const handleRefreshDrivers = () => {
    fetchDrivers(currentPage, ITEMS_PER_PAGE);
  };

  const handleRefreshApplications = () => {
    fetchDriverApplications(currentPage, ITEMS_PER_PAGE);
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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "Users" | "Drivers" | "Requests");
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
    // Convert API users to display format with ride/delivery counts
    let result = apiUsers.map((user) => ({
      id: user._id,
      fullname: user.name,
      email: user.email,
      phone: user.phone || "N/A",
      rides: 0, // TODO: These should come from user details endpoint
      deliveries: 0,
      status: (user.is_blocked
        ? "Suspended"
        : user.is_online
        ? "Online"
        : "Offline") as "Online" | "Offline" | "Suspended",
    }));

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
  }, [apiUsers, searchQuery, filters]);

  // Filter and sort drivers
  const filteredDrivers = useMemo(() => {
    // Helper function to capitalize vehicle type
    const capitalizeVehicleType = (
      type: string
    ): "Cab" | "Bike" | "SUV" | "Keke" | "Van" | "Truck" => {
      const typeMap: {
        [key: string]: "Cab" | "Bike" | "SUV" | "Keke" | "Van" | "Truck";
      } = {
        bike: "Bike",
        keke: "Keke",
        cab: "Cab",
        suv: "SUV",
        van: "Van",
        truck: "Truck",
      };
      return typeMap[type.toLowerCase()] || "Cab";
    };

    // Convert API drivers to display format
    let result = apiDrivers.map((driver) => ({
      id: driver._id,
      fullname: driver.user.name,
      email: driver.user.email,
      phone: driver.user.phone || "N/A",
      vehicleType: capitalizeVehicleType(driver.vehicle_type),
      vehicleName:
        driver.vehicle.brand && driver.vehicle.model
          ? `${driver.vehicle.brand} ${driver.vehicle.model}`
          : "N/A",
      rating: driver.rating || 0,
      reviewsCount: driver.num_of_reviews || 0,
      status: (driver.is_blocked
        ? "Suspended"
        : driver.is_online
        ? "Online"
        : "Offline") as "Online" | "Offline" | "Suspended",
    }));

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
  }, [apiDrivers, searchQuery, filters]);

  // Filter and sort requests (driver applications)
  const filteredRequests = useMemo(() => {
    // Helper function to capitalize vehicle type
    const capitalizeVehicleType = (
      type: string
    ): "Cab" | "Bike" | "SUV" | "Keke" | "Van" | "Truck" => {
      const typeMap: {
        [key: string]: "Cab" | "Bike" | "SUV" | "Keke" | "Van" | "Truck";
      } = {
        bike: "Bike",
        keke: "Keke",
        cab: "Cab",
        suv: "SUV",
        van: "Van",
        truck: "Truck",
      };
      return typeMap[type.toLowerCase()] || "Cab";
    };

    // Convert API applications to display format
    let result = apiApplications.map((application) => ({
      id: application._id,
      fullname: application.user.name,
      email: application.user.email,
      phone: application.user.phone || "N/A",
      vehicleType: capitalizeVehicleType(application.vehicle_type),
      vehicleName:
        application.vehicle.brand && application.vehicle.model
          ? `${application.vehicle.brand} ${application.vehicle.model}`
          : "N/A",
      requestDate: application.createdAt,
      vehicleDetails: application.vehicle.brand
        ? {
            brand: application.vehicle.brand,
            model: application.vehicle.model || "",
            color: application.vehicle.color || "",
            year: application.vehicle.year || "",
            plateNumber: application.vehicle.plate_number || "",
            exteriorImage: application.vehicle.exterior_image,
            interiorImage: application.vehicle.interior_image,
          }
        : undefined,
      driverLicence: application.driver_licence.number
        ? {
            number: application.driver_licence.number,
            expiryDate: application.driver_licence.expiry_date || "",
            frontImage: application.driver_licence.front_image,
            backImage: application.driver_licence.back_image,
            selfieWithLicence: application.driver_licence.selfie_with_licence,
          }
        : undefined,
      dateOfBirth: application.createdAt,
    }));

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (request) =>
          request.fullname.toLowerCase().includes(query) ||
          request.email.toLowerCase().includes(query) ||
          request.phone.includes(query) ||
          request.vehicleType.toLowerCase().includes(query) ||
          request.vehicleName.toLowerCase().includes(query)
      );
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
      }
    }

    return result;
  }, [apiApplications, searchQuery, filters]);

  // Calculate pagination based on active tab
  const currentData =
    activeTab === "Users"
      ? filteredUsers
      : activeTab === "Drivers"
      ? filteredDrivers
      : filteredRequests;

  // Use API pagination for users, drivers, and requests
  const totalPages =
    activeTab === "Users"
      ? apiTotalPages
      : activeTab === "Drivers"
      ? driverTotalPages
      : Math.ceil(totalApplications / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  // For users, drivers, and requests, use the data from API (already paginated)
  const currentUsers =
    activeTab === "Users"
      ? filteredUsers
      : filteredUsers.slice(startIndex, endIndex);
  const currentDrivers =
    activeTab === "Drivers"
      ? filteredDrivers
      : filteredDrivers.slice(startIndex, endIndex);
  const currentRequests =
    activeTab === "Requests"
      ? filteredRequests
      : filteredRequests.slice(startIndex, endIndex);

  // Reset to page 1 when search results change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleApproveRequest = async (requestId: string) => {
    await processDriverApplication(requestId, "approve");
  };

  const handleDeclineRequest = async (requestId: string) => {
    await processDriverApplication(requestId, "reject");
  };

  // Get tab labels with counts
  const tabLabels =
    totalApplications > 0
      ? ["Users", "Drivers", `Requests (${totalApplications})`]
      : ["Users", "Drivers"];

  return (
    <DashboardLayout>
      <h1 className="page-header">{activeTab}</h1>

      <TabSwitcher
        tabs={tabLabels}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <div className="table-header">
        <FilterButton
          onClick={handleFilterClick}
          isOpen={isFilterOpen}
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
          onRefresh={handleRefreshUsers}
        />
      ) : activeTab === "Drivers" ? (
        <DriversTable
          drivers={currentDrivers}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onRefresh={handleRefreshDrivers}
        />
      ) : (
        <RequestsTable
          requests={currentRequests}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onApprove={handleApproveRequest}
          onDecline={handleDeclineRequest}
          onRefresh={handleRefreshApplications}
        />
      )}
    </DashboardLayout>
  );
};

export default Users;
