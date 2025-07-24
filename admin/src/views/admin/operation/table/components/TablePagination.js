import React from 'react';
import { Pagination } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const TablePagination = ({ tableInstance }) => {
  const {
    gotoPage,
    canPreviousPage,
    previousPage,
    pageCount,
    nextPage,
    canNextPage,
    state: { pageIndex },
  } = tableInstance;

  if (pageCount === 1) {
    return <></>;
  }

  return (
    <Pagination size="sm" className="justify-content-center mb-0 mt-3">
      <Pagination.First onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
        <CsLineIcons icon="arrow-double-left" />
      </Pagination.First>
      <Pagination.Prev disabled={!canPreviousPage} onClick={() => previousPage()}>
        <CsLineIcons icon="chevron-left" />
      </Pagination.Prev>
      {[...Array(pageCount)].map((x, i) => (
        <Pagination.Item key={`pagination${i}`} active={pageIndex === i} onClick={() => gotoPage(i)}>
          {i + 1}
        </Pagination.Item>
      ))}
      <Pagination.Next onClick={() => nextPage()} disabled={!canNextPage}>
        <CsLineIcons icon="chevron-right" />
      </Pagination.Next>
      <Pagination.Last onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
        <CsLineIcons icon="arrow-double-right" />
      </Pagination.Last>
    </Pagination>
  );
};

export default TablePagination;