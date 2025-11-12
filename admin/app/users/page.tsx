"use client";

import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import TabSwitcher from "../components/TabSwitcher";
import FilterButton from "../components/FilterButton";
import SearchBar from "../components/SearchBar";
import UsersTable from "../components/Users/UsersTable";
import DriversTable from "../components/Drivers/DriversTable";
import RequestsTable from "../components/Requests/RequestsTable";
import FilterDrawer, { FilterValues } from "../components/FilterDrawer";
import { requestsData } from "../data/requests";
import { useUserContext } from "../context/UserContext";
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

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let result = [...apiUsers];
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.phone && user.phone.includes(query))
      );
    }
    // Apply status filter
    if (filters.status) {
      result = result.filter((user) => {
        if (filters.status === "Online")
          return user.is_online && !user.is_blocked;
        if (filters.status === "Offline")
          return !user.is_online && !user.is_blocked;
        if (filters.status === "Suspended") return user.is_blocked;
        return true;
      });
    }
    // Optionally add sorting here if needed
    return result;
  }, [apiUsers, searchQuery, filters]);

  const currentUsers = filteredUsers;

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

  // No display mapping for users; use apiUsers directly

  // Filter and sort drivers (using real Driver fields)
  const filteredDrivers = useMemo(() => {
    let result = [...apiDrivers];
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (driver) =>
          driver.user.name.toLowerCase().includes(query) ||
          driver.user.email.toLowerCase().includes(query) ||
          (driver.user.phone && driver.user.phone.includes(query)) ||
          driver.vehicle_type.toLowerCase().includes(query) ||
          (driver.vehicle.brand &&
            driver.vehicle.brand.toLowerCase().includes(query)) ||
          (driver.vehicle.model &&
            driver.vehicle.model.toLowerCase().includes(query))
      );
    }
    // Apply status filter
    if (filters.status) {
      result = result.filter((driver) => {
        if (filters.status === "Online")
          return driver.is_online && !driver.is_blocked;
        if (filters.status === "Offline")
          return !driver.is_online && !driver.is_blocked;
        if (filters.status === "Suspended") return driver.is_blocked;
        return true;
      });
    }
    // Optionally add sorting here if needed
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

  // Calculate pagination based on active tab (for drivers/requests only)

  const totalPages =
    activeTab === "Users"
      ? apiTotalPages
      : activeTab === "Drivers"
      ? driverTotalPages
      : Math.ceil(apiApplications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  // For drivers, use filtered and paginated data
  const currentDrivers = filteredDrivers.slice(startIndex, endIndex);
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
    apiApplications.length > 0
      ? ["Users", "Drivers", `Requests (${apiApplications.length})`]
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
