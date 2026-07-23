import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Spinner, Alert, Badge, Form } from 'react-bootstrap';
import { useHistory, Link } from 'react-router-dom';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import Select from 'react-select';
import { toast } from 'react-toastify';

const ViewStaff = () => {
  const title = 'Manage Staff';
  const description = 'Overview and management of staff members.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'staff/view', text: 'Manage Staff' },
  ];
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [assets, setAssets] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [staffRes, branchRes, assetsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/staff/get-all`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        axios.get(`${process.env.REACT_APP_API}/branch/all`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        axios.get(`${process.env.REACT_APP_API}/assets`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }).catch(() => ({ data: { success: true, data: [] } }))
      ]);
      setStaff(staffRes.data.data);
      if (branchRes.data?.success) {
        setBranches(branchRes.data.data);
      }
      if (assetsRes.data?.success) {
        setAssets(assetsRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please try again.');
      toast.error('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessResignation = async (id, status) => {
    try {
      setProcessingId(id);
      const res = await axios.post(
        `${process.env.REACT_APP_API}/staff/process-resignation/${id}`,
        { status, admin_remarks: `Processed by HR on ${new Date().toLocaleDateString('en-GB')}` },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (res.data.success) {
        toast.success(`Resignation ${status} successfully!`);
        fetchData(); // Refresh the list
      }
    } catch (err) {
      console.error('Error processing resignation:', err);
      toast.error(err.response?.data?.message || 'Error processing resignation');
    } finally {
      setProcessingId(null);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  const filteredStaff = staff.filter(s => {
    const matchesBranch = selectedBranch === 'all'
      || s.branch_id === selectedBranch
      || (s.branch_id && s.branch_id._id === selectedBranch);

    if (!matchesBranch) return false;
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase().trim();
    const fullName = `${s.f_name || ''} ${s.l_name || ''}`.toLowerCase();
    const staffId = `${s.staff_id || ''}`.toLowerCase();
    const position = `${s.position || ''}`.toLowerCase();
    const mobile = `${s.mobile || ''}`.toLowerCase();

    return fullName.includes(term) || staffId.includes(term) || position.includes(term) || mobile.includes(term);
  });

  const groupedStaff = filteredStaff.reduce((groups, member) => {
    // Exclude pending resignations from the regular grid if desired, or keep them. Let's keep them but show alert above.
    const position = member.position || 'Other';
    if (!groups[position]) {
      groups[position] = [];
    }
    groups[position].push(member);
    return groups;
  }, {});

  const pendingResignations = filteredStaff.filter(m => m.resignation?.status === 'pending');
  const processedResignations = filteredStaff.filter(m => m.resignation?.status === 'approved' || m.resignation?.status === 'rejected');

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5 mt-5">
        <Spinner animation="border" style={{ color: '#1ea8e7' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-5">
        <Alert variant="danger" className="view-staff-glass-card border-0 p-5 text-center shadow-sm">
          <CsLineIcons icon="error" className="text-danger mb-3" size="48" />
          <h4 className="fw-bold mb-3">Failed to Load Staff</h4>
          <p className="text-muted mb-4">{error}</p>
          <Button className="view-staff-custom-btn-solid px-5" onClick={fetchData}>
            <CsLineIcons icon="refresh" className="me-2" size="18" />
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid px-lg-4 px-xl-5 pb-5">
      <HtmlHead title={title} description={description} />

      <div className="page-title-container mb-4">
        <Row className="g-3 align-items-center">
          <Col xs="12" lg="3" xl="3">
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7', whiteSpace: 'nowrap' }}>
              {title}
            </h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="12" lg="9" xl="9" className="d-flex flex-wrap flex-lg-nowrap justify-content-lg-end align-items-center gap-2">
            <div className="flex-grow-1 flex-sm-grow-0 flex-shrink-0" style={{ minWidth: '160px' }}>
              <div className="position-relative d-flex align-items-center">
                <CsLineIcons
                  icon="search"
                  size="16"
                  className="position-absolute text-muted ms-3"
                  style={{ left: '0', top: '50%', transform: 'translateY(-50%)', zIndex: 5, pointerEvents: 'none' }}
                />
                <Form.Control
                  type="text"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="shadow-sm"
                  style={{ borderRadius: '20px', height: '38px', paddingLeft: '38px', paddingRight: searchTerm ? '32px' : '12px', fontSize: '0.875rem' }}
                />
                {searchTerm && (
                  <div
                    className="position-absolute text-muted cursor-pointer me-3"
                    style={{ right: '0', top: '50%', transform: 'translateY(-50%)', zIndex: 5 }}
                    onClick={() => setSearchTerm('')}
                  >
                    <CsLineIcons icon="close" size="14" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-grow-1 flex-sm-grow-0 flex-shrink-0" style={{ minWidth: '150px' }}>
              <Select
                classNamePrefix="react-select"
                options={[
                  { value: 'all', label: 'All Branches' },
                  ...branches.map(b => ({ value: b._id, label: b.name }))
                ]}
                value={
                  selectedBranch === 'all'
                    ? { value: 'all', label: 'All Branches' }
                    : { value: selectedBranch, label: branches.find(b => b._id === selectedBranch)?.name || 'Branch' }
                }
                onChange={(selected) => setSelectedBranch(selected ? selected.value : 'all')}
                isSearchable={false}
                className="react-select-premium shadow-sm"
                menuPortalTarget={document.body}
                styles={{
                  container: (base) => ({ ...base, minWidth: '150px' }),
                  control: (base) => ({ ...base, borderRadius: '20px', minHeight: '38px' }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 })
                }}
              />
            </div>
            <Button
              variant="outline-primary"
              onClick={() => history.push('/staff/organization')}
              className="px-3 py-2 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm flex-grow-1 flex-sm-grow-0 flex-shrink-0"
              style={{ height: '38px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
            >
              <CsLineIcons icon="diagram-1" size="16" />
              <span>Organization</span>
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => history.push('/staff/add')}
              className="px-3 py-2 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm flex-grow-1 flex-sm-grow-0 flex-shrink-0"
              style={{ height: '38px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
            >
              <CsLineIcons icon="plus" size="16" />
              <span>Add Staff</span>
            </Button>
          </Col>
        </Row>
      </div>

      {pendingResignations.length > 0 && (
        <div className="mb-5">
          <h4 className="view-staff-group-title mb-3 text-warning d-flex align-items-center">
            <CsLineIcons icon="warning-hexagon" size="20" className="me-2" /> Pending Resignations
          </h4>
          <Row className="g-3">
            {pendingResignations.map(member => {
              const noticeDays = member.resignation.notice_period_days || 30;
              const submittedDate = new Date(member.resignation.submitted_on);
              const lastWorkingDay = new Date(submittedDate);
              lastWorkingDay.setDate(lastWorkingDay.getDate() + noticeDays);

              const staffAssets = assets.filter(a => a.assigned_to?._id === member._id);

              return (
                <Col md="6" lg="4" key={`resignation-${member._id}`}>
                  <Card className="border-warning shadow-sm h-100">
                    <Card.Body className="d-flex flex-column justify-content-between h-100">
                      <div>
                        <div className="d-flex align-items-center mb-3">
                          <div className="view-staff-staff-photo-wrapper me-3" style={{ width: '50px', height: '50px' }}>
                            <div className="view-staff-staff-photo-inner">
                              {!member.photo ? (
                                <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light text-muted">
                                  <CsLineIcons icon="user" size="20" />
                                </div>
                              ) : (
                                <img
                                  src={`${process.env.REACT_APP_UPLOAD_DIR}${member.photo}`}
                                  alt={`${member.f_name} ${member.l_name}`}
                                />
                              )}
                            </div>
                          </div>
                          <div>
                            <h6 className="mb-0 fw-bold">{member.f_name} {member.l_name}</h6>
                            <div className="text-muted small">{member.position}</div>
                          </div>
                        </div>
                        <div className="mb-3 small">
                          <div className="mb-1"><strong>Reason:</strong> {member.resignation.reason || 'No reason provided'}</div>
                          <div className="mb-1"><strong>Submitted:</strong> {submittedDate.toLocaleDateString('en-IN')}</div>
                          <div className="mb-1"><strong>Notice Period:</strong> {noticeDays} Days</div>
                          <div className="mb-1 text-danger"><strong>Calculated Last Day:</strong> {lastWorkingDay.toLocaleDateString('en-IN')}</div>
                        </div>

                        {/* Assets List */}
                        <div className="mb-4">
                          {staffAssets.length > 0 ? (
                            <div className="p-3 bg-light rounded" style={{ border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                              <div className="fw-bold text-dark small mb-2 d-flex align-items-center">
                                <CsLineIcons icon="boxes" size="14" className="me-1 text-primary" />
                                Assigned Assets ({staffAssets.length})
                              </div>
                              <ul className="list-unstyled mb-0 small text-muted ps-1">
                                {staffAssets.map(a => (
                                  <li key={a._id} className="d-flex justify-content-between align-items-center mb-1">
                                    <span>• {a.name}</span>
                                    {a.serial_number && (
                                      <span className="badge bg-soft-primary text-primary font-monospace" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', border: '1px solid rgba(35,179,244,0.1)' }}>
                                        {a.serial_number}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="p-2 bg-light rounded text-center small text-muted" style={{ border: '1px dashed rgba(226, 232, 240, 0.8)', fontSize: '0.8rem' }}>
                              <CsLineIcons icon="boxes" size="12" className="me-1" />
                              No assets assigned
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="d-flex gap-2 mt-auto">
                        <Button
                          variant="success"
                          size="sm"
                          className="flex-grow-1 d-flex justify-content-center align-items-center"
                          disabled={processingId === member._id}
                          onClick={() => handleProcessResignation(member._id, 'approved')}
                        >
                          {processingId === member._id ? <Spinner size="sm" animation="border" /> : <><CsLineIcons icon="check" size="14" className="me-1" /> Accept</>}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="flex-grow-1 d-flex justify-content-center align-items-center"
                          disabled={processingId === member._id}
                          onClick={() => handleProcessResignation(member._id, 'rejected')}
                        >
                          {processingId === member._id ? <Spinner size="sm" animation="border" /> : <><CsLineIcons icon="close" size="14" className="me-1" /> Reject</>}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      )}

      {processedResignations.length > 0 && (
        <div className="mb-5">
          <h4 className="view-staff-group-title mb-3 text-secondary d-flex align-items-center">
            <CsLineIcons icon="check-square" size="20" className="me-2 text-success" /> Processed Resignations / Exits
          </h4>
          <Row className="g-3">
            {processedResignations.map(member => {
              const noticeDays = member.resignation.notice_period_days || 30;
              const submittedDate = new Date(member.resignation.submitted_on);
              const lastWorkingDay = member.resignation.last_working_day ? new Date(member.resignation.last_working_day) : null;
              const staffAssets = assets.filter(a => a.assigned_to?._id === member._id);

              return (
                <Col md="6" lg="4" key={`processed-resignation-${member._id}`}>
                  <Card className="border-light shadow-sm h-100" style={{ background: member.resignation.status === 'approved' ? '#f8fafc' : '#fff' }}>
                    <Card.Body className="d-flex flex-column justify-content-between h-100">
                      <div>
                        <div className="d-flex align-items-center mb-3">
                          <div className="view-staff-staff-photo-wrapper me-3" style={{ width: '50px', height: '50px' }}>
                            <div className="view-staff-staff-photo-inner">
                              {!member.photo ? (
                                <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light text-muted">
                                  <CsLineIcons icon="user" size="20" />
                                </div>
                              ) : (
                                <img
                                  src={`${process.env.REACT_APP_UPLOAD_DIR}${member.photo}`}
                                  alt={`${member.f_name} ${member.l_name}`}
                                />
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <h6 className="mb-0 fw-bold">{member.f_name} {member.l_name}</h6>
                              <Badge bg={member.resignation.status === 'approved' ? 'success' : 'danger'} className="text-uppercase" style={{ fontSize: '0.6rem' }}>
                                {member.resignation.status}
                              </Badge>
                            </div>
                            <div className="text-muted small">{member.position}</div>
                          </div>
                        </div>
                        <div className="mb-3 small">
                          <div className="mb-1"><strong>Reason:</strong> {member.resignation.reason || 'No reason provided'}</div>
                          <div className="mb-1"><strong>Submitted:</strong> {submittedDate.toLocaleDateString('en-IN')}</div>
                          {lastWorkingDay && (
                            <div className="mb-1 text-danger"><strong>Last Working Day:</strong> {lastWorkingDay.toLocaleDateString('en-IN')}</div>
                          )}
                          {member.resignation.admin_remarks && (
                            <div className="mb-1 text-muted"><strong>HR Remarks:</strong> {member.resignation.admin_remarks}</div>
                          )}
                        </div>

                        {/* Assets List */}
                        <div className="mb-4">
                          {staffAssets.length > 0 ? (
                            <div className="p-3 bg-light rounded" style={{ border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                              <div className="fw-bold text-dark small mb-2 d-flex align-items-center">
                                <CsLineIcons icon="boxes" size="14" className="me-1 text-primary" />
                                Assigned Assets ({staffAssets.length})
                              </div>
                              <ul className="list-unstyled mb-0 small text-muted ps-1">
                                {staffAssets.map(a => (
                                  <li key={a._id} className="d-flex justify-content-between align-items-center mb-1">
                                    <span>• {a.name}</span>
                                    {a.serial_number && (
                                      <span className="badge bg-soft-primary text-primary font-monospace" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', border: '1px solid rgba(35,179,244,0.1)' }}>
                                        {a.serial_number}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="p-2 bg-light rounded text-center small text-muted" style={{ border: '1px dashed rgba(226, 232, 240, 0.8)', fontSize: '0.8rem' }}>
                              <CsLineIcons icon="boxes" size="12" className="me-1" />
                              No assets assigned
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-auto">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="w-100 rounded-pill"
                          onClick={() => history.push(`/staff/profile/${member._id}`)}
                        >
                          <CsLineIcons icon="user" size="14" className="me-1" /> View Profile & Exit details
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      )}

      {Object.keys(groupedStaff).length > 0 ? (
        Object.entries(groupedStaff).map(([position, members]) => (
          <div key={position} className="mb-5">
            <div className="d-flex justify-content-between align-items-center mb-3 px-1">
              <div className="d-flex align-items-center gap-2">
                <h4 className="view-staff-group-title mb-0">{position}</h4>
                <Badge bg="soft-primary" className="text-primary rounded-pill px-3 py-1 fw-bold" style={{ fontSize: '0.75rem' }}>
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </Badge>
              </div>
            </div>

            <Row className="g-3 g-md-4">
              {members.map((staffMember) => (
                <Col key={staffMember._id} xs="12" sm="6" md="4" lg="3" xl="2">
                  <Link to={`/staff/profile/${staffMember._id}`} className="text-decoration-none h-100 d-block">
                    <Card className="view-staff-staff-card border-0 shadow-sm h-100">
                      <Card.Body className="p-3 p-md-4 text-center d-flex flex-column align-items-center justify-content-between h-100">
                        <div className="w-100 d-flex flex-column align-items-center">
                          <div className="view-staff-staff-photo-wrapper">
                            <div className="view-staff-staff-photo-inner">
                              {!staffMember.photo ? (
                                <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light text-muted">
                                  <CsLineIcons icon="user" size="32" />
                                </div>
                              ) : (
                                <img
                                  src={`${process.env.REACT_APP_UPLOAD_DIR}${staffMember.photo}`}
                                  alt={`${staffMember.f_name} ${staffMember.l_name}`}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
                                  }}
                                />
                              )}
                            </div>
                          </div>

                          <div className="view-staff-status-badge mb-2 d-inline-block">#{staffMember.staff_id}</div>

                          <div className="view-staff-position-badge mb-1 text-truncate w-100">{staffMember.position}</div>

                          <h6 className="mb-0 fw-bold text-dark text-truncate w-100 px-1" style={{ fontSize: '0.95rem' }}>
                            {staffMember.f_name} {staffMember.l_name}
                          </h6>

                          {staffMember.resignation?.status === 'approved' && (
                            <Badge bg="success" className="text-uppercase mt-2" style={{ fontSize: '0.6rem', letterSpacing: '0.05em' }}>
                              Resigned
                            </Badge>
                          )}
                          {staffMember.resignation?.status === 'rejected' && (
                            <Badge bg="danger" className="text-uppercase mt-2" style={{ fontSize: '0.6rem', letterSpacing: '0.05em' }}>
                              Exit Rejected
                            </Badge>
                          )}
                        </div>

                        <div className="mt-3 pt-3 border-top w-100">
                          <div className="view-staff-profile-link d-flex align-items-center justify-content-center gap-2">
                            <span>Profile</span>
                            <CsLineIcons icon="arrow-right" size="14" />
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
              ))}
            </Row>
          </div>
        ))
      ) : (
        <div className="text-center py-5 my-4 view-staff-glass-card border-0 mx-auto px-4" style={{ maxWidth: '600px' }}>
          <div className="mb-4">
            <div className="bg-light d-inline-flex p-4 rounded-circle mb-3">
              <CsLineIcons icon="inbox" size="48" className="text-muted opacity-50" />
            </div>
            <h4 className="fw-bold text-dark mb-2">No Staff Members Found</h4>
            <p className="text-muted small mb-4">
              {searchTerm
                ? `No staff members matched "${searchTerm}". Try resetting your search or filter.`
                : 'Your staff directory is currently empty.'}
            </p>
          </div>
          <div className="d-flex flex-wrap justify-content-center gap-2">
            {searchTerm && (
              <Button variant="outline-secondary" className="rounded-pill px-4" onClick={() => setSearchTerm('')}>
                <CsLineIcons icon="close" className="me-1" size="14" /> Clear Search
              </Button>
            )}
            <Button variant="primary" className="custom-btn-solid px-4 py-2" onClick={() => history.push('/staff/add')}>
              <CsLineIcons icon="plus" className="me-2" size="18" />
              Add Staff
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewStaff;
