import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Form, Modal, Badge, Spinner, Alert } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import { getAssets, addAsset, updateAsset, deleteAsset, getAssetRequests, updateAssetRequestStatus } from 'api/assets';
import { getStaffList } from 'api/staff';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

const ASSET_TYPES = [
  'Laptop / PC',
  'Mobile Phone',
  'Keyboard',
  'Mouse',
  'Headset / Audio',
  'Uniform',
  'Access Card',
  'Furniture',
  'Other',
];

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [assetRequests, setAssetRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('assets');

  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);

  // Selected Asset / Request for actions
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approveData, setApproveData] = useState({
    mode: 'new',
    selectedAssetId: '',
    name: '',
    asset_type: 'Laptop / PC',
    serial_number: '',
    notes: '',
  });

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    asset_type: 'Laptop / PC',
    serial_number: '',
    notes: '',
  });

  const [assignData, setAssignData] = useState({
    assigned_to: '',
    assigned_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [returnData, setReturnData] = useState({
    status: 'available', // can be returned as available, damaged or lost
    notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const assetRes = await getAssets();
      if (assetRes.success) {
        setAssets(assetRes.data);
      }
      const staffRes = await getStaffList();
      if (staffRes.success) {
        setStaffList(staffRes.data);
      }
      const requestRes = await getAssetRequests();
      if (requestRes.success) {
        setAssetRequests(requestRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load assets data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setSelectedAsset(null);
    setFormData({
      name: '',
      asset_type: 'Laptop / PC',
      serial_number: '',
      notes: '',
    });
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (asset) => {
    setSelectedAsset(asset);
    setFormData({
      name: asset.name,
      asset_type: asset.asset_type,
      serial_number: asset.serial_number || '',
      notes: asset.notes || '',
    });
    setShowAddEditModal(true);
  };

  const handleOpenAssign = (asset) => {
    setSelectedAsset(asset);
    setAssignData({
      assigned_to: staffList[0]?._id || '',
      assigned_date: new Date().toISOString().split('T')[0],
      notes: asset.notes || '',
    });
    setShowAssignModal(true);
  };

  const handleOpenReturn = (asset) => {
    setSelectedAsset(asset);
    setReturnData({
      status: 'available',
      notes: '',
    });
    setShowReturnModal(true);
  };

  const handleOpenDelete = (asset) => {
    setSelectedAsset(asset);
    setShowDeleteModal(true);
  };

  // Submit operations
  const handleSaveAsset = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Asset Name is required');
      return;
    }

    try {
      if (selectedAsset) {
        // Edit
        const res = await updateAsset(selectedAsset._id, formData);
        if (res.success) {
          toast.success('Asset updated successfully');
          fetchData();
          setShowAddEditModal(false);
        }
      } else {
        // Add
        const res = await addAsset(formData);
        if (res.success) {
          toast.success('Asset added successfully');
          fetchData();
          setShowAddEditModal(false);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving asset');
    }
  };

  const handleAssignAsset = async (e) => {
    e.preventDefault();
    if (!assignData.assigned_to) {
      toast.error('Please select an employee');
      return;
    }

    try {
      const res = await updateAsset(selectedAsset._id, {
        assigned_to: assignData.assigned_to,
        assigned_date: new Date(assignData.assigned_date),
        status: 'assigned',
        notes: assignData.notes,
        return_date: null, // Reset return date
      });
      if (res.success) {
        toast.success('Asset assigned successfully');
        fetchData();
        setShowAssignModal(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error assigning asset');
    }
  };

  const handleReturnAsset = async (e) => {
    e.preventDefault();
    try {
      const res = await updateAsset(selectedAsset._id, {
        assigned_to: null,
        return_date: new Date(),
        status: returnData.status, // available, damaged, or lost
        notes: returnData.notes,
      });
      if (res.success) {
        toast.success('Asset marked as returned');
        fetchData();
        setShowReturnModal(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error returning asset');
    }
  };

  const handleDeleteAsset = async () => {
    try {
      const res = await deleteAsset(selectedAsset._id);
      if (res.success) {
        toast.success('Asset deleted successfully');
        fetchData();
        setShowDeleteModal(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting asset');
    }
  };

  // Metrics calculations
  const totalCount = assets.length;
  const availableCount = assets.filter((a) => a.status === 'available').length;
  const assignedCount = assets.filter((a) => a.status === 'assigned').length;
  const damagedLostCount = assets.filter((a) => a.status === 'damaged' || a.status === 'lost').length;

  // Filter & Search logic
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.serial_number && asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return <Badge bg="outline-success">Available</Badge>;
      case 'assigned':
        return <Badge bg="outline-primary">Assigned</Badge>;
      case 'damaged':
        return <Badge bg="outline-warning">Damaged</Badge>;
      case 'lost':
        return <Badge bg="outline-danger">Lost</Badge>;
      case 'pending':
        return <Badge bg="outline-warning">Pending</Badge>;
      case 'approved':
        return <Badge bg="outline-success">Approved</Badge>;
      case 'rejected':
        return <Badge bg="outline-danger">Rejected</Badge>;
      default:
        return <Badge bg="outline-secondary">{status}</Badge>;
    }
  };

  const getAssetTypeLabel = (type) => {
    if (!type) return 'Other';
    const legacyMap = {
      laptop: 'Laptop / PC',
      mobile: 'Mobile Phone',
      keyboard: 'Keyboard',
      mouse: 'Mouse',
      headset: 'Headset / Audio',
      uniform: 'Uniform',
      access_card: 'Access Card',
      furniture: 'Furniture',
      other: 'Other'
    };
    return legacyMap[type] || type;
  };

  const handleRequestStatusChange = async (reqId, newStatus) => {
    try {
      const res = await updateAssetRequestStatus(reqId, { status: newStatus, notes: '' });
      if (res.success) {
        toast.success(`Request ${newStatus} successfully`);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating request status');
    }
  };

  const handleOpenApprove = (req) => {
    setSelectedRequest(req);
    setApproveData({
      mode: 'new',
      selectedAssetId: '',
      name: req.asset_name || '',
      asset_type: req.asset_type || 'Laptop / PC',
      serial_number: '',
      notes: '',
    });
    setShowApproveModal(true);
  };

  const handleSubmitApprove = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      if (approveData.mode === 'new') {
        if (!approveData.name) {
          toast.error('Asset Name is required');
          return;
        }

        await addAsset({
          name: approveData.name,
          asset_type: approveData.asset_type,
          serial_number: approveData.serial_number,
          notes: approveData.notes,
          assigned_to: selectedRequest.staff_id?._id,
          assigned_date: new Date().toISOString().split('T')[0],
          status: 'assigned'
        });
      } else {
        if (!approveData.selectedAssetId) {
          toast.error('Please select an existing asset to assign');
          return;
        }

        await updateAsset(approveData.selectedAssetId, {
          assigned_to: selectedRequest.staff_id?._id,
          assigned_date: new Date().toISOString().split('T')[0],
          status: 'assigned',
          notes: approveData.notes || 'Assigned via approved request.'
        });
      }

      const res = await updateAssetRequestStatus(selectedRequest._id, {
        status: 'approved',
        notes: approveData.notes
      });

      if (res.success) {
        toast.success('Asset request approved and asset allocated successfully');
        setShowApproveModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Error approving request and allocating asset');
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* Premium Gradient Title Background */}
      <div
        className="mb-4 p-4 text-white rounded-3 shadow-sm d-flex flex-column flex-md-row justify-content-between align-items-md-center position-relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1ea8e7 0%, #23b3f4 100%)',
        }}
      >
        {/* Subtle Decorative Circle */}
        <div
          className="position-absolute rounded-circle"
          style={{
            width: '200px',
            height: '200px',
            background: 'rgba(255, 255, 255, 0.1)',
            top: '-50px',
            right: '-50px',
            pointerEvents: 'none',
          }}
        />

        <div className="z-index-1">
          <h2 className="fw-bold mb-1 text-white">Assets Management</h2>
          <p className="mb-0 text-white-50">Manage company inventories, track and allocate devices and resources to employees.</p>
        </div>
        <Button
          variant="light"
          onClick={handleOpenAdd}
          className="mt-3 mt-md-0 fw-semibold text-primary d-flex align-items-center shadow-sm position-relative z-index-1"
          style={{ borderRadius: '50px', padding: '0.6rem 1.5rem', zIndex: 2 }}
        >
          <CsLineIcons icon="plus" size="18" className="me-2" /> Add New Asset
        </Button>
      </div>

      {/* Tabs */}
      <div className="d-flex border-bottom mb-4">
        <button
          type="button"
          className={`btn btn-link text-decoration-none fw-bold px-4 py-2 border-bottom ${activeTab === 'assets' ? 'text-primary' : 'text-muted'}`}
          style={{ borderBottomWidth: activeTab === 'assets' ? '3px !important' : '0', borderBottomColor: activeTab === 'assets' ? '#23b3f4' : 'transparent', borderBottomStyle: 'solid', borderRadius: 0 }}
          onClick={() => setActiveTab('assets')}
        >
          Company Assets
        </button>
        <button
          type="button"
          className={`btn btn-link text-decoration-none fw-bold px-4 py-2 border-bottom ${activeTab === 'requests' ? 'text-primary' : 'text-muted'}`}
          style={{ borderBottomWidth: activeTab === 'requests' ? '3px !important' : '0', borderBottomColor: activeTab === 'requests' ? '#23b3f4' : 'transparent', borderBottomStyle: 'solid', borderRadius: 0 }}
          onClick={() => setActiveTab('requests')}
        >
          Asset Requests
        </button>
      </div>

      {activeTab === 'assets' && (
        <>
          {/* Metrics Row */}
          <Row className="mb-4">
            <Col xs={12} sm={6} md={3} className="mb-3 mb-md-0">
              <Card className="border-0 shadow-sm h-100 py-2" style={{ borderRadius: '15px' }}>
                <Card.Body className="d-flex align-items-center">
                  <div
                    className="rounded-3 p-3 me-3 d-flex align-items-center justify-content-center"
                    style={{ background: 'rgba(35, 179, 244, 0.1)', color: '#23b3f4', width: '54px', height: '54px' }}
                  >
                    <CsLineIcons icon="boxes" size="24" />
                  </div>
                  <div>
                    <h6 className="text-muted mb-0 small uppercase fw-bold">Total Assets</h6>
                    <h4 className="fw-bold mb-0 text-dark">{totalCount}</h4>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} md={3} className="mb-3 mb-md-0">
              <Card className="border-0 shadow-sm h-100 py-2" style={{ borderRadius: '15px' }}>
                <Card.Body className="d-flex align-items-center">
                  <div
                    className="rounded-3 p-3 me-3 d-flex align-items-center justify-content-center"
                    style={{ background: 'rgba(25, 135, 84, 0.1)', color: '#198754', width: '54px', height: '54px' }}
                  >
                    <CsLineIcons icon="check" size="24" />
                  </div>
                  <div>
                    <h6 className="text-muted mb-0 small uppercase fw-bold">Available</h6>
                    <h4 className="fw-bold mb-0 text-success">{availableCount}</h4>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} md={3} className="mb-3 mb-md-0">
              <Card className="border-0 shadow-sm h-100 py-2" style={{ borderRadius: '15px' }}>
                <Card.Body className="d-flex align-items-center">
                  <div
                    className="rounded-3 p-3 me-3 d-flex align-items-center justify-content-center"
                    style={{ background: 'rgba(13, 110, 253, 0.1)', color: '#0d6efd', width: '54px', height: '54px' }}
                  >
                    <CsLineIcons icon="user" size="24" />
                  </div>
                  <div>
                    <h6 className="text-muted mb-0 small uppercase fw-bold">Assigned</h6>
                    <h4 className="fw-bold mb-0 text-primary">{assignedCount}</h4>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} md={3}>
              <Card className="border-0 shadow-sm h-100 py-2" style={{ borderRadius: '15px' }}>
                <Card.Body className="d-flex align-items-center">
                  <div
                    className="rounded-3 p-3 me-3 d-flex align-items-center justify-content-center"
                    style={{ background: 'rgba(220, 53, 69, 0.1)', color: '#dc3545', width: '54px', height: '54px' }}
                  >
                    <CsLineIcons icon="close" size="24" />
                  </div>
                  <div>
                    <h6 className="text-muted mb-0 small uppercase fw-bold">Damaged/Lost</h6>
                    <h4 className="fw-bold mb-0 text-danger">{damagedLostCount}</h4>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Filter & Listing Card */}
          <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '15px' }}>
            <Card.Body className="p-4">
              <Row className="mb-3 g-3 align-items-center">
                <Col xs={12} md={6}>
                  <Form.Control
                    type="text"
                    placeholder="Search by asset name or serial number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ borderRadius: '50px', padding: '0.65rem 1.25rem', border: '1px solid #e2e8f0' }}
                  />
                </Col>
                <Col xs={12} md={3}>
                  <Select
                    classNamePrefix="react-select"
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'available', label: 'Available' },
                      { value: 'assigned', label: 'Assigned' },
                      { value: 'damaged', label: 'Damaged' },
                      { value: 'lost', label: 'Lost' }
                    ]}
                    value={{
                      all: { value: 'all', label: 'All Status' },
                      available: { value: 'available', label: 'Available' },
                      assigned: { value: 'assigned', label: 'Assigned' },
                      damaged: { value: 'damaged', label: 'Damaged' },
                      lost: { value: 'lost', label: 'Lost' }
                    }[statusFilter]}
                    onChange={(selected) => setStatusFilter(selected ? selected.value : 'all')}
                    placeholder="Filter by Status"
                  />
                </Col>
              </Row>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">Loading assets...</p>
                </div>
              ) : filteredAssets.length === 0 ? (
                <Alert variant="info" className="text-center py-4 border-0" style={{ borderRadius: '12px', background: 'rgba(35, 179, 244, 0.08)', color: '#23b3f4' }}>
                  No assets found matching the criteria.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table hover className="align-middle">
                    <thead>
                      <tr className="text-muted border-bottom" style={{ fontSize: '0.85rem' }}>
                        <th>Asset Name</th>
                        <th>Type</th>
                        <th>Serial Number</th>
                        <th>Status</th>
                        <th>Assignment Details</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssets.map((asset) => (
                        <tr key={asset._id} className="border-bottom" style={{ fontSize: '0.9rem' }}>
                          <td className="fw-semibold text-dark">{asset.name}</td>
                          <td>{getAssetTypeLabel(asset.asset_type)}</td>
                          <td><code>{asset.serial_number || 'N/A'}</code></td>
                          <td>{getStatusBadge(asset.status)}</td>
                          <td>
                            {asset.status === 'assigned' && asset.assigned_to ? (
                              <div>
                                <span className="fw-semibold">{asset.assigned_to.f_name} {asset.assigned_to.l_name}</span>
                                <span className="text-muted d-block small">
                                  Assigned on: {new Date(asset.assigned_date).toLocaleDateString('en-GB')}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="text-end">
                            {asset.status === 'assigned' ? (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleOpenReturn(asset)}
                                className="me-2"
                                style={{ borderRadius: '30px' }}
                              >
                                Mark Returned
                              </Button>
                            ) : (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleOpenAssign(asset)}
                                className="me-2"
                                disabled={asset.status === 'lost'}
                                style={{ borderRadius: '30px' }}
                              >
                                Assign to Staff
                              </Button>
                            )}
                            <Button
                              variant="light"
                              size="sm"
                              onClick={() => handleOpenEdit(asset)}
                              className="me-2 p-1 rounded-circle"
                              style={{ width: '32px', height: '32px' }}
                            >
                              <CsLineIcons icon="edit" size="16" className="text-primary" />
                            </Button>
                            <Button
                              variant="light"
                              size="sm"
                              onClick={() => handleOpenDelete(asset)}
                              className="p-1 rounded-circle"
                              style={{ width: '32px', height: '32px' }}
                            >
                              <CsLineIcons icon="bin" size="16" className="text-danger" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </>
      )}

      {activeTab === 'requests' && (
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '15px' }}>
          <Card.Body className="p-4">
            <h5 className="fw-bold mb-4">Asset Requests</h5>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : assetRequests.length === 0 ? (
              <Alert variant="info" className="text-center py-4 border-0" style={{ borderRadius: '12px', background: 'rgba(35, 179, 244, 0.08)', color: '#23b3f4' }}>
                No asset requests found.
              </Alert>
            ) : (
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead>
                    <tr className="text-muted border-bottom" style={{ fontSize: '0.85rem' }}>
                      <th>Staff Member</th>
                      <th>Asset Name</th>
                      <th>Type</th>
                      <th>Reason</th>
                      <th>Requested On</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetRequests.map((req) => (
                      <tr key={req._id} className="border-bottom" style={{ fontSize: '0.9rem' }}>
                        <td className="fw-semibold text-dark">
                          {req.staff_id?.f_name} {req.staff_id?.l_name}
                          <span className="d-block text-muted small">{req.staff_id?.staff_id}</span>
                        </td>
                        <td className="fw-bold">{req.asset_name}</td>
                        <td>{req.asset_type}</td>
                        <td>{req.reason || '—'}</td>
                        <td>{new Date(req.createdAt).toLocaleDateString('en-GB')}</td>
                        <td>{getStatusBadge(req.status)}</td>
                        <td className="text-end">
                          {req.status === 'pending' && (
                            <>
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="me-2"
                                style={{ borderRadius: '30px' }}
                                onClick={() => handleOpenApprove(req)}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                style={{ borderRadius: '30px' }}
                                onClick={() => handleRequestStatusChange(req._id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Add / Edit Asset Modal */}
      <Modal show={showAddEditModal} onHide={() => setShowAddEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{selectedAsset ? 'Edit Asset' : 'Add New Asset'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveAsset}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Asset Name *</Form.Label>
              <Form.Control
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. MacBook Pro, Logitech Mouse"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Asset Type</Form.Label>
              <CreatableSelect
                isClearable
                options={ASSET_TYPES.map((type) => ({ label: type, value: type }))}
                value={
                  formData.asset_type
                    ? { label: getAssetTypeLabel(formData.asset_type), value: getAssetTypeLabel(formData.asset_type) }
                    : null
                }
                onChange={(selected) => setFormData({ ...formData, asset_type: selected ? selected.value : '' })}
                placeholder="Select or type asset type..."
                classNamePrefix="react-select"
                menuPortalTarget={document.body}
                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Serial / Tag Number</Form.Label>
              <Form.Control
                type="text"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                placeholder="e.g. S/N 12345678"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Notes / Details</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Details about asset specs or condition..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowAddEditModal(false)} style={{ borderRadius: '30px' }}>Cancel</Button>
            <Button variant="primary" type="submit" style={{ borderRadius: '30px' }}>Save Asset</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Assign Asset Modal */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Assign Asset: {selectedAsset?.name}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAssignAsset}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Select Employee *</Form.Label>
              <Select
                classNamePrefix="react-select"
                menuPortalTarget={document.body}
                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                options={staffList.map((staff) => ({
                  value: staff._id,
                  label: `${staff.f_name} ${staff.l_name} (${staff.staff_id || 'No ID'})`
                }))}
                value={
                  assignData.assigned_to
                    ? {
                      value: assignData.assigned_to,
                      label: (() => {
                        const staff = staffList.find(s => s._id === assignData.assigned_to);
                        return staff ? `${staff.f_name} ${staff.l_name} (${staff.staff_id || 'No ID'})` : '';
                      })()
                    }
                    : null
                }
                onChange={(selected) => setAssignData({ ...assignData, assigned_to: selected ? selected.value : '' })}
                placeholder="-- Choose Employee --"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Assignment Date</Form.Label>
              <Form.Control
                type="date"
                required
                value={assignData.assigned_date}
                onChange={(e) => setAssignData({ ...assignData, assigned_date: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Assignment Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={assignData.notes}
                onChange={(e) => setAssignData({ ...assignData, notes: e.target.value })}
                placeholder="Condition on hand over, notes..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowAssignModal(false)} style={{ borderRadius: '30px' }}>Cancel</Button>
            <Button variant="primary" type="submit" style={{ borderRadius: '30px' }}>Assign Asset</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Return Asset Modal */}
      <Modal show={showReturnModal} onHide={() => setShowReturnModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Return Asset: {selectedAsset?.name}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleReturnAsset}>
          <Modal.Body>
            <p className="text-muted">
              You are marking this asset as returned by <strong>{selectedAsset?.assigned_to?.f_name} {selectedAsset?.assigned_to?.l_name}</strong>.
            </p>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Asset Status After Return</Form.Label>
              <Select
                classNamePrefix="react-select"
                menuPortalTarget={document.body}
                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                options={[
                  { value: 'available', label: 'Available (Good Condition)' },
                  { value: 'damaged', label: 'Damaged / Needs Maintenance' },
                  { value: 'lost', label: 'Lost' }
                ]}
                value={{
                  available: { value: 'available', label: 'Available (Good Condition)' },
                  damaged: { value: 'damaged', label: 'Damaged / Needs Maintenance' },
                  lost: { value: 'lost', label: 'Lost' }
                }[returnData.status]}
                onChange={(selected) => setReturnData({ ...returnData, status: selected ? selected.value : 'available' })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Return Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={returnData.notes}
                onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
                placeholder="Condition on return, notes..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowReturnModal(false)} style={{ borderRadius: '30px' }}>Cancel</Button>
            <Button variant="success" type="submit" style={{ borderRadius: '30px' }}>Process Return</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Delete Asset</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the asset <strong>{selectedAsset?.name}</strong>? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowDeleteModal(false)} style={{ borderRadius: '30px' }}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteAsset} style={{ borderRadius: '30px' }}>Delete</Button>
        </Modal.Footer>
      </Modal>

      {/* Approve Request Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="text-success fw-bold">Approve Asset Request</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitApprove}>
          <Modal.Body className="p-4">
            <p className="text-muted">
              You are approving the request for <strong>{selectedRequest?.asset_name}</strong> ({selectedRequest?.asset_type}) from <strong>{selectedRequest?.staff_id?.f_name} {selectedRequest?.staff_id?.l_name}</strong>.
            </p>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Allocation Method *</Form.Label>
              <div className="d-flex gap-3">
                <Form.Check
                  type="radio"
                  label="Register & Assign a New Asset"
                  name="allocationMode"
                  id="modeNew"
                  checked={approveData.mode === 'new'}
                  onChange={() => setApproveData({ ...approveData, mode: 'new' })}
                />
                <Form.Check
                  type="radio"
                  label="Assign an Existing Available Asset"
                  name="allocationMode"
                  id="modeExisting"
                  checked={approveData.mode === 'existing'}
                  onChange={() => setApproveData({ ...approveData, mode: 'existing' })}
                />
              </div>
            </Form.Group>

            {approveData.mode === 'new' ? (
              <>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Asset Name *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={approveData.name}
                    onChange={(e) => setApproveData({ ...approveData, name: e.target.value })}
                    placeholder="e.g. MacBook Pro M3"
                  />
                </Form.Group>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Asset Type *</Form.Label>
                      <Select
                        classNamePrefix="react-select"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        options={ASSET_TYPES.map(type => ({ value: type, label: type }))}
                        value={{ value: approveData.asset_type, label: approveData.asset_type }}
                        onChange={(selected) => setApproveData({ ...approveData, asset_type: selected ? selected.value : 'other' })}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Serial / Tag Number</Form.Label>
                      <Form.Control
                        type="text"
                        value={approveData.serial_number}
                        onChange={(e) => setApproveData({ ...approveData, serial_number: e.target.value })}
                        placeholder="e.g. SN-98234-X"
                      />
                    </Form.Group>
                  </div>
                </div>
              </>
            ) : (
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Select Available Asset *</Form.Label>
                <Select
                  classNamePrefix="react-select"
                  menuPortalTarget={document.body}
                  styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                  options={assets
                    .filter(a => a.status === 'available')
                    .map(a => ({
                      value: a._id,
                      label: `${a.name} ${a.serial_number ? `(SN: ${a.serial_number})` : ''} - [${getAssetTypeLabel(a.asset_type)}]`
                    }))
                  }
                  value={
                    approveData.selectedAssetId
                      ? {
                        value: approveData.selectedAssetId,
                        label: (() => {
                          const a = assets.find(item => item._id === approveData.selectedAssetId);
                          return a ? `${a.name} ${a.serial_number ? `(SN: ${a.serial_number})` : ''} - [${getAssetTypeLabel(a.asset_type)}]` : '';
                        })()
                      }
                      : null
                  }
                  onChange={(selected) => setApproveData({ ...approveData, selectedAssetId: selected ? selected.value : '' })}
                  placeholder="-- Select Available Asset --"
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Approval / Allocation Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={approveData.notes}
                onChange={(e) => setApproveData({ ...approveData, notes: e.target.value })}
                placeholder="Details of approval, physical condition notes, etc..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowApproveModal(false)} style={{ borderRadius: '30px' }}>Cancel</Button>
            <Button variant="success" type="submit" style={{ borderRadius: '30px' }}>Confirm Approval</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Assets;
