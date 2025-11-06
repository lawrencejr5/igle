"use client";

import { useState, useMemo } from "react";
import DashboardLayout from "../components/DashboardLayout";
import TabSwitcher from "../components/TabSwitcher";
import FilterButton from "../components/FilterButton";
import SearchBar from "../components/SearchBar";
import ReportsTable from "../components/ReportsTable";
import FeedbacksTable from "../components/FeedbacksTable";
import FilterDrawer, { FilterValues } from "../components/FilterDrawer";
import { reportsData } from "../data/reports";
import { feedbacksData } from "../data/feedbacks";

const ITEMS_PER_PAGE = 10;

const ReportAndFeedbacks = () => {
  const [activeTab, setActiveTab] = useState<"Reports" | "Feedbacks">(
    "Reports"
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
    setActiveTab(tab as "Reports" | "Feedbacks");
    setCurrentPage(1); // Reset to first page when switching tabs
    setSearchQuery(""); // Clear search query
    setFilters({
      status: "",
      dateFrom: "",
      dateTo: "",
      sortBy: "",
    }); // Reset filters
  };

  // Filter and sort reports
  const filteredReports = useMemo(() => {
    let result = [...reportsData];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (report) =>
          report._id.toLowerCase().includes(query) ||
          report.driver.fullname.toLowerCase().includes(query) ||
          (report.reporter &&
            report.reporter.fullname.toLowerCase().includes(query)) ||
          report.category.toLowerCase().includes(query) ||
          (report.description &&
            report.description.toLowerCase().includes(query)) ||
          report.status.toLowerCase().includes(query) ||
          (report.ride && report.ride._id.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (filters.status) {
      result = result.filter((report) => report.status === filters.status);
    }

    // Apply date range filter
    if (filters.dateFrom) {
      result = result.filter(
        (report) => new Date(report.createdAt) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      result = result.filter(
        (report) => new Date(report.createdAt) <= new Date(filters.dateTo)
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case "name-asc":
          result.sort((a, b) =>
            a.driver.fullname.localeCompare(b.driver.fullname)
          );
          break;
        case "name-desc":
          result.sort((a, b) =>
            b.driver.fullname.localeCompare(a.driver.fullname)
          );
          break;
        case "rides-desc":
        case "deliveries-desc":
          result.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        case "rides-asc":
        case "deliveries-asc":
          result.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          break;
      }
    }

    return result;
  }, [searchQuery, filters]);

  // Filter and sort feedbacks
  const filteredFeedbacks = useMemo(() => {
    let result = [...feedbacksData];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (feedback) =>
          feedback._id.toLowerCase().includes(query) ||
          (feedback.user &&
            feedback.user.fullname.toLowerCase().includes(query)) ||
          feedback.type.toLowerCase().includes(query) ||
          feedback.message.toLowerCase().includes(query) ||
          (feedback.contact && feedback.contact.toLowerCase().includes(query))
      );
    }

    // Apply type filter (reusing status filter for feedback type)
    if (filters.status) {
      result = result.filter((feedback) => feedback.type === filters.status);
    }

    // Apply date range filter
    if (filters.dateFrom) {
      result = result.filter(
        (feedback) => new Date(feedback.createdAt) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      result = result.filter(
        (feedback) => new Date(feedback.createdAt) <= new Date(filters.dateTo)
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case "name-asc":
          result.sort((a, b) => {
            const nameA = a.user?.fullname || "Anonymous";
            const nameB = b.user?.fullname || "Anonymous";
            return nameA.localeCompare(nameB);
          });
          break;
        case "name-desc":
          result.sort((a, b) => {
            const nameA = a.user?.fullname || "Anonymous";
            const nameB = b.user?.fullname || "Anonymous";
            return nameB.localeCompare(nameA);
          });
          break;
        case "rides-desc":
        case "deliveries-desc":
          result.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        case "rides-asc":
        case "deliveries-asc":
          result.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          break;
      }
    }

    return result;
  }, [searchQuery, filters]);

  // Calculate pagination based on active tab
  const currentData =
    activeTab === "Reports" ? filteredReports : filteredFeedbacks;
  const totalPages = Math.ceil(currentData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentReports = filteredReports.slice(startIndex, endIndex);
  const currentFeedbacks = filteredFeedbacks.slice(startIndex, endIndex);

  // Reset to page 1 when search results change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <DashboardLayout>
      <h1 className="page-header">{activeTab}</h1>

      <TabSwitcher
        tabs={["Reports", "Feedbacks"]}
        onTabChange={handleTabChange}
      />

      <div className="table-header">
        <FilterButton
          onClick={handleFilterClick}
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

      {activeTab === "Reports" ? (
        <ReportsTable
          reports={currentReports}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      ) : (
        <FeedbacksTable
          feedbacks={currentFeedbacks}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </DashboardLayout>
  );
};

export default ReportAndFeedbacks;
