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

  // Apply client-side sorting only (filtering/search now handled by backend)
  const displayUsers = useMemo(() => {
    let result = [...apiUsers];

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case "name-asc":
          result.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "name-desc":
          result.sort((a, b) => b.name.localeCompare(a.name));
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
  }, [apiUsers, filters.sortBy]);

  // Fetch applications on mount to ensure Requests tab visibility is accurate
  useEffect(() => {
    fetchDriverApplications(1, ITEMS_PER_PAGE);
  }, []);

  // Fetch users when component mounts or page/search/filters change
  useEffect(() => {
    if (activeTab === "Users") {
      const filterParams: any = {};
      if (filters.status) filterParams.status = filters.status;
      if (filters.dateFrom) filterParams.dateFrom = filters.dateFrom;
      if (filters.dateTo) filterParams.dateTo = filters.dateTo;
      if (searchQuery.trim()) filterParams.search = searchQuery.trim();

      fetchUsers(currentPage, ITEMS_PER_PAGE, false, filterParams);
    } else if (activeTab === "Drivers") {
      const filterParams: any = {};
      if (filters.status) filterParams.status = filters.status;
      if (filters.dateFrom) filterParams.dateFrom = filters.dateFrom;
      if (filters.dateTo) filterParams.dateTo = filters.dateTo;
      if (searchQuery.trim()) filterParams.search = searchQuery.trim();

      fetchDrivers(currentPage, ITEMS_PER_PAGE, false, filterParams);
    } else if (activeTab === "Requests") {
      fetchDriverApplications(currentPage, ITEMS_PER_PAGE);
    }
  }, [activeTab, currentPage, searchQuery, filters]);

  const handleRefreshUsers = () => {
    const filterParams: any = {};
    if (filters.status) filterParams.status = filters.status;
    if (filters.dateFrom) filterParams.dateFrom = filters.dateFrom;
    if (filters.dateTo) filterParams.dateTo = filters.dateTo;
    if (searchQuery.trim()) filterParams.search = searchQuery.trim();

    fetchUsers(currentPage, ITEMS_PER_PAGE, false, filterParams);
  };

  const handleRefreshDrivers = () => {
    const filterParams: any = {};
    if (filters.status) filterParams.status = filters.status;
    if (filters.dateFrom) filterParams.dateFrom = filters.dateFrom;
    if (filters.dateTo) filterParams.dateTo = filters.dateTo;
    if (searchQuery.trim()) filterParams.search = searchQuery.trim();

    fetchDrivers(currentPage, ITEMS_PER_PAGE, false, filterParams);
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

  // Apply client-side sorting only for drivers (filtering/search now handled by backend)
  const displayDrivers = useMemo(() => {
    let result = [...apiDrivers];

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case "name-asc":
          result.sort((a, b) => a.user.name.localeCompare(b.user.name));
          break;
        case "name-desc":
          result.sort((a, b) => b.user.name.localeCompare(a.user.name));
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
  }, [apiDrivers, filters.sortBy]);

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
          users={displayUsers}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onRefresh={handleRefreshUsers}
        />
      ) : activeTab === "Drivers" ? (
        <DriversTable
          drivers={displayDrivers}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onRefresh={handleRefreshDrivers}
        />
      ) : (
        <RequestsTable
          requests={filteredRequests}
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
