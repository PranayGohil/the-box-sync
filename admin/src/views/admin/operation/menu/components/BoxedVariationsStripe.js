import React from 'react';
import { Col, Row } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy, usePagination } from 'react-table';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import bootstrapIcons from 'views/interface/content/icons/data/bootstrap-icons-tags';
import Table from './Table';
import TablePagination from './TablePagination';
import ControlsSearch from './ControlsSearch';
import ControlsPageSize from './ControlsPageSize';



const BoxedVariationsStripe = ({ columns, data, category }) => {

  const eggIcon = bootstrapIcons.find((icon) => icon.c === 'bi-egg');

  const tableInstance = useTable(
    { columns, data, initialState: { pageIndex: 0, sortBy: [{ id: 'name', desc: true }] } },
    useGlobalFilter,
    useSortBy,
    usePagination
  );



  // Meal type icon helper
  const getMealIcon = (mealType) => {
    if (mealType === 'veg') return <CsLineIcons icon="leaf" width="20" height="20" className="me-2 text-success" />;
    if (mealType === 'non-veg') return <CsLineIcons icon="bone" width="20" height="20" className="me-2 text-danger" />;
    return <i className={`bi ${eggIcon.c}`} />;
  };

  return (
    <>
      <Row>
        <Col sm="12" md="12" lg="12" xxl="12" className="mb-1">
          {getMealIcon(category.meal_type)}
          {category && <h5 className="mb-2">{category}</h5>}
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
