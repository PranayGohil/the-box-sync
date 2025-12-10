import React from 'react';
import { useHistory } from 'react-router-dom';
import { Col, Row } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy, usePagination } from 'react-table';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import Table from './Table';
import TablePagination from './TablePagination';
import ControlsSearch from './ControlsSearch';
import ControlsPageSize from './ControlsPageSize';


const BoxedVariationsStripe = ({ columns, data, table, setSelectedTableArea, setEditTableAreaModalShow }) => {
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
        <Col sm="12" md="12" lg="12" xxl="12" className="mb-1">
          {table.area && <div className='d-flex justify-content-between'>
            <h5 className="mb-2">{table.area}</h5>
            <div>
              <button
                type="button"
                className="btn btn-sm btn-icon btn-outline-primary"
                onClick={() => {
                  setSelectedTableArea(table);
                  setEditTableAreaModalShow(true);
                }}
              >
                <CsLineIcons icon="edit" />
              </button>
              <button
                type="button"
                className="btn btn-sm btn-icon btn-outline-success mx-2"
                onClick={() => {
                  history.push('/operations/add-table', {
                    area: table.area,
                    fromManageTable: true,
                  });
                }}
              >
                <CsLineIcons icon="plus" />
              </button>
            </div>
          </div>}
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
