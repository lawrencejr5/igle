"use client";

import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import CustomDropdown from "./CustomDropdown";

export interface FilterValues {
  status: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
}

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
  currentFilters: FilterValues;
}

const FilterDrawer = ({
  isOpen,
  onClose,
  onApply,
  currentFilters,
}: FilterDrawerProps) => {
  const [filters, setFilters] = useState<FilterValues>(currentFilters);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterValues = {
      status: "",
      dateFrom: "",
      dateTo: "",
      sortBy: "",
    };
    setFilters(resetFilters);
    onApply(resetFilters);
    onClose();
  };

  const handleChange = (field: keyof FilterValues, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className={`filter-drawer ${isOpen ? "filter-drawer--open" : ""}`}>
      <div className="filter-drawer__body">
        {/* Status Filter */}
        <div className="filter-drawer__field filter-drawer__field--status">
          <label className="filter-drawer__label">Status</label>
          <CustomDropdown
            options={[
              { value: "", label: "All Statuses" },
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
              { value: "Suspended", label: "Suspended" },
            ]}
            value={filters.status}
            onChange={(value) => handleChange("status", value)}
            placeholder="Select status"
          />
        </div>

        {/* Date Joined Range */}
        <div className="filter-drawer__field filter-drawer__field--date">
          <label className="filter-drawer__label">Date Joined</label>
          <div className="filter-drawer__date-range">
            <input
              type="date"
              className="filter-drawer__input"
              placeholder="From"
              value={filters.dateFrom}
              onChange={(e) => handleChange("dateFrom", e.target.value)}
            />
            <span className="filter-drawer__date-separator">to</span>
            <input
              type="date"
              className="filter-drawer__input"
              placeholder="To"
              value={filters.dateTo}
              onChange={(e) => handleChange("dateTo", e.target.value)}
            />
          </div>
        </div>

        {/* Sort Filter */}
        <div className="filter-drawer__field filter-drawer__field--sort">
          <label className="filter-drawer__label">Sort By</label>
          <CustomDropdown
            options={[
              { value: "", label: "Default" },
              { value: "name-asc", label: "Name (A-Z)" },
              { value: "name-desc", label: "Name (Z-A)" },
              { value: "rides-desc", label: "Most Rides" },
              { value: "rides-asc", label: "Least Rides" },
              { value: "deliveries-desc", label: "Most Deliveries" },
              { value: "deliveries-asc", label: "Least Deliveries" },
            ]}
            value={filters.sortBy}
            onChange={(value) => handleChange("sortBy", value)}
            placeholder="Select sort order"
          />
        </div>

        {/* Action Buttons */}
        <div className="filter-drawer__footer">
          <button
            className="filter-drawer__button filter-drawer__button--reset"
            onClick={handleReset}
          >
            Reset
          </button>
          <button
            className="filter-drawer__button filter-drawer__button--apply"
            onClick={handleApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterDrawer;
