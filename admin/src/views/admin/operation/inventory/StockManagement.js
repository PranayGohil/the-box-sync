import React, { useState, useEffect } from 'react';
import { Button, Col, Row, Modal, Form, Spinner, Card, Table, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getCurrentStock, useInventoryStock, exportInventoryExcel, importInventoryExcel } from 'api/inventory';

const StockManagement = () => {
  const title = 'Stock Management';
  const description = 'Monitor current stock, deduct stock, and manage import/export easily.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/stock-management', text: 'Operations' },
    { to: 'operations/stock-management', title: 'Stock Management' },
  ];

  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showUseModal, setShowUseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantityUsed, setQuantityUsed] = useState('');
  const [useComment, setUseComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now()); // key to reset file input

  const fetchStock = async () => {
    try {
      setLoading(true);
      const res = await getCurrentStock();
      if (res.data.success) {
        setStockData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleUseSubmit = async (e) => {
    e.preventDefault();
    if (!quantityUsed || Number(quantityUsed) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await useInventoryStock({
        item_name: selectedItem._id,
        quantity_used: quantityUsed,
        comment: useComment
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Stock deducted successfully');
        setShowUseModal(false);
        setSelectedItem(null);
        setQuantityUsed('');
        setUseComment('');
        fetchStock();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deduct stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await exportInventoryExcel();
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Inventory_Stock.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Excel exported successfully');
    } catch (error) {
      toast.error('Failed to export excel');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
        toast.error('Please upload a valid Excel file (.xlsx or .xls)');
        return;
    }

    try {
      setIsSubmitting(true);
      toast.info('Importing stock, please wait...');
      const res = await importInventoryExcel(file);
      if (res.data.success) {
        toast.success('Stock imported successfully!');
        fetchStock();
      }
    } catch (err) {
      toast.error('Failed to import stock');
    } finally {
      setIsSubmitting(false);
      setFileInputKey(Date.now()); // reset file input
    }
  };

  return (
    <>
      <HtmlHead title={title} description={description} />
      <div className="page-title-container">
        <Row className="g-0">
          <Col className="col-auto mb-3 mb-sm-0 me-auto">
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="auto" className="d-flex align-items-end justify-content-end mb-2 mb-sm-0 order-sm-3 gap-2">
            <Button variant="outline-primary" className="btn-icon btn-icon-start text-nowrap" onClick={handleExport}>
              <CsLineIcons icon="download" /> <span>Export</span>
            </Button>
            <div className="d-inline-block position-relative">
               <input
                 type="file"
                 accept=".xlsx,.xls"
                 key={fileInputKey}
                 style={{ opacity: 0, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, cursor: 'pointer' }}
                 onChange={handleImport}
                 disabled={isSubmitting}
               />
               <Button variant="primary" className="btn-icon btn-icon-start py-2">
                 <CsLineIcons icon="upload" /> <span>Import</span>
               </Button>
            </div>
          </Col>
        </Row>
      </div>

      <Row>
        <Col sm="12">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center mb-5 mt-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : stockData.length === 0 ? (
            <Alert variant="info">No stock data found.</Alert>
          ) : (
            <Card>
              <Card.Body>
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" className="text-uppercase text-muted text-small">Item Name</th>
                      <th scope="col" className="text-uppercase text-muted text-small">Current Stock</th>
                      <th scope="col" className="text-uppercase text-muted text-small text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockData.map((item, index) => (
                      <tr key={index}>
                        <td className="align-middle fw-bold">{item._id}</td>
                        <td className="align-middle">
                          <span className={item.totalStock <= 0 ? "text-danger fw-bold" : "text-success fw-bold"}>
                            {item.totalStock}
                          </span>{' '}
                          <span className="text-muted text-small">{item.unit}</span>
                        </td>
                        <td className="text-end align-middle">
                          <Button 
                             size="sm" 
                             variant="outline-warning" 
                             disabled={item.totalStock <= 0}
                             onClick={() => { setSelectedItem(item); setShowUseModal(true); }}
                          >
                            Mark as Used
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Mark As Used Modal */}
      <Modal show={showUseModal} onHide={() => !isSubmitting && setShowUseModal(false)} centered>
        <Modal.Header closeButton={!isSubmitting}>
          <Modal.Title>Deduct Stock</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
             <Form onSubmit={handleUseSubmit}>
               <div className="mb-3">
                 <strong>Item:</strong> {selectedItem._id}
               </div>
               <div className="mb-3">
                 <strong>Available Stock:</strong> {selectedItem.totalStock} {selectedItem.unit}
               </div>
               <Form.Group className="mb-3">
                 <Form.Label>Quantity to Deduct ({selectedItem.unit})</Form.Label>
                 <Form.Control 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    max={selectedItem.totalStock}
                    value={quantityUsed} 
                    onChange={e => setQuantityUsed(e.target.value)} 
                    required 
                 />
               </Form.Group>
               <Form.Group className="mb-3">
                 <Form.Label>Comments / Reason</Form.Label>
                 <Form.Control 
                    as="textarea" 
                    rows={2} 
                    value={useComment}
                    onChange={e => setUseComment(e.target.value)}
                 />
               </Form.Group>
               <div className="text-end">
                 <Button variant="outline-secondary" className="me-2" onClick={() => setShowUseModal(false)} disabled={isSubmitting}>
                   Cancel
                 </Button>
                 <Button variant="primary" type="submit" disabled={isSubmitting}>
                   {isSubmitting ? <Spinner animation="border" size="sm" /> : 'Confirm Deduction'}
                 </Button>
               </div>
             </Form>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default StockManagement;
