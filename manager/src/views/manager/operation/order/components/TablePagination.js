import React from 'react';
import { Pagination } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const TablePagination = ({ paginationProps }) => {
  const {
    gotoPage,
    canPreviousPage,
    previousPage,
    pageCount,
    nextPage,
    canNextPage,
    pageIndex,
  } = paginationProps;

  if (pageCount <= 1) {
    return <></>;
  }

  // Helper function to generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (pageCount <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 0; i < pageCount; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Show first page, last page, current page and surrounding pages
    if (pageIndex < 3) {
      // Near the beginning
      for (let i = 0; i < 4; i++) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(pageCount - 1);
    } else if (pageIndex > pageCount - 4) {
      // Near the end
      pages.push(0);
      pages.push('ellipsis');
      for (let i = pageCount - 4; i < pageCount; i++) {
        pages.push(i);
      }
    } else {
      // In the middle
      pages.push(0);
      pages.push('ellipsis');
      pages.push(pageIndex - 1);
      pages.push(pageIndex);
      pages.push(pageIndex + 1);
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
        onClick={() => gotoPage(0)}
        disabled={!canPreviousPage}
      >
        <CsLineIcons icon="arrow-double-left" />
      </Pagination.First>
      <Pagination.Prev
        className="shadow"
        disabled={!canPreviousPage}
        onClick={() => previousPage()}
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
            active={pageIndex === page}
            onClick={() => gotoPage(page)}
          >
            {page + 1}
          </Pagination.Item>
        )
      )}

      <Pagination.Next
        className="shadow"
        onClick={() => nextPage()}
        disabled={!canNextPage}
      >
        <CsLineIcons icon="chevron-right" />
      </Pagination.Next>
      <Pagination.Last
        className="shadow"
        onClick={() => gotoPage(pageCount - 1)}
        disabled={!canNextPage}
      >
        <CsLineIcons icon="arrow-double-right" />
      </Pagination.Last>
    </Pagination>
  );
};

export default TablePagination;