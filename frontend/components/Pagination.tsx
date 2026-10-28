import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('…', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '…');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, '…', currentPage - 1, currentPage, currentPage + 1, '…', totalPages);
    }

    return pages;
  };

  const navBtn =
    'border border-ink/12 bg-white px-3.5 py-2 text-sm font-medium text-ink/70 transition-colors hover:border-ink/25 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="my-10 flex flex-wrap items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={navBtn}
      >
        Anterior
      </button>

      <div className="flex gap-1">
        {getPageNumbers().map((page, index) =>
          typeof page === 'number' ? (
            <button
              key={index}
              onClick={() => onPageChange(page)}
              className={`h-10 min-w-[2.5rem] px-2 text-sm font-semibold transition-colors ${
                page === currentPage
                  ? 'bg-primary-500 text-ink'
                  : 'border border-ink/10 bg-white text-ink/65 hover:border-ink/25'
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={index} className="flex h-10 w-8 items-center justify-center text-ink/35">
              {page}
            </span>
          )
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={navBtn}
      >
        Próxima
      </button>
    </div>
  );
}
