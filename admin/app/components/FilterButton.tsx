"use client";

import { IoFilterOutline } from "react-icons/io5";

interface FilterButtonProps {
  onClick?: () => void;
}

const FilterButton = ({ onClick }: FilterButtonProps) => {
  return (
    <button className="filter-button" onClick={onClick}>
      <IoFilterOutline />
      <span>Filter</span>
    </button>
  );
};

export default FilterButton;
