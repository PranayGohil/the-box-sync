import React, { useMemo, useState } from 'react';
import { Card, Col, Row, ButtonGroup, Dropdown, Pagination, Modal, Button, Form } from 'react-bootstrap';
import { useFormik } from 'formik';
import { useTable, useGlobalFilter, useSortBy, useAsyncDebounce, usePagination } from 'react-table';
import classNames from 'classnames';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import csInterfaceIcons from 'views/interface/content/icons/data/cs-interface-icons-tags';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import bootstrapIcons from 'views/interface/content/icons/data/bootstrap-icons-tags';

const ManageMenu = () => {
  const title = 'Manage Menu';
  const description = 'Dynamic menu table with search and pagination';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/manage-menu', title: 'Manage Menu' },
  ];

  // Modal and selected dish state
  const [editMenuModalShow, setEditMenuModalShow] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [deleteDishModalShow, setDeleteDishModalShow] = useState(false);
  const [dishToDelete, setDishToDelete] = useState(null);

  // Dummy icons
  const starFillIcon = csInterfaceIcons.find((icon) => icon.c === 'cs-star-full');
  const eggIcon = bootstrapIcons.find((icon) => icon.c === 'bi-egg');

  // Dummy menu data
  const [menuData] = useState([
    {
      id: '1',
      meal_type: 'egg',
      category: 'Paneer',
      dishes: [
        { id: 'a', dish_name: 'Paneer Masala', dish_price: 200, is_special: false },
        { id: 'b', dish_name: 'Cheese Paneer', dish_price: 220, is_special: true },
      ],
    },
    {
      id: '2',
      meal_type: 'non-veg',
      category: 'Chicken',
      dishes: [
        { id: 'c', dish_name: 'Butter Chicken', dish_price: 150, is_special: false },
        { id: 'd', dish_name: 'Kadai Chicken', dish_price: 180, is_special: true },
      ],
    },
    {
      id: '3',
      meal_type: 'veg',
      category: 'Veg Sabji',
      dishes: [
        { id: 'e', dish_name: 'Aloo Sabji', dish_price: 70, is_special: true },
        { id: 'f', dish_name: 'Bhindi Sabji', dish_price: 60, is_special: false },
        { id: 'g', dish_name: 'Gobi ki Sabji', dish_price: 110, is_special: true },
      ],
    },
  ]);

  // Meal type icon helper
  const getMealIcon = (mealType) => {
    if (mealType === 'veg') return <CsLineIcons icon="leaf" width="20" height="20" className="me-2 text-success" />;
    if (mealType === 'non-veg') return <CsLineIcons icon="bone" width="20" height="20" className="me-2 text-danger" />;
    return <i className={`bi ${eggIcon.c}`} />;
  };

  // Table helper components
  const ControlsSearch = ({ tableInstance }) => {
    const {
      setGlobalFilter,
      state: { globalFilter },
    } = tableInstance;
    const [value, setValue] = useState(globalFilter);
    const onChange = useAsyncDebounce((val) => setGlobalFilter(val || undefined), 200);
    return (
      <div className="search-input-container w-100 border border-separator bg-foreground search-sm">
        <input
          className="form-control form-control-sm datatable-search"
          value={value || ''}
          onChange={(e) => {
            setValue(e.target.value);
            onChange(e.target.value);
          }}
          placeholder="Search"
        />
        {value ? (
          <span
            className="search-delete-icon"
            onClick={() => {
              setValue('');
              onChange('');
            }}
          >
            <CsLineIcons icon="close" />
          </span>
        ) : (
          <span className="search-magnifier-icon pe-none">
            <CsLineIcons icon="search" />
          </span>
        )}
      </div>
    );
  };

  const ControlsPageSize = ({ tableInstance }) => {
    const {
      setPageSize,
      gotoPage,
      state: { pageSize },
    } = tableInstance;
    const options = [2, 5, 10];
    return (
      <Dropdown size="sm" as={ButtonGroup} className="d-inline-block" align="end">
        <Dropdown.Toggle variant="outline-muted">{pageSize} Items</Dropdown.Toggle>
        <Dropdown.Menu>
          {options.map((size) => (
            <Dropdown.Item
              key={size}
              active={pageSize === size}
              onClick={() => {
                setPageSize(size);
                gotoPage(0);
              }}
            >
              {size} Items
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  };

  const Table = ({ tableInstance, className }) => {
    const { getTableProps, headerGroups, page, getTableBodyProps, prepareRow } = tableInstance;
    return (
      <table {...getTableProps()} className={className}>
        <thead>
          {headerGroups.map((headerGroup, i) => (
            <tr key={i} {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((col, ci) => (
                <th
                  key={ci}
                  {...col.getHeaderProps(col.getSortByToggleProps())}
                  className={classNames(col.headerClassName, {
                    sorting_desc: col.isSortedDesc,
                    sorting_asc: col.isSorted && !col.isSortedDesc,
                    sorting: col.sortable,
                  })}
                >
                  {col.render('Header')}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row, ri) => {
            prepareRow(row);
            return (
              <tr key={ri} {...row.getRowProps()} className={ri % 2 === 0 ? 'even' : 'odd'}>
                {row.cells.map((cell, ci) => (
                  <td key={ci} {...cell.getCellProps()} className={cell.column.cellClassName}>
                    {cell.render('Cell')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const TablePagination = ({ tableInstance }) => {
    const {
      gotoPage,
      previousPage,
      nextPage,
      canPreviousPage,
      canNextPage,
      pageCount,
      state: { pageIndex },
    } = tableInstance;
    if (pageCount <= 1) return null;
    return (
      <Pagination size="sm" className="justify-content-center mb-0 mt-3">
        <Pagination.First onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          <CsLineIcons icon="arrow-double-left" />
        </Pagination.First>
        <Pagination.Prev onClick={() => previousPage()} disabled={!canPreviousPage}>
          <CsLineIcons icon="chevron-left" />
        </Pagination.Prev>
        {[...Array(pageCount)].map((_, i) => (
          <Pagination.Item key={i} active={i === pageIndex} onClick={() => gotoPage(i)}>
            {i + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next onClick={() => nextPage()} disabled={!canNextPage}>
          <CsLineIcons icon="chevron-right" />
        </Pagination.Next>
        <Pagination.Last onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          <CsLineIcons icon="arrow-double-right" />
        </Pagination.Last>
      </Pagination>
    );
  };

  // Build table per category
  const renderCategoryTable = (category) => {
    const columns = useMemo(
      () => [
        {
          Header: 'Dish Name',
          accessor: 'dish_name',
          sortable: true,
          headerClassName: 'text-muted text-small text-uppercase w-40',
          Cell: ({ row }) => (
            <>
              {row.original.dish_name}
              {row.original.is_special && <i className={`icon-20 ${starFillIcon.c} ms-2 text-warning`} />}
            </>
          ),
        },
        {
          Header: 'Price',
          accessor: 'dish_price',
          sortable: true,
          headerClassName: 'text-muted text-small text-uppercase w-20',
          cellClassName: 'text-alternate',
        },
        {
          Header: 'Actions',
          id: 'actions',
          headerClassName: 'text-muted text-small text-uppercase w-20',
          Cell: ({ row }) => (
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-icon btn-outline-primary"
                onClick={() => {
                  setSelectedDish(row.original);
                  setEditMenuModalShow(true);
                }}
              >
                <CsLineIcons icon="edit" />
              </button>
              <button
                type="button"
                className="btn btn-sm btn-icon btn-outline-danger"
                onClick={() => {
                  setDishToDelete(row.original);
                  setDeleteDishModalShow(true);
                }}
              >
                <CsLineIcons icon="bin" />
              </button>
            </div>
          ),
        },
      ],
      []
    );

    const data = useMemo(() => category.dishes, [category.dishes]);
    const tableInstance = useTable({ columns, data, initialState: { pageIndex: 0 } }, useGlobalFilter, useSortBy, usePagination);

    return (
      <>
        <Row className="mb-2">
          <Col xs={6}>
            <ControlsSearch tableInstance={tableInstance} />
          </Col>
          <Col xs={6} className="text-end">
            <ControlsPageSize tableInstance={tableInstance} />
          </Col>
        </Row>
        <Table className="react-table nowrap stripe" tableInstance={tableInstance} />
        <TablePagination tableInstance={tableInstance} />
      </>
    );
  };

  return (
    <>
      <HtmlHead title={title} description={description} />
      <Row>
        <Col>
          <div className="page-title-container mb-4">
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </div>
          <Row>
            {menuData.map((category) => (
              <Col md={6} lg={4} key={category.id}>
                <Card body className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    {getMealIcon(category.meal_type)}
                    <h5 className="mb-0">{category.category}</h5>
                  </div>
                  {renderCategoryTable(category)}
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>

      {/* Edit Modal */}
      {selectedDish && <EditDishModal show={editMenuModalShow} handleClose={() => setEditMenuModalShow(false)} data={selectedDish} />}

      {dishToDelete && <DeleteDishModal show={deleteDishModalShow} handleClose={() => setDeleteDishModalShow(false)} data={dishToDelete} />}
    </>
  );
};

// ✅ Modal component
const EditDishModal = ({ show, handleClose, data }) => {
  const [previewImg, setPreviewImg] = useState(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(!!data?.quantity);

  const formik = useFormik({
    initialValues: {
      dish_name: data?.dish_name || '',
      dish_price: data?.dish_price || '',
      description: data?.description || '',
      quantity: data?.quantity || '',
      unit: data?.unit || '',
      dish_img: data?.dish_img || null,
      is_special: data?.is_special || false,
    },
    enableReinitialize: true,
    onSubmit: (values) => {
      console.log('Updated dish:', values);
      handleClose();
    },
  });

  return (
    <Modal className="modal-right large" show={show} onHide={handleClose} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Edit Dish</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form id="edit_dish_form" onSubmit={formik.handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Dish Name</Form.Label>
            <Form.Control type="text" name="dish_name" value={formik.values.dish_name} onChange={formik.handleChange} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Dish Price</Form.Label>
            <Form.Control type="text" name="dish_price" value={formik.values.dish_price} onChange={formik.handleChange} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" name="description" value={formik.values.description} onChange={formik.handleChange} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Dish Image</Form.Label>
            <Form.Control
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                formik.setFieldValue('dish_img', file);
                if (file) setPreviewImg(URL.createObjectURL(file));
              }}
            />
            {previewImg && <img src={previewImg} alt="Preview" className="img-thumbnail mt-2" style={{ maxWidth: '100px' }} />}
          </Form.Group>
          <Form.Check
            type="checkbox"
            label="Advanced Options"
            checked={showAdvancedOptions}
            onChange={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="mb-3"
          />
          {showAdvancedOptions && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Quantity</Form.Label>
                <Form.Control type="text" name="quantity" value={formik.values.quantity} onChange={formik.handleChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Unit</Form.Label>
                <Form.Select name="unit" value={formik.values.unit} onChange={formik.handleChange}>
                  <option value="">Select Unit</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="litre">litre</option>
                  <option value="ml">ml</option>
                  <option value="piece">piece</option>
                </Form.Select>
              </Form.Group>
            </>
          )}
          <Form.Check
            type="checkbox"
            label="Special Dish"
            checked={formik.values.is_special}
            onChange={(e) => formik.setFieldValue('is_special', e.target.checked)}
            className="mb-3"
          />
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="dark" type="submit" form="edit_dish_form">
          Update Dish
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const DeleteDishModal = ({ show, handleClose, data }) => {
  return (
    <Modal className="modal-close-out" show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Delete Dish</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to delete this dish?</p>
        <p>
          <strong>{data.dish_name}</strong>
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            console.log('Deleting dish:', data);
            handleClose();
          }}
        >
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ManageMenu;
