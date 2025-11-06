"use client";

import { IoFilterOutline } from "react-icons/io5";

interface FilterButtonProps {
  onClick?: () => void;
  hasActiveFilters?: boolean;
}

const FilterButton = ({
  onClick,
  hasActiveFilters = false,
}: FilterButtonProps) => {
  return (
    <button
      className={`filter-button ${
        hasActiveFilters ? "filter-button--active" : ""
      }`}
      onClick={onClick}
    >
      <IoFilterOutline />
      <span>Filter</span>
      {hasActiveFilters && <span className="filter-button__badge"></span>}
    </button>
  );
};

export default FilterButton;
