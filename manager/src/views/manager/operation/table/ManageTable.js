import React, { useState, useEffect } from 'react';
import { Card, Col, Row, ButtonGroup, Dropdown, Pagination, Modal, Button, Form } from 'react-bootstrap';
import { useFormik } from 'formik';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import BoxedVariationsStripe from './components/BoxedVariationsStripe';
import EditTableModal from './EditTableModal';
import EditTableAreaModal from './EditTableAreaModal';
import DeleteTableModal from './DeleteTableModal';


const ManageTable = () => {
  const title = 'Manage Tables';
  const description = 'React Table responsive boxed variations with search.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/manage-table', title: 'Manage Tables' },
  ];

  const [editTableModalShow, setEditTableModalShow] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [editTableAreaModalShow, setEditTableAreaModalShow] = useState(false);
  const [selectedTableArea, setSelectedTableArea] = useState(null);
  const [deleteTableModalShow, setDeleteTableModalShow] = useState(false);
  const [tableToDelete, setTableToDelete] = useState(null);
  const [tableData, setTableData] = useState([]);

  const fetchTableData = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/table/get-all`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const transformedTables = res.data.data.map(({ _id, ...rest }) => ({
        ...rest,
        id: _id,
      }));
      console.log(transformedTables);
      setTableData(transformedTables);
    } catch (error) {
      console.error('Error fetching table data:', error);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, []);

  return (
    <>
      <HtmlHead title={title} description={description} />
      <Row>
        <Col>
          {/* Title Start */}
          <section className="scroll-section" id="title">
            <div className="page-title-container">
              <h1 className="mb-0 pb-0 display-4">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </div>
          </section>
          {/* Title End */}

          <Row>
            {tableData.map((table) => {
              const transformedData = table.tables.map(({ _id, ...rest }) => ({
                ...rest,
                id: _id,
              }));
              const data = transformedData;

              const columns = [
                {
                  Header: 'Table Number',
                  accessor: 'table_no',
                  Cell: ({ row }) => <span className="ms-3">{row.original.table_no}</span>,
                },
                {
                  Header: 'Max Person',
                  accessor: 'max_person',
                  Cell: ({ row }) => <span className="ms-3">{row.original.max_person}</span>,
                },
                {
                  Header: 'Actions',
                  id: 'actions',
                  Cell: ({ row }) => (
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-icon btn-outline-primary"
                        onClick={() => {
                          setSelectedTable(row.original);
                          setEditTableModalShow(true);
                        }}
                      >
                        <CsLineIcons icon="edit" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-icon btn-outline-danger"
                        onClick={() => {
                          setTableToDelete({ ...row.original, area: table.area });
                          setDeleteTableModalShow(true);
                        }}
                      >
                        <CsLineIcons icon="bin" />
                      </button>
                    </div>
                  ),
                },
              ];

              return (
                <Col md={6} key={table.id}>
                  <section className="scroll-section" id="stripe">
                    <Card body className="mb-5">
                      <BoxedVariationsStripe columns={columns} data={data} table={table} setSelectedTableArea={setSelectedTableArea} setEditTableAreaModalShow={setEditTableAreaModalShow} />
                    </Card>
                  </section>
                </Col>
              )
            })}

          </Row>
        </Col>
      </Row>
      {/* Edit Modal */}
      {selectedTable && (
        <EditTableModal
          show={editTableModalShow}
          handleClose={() => setEditTableModalShow(false)}
          data={selectedTable}
          onUpdateSuccess={fetchTableData}
        />
      )}

      {selectedTableArea && (
        <EditTableAreaModal
          show={editTableAreaModalShow}
          handleClose={() => setEditTableAreaModalShow(false)}
          data={selectedTableArea}
          onUpdateSuccess={fetchTableData}
        />
      )}


      {tableToDelete && (
        <DeleteTableModal
          show={deleteTableModalShow}
          handleClose={() => setDeleteTableModalShow(false)}
          data={tableToDelete}
          onDeleteSuccess={fetchTableData}
        />
      )}
    </>
  );
};

export default ManageTable;
