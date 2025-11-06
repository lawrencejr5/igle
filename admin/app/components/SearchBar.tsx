"use client";

import { IoSearchOutline } from "react-icons/io5";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar = ({
  value,
  onChange,
  placeholder = "Search users...",
}: SearchBarProps) => {
  return (
    <div className="search-bar">
      <IoSearchOutline className="search-bar__icon" />
      <input
        type="text"
        className="search-bar__input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
