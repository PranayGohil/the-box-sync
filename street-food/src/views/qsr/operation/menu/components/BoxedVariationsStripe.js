import React from 'react';
import { useHistory } from 'react-router-dom';
import { Col, Row, Badge, Button } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy, usePagination } from 'react-table';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import Table from './Table';
import TablePagination from './TablePagination';
import ControlsSearch from './ControlsSearch';
import ControlsPageSize from './ControlsPageSize';

const BoxedVariationsStripe = ({ columns, data, category, setEditCategoryModalShow, setSelectedCategory }) => {
  const history = useHistory();
  const tableInstance = useTable(
    { columns, data, initialState: { pageIndex: 0, sortBy: [{ id: 'name', desc: true }] } },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom" style={{ borderColor: 'rgba(35, 179, 244, 0.1)' }}>
        <div>
          <h5 className="mb-1 fw-bold text-dark" style={{ letterSpacing: '-0.01em' }}>{category.category}</h5>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="link"
            size="sm"
            className="p-1 text-muted manage-menu-custom-icon-btn"
            onClick={() => {
              setEditCategoryModalShow(true);
              setSelectedCategory(category);
            }}
            title="Edit Category"
          >
            <CsLineIcons icon="edit" size="16" />
          </Button>
          <Button
            variant="link"
            size="sm"
            className="p-1 manage-menu-text-primary manage-menu-custom-icon-btn"
            onClick={() => {
              history.push('/operations/add-dish', {
                category: category.category,
                fromManageMenu: true,
              });
            }}
            title="Add More Dishes"
          >
            <CsLineIcons icon="plus" size="16" stroke="#23b3f4" />
          </Button>
        </div>
      </div>

      <Row className="g-2 mb-3 d-none d-md-flex">
        <Col sm="12" md="8">
          <ControlsSearch tableInstance={tableInstance} />
        </Col>
        <Col sm="12" md="4" className="d-flex justify-content-md-end">
          <ControlsPageSize tableInstance={tableInstance} />
        </Col>
      </Row>

      <Row>
        <Col xs="12">
          <Table className="react-table nowrap stripe" tableInstance={tableInstance} />
        </Col>
        <Col xs="12" className="mt-3">
          <TablePagination tableInstance={tableInstance} />
        </Col>
      </Row>
    </>
  );
};

export default BoxedVariationsStripe;
