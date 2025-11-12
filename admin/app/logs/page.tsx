"use client";

import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import TabSwitcher from "../components/TabSwitcher";
import FilterButton from "../components/FilterButton";
import SearchBar from "../components/SearchBar";
import ReportsTable from "../components/Reports/ReportsTable";
import FeedbacksTable from "../components/Feedbacks/FeedbacksTable";
import FilterDrawer, { FilterValues } from "../components/FilterDrawer";
import { useReportContext } from "../context/ReportContext";
import { useFeedbackContext } from "../context/FeedbackContext";

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

  const {
    reports,
    totalPages: reportTotalPages,
    fetchReports,
    updateReportStatus,
    deleteReport,
  } = useReportContext();

  const {
    feedbacks,
    totalPages: feedbackTotalPages,
    fetchFeedbacks,
    deleteFeedback,
  } = useFeedbackContext();

  // Fetch reports on mount and when filters/page changes
  useEffect(() => {
    if (activeTab === "Reports") {
      fetchReports(currentPage, ITEMS_PER_PAGE, {
        status: filters.status,
      });
    } else if (activeTab === "Feedbacks") {
      fetchFeedbacks(currentPage, ITEMS_PER_PAGE, {
        type: filters.status,
      });
    }
  }, [activeTab, currentPage, filters.status]);

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

  const handleUpdateStatus = async (
    reportId: string,
    status: "new" | "investigating" | "resolved" | "dismissed"
  ) => {
    await updateReportStatus(reportId, status);
  };

  const handleDeleteReport = async (reportId: string) => {
    await deleteReport(reportId);
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    await deleteFeedback(feedbackId);
  };

  // Filter and sort reports (client-side filtering on top of server data)
  const filteredReports = useMemo(() => {
    let result = [...reports];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (report) =>
          report._id.toLowerCase().includes(query) ||
          report.driver.user.name.toLowerCase().includes(query) ||
          (report.reporter &&
            report.reporter.name.toLowerCase().includes(query)) ||
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
            a.driver.user.name.localeCompare(b.driver.user.name)
          );
          break;
        case "name-desc":
          result.sort((a, b) =>
            b.driver.user.name.localeCompare(a.driver.user.name)
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
  }, [reports, searchQuery, filters]);

  // Filter and sort feedbacks (client-side filtering on top of server data)
  const filteredFeedbacks = useMemo(() => {
    let result = [...feedbacks];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (feedback) =>
          feedback._id.toLowerCase().includes(query) ||
          (feedback.user && feedback.user.name.toLowerCase().includes(query)) ||
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
            const nameA = a.user?.name || "Anonymous";
            const nameB = b.user?.name || "Anonymous";
            return nameA.localeCompare(nameB);
          });
          break;
        case "name-desc":
          result.sort((a, b) => {
            const nameA = a.user?.name || "Anonymous";
            const nameB = b.user?.name || "Anonymous";
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
  }, [feedbacks, searchQuery, filters]);

  // Calculate pagination based on active tab
  const totalPages =
    activeTab === "Reports" ? reportTotalPages : feedbackTotalPages;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

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
        statusOptions={
          activeTab === "Reports"
            ? [
                { value: "", label: "All Statuses" },
                { value: "new", label: "New" },
                { value: "investigating", label: "Investigating" },
                { value: "resolved", label: "Resolved" },
                { value: "dismissed", label: "Dismissed" },
              ]
            : [
                { value: "", label: "All Types" },
                { value: "bug", label: "Bug" },
                { value: "feature", label: "Feature" },
                { value: "general", label: "General" },
              ]
        }
        sortOptions={[
          { value: "", label: "Default" },
          { value: "name-asc", label: "Name (A-Z)" },
          { value: "name-desc", label: "Name (Z-A)" },
          { value: "deliveries-desc", label: "Newest First" },
          { value: "deliveries-asc", label: "Oldest First" },
        ]}
        dateLabel={activeTab === "Reports" ? "Report Date" : "Feedback Date"}
      />

      {activeTab === "Reports" ? (
        <ReportsTable
          reports={filteredReports}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDeleteReport}
        />
      ) : (
        <FeedbacksTable
          feedbacks={filteredFeedbacks}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onDelete={handleDeleteFeedback}
        />
      )}
    </DashboardLayout>
  );
};

export default ReportAndFeedbacks;
