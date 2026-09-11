"use client";

import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import FilterButton from "../components/FilterButton";
import SearchBar from "../components/SearchBar";
import FilterDrawer, { FilterValues } from "../components/FilterDrawer";
import FoodOrdersTable from "../components/FoodOrders/FoodOrdersTable";
import FoodOrderDetailModal from "../components/FoodOrders/FoodOrderDetailModal";
import FoodOrderStatusModal from "../components/FoodOrders/FoodOrderStatusModal";
import ConfirmModal from "../components/ConfirmModal";
import {
  useFoodOrderContext,
  FoodOrder,
  FoodOrderStatus,
} from "../context/FoodOrderContext";

const ITEMS_PER_PAGE = 10;

const FoodOrdersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    status: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "",
  });

  // Modal state
  const [viewingOrder, setViewingOrder] = useState<FoodOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<FoodOrder | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<{
    order: FoodOrder;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    order: FoodOrder;
  } | null>(null);

  const {
    orders,
    totalPages: apiTotalPages,
    loading,
    fetchFoodOrders,
    fetchFoodOrderById,
    updateFoodOrderStatus,
    cancelFoodOrder,
    deleteFoodOrder,
  } = useFoodOrderContext();

  useEffect(() => {
    const params: any = {};
    if (filters.status) params.status = filters.status;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    fetchFoodOrders(currentPage, ITEMS_PER_PAGE, params);
  }, [currentPage, searchQuery, filters]);

  const hasActiveFilters = useMemo(
    () =>
      filters.status !== "" ||
      filters.dateFrom !== "" ||
      filters.dateTo !== "" ||
      filters.sortBy !== "",
    [filters],
  );

  const displayOrders = useMemo(() => {
    let result = [...orders];
    if (filters.sortBy === "date-desc")
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    else if (filters.sortBy === "date-asc")
      result.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    else if (filters.sortBy === "total-desc")
      result.sort((a, b) => b.pricing.total - a.pricing.total);
    else if (filters.sortBy === "total-asc")
      result.sort((a, b) => a.pricing.total - b.pricing.total);
    return result;
  }, [orders, filters.sortBy]);

  const handleRefresh = () => {
    const params: any = {};
    if (filters.status) params.status = filters.status;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    fetchFoodOrders(currentPage, ITEMS_PER_PAGE, params);
  };

  const handleView = async (order: FoodOrder) => {
    await fetchFoodOrderById(order._id);
    setViewingOrder(order);
  };

  const handleStatusUpdate = async (id: string, status: FoodOrderStatus) => {
    const success = await updateFoodOrderStatus(id, status);
    if (success) {
      setEditingOrder(null);
      handleRefresh();
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelConfirm) return;
    const success = await cancelFoodOrder(
      cancelConfirm.order._id,
      "Cancelled by admin",
    );
    if (success) {
      setCancelConfirm(null);
      handleRefresh();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    const success = await deleteFoodOrder(deleteConfirm.order._id);
    if (success) {
      setDeleteConfirm(null);
      handleRefresh();
    }
  };

  return (
    <DashboardLayout>
      <h1 className="page-header">Food Orders</h1>

      <div className="table-header">
        <FilterButton
          onClick={() => setIsFilterOpen((p) => !p)}
          isOpen={isFilterOpen}
          hasActiveFilters={hasActiveFilters}
        />
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by order number..."
        />
      </div>

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={(f) => {
          setFilters(f);
          setCurrentPage(1);
        }}
        currentFilters={filters}
        statusOptions={[
          { value: "", label: "All Statuses" },
          { value: "placed", label: "Placed" },
          { value: "preparing", label: "Preparing" },
          { value: "ready_for_pickup", label: "Ready for Pickup" },
          { value: "in_transit", label: "In Transit" },
          { value: "delivered", label: "Delivered" },
          { value: "cancelled", label: "Cancelled" },
          { value: "rejected", label: "Rejected" },
        ]}
        sortOptions={[
          { value: "", label: "Default" },
          { value: "date-desc", label: "Newest First" },
          { value: "date-asc", label: "Oldest First" },
          { value: "total-desc", label: "Highest Total" },
          { value: "total-asc", label: "Lowest Total" },
        ]}
        dateLabel="Order Date"
      />

      <FoodOrdersTable
        orders={displayOrders}
        currentPage={currentPage}
        totalPages={apiTotalPages}
        onPageChange={setCurrentPage}
        onRefresh={handleRefresh}
        onView={handleView}
        onEdit={(order) => setEditingOrder(order)}
        onCancel={(order) => setCancelConfirm({ order })}
        onDelete={(order) => setDeleteConfirm({ order })}
      />

      {/* Detail Modal */}
      {viewingOrder && (
        <FoodOrderDetailModal
          order={viewingOrder}
          onClose={() => setViewingOrder(null)}
        />
      )}

      {/* Edit Status Modal */}
      {editingOrder && (
        <FoodOrderStatusModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onConfirm={handleStatusUpdate}
        />
      )}

      {/* Cancel Confirm */}
      <ConfirmModal
        isOpen={!!cancelConfirm}
        title="Cancel Food Order"
        message={`Are you sure you want to cancel order #${cancelConfirm?.order.order_number}? The customer will be refunded ₦${cancelConfirm?.order.pricing.total.toLocaleString()} to their wallet.`}
        confirmText="Cancel Order"
        variant="danger"
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelConfirm(null)}
      />

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Delete Food Order"
        message={`Are you sure you want to permanently delete order #${deleteConfirm?.order.order_number}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
      />
    </DashboardLayout>
  );
};

export default FoodOrdersPage;
