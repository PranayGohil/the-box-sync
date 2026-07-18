import React from 'react';
import { Pagination } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const ReportPagination = ({ currentPage, totalPages, onChangePage }) => {
  if (totalPages <= 1) {
    return <></>;
  }

  // Helper to generate page numbers with ellipsis (same logic as TablePagination)
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 4;
    const zeroBasedIndex = currentPage - 1;
    const pageCount = totalPages;

    if (pageCount <= maxPagesToShow) {
      for (let i = 0; i < pageCount; i++) {
        pages.push(i);
      }
      return pages;
    }

    if (zeroBasedIndex < 3) {
      for (let i = 0; i < 3; i++) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(pageCount - 1);
    } else if (zeroBasedIndex > pageCount - 3) {
      pages.push(0);
      pages.push('ellipsis');
      for (let i = pageCount - 3; i < pageCount; i++) {
        pages.push(i);
      }
    } else {
      pages.push(0);
      pages.push('ellipsis');
      pages.push(zeroBasedIndex - 1);
      pages.push(zeroBasedIndex);
      pages.push(zeroBasedIndex + 1);
      pages.push('ellipsis');
      pages.push(pageCount - 1);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <Pagination className="justify-content-center mb-0 mt-3">
      <Pagination.First
        className="shadow"
        onClick={() => onChangePage(1)}
        disabled={currentPage === 1}
      >
        <CsLineIcons icon="arrow-double-left" />
      </Pagination.First>
      <Pagination.Prev
        className="shadow"
        disabled={currentPage === 1}
        onClick={() => onChangePage(Math.max(1, currentPage - 1))}
      >
        <CsLineIcons icon="chevron-left" />
      </Pagination.Prev>

      {pageNumbers.map((page, index) =>
        page === 'ellipsis' ? (
          <Pagination.Ellipsis key={`ellipsis-${index}`} disabled />
        ) : (
          <Pagination.Item
            key={`pagination-${page}`}
            className="shadow"
            active={currentPage === (page + 1)}
            onClick={() => onChangePage(page + 1)}
          >
            {page + 1}
          </Pagination.Item>
        )
      )}

      <Pagination.Next
        className="shadow"
        onClick={() => onChangePage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <CsLineIcons icon="chevron-right" />
      </Pagination.Next>
      <Pagination.Last
        className="shadow"
        onClick={() => onChangePage(totalPages)}
        disabled={currentPage === totalPages}
      >
        <CsLineIcons icon="arrow-double-right" />
      </Pagination.Last>
    </Pagination>
  );
};

export default ReportPagination;
