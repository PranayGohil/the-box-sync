import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import HtmlHead from 'components/html-head/HtmlHead';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { ReactSortable } from 'react-sortablejs';
import DeleteConfirmModal from 'components/DeleteConfirmModal';

const BranchBoard = () => {
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [unassignedStaff, setUnassignedStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals for Branches
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  
  const [showDeleteBranchModal, setShowDeleteBranchModal] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);

  // Modals for Departments
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [isDeptGlobal, setIsDeptGlobal] = useState(false);
  const [activeBranchForDept, setActiveBranchForDept] = useState(null);

  const [showDeleteDeptModal, setShowDeleteDeptModal] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);

  // Modals for Roles
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [activeDeptForRole, setActiveDeptForRole] = useState(null);
  const [activeParentNodeId, setActiveParentNodeId] = useState(null);

  const [showDeleteRoleModal, setShowDeleteRoleModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [branchRes, deptRes, staffRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/branch/all`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${process.env.REACT_APP_API}/department/get`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${process.env.REACT_APP_API}/staff/get-all?limit=1000`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      const fetchedBranches = branchRes.data.data || [];
      const fetchedDepts = deptRes.data.departments || [];
      const fetchedStaff = staffRes.data.data || [];
      
      const staffWithId = fetchedStaff.map(s => ({ ...s, id: s._id }));
      setBranches(fetchedBranches);
      setDepartments(fetchedDepts);
      setStaffList(staffWithId);
      setUnassignedStaff(staffWithId.filter(s => !s.department));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load organization data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // --- BRANCH ACTIONS ---
  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    try {
      setIsCreating(true);
      const res = await axios.post(`${process.env.REACT_APP_API}/branch/create`, 
        { name: newBranchName, address: newBranchAddress }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success("Branch created!");
      setNewBranchName('');
      setNewBranchAddress('');
      setShowBranchModal(false);
      setBranches([...branches, res.data.branch]);
    } catch (error) {
      toast.error("Failed to create branch");
    } finally {
      setIsCreating(false);
    }
  };

  const confirmDeleteBranch = (id) => {
    setBranchToDelete(id);
    setShowDeleteBranchModal(true);
  };

  const handleDeleteBranch = async () => {
    if (!branchToDelete) return;
    try {
      setIsDeleting(true);
      await axios.delete(`${process.env.REACT_APP_API}/branch/delete/${branchToDelete}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success("Branch deleted!");
      setShowDeleteBranchModal(false);
      fetchInitialData();
    } catch (error) {
      toast.error("Failed to delete branch");
    } finally {
      setIsDeleting(false);
      setBranchToDelete(null);
    }
  };

  // --- DEPARTMENT ACTIONS ---
  const handleOpenAddDept = (branchId = null, isGlobal = false) => {
    setActiveBranchForDept(branchId);
    setIsDeptGlobal(isGlobal);
    setNewDeptName('');
    setShowDeptModal(true);
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    try {
      setIsCreating(true);
      const payload = { 
        name: newDeptName, 
        branch_id: activeBranchForDept, 
        is_global: isDeptGlobal 
      };
      const res = await axios.post(`${process.env.REACT_APP_API}/department/create`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success("Department created!");
      
      const newDept = res.data.department;
      newDept.structure = [];
      setDepartments([...departments, newDept]);
      setShowDeptModal(false);
    } catch (error) {
      toast.error("Failed to create department");
    } finally {
      setIsCreating(false);
    }
  };

  const confirmDeleteDept = (id) => {
    setDeptToDelete(id);
    setShowDeleteDeptModal(true);
  };

  const handleDeleteDepartment = async () => {
    if (!deptToDelete) return;
    try {
      setIsDeleting(true);
      await axios.delete(`${process.env.REACT_APP_API}/department/delete/${deptToDelete}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success("Department deleted!");
      setShowDeleteDeptModal(false);
      fetchInitialData();
    } catch (error) {
      toast.error("Failed to delete department");
    } finally {
      setIsDeleting(false);
      setDeptToDelete(null);
    }
  };

  // --- ROLE ACTIONS ---
  const handleOpenAddRole = (deptId, parentNodeId = null) => {
    setActiveDeptForRole(deptId);
    setActiveParentNodeId(parentNodeId);
    setNewRoleName('');
    setShowRoleModal(true);
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim() || !activeDeptForRole) return;

    const deptIndex = departments.findIndex(d => d._id === activeDeptForRole);
    if (deptIndex === -1) return;

    const dept = departments[deptIndex];
    const newStructure = [...(dept.structure || [])];
    const nodeId = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

    newStructure.push({
      node_id: nodeId,
      name: newRoleName,
      parent_id: activeParentNodeId
    });

    try {
      setIsCreating(true);
      await axios.post(`${process.env.REACT_APP_API}/department/update-structure/${dept._id}`, { structure: newStructure }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const newDepts = [...departments];
      newDepts[deptIndex] = { ...dept, structure: newStructure };
      setDepartments(newDepts);
      setShowRoleModal(false);
      toast.success("Role added!");
    } catch (error) {
      toast.error("Failed to add role");
    } finally {
      setIsCreating(false);
    }
  };

  const confirmDeleteRole = (deptId, nodeId) => {
    setRoleToDelete({ deptId, nodeId });
    setShowDeleteRoleModal(true);
  };

  const handleRemoveRole = async () => {
    if (!roleToDelete) return;
    const { deptId, nodeId } = roleToDelete;

    const deptIndex = departments.findIndex(d => d._id === deptId);
    if (deptIndex === -1) return;

    const dept = departments[deptIndex];
    const nodesToDelete = new Set([nodeId]);
    let added = true;
    while(added) {
      added = false;
      for (let i = 0; i < dept.structure.length; i++) {
        const n = dept.structure[i];
        if (nodesToDelete.has(n.parent_id) && !nodesToDelete.has(n.node_id)) {
          nodesToDelete.add(n.node_id);
          added = true;
        }
      }
    }

    const newStructure = dept.structure.filter(n => !nodesToDelete.has(n.node_id));

    try {
      setIsDeleting(true);
      await axios.post(`${process.env.REACT_APP_API}/department/update-structure/${dept._id}`, { structure: newStructure }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      const staffPromises = staffList
        .filter(s => s.department === deptId && nodesToDelete.has(s.department_node_id))
        .map(s => axios.post(`${process.env.REACT_APP_API}/department/assign`, {
          staff_id: s._id,
          department_id: null,
          department_node_id: null
        }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }));

      if (staffPromises.length > 0) await Promise.all(staffPromises);

      fetchInitialData();
      setShowDeleteRoleModal(false);
      toast.success("Role removed!");
    } catch (error) {
      toast.error("Failed to remove role");
    } finally {
      setIsDeleting(false);
      setRoleToDelete(null);
    }
  };

  // --- DRAG AND DROP ---
  const handleEndDragStaff = async (evt) => {
    const { from, to, item } = evt;
    const fromId = from.id; 
    const toId = to.id;

    if (fromId === toId) return;

    const staffId = item.id;
    let actualDeptId = null;
    let finalNodeId = null;

    if (toId === 'unassigned') {
      actualDeptId = null;
      finalNodeId = null;
    } else if (toId.startsWith('dept_')) {
      actualDeptId = toId.replace('dept_', '');
      finalNodeId = null;
    } else {
      finalNodeId = toId;
      const foundDept = departments.find(d => d.structure && d.structure.some(n => n.node_id === toId));
      if (foundDept) {
        actualDeptId = foundDept._id;
      }
    }

    setTimeout(async () => {
      setStaffList(prevList => prevList.map(s => {
        if (s._id === staffId) return { ...s, department: actualDeptId, department_node_id: finalNodeId };
        return s;
      }));
      
      if (actualDeptId === null) {
         setUnassignedStaff(prev => {
            const s = staffList.find(st => st._id === staffId);
            if (s && !prev.some(x => x._id === staffId)) {
               return [...prev, { ...s, department: null, department_node_id: null }];
            }
            return prev;
         });
      }

      try {
        await axios.post(`${process.env.REACT_APP_API}/department/assign`, {
          staff_id: staffId,
          department_id: actualDeptId,
          department_node_id: finalNodeId
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success("Staff reassigned!");
        fetchInitialData(); 
      } catch (error) {
        toast.error("Failed to reassign staff.");
        fetchInitialData();
      }
    }, 10);
  };

  const updateSortableList = () => {};

  const renderStaffCard = (staff) => (
    <div key={staff._id} id={staff._id}>
      <Card className="mb-2 shadow-sm cursor-pointer hover-scale-up border-0" style={{ backgroundColor: '#ffffff' }}>
        <Card.Body className="p-2 d-flex align-items-center rounded">
          <div className="sw-4 sh-4 sw-md-5 sh-md-5 me-2 me-md-3 bg-primary text-white d-flex justify-content-center align-items-center rounded-circle fw-bold flex-shrink-0" style={{ fontSize: '0.9rem' }}>
            {staff.f_name?.charAt(0)}{staff.l_name?.charAt(0)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.9rem' }}>{staff.f_name} {staff.l_name}</div>
            <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>{staff.position || 'No Title'}</div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );

  const renderTreeNode = (dept, node, allNodes, depth = 0) => {
    const children = allNodes.filter(n => n.parent_id === node.node_id);
    const staffInNode = staffList.filter(s => s.department === dept._id && s.department_node_id === node.node_id);

    return (
      <div key={node.node_id} className="mt-3" style={{ paddingLeft: `${depth * 10}px` }}>
        <Card className="border border-secondary bg-light">
          <Card.Header className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center p-2 bg-transparent">
            <h6 className="mb-2 mb-sm-0 fw-bold">{node.name}</h6>
            <div className="d-flex w-100 w-sm-auto justify-content-end align-items-center">
              <Button variant="outline-primary" size="sm" className="me-2 rounded-circle flex-shrink-0 d-inline-flex justify-content-center align-items-center p-0" style={{ width: '24px', height: '24px' }} onClick={() => handleOpenAddRole(dept._id, node.node_id)} title="Add Sub-role">
                <CsLineIcons icon="plus" size="12" />
              </Button>
              <Button variant="outline-danger" size="sm" className="rounded-circle flex-shrink-0 d-inline-flex justify-content-center align-items-center p-0" style={{ width: '24px', height: '24px' }} onClick={() => confirmDeleteRole(dept._id, node.node_id)} title="Remove Role">
                <CsLineIcons icon="bin" size="12" />
              </Button>
            </div>
          </Card.Header>
          <Card.Body className="p-2">
            <ReactSortable
              list={staffInNode}
              setList={(nl) => updateSortableList(nl, node.node_id)}
              group="staffGroup"
              animation={150}
              onEnd={handleEndDragStaff}
              forceFallback={true}
              className="w-100"
              style={{ minHeight: '60px', border: '1px dashed #ccc', borderRadius: '4px', padding: '5px' }}
              id={node.node_id}
            >
              {staffInNode.map(s => renderStaffCard(s))}
            </ReactSortable>
            {children.map(child => renderTreeNode(dept, child, allNodes, depth + 1))}
          </Card.Body>
        </Card>
      </div>
    );
  };

  const renderDepartmentTree = (dept) => {
    const structure = dept.structure || [];
    const rootNodes = structure.filter(n => !n.parent_id);
    const departmentStaff = staffList.filter(s => s.department === dept._id && !s.department_node_id);

    return (
      <Card className="mb-3 bg-white border-0 shadow-sm" key={dept._id}>
        <Card.Header className="border-0 pt-3 pb-2 bg-transparent d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center">
          <h5 className="mb-3 mb-sm-0 fw-bold text-dark d-flex align-items-center">
            <div className="sw-3 sh-3 rounded-circle d-flex justify-content-center align-items-center me-2 bg-primary bg-opacity-10">
              <CsLineIcons icon="diagram-1" size="14" className="text-primary" />
            </div>
            {dept.name}
          </h5>
          <div className="d-flex w-100 w-sm-auto justify-content-start justify-content-sm-end align-items-center">
            <Button variant="outline-primary" size="sm" className="me-2 rounded-pill flex-grow-1 flex-sm-grow-0" onClick={() => handleOpenAddRole(dept._id, null)}>
              <CsLineIcons icon="plus" size="12" className="me-1" /> Top Role
            </Button>
            <Button variant="outline-danger" size="sm" className="rounded-circle p-0 flex-shrink-0 d-inline-flex justify-content-center align-items-center" style={{ width: '28px', height: '28px' }} onClick={() => confirmDeleteDept(dept._id)}>
              <CsLineIcons icon="bin" size="14" />
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-3 bg-light rounded m-2">
          <ReactSortable
            list={departmentStaff}
            setList={(nl) => updateSortableList(nl, `dept_${dept._id}`)}
            group="staffGroup"
            animation={150}
            onEnd={handleEndDragStaff}
            forceFallback={true}
            className="w-100"
            style={{ 
              minHeight: departmentStaff.length === 0 && rootNodes.length > 0 ? '10px' : '60px', 
              paddingBottom: '10px'
            }}
            id={`dept_${dept._id}`}
          >
            {departmentStaff.length === 0 && rootNodes.length === 0 ? (
              <div className="text-muted text-center py-4 small" style={{ border: '1px dashed #ccc', borderRadius: '4px' }}>
                Drop staff here or Add a Top Role
              </div>
            ) : (
              departmentStaff.map(s => renderStaffCard(s))
            )}
          </ReactSortable>
          {rootNodes.map(rootNode => renderTreeNode(dept, rootNode, structure, 0))}
        </Card.Body>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" style={{ color: '#23b3f4' }} />
      </div>
    );
  }

  const globalDepts = departments.filter(d => d.is_global);

  return (
    <div className="container-fluid pb-5">
      <HtmlHead title="Organization Structure" description="Manage Organization Branches, Departments, and Global Roles" />
      
      <div className="page-title-container mb-4 mt-5 mt-lg-0">
        <Row className="g-0 align-items-sm-center">
          <Col xs={12} lg="auto" className="me-auto mb-3 mb-lg-0">
            <h1 className="mb-0 pb-0 display-6 display-lg-4 fw-bold" style={{ color: '#23b3f4' }}>Organization Structure</h1>
            <div className="text-muted mt-1 small">Manage branches, nested departments, and global oversight roles.</div>
          </Col>
          <Col xs={12} lg="auto" className="d-flex flex-column flex-sm-row justify-content-end gap-2 mt-2 mt-lg-0">
            <Button variant="outline-primary" className="rounded-pill px-4 shadow-sm w-100 w-sm-auto" onClick={() => handleOpenAddDept(null, true)}>
              <CsLineIcons icon="globe" size="18" className="me-2" /> Add Global Dept
            </Button>
            <Button variant="primary" className="rounded-pill px-4 shadow-sm w-100 w-sm-auto" onClick={() => setShowBranchModal(true)}>
              <CsLineIcons icon="plus" size="18" className="me-2" /> Add Branch
            </Button>
          </Col>
        </Row>
      </div>

      <Row className="g-4">
        {/* Unassigned Staff Column */}
        <Col xs={12} lg={4} xl={3}>
          <Card className="h-100 bg-white border-primary mb-4 shadow-sm" style={{ borderTopWidth: '4px' }}>
            <Card.Header className="border-0 pt-4 pb-2 bg-transparent d-flex flex-column align-items-start">
              <h5 className="mb-2 fw-bold text-primary">Unassigned Staff ({unassignedStaff.length})</h5>
              <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>Drag staff to assign them to a role.</p>
            </Card.Header>
            <Card.Body className="p-3 bg-light rounded m-2 overflow-auto" style={{ maxHeight: '75vh' }}>
              <ReactSortable
                list={unassignedStaff}
                setList={(nl) => updateSortableList(nl, 'unassigned')}
                group="staffGroup"
                animation={150}
                onEnd={handleEndDragStaff}
                forceFallback={true}
                className="w-100"
                style={{ minHeight: '60px', paddingBottom: '30px' }}
                id="unassigned"
              >
                {unassignedStaff.length === 0 ? (
                  <div className="text-muted text-center mt-3 small">All staff are assigned.</div>
                ) : (
                  unassignedStaff.map(s => renderStaffCard(s))
                )}
              </ReactSortable>
            </Card.Body>
          </Card>
        </Col>

        {/* Organization Layout Column */}
        <Col xs={12} lg={8} xl={9}>
          
          {/* Global Roles / Departments */}
          {globalDepts.length > 0 && (
            <div className="mb-5">
              <h4 className="fw-bold text-dark mb-3 d-flex align-items-center">
                <CsLineIcons icon="globe" size="20" className="me-2 text-primary" /> 
                Global Departments & Roles
              </h4>
              <Row className="g-3">
                <Col xl={6}>
                  {globalDepts.filter((_, i) => i % 2 === 0).map(dept => (
                    <div key={dept._id} className="mb-3">
                      {renderDepartmentTree(dept)}
                    </div>
                  ))}
                </Col>
                <Col xl={6}>
                  {globalDepts.filter((_, i) => i % 2 !== 0).map(dept => (
                    <div key={dept._id} className="mb-3">
                      {renderDepartmentTree(dept)}
                    </div>
                  ))}
                </Col>
              </Row>
            </div>
          )}

          {/* Branches */}
          <div>
            <h4 className="fw-bold text-dark mb-3 d-flex align-items-center">
              <CsLineIcons icon="building" size="20" className="me-2 text-primary" /> 
              Branches
            </h4>
            <Row className="g-4">
              {branches.length === 0 ? (
                <Col xs={12}>
                  <Alert variant="info" className="text-center p-5 border-0 shadow-sm" style={{ backgroundColor: 'rgba(35, 179, 244, 0.05)', borderRadius: '1.5rem' }}>
                    <CsLineIcons icon="building" size="48" style={{ color: '#23b3f4' }} className="mb-3" />
                    <h5 className="fw-bold text-dark">No Branches Found</h5>
                    <p className="text-muted mb-0">Add your first branch to organize your staff geographically.</p>
                  </Alert>
                </Col>
              ) : (
                branches.map(branch => {
                  const branchDepts = departments.filter(d => d.branch_id === branch._id);
                  return (
                    <Col xs={12} key={branch._id}>
                      <Card className="border-0 shadow-sm bg-white" style={{ borderRadius: '1rem', borderTop: '4px solid #23b3f4' }}>
                        <Card.Header className="bg-transparent border-0 pt-4 pb-2 d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center">
                          <div className="mb-3 mb-sm-0">
                            <h4 className="fw-bold mb-1 text-dark">{branch.name}</h4>
                            <p className="text-muted small mb-0">{branch.address || 'No address provided'}</p>
                          </div>
                          <div className="d-flex w-100 w-sm-auto justify-content-start justify-content-sm-end align-items-center">
                            <Button variant="outline-primary" size="sm" className="me-2 rounded-pill flex-grow-1 flex-sm-grow-0" onClick={() => handleOpenAddDept(branch._id, false)}>
                              <CsLineIcons icon="plus" size="14" className="me-1" /> Add Department
                            </Button>
                            <Button variant="outline-danger" size="sm" className="rounded-circle p-0 flex-shrink-0 d-inline-flex justify-content-center align-items-center" style={{ width: '32px', height: '32px' }} onClick={() => confirmDeleteBranch(branch._id)}>
                              <CsLineIcons icon="bin" size="16" />
                            </Button>
                          </div>
                        </Card.Header>
                        <Card.Body className="pt-2">
                          {branchDepts.length === 0 ? (
                            <div className="text-muted text-center py-4 bg-light rounded border border-dashed small">
                              No departments in this branch. Click "Add Department" to get started.
                            </div>
                          ) : (
                            <Row className="g-3">
                              <Col xl={6}>
                                {branchDepts.filter((_, i) => i % 2 === 0).map(dept => (
                                  <div key={dept._id} className="mb-3">
                                    {renderDepartmentTree(dept)}
                                  </div>
                                ))}
                              </Col>
                              <Col xl={6}>
                                {branchDepts.filter((_, i) => i % 2 !== 0).map(dept => (
                                  <div key={dept._id} className="mb-3">
                                    {renderDepartmentTree(dept)}
                                  </div>
                                ))}
                              </Col>
                            </Row>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })
              )}
            </Row>
          </div>

        </Col>
      </Row>

      {/* --- Modals --- */}
      
      {/* Branch Modal */}
      <Modal show={showBranchModal} onHide={() => setShowBranchModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Add New Branch</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateBranch}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Branch Name *</Form.Label>
              <Form.Control type="text" required placeholder="e.g. Downtown Branch" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Address</Form.Label>
              <Form.Control as="textarea" rows={3} placeholder="Full address of the branch" value={newBranchAddress} onChange={(e) => setNewBranchAddress(e.target.value)} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-top-0 pt-0">
            <Button variant="light" className="rounded-pill px-4" onClick={() => setShowBranchModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" className="rounded-pill px-4 shadow-sm" disabled={isCreating}>
              {isCreating ? <Spinner size="sm" animation="border" /> : 'Create Branch'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Department Modal */}
      <Modal show={showDeptModal} onHide={() => setShowDeptModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Add New {isDeptGlobal ? 'Global Department' : 'Branch Department'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateDepartment}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Department Name *</Form.Label>
              <Form.Control type="text" required placeholder="e.g. Sales, Kitchen, Executive" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} />
            </Form.Group>
            {isDeptGlobal && <Form.Text className="text-muted">This department will not be tied to any specific branch.</Form.Text>}
          </Modal.Body>
          <Modal.Footer className="border-top-0 pt-0">
            <Button variant="light" className="rounded-pill px-4" onClick={() => setShowDeptModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" className="rounded-pill px-4 shadow-sm" disabled={isCreating}>
              {isCreating ? <Spinner size="sm" animation="border" /> : 'Create Department'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Role Modal */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">{activeParentNodeId ? 'Add Sub-role' : 'Add Top Role'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddRole}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Role Name *</Form.Label>
              <Form.Control type="text" required placeholder="e.g. Manager, Developer" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} autoFocus />
              <Form.Text className="text-muted">
                {activeParentNodeId ? "This role will report to the parent node you selected." : "This will be a top-level role in the department."}
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-top-0 pt-0">
            <Button variant="light" className="rounded-pill px-4" onClick={() => setShowRoleModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" className="rounded-pill px-4 shadow-sm" disabled={isCreating}>
              {isCreating ? <Spinner size="sm" animation="border" /> : 'Add Role'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <DeleteConfirmModal show={showDeleteBranchModal} onHide={() => setShowDeleteBranchModal(false)} onConfirm={handleDeleteBranch} isDeleting={isDeleting} title="Delete Branch" bodyText="Are you sure you want to delete this branch? All departments and staff inside will be unassigned. This action cannot be undone." />
      <DeleteConfirmModal show={showDeleteDeptModal} onHide={() => setShowDeleteDeptModal(false)} onConfirm={handleDeleteDepartment} isDeleting={isDeleting} title="Delete Department" bodyText="Are you sure you want to delete this department? All staff inside will be unassigned." />
      <DeleteConfirmModal show={showDeleteRoleModal} onHide={() => setShowDeleteRoleModal(false)} onConfirm={handleRemoveRole} isDeleting={isDeleting} title="Delete Role" bodyText="Remove this role and all sub-roles? Staff will be sent to 'Unassigned'." />

    </div>
  );
};

export default BranchBoard;
