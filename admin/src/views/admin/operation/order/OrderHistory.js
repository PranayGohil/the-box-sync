import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Badge, Col, Form, Row, Button, Spinner, Alert, Card, Collapse, Modal, ProgressBar, Dropdown } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy } from 'react-table';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthContext } from 'contexts/AuthContext';

import ControlsPageSize from './components/ControlsPageSize';
import ControlsSearch from './components/ControlsSearch';
import Table from './components/Table';
import TablePagination from './components/TablePagination';

const customStyles = `
  .custom-control-btn {
    position: relative !important;
    width: 40px !important;
    height: 40px !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 10px !important;
    transition: all 0.2s ease !important;
    border: 1px solid #1ea8e7 !important;
    background-color: #fff !important;
    color: #1ea8e7 !important;
  }
  .custom-control-btn:hover {
    background-color: #1ea8e7 !important;
    color: #fff !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 8px rgba(30, 168, 231, 0.2) !important;
  }
  .custom-control-btn:hover svg {
    color: #fff !important;
    fill: #fff !important;
  }
  .custom-control-btn.active {
    background-color: #1ea8e7 !important;
    color: #fff !important;
  }
  .custom-control-btn.active svg {
    color: #fff !important;
    fill: #fff !important;
  }
  .custom-search-container {
    border-radius: 10px !important;
    overflow: hidden !important;
    background-color: #fff !important;
    border: 1px solid #eee !important;
    transition: all 0.2s ease !important;
  }
  .custom-search-container:focus-within {
    border-color: #1ea8e7 !important;
    box-shadow: 0 0 0 2px rgba(30, 168, 231, 0.1) !important;
  }
`;

const OrderHistory = () => {
  const title = 'Order History';
  const description = 'Order history with advanced filters.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/order-history', text: 'Order History' },
  ];

  const history = useHistory();
  const { currentUser } = useContext(AuthContext);

  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState({});

  // Server-side pagination state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    orderSource: '',
    orderStatus: '',
    orderType: '',
    tableArea: '',
    fromDate: '',
    toDate: '',
  });

  // Bulk Export states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportFilters, setExportFilters] = useState({
    orderSource: '',
    orderStatus: '',
    orderType: '',
    tableArea: '',
    fromDate: '',
    toDate: '',
    paymentType: '',
  });

  // Ref to prevent infinite loops
  const fetchRef = useRef(false);

  const COMPANY_NAME = currentUser?.name || 'TheBoxSync';
  const API_BASE = process.env.REACT_APP_API;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatCurrencyPDF = (amount) => {
    const value = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(amount || 0);
    return `Rs. ${value}`;
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pageIndex + 1,
        limit: pageSize,
        sortBy,
        sortOrder,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm;
      }

      // Add filters to params
      if (filters.orderSource) {
        params.order_source = filters.orderSource;
      }
      if (filters.orderStatus) {
        params.order_status = filters.orderStatus;
      }
      if (filters.orderType) {
        params.order_type = filters.orderType;
      }
      if (filters.tableArea) {
        params.table_area = filters.tableArea;
      }
      if (filters.fromDate) {
        params.from = filters.fromDate;
      }
      if (filters.toDate) {
        params.to = filters.toDate;
      }

      const { data: resData } = await axios.get(`${API_BASE}/order/get-orders`, {
        params,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (resData.success) {
        const transformedOrders = resData.data.map(({ _id, ...rest }) => ({
          ...rest,
          id: _id,
        }));

        setData(transformedOrders);

        if (resData.pagination) {
          setTotalRecords(resData.pagination.total || 0);
          setTotalPages(resData.pagination.totalPages || 0);
        }
      } else {
        setError(resData.message);
        toast.error(resData.message);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError(err.message || 'Failed to fetch orders');
      toast.error('Failed to fetch orders. Please try again.');
    } finally {
      setLoading(false);
      fetchRef.current = false;
    }
  }, [pageIndex, pageSize, searchTerm, sortBy, sortOrder, filters, API_BASE]);

  useEffect(() => {
    if (!fetchRef.current) {
      fetchRef.current = true;
      fetchOrders();
    }
  }, [fetchOrders]);

  const handlePageChange = (newPageIndex) => {
    if (newPageIndex !== pageIndex) {
      setPageIndex(newPageIndex);
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPageIndex(0);
  };

  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  const handleSearch = (value) => {
    if (value !== searchTerm) {
      setSearchTerm(value);
      setPageIndex(0);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(localSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearchTerm]);

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleSort = (columnId) => {
    if (sortBy === columnId) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnId);
      setSortOrder('desc');
    }
    setPageIndex(0);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setPageIndex(0);
  };

  const handleClearFilters = () => {
    setFilters({
      orderSource: '',
      orderStatus: '',
      orderType: '',
      tableArea: '',
      fromDate: '',
      toDate: '',
    });
    setSearchTerm('');
    setPageIndex(0);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.orderSource) count += 1;
    if (filters.orderStatus) count += 1;
    if (filters.orderType) count += 1;
    if (filters.tableArea) count += 1;
    if (filters.fromDate) count += 1;
    if (filters.toDate) count += 1;
    if (searchTerm) count += 1;
    return count;
  };

  const printCounterBill = (ord, userData, counterName, items) => {
    return `
      <div style="page-break-after: always; font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 10px; border: 1px solid #ccc;">
        <!-- Restaurant Header -->
        <div style="text-align: center; margin-bottom: 10px;">
          <h3 style="margin: 5px;">${userData.name}</h3>
        </div>

        <hr style="border: 0.5px dashed #ccc;" />

        <!-- Counter Badge -->
        <div style="text-align: center; margin: 8px 0;">
          <span style="background: #000; color: #fff; padding: 4px 16px; border-radius: 4px; font-size: 14px; font-weight: bold;">
            ${counterName} Counter
          </span>
        </div>

        <hr style="border: 0.5px dashed #ccc;" />

        <!-- Order Info -->
        <table style="width: 100%; font-size: 12px; margin-bottom: 8px;">
          <tr>
            <td><strong>Bill No:</strong> ${ord.order_no || ord._id}</td>
            <td style="text-align: right;"><strong>${ord.order_type}</strong></td>
          </tr>
          <tr>
            <td><strong>Date:</strong> ${new Date(ord.order_date).toLocaleString()}</td>
            <td style="text-align: right;">
              ${ord.table_no
        ? `<strong>Table:</strong> ${ord.table_no}`
        : ord.token
          ? `<strong>Token:</strong> ${ord.token}`
          : ''}
            </td>
          </tr>
          ${ord.customer_name
        ? `<tr><td colspan="2"><strong>Customer:</strong> ${ord.customer_name}</td></tr>`
        : ''}
        </table>

        <!-- Items Table -->
        <table style="width: 100%; font-size: 12px; margin-bottom: 10px;">
          <thead>
            <tr>
              <th style="text-align: left; border-bottom: 1px solid #ccc;">Item</th>
              <th style="text-align: center; border-bottom: 1px solid #ccc;">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.dish_name}</td>
                <td style="text-align: center;">${item.quantity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

      </div>
    `;
  };

  const printFullBill = (ord, userData, items, subTotal) => {
    return `
      <div style="page-break-after: always; font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 10px; border: 1px solid #ccc;">
        <!-- Restaurant Header -->
        <div style="text-align: center; margin-bottom: 10px;">
          <h2 style="margin: 5px;">${userData.name}</h2>
          <p style="margin: 0; font-size: 14px;">${userData.address}</p>
          <p style="margin: 0; font-size: 14px;">${userData.city}, ${userData.state} - ${userData.pincode}</p>
          <p style="margin: 5px; font-size: 14px;"><strong>Ph:</strong> ${userData.mobile}</p>
          ${userData.gst_no ? `<p style="font-size: 14px;"><strong>GST:</strong> ${userData.gst_no}</p>` : ''}
        </div>

        <hr style="border: 0.5px dashed #ccc;" />

        <!-- Order Info -->
        <table style="width: 100%; font-size: 14px; margin-bottom: 20px;">
          <tr>
            <td><strong>Bill No:</strong> ${ord.order_no || ord._id}</td>
            <td style="text-align: right;"><strong>${ord.order_type}</strong></td>
          </tr>
          <tr>
            <td><strong>Date:</strong> ${new Date(ord.order_date).toLocaleString()}</td>
            <td style="text-align: right;">
              ${ord.table_no
        ? `<strong>Table:</strong> ${ord.table_no}`
        : ord.token
          ? `<strong>Token:</strong> ${ord.token}`
          : ''}
            </td>
          </tr>
          ${ord.customer_name
        ? `<tr><td colspan="2"><strong>Customer:</strong> ${ord.customer_name}</td></tr>`
        : ''}
        </table>

        <!-- Items Table -->
        <table style="width: 100%; font-size: 14px; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="text-align: left; border-bottom: 1px solid #ccc;">Item</th>
              <th style="text-align: center; border-bottom: 1px solid #ccc;">Qty</th>
              <th style="text-align: center; border-bottom: 1px solid #ccc;">Price</th>
              <th style="text-align: right; border-bottom: 1px solid #ccc;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.dish_name}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: center;">₹${item.dish_price}</td>
                <td style="text-align: right;">₹${(item.dish_price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}

            <tr>
              <td colspan="3" style="text-align: right; border-top: 1px solid #ccc; padding-top: 10px;">
                <strong>Sub Total:</strong>
              </td>
              <td style="text-align: right; border-top: 1px solid #ccc; padding-top: 10px;">
                <strong>₹${subTotal.toFixed(2)}</strong>
              </td>
            </tr>

            ${ord.cgst_amount > 0 ? `
              <tr>
                <td colspan="3" style="text-align: right;">
                  <strong>CGST (${ord.cgst_percent || 0}%):</strong>
                </td>
                <td style="text-align: right;">
                  ₹${parseFloat(ord.cgst_amount).toFixed(2)}
                </td>
              </tr>
            ` : ''}

            ${ord.sgst_amount > 0 ? `
              <tr>
                <td colspan="3" style="text-align: right;">
                  <strong>SGST (${ord.sgst_percent || 0}%):</strong>
                </td>
                <td style="text-align: right;">
                  ₹${parseFloat(ord.sgst_amount).toFixed(2)}
                </td>
              </tr>
            ` : ''}

            ${ord.vat_amount > 0 ? `
              <tr>
                <td colspan="3" style="text-align: right;">
                  <strong>VAT (${ord.vat_percent || 0}%):</strong>
                </td>
                <td style="text-align: right;">
                  ₹${parseFloat(ord.vat_amount).toFixed(2)}
                </>
              </tr>
            ` : ''}

            ${ord.discount_amount > 0 ? `
              <tr>
                <td colspan="3" style="text-align: right;">
                  <strong>Discount:</strong>
                </td>
                <td style="text-align: right;">
                  ₹${parseFloat(ord.discount_amount).toFixed(2)}
                </td>
              </tr>
            ` : ''}

            <tr>
              <td colspan="3" style="text-align: right; border-top: 1px solid #ccc; padding-top: 10px;">
                <strong>Total Amount:</strong>
              </td>
              <td style="text-align: right; border-top: 1px solid #ccc; padding-top: 10px;">
                <strong>₹${parseFloat(ord.total_amount).toFixed(2)}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        <hr style="border: 0.5px dashed #ccc;" />
        <p style="text-align: center; font-size: 12px;"><strong>Thanks, Visit Again</strong></p>

      </div>
    `;
  };

  const handlePrint = async (orderId) => {
    try {
      setPrinting(true);

      const userRes = await axios.get(`${process.env.REACT_APP_API}/user/get`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      const orderRes = await axios.get(`${process.env.REACT_APP_API}/order/get/${orderId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      const order = orderRes.data.data;

      const userData = userRes.data;

      const groupedByCounter = {};
      order.order_items.forEach(item => {
        const counterName = item.counter || "Default";
        if (!groupedByCounter[counterName]) groupedByCounter[counterName] = [];
        groupedByCounter[counterName].push(item);
      });

      const printWindow = window.open("", "_blank");

      if (!printWindow) {
        toast.error("Popup blocked! Please allow popups.");
        return;
      }

      let allBillsHTML = "";

      allBillsHTML += printFullBill(order, userData, order.order_items, order.sub_total);

      Object.entries(groupedByCounter).forEach(([counterName, items]) => {
        const subTotal = items.reduce(
          (sum, i) => sum + (i.dish_price * i.quantity),
          0
        );

        allBillsHTML += printCounterBill(order, userData, counterName, items);
      });

      printWindow.document.write(`
        <html>
        <head>
        <title>Print Bills</title>

        <script>
        window.onload = function() {
          window.focus();
          window.print();

          // close window after print dialog
          setTimeout(function() {
            window.close();
          }, 100);
        };
        </script>

        </head>

        <body>
        ${allBillsHTML}
        </body>
        </html>
        `
      );
      printWindow.document.close();

      printWindow.focus();

    } catch (err) {
      console.error("Print error:", err);
      toast.error("Failed to print bills");
    } finally {
      setPrinting(false);
    }
  };

  // Bulk Export Functions
  const fetchAllOrdersForExport = async () => {
    try {
      const params = {
        page: 1,
        limit: 10000, // Large limit to get all orders
        sortBy: 'order_date',
        sortOrder: 'desc',
      };

      // Apply export filters
      if (exportFilters.orderSource) {
        params.order_source = exportFilters.orderSource;
      }
      if (exportFilters.orderStatus) {
        params.order_status = exportFilters.orderStatus;
      }
      if (exportFilters.orderType) {
        params.order_type = exportFilters.orderType;
      }
      if (exportFilters.tableArea) {
        params.table_area = exportFilters.tableArea;
      }
      if (exportFilters.fromDate) {
        params.from = exportFilters.fromDate;
      }
      if (exportFilters.toDate) {
        params.to = exportFilters.toDate;
      }
      if (exportFilters.paymentType) {
        params.payment_type = exportFilters.paymentType;
      }

      const { data: resData } = await axios.get(`${API_BASE}/order/get-orders`, {
        params,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (resData.success) {
        return resData.data;
      }
      throw new Error(resData.message || 'Failed to fetch orders');
    } catch (err) {
      throw new Error(err.message || 'Failed to fetch orders for export');
    }
  };

  const exportToExcel = async () => {
    setExporting(true);
    setExportProgress(10);

    try {
      setExportProgress(20);
      const orders = await fetchAllOrdersForExport();

      if (!orders || orders.length === 0) {
        setExporting(false);
        return;
      }

      setExportProgress(40);

      const wb = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ['ORDER HISTORY EXPORT'],
        [],
        ['Company:', COMPANY_NAME],
        ['Export Date:', format(new Date(), 'dd MMM yyyy HH:mm')],
        ['Total Orders:', orders.length],
        [],
        ['FILTERS APPLIED'],
        ['Filter', 'Value'],
      ];

      if (exportFilters.fromDate || exportFilters.toDate) {
        summaryData.push([
          'Date Range',
          `${exportFilters.fromDate ? format(new Date(exportFilters.fromDate), 'dd MMM yyyy') : 'All'} to ${exportFilters.toDate ? format(new Date(exportFilters.toDate), 'dd MMM yyyy') : 'All'
          }`,
        ]);
      }
      if (exportFilters.orderSource) {
        summaryData.push(['Order Source', exportFilters.orderSource]);
      }
      if (exportFilters.orderStatus) {
        summaryData.push(['Order Status', exportFilters.orderStatus]);
      }
      if (exportFilters.orderType) {
        summaryData.push(['Order Type', exportFilters.orderType]);
      }
      if (exportFilters.paymentType) {
        summaryData.push(['Payment Type', exportFilters.paymentType]);
      }

      summaryData.push([]);
      summaryData.push(['SUMMARY STATISTICS']);
      summaryData.push(['Metric', 'Value']);

      const totalAmount = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const avgOrderValue = totalAmount / orders.length;

      summaryData.push(['Total Revenue', totalAmount]);
      summaryData.push(['Average Order Value', avgOrderValue]);

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 40 }];
      summarySheet.B12.z = '"Rs. "#,##0';
      summarySheet.B13.z = '"Rs. "#,##0';

      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      setExportProgress(60);

      // Orders Detail Sheet
      const ordersData = [
        ['Order No', 'Order Date', 'Order Time', 'Customer Name', 'Table No', 'Order Type', 'Order Source', 'Payment Type', 'Total Amount', 'Status'],
      ];

      orders.forEach((order) => {
        const orderDate = new Date(order.order_date);
        ordersData.push([
          order.order_no || order._id || '',
          format(orderDate, 'dd-MM-yyyy'),
          format(orderDate, 'HH:mm:ss'),
          order.customer_name || 'Guest',
          order.table_no || (order.token ? `Token ${order.token}` : 'N/A'),
          order.order_type || 'N/A',
          order.order_source || 'N/A',
          order.payment_type || 'N/A',
          order.total_amount || 0,
          order.order_status || 'N/A',
        ]);
      });

      const ordersSheet = XLSX.utils.aoa_to_sheet(ordersData);

      // Set column widths
      ordersSheet['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];

      // Apply currency formatting to Total Amount column (column I, index 8)
      const range = XLSX.utils.decode_range(ordersSheet['!ref']);
      for (let R = 1; R <= range.e.r; R += 1) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: 8 });
        if (ordersSheet[cellAddress] && typeof ordersSheet[cellAddress].v === 'number') {
          ordersSheet[cellAddress].z = '"Rs. "#,##0';
          ordersSheet[cellAddress].t = 'n';
        }
      }

      // Enable auto-filter
      ordersSheet['!autofilter'] = { ref: `A1:J${range.e.r + 1}` };

      XLSX.utils.book_append_sheet(wb, ordersSheet, 'Orders Detail');

      setExportProgress(90);

      // Generate filename
      const fromDateStr = exportFilters.fromDate ? format(new Date(exportFilters.fromDate), 'dd-MMM-yyyy') : 'All';
      const toDateStr = exportFilters.toDate ? format(new Date(exportFilters.toDate), 'dd-MMM-yyyy') : 'All';
      const filename = `Order_History_${fromDateStr}_to_${toDateStr}.xlsx`;

      XLSX.writeFile(wb, filename);

      setExportProgress(100);
    } catch (err) {
      console.error('Export error:', err);
      toast.error(err.message || 'Failed to export orders');
    } finally {
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
        setShowExportModal(false);
      }, 500);
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    setExportProgress(10);

    try {
      setExportProgress(20);
      const orders = await fetchAllOrdersForExport();

      if (!orders || orders.length === 0) {
        setExporting(false);
        return;
      }

      setExportProgress(40);

      const doc = new jsPDF('portrait'); // Portrait orientation
      let yPosition = 20;

      // Header
      doc.setFillColor(68, 114, 196);
      doc.rect(0, 0, 210, 35, 'F'); // Portrait width is 210mm

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('ORDER HISTORY REPORT', 105, 16, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(COMPANY_NAME, 105, 26, { align: 'center' });

      yPosition = 45;
      doc.setTextColor(0, 0, 0);

      // Export Information
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Export Date:', 15, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(format(new Date(), 'dd MMM yyyy HH:mm'), 48, yPosition);

      doc.setFont(undefined, 'bold');
      doc.text('Total Orders:', 120, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(orders.length.toString(), 155, yPosition);

      yPosition += 8;

      // Filters Applied
      if (
        exportFilters.fromDate ||
        exportFilters.toDate ||
        exportFilters.orderSource ||
        exportFilters.orderStatus ||
        exportFilters.orderType ||
        exportFilters.paymentType
      ) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Filters Applied:', 15, yPosition);
        yPosition += 6;

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');

        if (exportFilters.fromDate || exportFilters.toDate) {
          doc.text(
            `Date Range: ${exportFilters.fromDate ? format(new Date(exportFilters.fromDate), 'dd MMM yyyy') : 'All'} to ${exportFilters.toDate ? format(new Date(exportFilters.toDate), 'dd MMM yyyy') : 'All'
            }`,
            20,
            yPosition
          );
          yPosition += 5;
        }

        const filterLabels = [
          { key: 'orderSource', label: 'Order Source' },
          { key: 'orderStatus', label: 'Order Status' },
          { key: 'orderType', label: 'Order Type' },
          { key: 'paymentType', label: 'Payment Type' },
        ];

        filterLabels.forEach(({ key, label }) => {
          if (exportFilters[key]) {
            doc.text(`${label}: ${exportFilters[key]}`, 20, yPosition);
            yPosition += 4;
          }
        });

        yPosition += 5;
      }

      setExportProgress(60);

      // Summary Statistics
      const totalAmount = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const avgOrderValue = totalAmount / orders.length;

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Summary Statistics:', 15, yPosition);
      yPosition += 6;

      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(`Total Revenue: ${formatCurrencyPDF(totalAmount)}`, 20, yPosition);
      yPosition += 4;
      doc.text(`Average Order Value: ${formatCurrencyPDF(avgOrderValue)}`, 20, yPosition);
      yPosition += 8;

      setExportProgress(70);

      // Orders Table
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Order Details', 15, yPosition);
      yPosition += 5;

      autoTable(doc, {
        startY: yPosition,
        head: [['Order No', 'Date', 'Customer', 'Type', 'Amount', 'Status']],
        body: orders.map((order) => {
          const orderDate = new Date(order.order_date);
          return [
            (order.order_no || order._id || '').substring(0, 15),
            format(orderDate, 'dd-MM-yy\nHH:mm'),
            (order.customer_name || 'Guest').substring(0, 20),
            (order.order_type || 'N/A').substring(0, 8),
            formatCurrencyPDF(order.total_amount),
            (order.order_status || 'N/A').substring(0, 8),
          ];
        }),
        theme: 'grid',
        headStyles: {
          fillColor: [68, 114, 196],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
        },
        styles: {
          fontSize: 7,
          cellPadding: 1.5,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 22, halign: 'center', fontSize: 6.5 },
          2: { cellWidth: 35 },
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
          5: { cellWidth: 18, halign: 'center' },
        },
        margin: { left: 10, right: 10, top: yPosition },
      });

      setExportProgress(90);

      // Footer on each page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i += 1) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(128, 128, 128);
        doc.text(`${COMPANY_NAME} | Order History | Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
        doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 105, 289, { align: 'center' });
      }

      setExportProgress(95);

      // Generate filename
      const fromDateStr = exportFilters.fromDate ? format(new Date(exportFilters.fromDate), 'dd-MMM-yyyy') : 'All';
      const toDateStr = exportFilters.toDate ? format(new Date(exportFilters.toDate), 'dd-MMM-yyyy') : 'All';
      const filename = `Order_History_${fromDateStr}_to_${toDateStr}.pdf`;

      doc.save(filename);

      setExportProgress(100);
    } catch (err) {
      console.error('Export error:', err);
      toast.error(err.message || 'Failed to export orders');
    } finally {
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
        setShowExportModal(false);
      }, 500);
    }
  };

  const handleExportClick = () => {
    // Pre-fill export filters with current filters
    setExportFilters({
      orderSource: filters.orderSource,
      orderStatus: filters.orderStatus,
      orderType: filters.orderType,
      tableArea: filters.tableArea,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      paymentType: '',
    });
    setShowExportModal(true);
  };

  const handleExportConfirm = () => {
    if (exportFormat === 'excel') {
      exportToExcel();
    } else {
      exportToPDF();
    }
  };

  const columns = React.useMemo(
    () => [
      {
        Header: 'Order No.',
        accessor: 'order_no',
        id: 'order_no',
        headerClassName: 'text-small text-uppercase w-15',
      },
      {
        Header: 'Date',
        accessor: 'order_date',
        id: 'order_date',
        headerClassName: 'text-small text-uppercase w-15',
        sortable: true,
        isSorted: sortBy === 'order_date',
        isSortedDesc: sortBy === 'order_date' && sortOrder === 'desc',
        Cell: ({ value }) => new Date(value).toLocaleDateString('en-IN'),
      },
      {
        Header: 'Time',
        accessor: 'order_date',
        id: 'order_time',
        headerClassName: 'text-small text-uppercase w-15',
        disableSortBy: true,
        Cell: ({ value }) => new Date(value).toLocaleTimeString(),
      },
      {
        Header: 'Name',
        accessor: 'customer_name',
        headerClassName: 'text-small text-uppercase w-15',
        sortable: true,
        isSorted: sortBy === 'customer_name',
        isSortedDesc: sortBy === 'customer_name' && sortOrder === 'desc',
      },
      {
        Header: 'Type',
        accessor: 'order_type',
        headerClassName: 'text-small text-uppercase w-15',
        sortable: true,
        isSorted: sortBy === 'order_type',
        isSortedDesc: sortBy === 'order_type' && sortOrder === 'desc',
        Cell: ({ value }) => (
          <Badge bg={value === 'Dine In' ? 'primary' : value === 'Takeaway' ? 'warning' : value === 'Delivery' ? 'success' : 'secondary'}>{value}</Badge>
        ),
      },
      {
        Header: 'Source',
        accessor: 'order_source',
        headerClassName: 'text-small text-uppercase w-15',
        sortable: true,
        isSorted: sortBy === 'order_source',
        isSortedDesc: sortBy === 'order_source' && sortOrder === 'desc',
        Cell: ({ value }) => (
          <Badge bg={value === 'Manager' ? 'info' : value === 'Captain' ? 'primary' : value === 'QSR' ? 'secondary' : 'dark'}>{value}</Badge>
        ),
      },
      {
        Header: 'Amount',
        accessor: 'total_amount',
        headerClassName: 'text-small text-uppercase w-15',
        sortable: true,
        isSorted: sortBy === 'total_amount',
        isSortedDesc: sortBy === 'total_amount' && sortOrder === 'desc',
        Cell: ({ value }) => `₹ ${parseFloat(value).toFixed(2)}`,
      },
      {
        Header: 'Status',
        accessor: 'order_status',
        headerClassName: 'text-small text-uppercase w-10',
        sortable: true,
        isSorted: sortBy === 'order_status',
        isSortedDesc: sortBy === 'order_status' && sortOrder === 'desc',
        Cell: ({ value }) => (
          <Badge bg={value === 'Paid' || value === 'Save' ? 'success' : value === 'KOT' ? 'warning' : value === 'Cancelled' ? 'danger' : 'secondary'}>
            {value}
          </Badge>
        ),
      },
      {
        Header: 'Action',
        id: 'action',
        headerClassName: 'text-small text-uppercase w-10 text-center',
        disableSortBy: true,
        Cell: ({ row }) => (
          <div className="d-flex justify-content-center gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              title="View"
              className="btn-icon btn-icon-only"
              onClick={() => history.push(`/operations/order-details/${row.original.id}`)}
            >
              <CsLineIcons icon="eye" />
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              title="Print"
              className="btn-icon btn-icon-only"
              onClick={() => handlePrint(row.original.id)}
              disabled={printing[row.original.id]}
            >
              {printing[row.original.id] ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="print" />}
            </Button>
          </div>
        ),
      },
    ],
    [history, printing, sortBy, sortOrder]
  );

  const tableInstance = useTable(
    {
      columns,
      data,
      manualPagination: true,
      manualSortBy: true,
      pageCount: totalPages,
      autoResetPage: false,
      autoResetSortBy: false,
      autoResetGlobalFilter: false,
    },
    useGlobalFilter,
    useSortBy
  );

  const paginationProps = {
    canPreviousPage: pageIndex > 0,
    canNextPage: pageIndex < totalPages - 1,
    pageCount: totalPages,
    pageIndex,
    gotoPage: handlePageChange,
    nextPage: () => handlePageChange(pageIndex + 1),
    previousPage: () => handlePageChange(pageIndex - 1),
  };

  if (loading && pageIndex === 0) {
    return (
      <div className="container-fluid pb-5">
        <HtmlHead title={title} description={description} />
          <div className="page-title-container">
            <Row>
              <Col xs="12" md="7">
                <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
            </Row>
          </div>
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <h5>Loading...</h5>
          </div>
      </div>
    );
  }

  return (
    <div className="container-fluid pb-5">
      <HtmlHead title={title} description={description} />

      <div className="page-title-container mb-4">
        <Row className="align-items-center">
          <Col xs="12" md="7">
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              <CsLineIcons icon="error" className="me-2" />
              {error}
            </Alert>
          )}

          {/* Filter Section */}

          {/* Search and Controls */}
          <div>
            <style>{customStyles}</style>
            <Row className="mb-3 g-2 align-items-center">
              <Col xs="12" sm="auto" className="flex-grow-1" style={{ minWidth: '200px' }}>
                <div className="custom-search-container shadow-sm d-flex align-items-center px-2">
                  <CsLineIcons icon="search" size="18" className="text-primary opacity-75 ms-1" />
                  <Form.Control
                    type="text"
                    className="border-0 bg-transparent shadow-none"
                    placeholder="Search orders..."
                    value={localSearchTerm}
                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                    style={{ height: '40px', fontSize: '14px' }}
                  />
                  {localSearchTerm && (
                    <div 
                      className="cursor-pointer text-muted px-1" 
                      onClick={() => setLocalSearchTerm('')}
                    >
                      <CsLineIcons icon="close" size="14" />
                    </div>
                  )}
                </div>
              </Col>
              <Col xs="auto" className="ms-auto ms-sm-0">
                <div className="d-flex gap-2">
                  <Button
                    className="custom-control-btn shadow-sm"
                    onClick={handleExportClick}
                    disabled={totalRecords === 0 || loading}
                    title="Export Orders"
                  >
                    <CsLineIcons icon="download" size="18" />
                  </Button>
                  <Button
                    className={`custom-control-btn shadow-sm ${showFilters ? 'active' : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                    title="Filters"
                    disabled={loading}
                  >
                    <CsLineIcons icon={showFilters ? 'close' : 'filter'} size="18" />
                    {getActiveFilterCount() > 0 && (
                      <Badge bg="danger" className="position-absolute rounded-pill border border-2 border-white" style={{ top: '-5px', right: '-5px', fontSize: '10px', padding: '4px 6px' }}>
                        {getActiveFilterCount()}
                      </Badge>
                    )}
                  </Button>
                </div>
              </Col>
              <Col className="text-end d-none d-lg-block">
                <div className="d-inline-block me-3 text-muted small fw-bold">
                  {loading ? (
                    'Loading...'
                  ) : (
                    <>
                      Showing {data.length > 0 ? pageIndex * pageSize + 1 : 0}-{Math.min((pageIndex + 1) * pageSize, totalRecords)} of {totalRecords}
                    </>
                  )}
                </div>
                <div className="d-inline-block">
                  <ControlsPageSize pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
                </div>
              </Col>
            </Row>
            <Collapse in={showFilters}>
              <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: '1.25rem', backgroundColor: '#f8f9fa' }}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0 fw-bold d-flex align-items-center" style={{ color: '#23b3f4' }}>
                      <CsLineIcons icon="filter" className="me-2" size="18" />
                      Filter Records
                    </h5>
                    {getActiveFilterCount() > 0 && (
                      <Button 
                        variant="link" 
                        className="p-0 text-danger text-decoration-none small fw-bold" 
                        onClick={handleClearFilters}
                      >
                        <CsLineIcons icon="close" size="12" className="me-1" />
                        Clear All
                      </Button>
                    )}
                  </div>

                  <div>
                    <Row className="g-3">
                      {/* Order Source Filter */}
                      <Col xs="12" sm="6" md="2">
                        <Form.Label className="small fw-bold text-muted mb-1">Source</Form.Label>
                        <Dropdown className="w-100">
                          <Dropdown.Toggle 
                            variant="white" 
                            className="w-100 rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-between px-3"
                            style={{ height: '44px', fontSize: '14px' }}
                          >
                            {filters.orderSource || 'All Sources'}
                          </Dropdown.Toggle>
                          <Dropdown.Menu 
                            className="w-100 shadow-lg border-0 animate__animated animate__fadeIn" 
                            style={{ borderRadius: '1.25rem', padding: '0.75rem', marginTop: '8px', maxHeight: '350px', overflowY: 'auto' }}
                          >
                            <Dropdown.Item onClick={() => handleFilterChange('orderSource', '')}>All Sources</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleFilterChange('orderSource', 'Manager')}>Manager</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleFilterChange('orderSource', 'Captain')}>Captain</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleFilterChange('orderSource', 'QSR')}>QSR</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleFilterChange('orderSource', 'Restaurant Website')}>Restaurant Website</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </Col>

                      {/* Date Range Filter */}
                      <Col xs="6" sm="6" md="2">
                        <Form.Label className="small fw-bold text-muted mb-1">From</Form.Label>
                        <Form.Control 
                          type="date" 
                          value={filters.fromDate} 
                          onChange={(e) => handleFilterChange('fromDate', e.target.value)} 
                          className="rounded-pill px-3 border-0 shadow-sm"
                          style={{ height: '44px', fontSize: '14px' }}
                        />
                      </Col>
                      <Col xs="6" sm="6" md="2">
                        <Form.Label className="small fw-bold text-muted mb-1">To</Form.Label>
                        <Form.Control 
                          type="date" 
                          value={filters.toDate} 
                          onChange={(e) => handleFilterChange('toDate', e.target.value)} 
                          className="rounded-pill px-3 border-0 shadow-sm"
                          style={{ height: '44px', fontSize: '14px' }}
                        />
                      </Col>

                      {/* Order Status Filter */}
                      <Col xs="12" sm="6" md="3">
                        <Form.Label className="small fw-bold text-muted mb-1">Status</Form.Label>
                        <Dropdown className="w-100">
                          <Dropdown.Toggle 
                            variant="white" 
                            className="w-100 rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-between px-3"
                            style={{ height: '44px', fontSize: '14px' }}
                          >
                            {filters.orderStatus || 'All Status'}
                          </Dropdown.Toggle>
                          <Dropdown.Menu 
                            className="w-100 shadow-lg border-0 animate__animated animate__fadeIn" 
                            style={{ borderRadius: '1.25rem', padding: '0.75rem', marginTop: '8px', maxHeight: '350px', overflowY: 'auto' }}
                          >
                            <Dropdown.Item onClick={() => handleFilterChange('orderStatus', '')}>All Status</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleFilterChange('orderStatus', 'Paid')}>Paid</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleFilterChange('orderStatus', 'Save')}>Save</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleFilterChange('orderStatus', 'KOT')}>KOT</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleFilterChange('orderStatus', 'Cancelled')}>Cancelled</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </Col>

                      {/* Order Type Filter */}
                      <Col xs="12" sm="6" md="3">
                        <Form.Label className="small fw-bold text-muted mb-1">Type</Form.Label>
                        <Dropdown className="w-100">
                          <Dropdown.Toggle 
                            variant="white" 
                            className="w-100 rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-between px-3"
                            style={{ height: '44px', fontSize: '14px' }}
                          >
                            {filters.orderType || 'All Types'}
                          </Dropdown.Toggle>
                          <Dropdown.Menu 
                          className="w-100 shadow-lg border-0 animate__animated animate__fadeIn" 
                          style={{ borderRadius: '1.25rem', padding: '0.75rem', marginTop: '8px', maxHeight: '350px', overflowY: 'auto' }}
                        >
                            <Dropdown.Item onClick={() => handleFilterChange('orderType', '')}>All Types</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleFilterChange('orderType', 'Dine In')}>Dine In</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleFilterChange('orderType', 'Takeaway')}>Takeaway</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleFilterChange('orderType', 'Delivery')}>Delivery</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </Col>
                    </Row>
                  </div>
                </Card.Body>
              </Card>
            </Collapse>

            {/* Show table or "no data" message */}
            {data.length === 0 && !loading ? (
              <Alert variant="info" className="text-center border-0 shadow-sm" style={{ borderRadius: '1rem', backgroundColor: 'rgba(30, 168, 231, 0.05)', color: '#1ea8e7' }}>
                <CsLineIcons icon="inbox" size={24} className="me-2" />
                No orders found. {searchTerm || getActiveFilterCount() > 0 ? 'Try adjusting your search or filters.' : 'Orders will appear here once created.'}
              </Alert>
            ) : (
              <>
                {/* Table View for Desktop */}
                <Row className="d-none d-md-flex">
                  <Col xs="12" style={{ overflow: "auto" }}>
                    <Table className="react-table rows" tableInstance={tableInstance} onSort={handleSort} />
                  </Col>
                </Row>

                {/* Card View for Mobile */}
                <Row className="d-md-none g-3">
                  {data.map((order, idx) => (
                    <Col key={idx} xs="12">
                      <Card className="border-0 shadow-sm hover-scale-up" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
                        <Card.Body className="p-3 position-relative">
                          <div className="position-absolute" style={{ top: '-10px', right: '-10px', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(30, 168, 231, 0.1)', filter: 'blur(10px)' }} />
                          <div className="d-flex justify-content-between align-items-start mb-3 position-relative">
                            <div>
                              <div className="fw-bolder text-primary mb-1" style={{ fontSize: '14px' }}>{order.order_no || 'ORD-0000'}</div>
                              <div className="text-muted small fw-medium">{format(new Date(order.order_date), 'dd MMM yyyy, HH:mm')}</div>
                            </div>
                            <Badge bg={order.order_status === 'Paid' ? 'success' : order.order_status === 'KOT' ? 'warning' : 'secondary'} className="rounded-pill px-3 py-1">
                              {order.order_status}
                            </Badge>
                          </div>
                          
                          <Row className="mb-3 g-0 border-top pt-2" style={{ borderColor: '#f3f4f6' }}>
                            <Col xs="6">
                              <div className="text-muted small">Type</div>
                              <div className="fw-bold small">{order.order_type}</div>
                            </Col>
                            <Col xs="6" className="text-end">
                              <div className="text-muted small">Amount</div>
                              <div className="fw-bolder text-dark" style={{ fontSize: '15px' }}>₹{parseFloat(order.total_amount).toFixed(2)}</div>
                            </Col>
                          </Row>

                          <div className="d-flex justify-content-between align-items-center">
                            <Badge bg="info" className="rounded-pill opacity-75">{order.order_source}</Badge>
                            <div className="d-flex gap-2">
                              <Button variant="outline-primary" size="sm" className="btn-icon btn-icon-only rounded-circle" onClick={() => history.push(`/operations/order-details/${order.id}`)}>
                                <CsLineIcons icon="eye" size="14" />
                              </Button>
                              <Button variant="outline-secondary" size="sm" className="btn-icon btn-icon-only rounded-circle" onClick={() => handlePrint(order.id)}>
                                <CsLineIcons icon="print" size="14" />
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>

                <Row className="mt-4">
                  <Col xs="12">
                    <TablePagination paginationProps={paginationProps} />
                  </Col>
                </Row>
              </>
            )}
          </div>

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => !exporting && setShowExportModal(false)} size="lg" centered className="modal-glass">
        <Modal.Header closeButton={!exporting} className="border-0 pb-0">
          <Modal.Title className="fw-bold d-flex align-items-center">
            <div className="sw-5 sh-5 rounded-circle d-flex justify-content-center align-items-center me-3" style={{ backgroundColor: 'rgba(30, 168, 231, 0.1)' }}>
              <CsLineIcons icon="download" size="20" style={{ color: '#1ea8e7' }} />
            </div>
            <span>Export Order History</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pt-4">
          {!exporting ? (
            <>
              <p className="text-muted mb-4">Select your preferred format and filters to generate the report.</p>

              <Form>
                {/* Export Format Selection */}
                <div className="mb-4">
                  <Form.Label className="fw-bolder mb-3 text-uppercase text-muted" style={{ fontSize: '11px', letterSpacing: '1px' }}>Export Format</Form.Label>
                  <Row className="g-3">
                    <Col xs="12" sm="6">
                      <Card 
                        className={`border-2 transition-all cursor-pointer h-100 ${exportFormat === 'excel' ? 'border-primary' : 'border-separator-light'}`}
                        style={{ borderRadius: '1.25rem', cursor: 'pointer', transition: 'all 0.3s ease' }}
                        onClick={() => setExportFormat('excel')}
                      >
                        <Card.Body className="d-flex align-items-center p-3">
                          <div className="sw-5 sh-5 rounded-circle d-flex justify-content-center align-items-center me-3 bg-light-success text-success">
                            <CsLineIcons icon="file-text" size="20" />
                          </div>
                          <div className="flex-grow-1">
                            <div className="fw-bold text-dark">Excel Data</div>
                            <div className="text-muted xsmall">Tabular .xlsx</div>
                          </div>
                          <Form.Check
                            type="radio"
                            className="ms-2"
                            checked={exportFormat === 'excel'}
                            onChange={() => {}}
                          />
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs="12" sm="6">
                      <Card 
                        className={`border-2 transition-all cursor-pointer h-100 ${exportFormat === 'pdf' ? 'border-primary' : 'border-separator-light'}`}
                        style={{ borderRadius: '1.25rem', cursor: 'pointer', transition: 'all 0.3s ease' }}
                        onClick={() => setExportFormat('pdf')}
                      >
                        <Card.Body className="d-flex align-items-center p-3">
                          <div className="sw-5 sh-5 rounded-circle d-flex justify-content-center align-items-center me-3 bg-light-danger text-danger">
                            <CsLineIcons icon="file-text" size="20" />
                          </div>
                          <div className="flex-grow-1">
                            <div className="fw-bold text-dark">PDF Report</div>
                            <div className="text-muted xsmall">Document .pdf</div>
                          </div>
                          <Form.Check
                            type="radio"
                            className="ms-2"
                            checked={exportFormat === 'pdf'}
                            onChange={() => {}}
                          />
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </div>

                {/* Export Filters */}
                <Form.Label className="fw-bolder mb-3 text-uppercase text-muted" style={{ fontSize: '11px', letterSpacing: '1px' }}>Filter Data</Form.Label>

                <Card className="border-0 bg-light p-3" style={{ borderRadius: '1rem' }}>
                  <Row className="g-3">
                    <Col xs={12}>
                      <Form.Label className="small fw-bold text-muted mb-1">Date Range</Form.Label>
                      <div className="d-flex flex-column flex-sm-row gap-3">
                        <Form.Control
                          type="date"
                          value={exportFilters.fromDate}
                          onChange={(e) => setExportFilters({ ...exportFilters, fromDate: e.target.value })}
                          className="border-0 shadow-sm rounded-pill flex-grow-1 px-4"
                          style={{ height: '44px', fontSize: '14px' }}
                        />
                        <Form.Control
                          type="date"
                          value={exportFilters.toDate}
                          onChange={(e) => setExportFilters({ ...exportFilters, toDate: e.target.value })}
                          className="border-0 shadow-sm rounded-pill flex-grow-1 px-4"
                          style={{ height: '44px', fontSize: '14px' }}
                        />
                      </div>
                    </Col>

                    <Col xs={12} sm={6}>
                      <Form.Label className="small fw-bold text-muted mb-1">Order Source</Form.Label>
                      <Dropdown className="w-100">
                        <Dropdown.Toggle 
                          variant="white" 
                          className="w-100 rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-between px-4"
                          style={{ height: '44px', fontSize: '14px' }}
                        >
                          {exportFilters.orderSource || 'All Sources'}
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="w-100 shadow-lg border-0 animate__animated animate__fadeIn" style={{ borderRadius: '1rem', maxHeight: '250px', overflowY: 'auto' }}>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderSource: '' })}>All Sources</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderSource: 'Manager' })}>Manager</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderSource: 'Captain' })}>Captain</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderSource: 'QSR' })}>QSR</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderSource: 'Restaurant Website' })}>Restaurant Website</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </Col>

                    <Col xs={12} sm={6}>
                      <Form.Label className="small fw-bold text-muted mb-1">Status</Form.Label>
                      <Dropdown className="w-100">
                        <Dropdown.Toggle 
                          variant="white" 
                          className="w-100 rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-between px-4"
                          style={{ height: '44px', fontSize: '14px' }}
                        >
                          {exportFilters.orderStatus || 'All Status'}
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="w-100 shadow-lg border-0 animate__animated animate__fadeIn" style={{ borderRadius: '1rem', maxHeight: '250px', overflowY: 'auto' }}>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderStatus: '' })}>All Status</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderStatus: 'Paid' })}>Paid</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderStatus: 'Save' })}>Save</Dropdown.Item>
                          <Dropdown.Item onClick={() => handleFilterChange('orderStatus', 'KOT')}>KOT</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderStatus: 'Cancelled' })}>Cancelled</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </Col>

                    <Col xs={12} sm={6}>
                      <Form.Label className="small fw-bold text-muted mb-1">Order Type</Form.Label>
                      <Dropdown className="w-100">
                        <Dropdown.Toggle 
                          variant="white" 
                          className="w-100 rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-between px-4"
                          style={{ height: '44px', fontSize: '14px' }}
                        >
                          {exportFilters.orderType || 'All Types'}
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="w-100 shadow-lg border-0 animate__animated animate__fadeIn" style={{ borderRadius: '1rem', maxHeight: '250px', overflowY: 'auto' }}>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderType: '' })}>All Types</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderType: 'Dine In' })}>Dine In</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderType: 'Takeaway' })}>Takeaway</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderType: 'Delivery' })}>Delivery</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </Col>

                    <Col xs={12} sm={6}>
                      <Form.Label className="small fw-bold text-muted mb-1">Payment Mode</Form.Label>
                      <Dropdown className="w-100">
                        <Dropdown.Toggle 
                          variant="white" 
                          className="w-100 rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-between px-4"
                          style={{ height: '44px', fontSize: '14px' }}
                        >
                          {exportFilters.paymentType || 'All Payment Types'}
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="w-100 shadow-lg border-0 animate__animated animate__fadeIn" style={{ borderRadius: '1rem', maxHeight: '250px', overflowY: 'auto' }}>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, paymentType: '' })}>All Payment Types</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, paymentType: 'Cash' })}>Cash</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, paymentType: 'Card' })}>Card</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, paymentType: 'UPI' })}>UPI</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, paymentType: 'Complementary' })}>Complementary</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, paymentType: 'Pending' })}>Pending</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </Col>

                    <Col xs={12}>
                      <Form.Label className="small fw-bold text-muted mb-1">Table Area</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter table area"
                        value={exportFilters.tableArea}
                        onChange={(e) => setExportFilters({ ...exportFilters, tableArea: e.target.value })}
                        className="border-0 shadow-sm rounded-pill px-4"
                        style={{ height: '44px', fontSize: '14px' }}
                      />
                    </Col>
                  </Row>
                </Card>

                <div className="mt-3 d-flex align-items-center text-primary small bg-light-primary p-2 rounded-3">
                  <CsLineIcons icon="info-circle" className="me-2" size="14" />
                  <span>Leave filters empty to export all records.</span>
                </div>
              </Form>
            </>
          ) : (
            <div className="text-center py-5">
              <div className="mb-4">
                <Spinner animation="border" style={{ color: '#1ea8e7', width: '3rem', height: '3rem' }} />
              </div>
              <h4 className="fw-bold mb-2">Generating Report</h4>
              <p className="text-muted mb-4">Please wait while we compile your data into {exportFormat === 'excel' ? 'Excel' : 'PDF'}...</p>
              <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                <ProgressBar now={exportProgress} label={`${exportProgress}%`} style={{ height: '10px', backgroundColor: '#f3f4f6' }}>
                  <ProgressBar now={exportProgress} style={{ backgroundColor: '#1ea8e7' }} />
                </ProgressBar>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 pb-4 px-4">
          <Button variant="light" onClick={() => setShowExportModal(false)} disabled={exporting} className="rounded-pill px-4">
            Close
          </Button>
          <Button 
            onClick={handleExportConfirm} 
            disabled={exporting} 
            className="rounded-pill px-4 hover-scale-up"
            style={{ backgroundColor: '#1ea8e7', borderColor: '#1ea8e7' }}
          >
            {exporting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Generating...
              </>
            ) : (
              <>
                <CsLineIcons icon="download" className="me-2" />
                Download {exportFormat === 'excel' ? 'Excel' : 'PDF'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrderHistory;
