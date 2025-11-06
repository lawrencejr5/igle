"use client";

import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="pagination">
      <button
        className="pagination__button"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <MdNavigateBefore />
      </button>

      <span className="pagination__info">
        Page {currentPage} of {totalPages}
      </span>

      <button
        className="pagination__button"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <MdNavigateNext />
      </button>
    </div>
  );
};

export default Pagination;
