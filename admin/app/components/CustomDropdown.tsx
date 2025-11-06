"use client";

import { useState, useRef, useEffect } from "react";
import { IoChevronDown } from "react-icons/io5";
import { IoCheckmark } from "react-icons/io5";

interface Option {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const CustomDropdown = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
}: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className={`custom-dropdown__trigger ${
          isOpen ? "custom-dropdown__trigger--open" : ""
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className={`custom-dropdown__text ${
            !value ? "custom-dropdown__text--placeholder" : ""
          }`}
        >
          {displayText}
        </span>
        <IoChevronDown
          className={`custom-dropdown__arrow ${
            isOpen ? "custom-dropdown__arrow--open" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="custom-dropdown__menu">
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`custom-dropdown__option ${
                value === option.value
                  ? "custom-dropdown__option--selected"
                  : ""
              }`}
              onClick={() => handleSelect(option.value)}
            >
              <span>{option.label}</span>
              {value === option.value && (
                <IoCheckmark className="custom-dropdown__checkmark" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
