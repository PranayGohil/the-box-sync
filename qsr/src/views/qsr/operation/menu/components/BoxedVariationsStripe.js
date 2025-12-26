import React from 'react';
import { useHistory } from 'react-router-dom';
import { Col, Row, Badge } from 'react-bootstrap';
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
      <Row>
        <Col sm="12" md="12" lg="12" xxl="12" className="mb-2 d-flex align-items-center justify-content-between">
          {category && <h5 className="mb-0">{category.category}</h5>}
          <div className='text-end'>
            <Badge
              variant="outline"
              className={`text-white mb-2 ${category.meal_type === 'veg' ? 'bg-success' : category.meal_type === 'egg' ? 'bg-warning' : 'bg-danger'}`}
            >
              {category.meal_type === 'veg' ? 'Veg' : category.meal_type === 'egg' ? 'Egg' : 'Non-Veg'}
            </Badge>
            <div>
              <button
                type="button"
                className="btn btn-sm btn-icon btn-outline-primary"
                onClick={() => {
                  setEditCategoryModalShow(true);
                  setSelectedCategory(category);
                }}
              >
                <CsLineIcons icon="edit" />
              </button>
              <button
                type="button"
                className="btn btn-sm btn-icon btn-outline-success mx-2"
                onClick={() => {
                  history.push('/operations/add-dish', {
                    category: category.category,
                    mealType: category.meal_type,
                    fromManageMenu: true,   // flag to lock fields
                  });
                }}
              >
                <CsLineIcons icon="plus" />
              </button>
            </div>
          </div>
        </Col>
        <Col sm="12" md="5" lg="3" xxl="2" className="mb-1">
          <div className="d-inline-block float-md-start me-1 search-input-container border border-separator bg-foreground search-sm" style={{ width: '100px' }}>
            <ControlsSearch tableInstance={tableInstance} />
          </div>
        </Col>
        <Col sm="12" md="7" lg="9" xxl="10" className="text-end mb-1">
          <div className="d-inline-block">
            <ControlsPageSize tableInstance={tableInstance} />
          </div>
        </Col>

        <Col xs="12">
          <Table className="react-table nowrap stripe" tableInstance={tableInstance} />
        </Col>
        <Col xs="12">
          <TablePagination tableInstance={tableInstance} />
        </Col>
      </Row>
    </>
  );
};

export default BoxedVariationsStripe;
