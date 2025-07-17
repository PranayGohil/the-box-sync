import React, { useState, useMemo } from 'react';
import { Badge, Button, Col, Row } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy, usePagination } from 'react-table';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import ControlsSearch from './components/ControlsSearch';
import ControlsPageSize from './components/ControlsPageSize';
import Table from './components/Table';
import TablePagination from './components/TablePagination';

const dummyFeedback = [
  {
    id: 1,
    customer_name: 'John Doe',
    message: 'Great food, loved the ambiance!',
    date: '2025-07-10',
    status: 'New',
  },
  {
    id: 2,
    customer_name: 'Jane Smith',
    message: 'Service was a bit slow.',
    date: '2025-07-09',
    status: 'Replied',
  },
  {
    id: 3,
    customer_name: 'Mike Johnson',
    message: 'Amazing experience!',
    date: '2025-07-08',
    status: 'New',
  },
];

const AdminFeedback = () => {
  const title = 'Customer Feedback';
  const description = 'Manage and respond to customer feedback.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'admin/feedback', title: 'Customer Feedback' },
  ];

  const [feedbackData, setFeedbackData] = useState(dummyFeedback);
  const [replyModal, setReplyModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const handleReply = (row) => {
    setSelectedFeedback(row.original);
    setReplyModal(true);
  };

  const handleDelete = (id) => {
    const updated = feedbackData.filter((item) => item.id !== id);
    setFeedbackData(updated);
  };

  const columns = useMemo(
    () => [
      { Header: 'Customer', accessor: 'customer_name' },
      { Header: 'Message', accessor: 'message' },
      { Header: 'Date', accessor: 'date' },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ cell }) => <Badge bg={cell.value === 'Replied' ? 'outline-success' : 'outline-warning'}>{cell.value}</Badge>,
      },
      {
        Header: 'Actions',
        Cell: ({ row }) => (
          <>
            <Button variant="link" size="sm" onClick={() => handleReply(row)} title="Reply">
              <CsLineIcons icon="send" />
            </Button>
            <Button variant="link" size="sm" onClick={() => handleDelete(row.original.id)} title="Delete">
              <CsLineIcons icon="bin" />
            </Button>
          </>
        ),
      },
    ],
    []
  );

  const tableInstance = useTable(
    { columns, data: feedbackData, initialState: { pageIndex: 0 } },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  return (
    <>
      <HtmlHead title={title} description={description} />
      <Row>
        <Col>
          <div className="page-title-container mb-3">
            <Row>
              <Col xs="12" md="7">
                <h1 className="mb-0 pb-0 display-4">{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
            </Row>
          </div>

          <Row className="mb-3">
            <Col sm="12" md="5" lg="3" xxl="2">
              <div className="search-input-container w-100 shadow bg-foreground">
                <ControlsSearch tableInstance={tableInstance} />
              </div>
            </Col>
            <Col className="text-end">
              <ControlsPageSize tableInstance={tableInstance} />
            </Col>
          </Row>

          <Table className="react-table rows" tableInstance={tableInstance} />
          <TablePagination tableInstance={tableInstance} />
        </Col>
      </Row>

      {/* Reply Modal */}
      {replyModal && selectedFeedback && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-close-out" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reply to {selectedFeedback.customer_name}</h5>
                <button type="button" className="btn-close" onClick={() => setReplyModal(false)} />
              </div>
              <div className="modal-body">
                <textarea className="form-control" placeholder="Type your reply..." rows="4" />
              </div>
              <div className="modal-footer">
                <Button variant="secondary" onClick={() => setReplyModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    console.log('Replied to:', selectedFeedback.customer_name);
                    setReplyModal(false);
                  }}
                >
                  Send Reply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminFeedback;
