"use client";

import { IoFilterOutline, IoClose } from "react-icons/io5";

interface FilterButtonProps {
  onClick?: () => void;
  hasActiveFilters?: boolean;
  isOpen?: boolean;
}

const FilterButton = ({
  onClick,
  hasActiveFilters = false,
  isOpen = false,
}: FilterButtonProps) => {
  return (
    <button
      className={`filter-button ${
        hasActiveFilters ? "filter-button--active" : ""
      } ${isOpen ? "filter-button--open" : ""}`}
      onClick={onClick}
    >
      {isOpen ? <IoClose /> : <IoFilterOutline />}
      <span>Filter</span>
      {hasActiveFilters && <span className="filter-button__badge"></span>}
    </button>
  );
};

export default FilterButton;
