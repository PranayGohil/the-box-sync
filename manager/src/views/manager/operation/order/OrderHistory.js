import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Badge, Col, Form, Row, Button, Spinner, Alert, Card, Collapse, Dropdown, Modal, ProgressBar } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy } from 'react-table';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';

import ControlsPageSize from './components/ControlsPageSize';
import ControlsSearch from './components/ControlsSearch';
import Table from './components/Table';
import TablePagination from './components/TablePagination';

const OrderHistory = () => {
  const title = 'Order History';
  const description = 'Order history with advanced filters.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/order-history', title: 'Order History' },
  ];

  const history = useHistory();

  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState({});
  const [printingStatus, setPrintingStatus] = useState(false);

  // Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportFormat, setExportFormat] = useState('excel'); // 'excel' or 'pdf'
  const [exportFilters, setExportFilters] = useState({
    orderSource: '',
    orderStatus: '',
    orderType: '',
    tableArea: '',
    fromDate: '',
    toDate: '',
    paymentType: '',
  });

  const COMPANY_NAME = 'The Box';

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

  // Ref to prevent infinite loops
  const fetchRef = useRef(false);

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
      if (filters.orderSource === '') {
        params.order_source = ['Manager', 'Captain'];
      } else {
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

      const { data: resData } = await axios.get(`${process.env.REACT_APP_API}/order/get-orders`, {
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
  }, [pageIndex, pageSize, searchTerm, sortBy, sortOrder, filters]);

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

  const handleSearch = useCallback(
    (value) => {
      if (value !== searchTerm) {
        setSearchTerm(value);
        setPageIndex(0);
      }
    },
    [searchTerm]
  );

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
    if (filters.orderSource) count++;
    if (filters.orderStatus) count++;
    if (filters.orderType) count++;
    if (filters.tableArea) count++;
    if (filters.fromDate) count++;
    if (filters.toDate) count++;
    if (searchTerm) count++;
    return count;
  };

  // const handlePrint = async (orderId) => {
  //   setPrinting((prev) => ({ ...prev, [orderId]: true }));
  //   try {
  //     const orderResponse = await axios.get(`${process.env.REACT_APP_API}/order/get/${orderId}`, {
  //       headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  //     });

  //     const userResponse = await axios.get(`${process.env.REACT_APP_API}/user/get`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  //     const order = orderResponse.data.data;
  //     const userData = userResponse.data;

  //     const printDiv = document.createElement('div');
  //     printDiv.id = 'printable-invoice';
  //     printDiv.style.display = 'none';
  //     document.body.appendChild(printDiv);

  //     printDiv.innerHTML = `
  //        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; border: 1px solid #ccc; padding: 10px;">
  //          <div style="text-align: center; margin-bottom: 10px;">
  //            <h3 style="margin: 10px;">${userData.name}</h3>
  //            <p style="margin: 0; font-size: 12px;">${userData.address}</p>
  //            <p style="margin: 0; font-size: 12px;">
  //              ${userData.city}, ${userData.state} - ${userData.pincode}
  //            </p>
  //            <p style="margin: 10px; font-size: 12px;"><strong>Ph.: </strong> ${userData.mobile}</p>
  //            ${
  //              userData.fssai_no && userData.fssai_no !== 'null'
  //                ? `<p style="margin: 10px; font-size: 12px;"><strong>FSSAI No:</strong> ${userData.fssai_no}</p>`
  //                : ''
  //            }
  //            <p style="margin: 10px; font-size: 12px;"><strong>GST No:</strong> ${userData.gst_no}</p>
  //          </div>
  //          <hr style="border: 0.5px dashed #ccc;" />
  //          <p></p>
  //           <table style="width: 100%; font-size: 12px; margin-bottom: 10px;">
  //            <tr>
  //              <td style="width: 50%; height: 30px;">
  //                <strong> Name: </strong> ${order?.customer_name || '(M: 1234567890)'}
  //              </td>
  //               <td style="text-align: right;">
  //                 <strong>${order.order_type}</strong>
  //              </td>
  //            </tr>
  //            <tr>
  //              <td style="width: 50%; height: 30px;">
  //                <strong>Date:</strong> ${new Date(order.order_date).toLocaleString()}
  //              </td>
  //             <td style="text-align: right;">
  //                  ${
  //                    order.table_no
  //                      ? ` <strong>Table No: </strong> <span style="margin-left: 5px; font-size: 16px;"> ${order.table_no} </span>`
  //                      : order.token
  //                      ? ` <strong>Token No: </strong> <span style="margin-left: 5px; font-size: 16px;"> ${order.token} </span>`
  //                      : ''
  //                  } </span>
  //              </td>
  //            </tr>
  //            <tr>
  //              <td colspan="2"><strong>Bill No:</strong> ${order.order_no || order._id}</td>
  //            </tr>
  //          </table>
  //          <hr style="border: 0.5px dashed #ccc;" />
  //          <table style="width: 100%; font-size: 12px; margin-bottom: 10px;">
  //            <thead>
  //              <tr>
  //                <th style="text-align: left; border-bottom: 1px dashed #ccc">Item</th>
  //                <th style="text-align: center; border-bottom: 1px dashed #ccc">Qty</th>
  //                <th style="text-align: center; border-bottom: 1px dashed #ccc">Price</th>
  //                <th style="text-align: right; border-bottom: 1px dashed #ccc">Amount</th>
  //              </tr>
  //            </thead>
  //            <tbody>
  //              ${order.order_items
  //                .map(
  //                  (item) => `
  //                <tr>
  //                  <td>${item.dish_name}</td>
  //                  <td style="text-align: center;">${item.quantity}</td>
  //                  <td style="text-align: center;">${item.dish_price}</td>
  //                  <td style="text-align: right;">₹ ${item.dish_price * item.quantity}</td>
  //                </tr>
  //              `
  //                )
  //                .join('')}
  //              <tr>
  //                <td colspan="3" style="text-align: right; border-top: 1px dashed #ccc"><strong>Sub Total: </strong></td>
  //                <td style="text-align: right; border-top: 1px dashed #ccc">₹ ${order.sub_total}</td>
  //              </tr>
  //              ${
  //                order.cgst_amount > 0
  //                  ? `
  //                <tr>
  //                  <td colspan="3" style="text-align: right;"><strong>CGST (${order.cgst_percent || 0} %):</strong></td>
  //                  <td style="text-align: right;">₹ ${order.cgst_amount || 0}</td>
  //                </tr>`
  //                  : ''
  //              }
  //              ${
  //                order.sgst_amount > 0
  //                  ? `
  //                <tr>
  //                  <td colspan="3" style="text-align: right;"><strong>SGST (${order.sgst_percent || 0} %):</strong></td>
  //                  <td style="text-align: right;">₹ ${order.sgst_amount || 0}</td>
  //                </tr>`
  //                  : ''
  //              }
  //              ${
  //                order.vat_amount > 0
  //                  ? `
  //                <tr>
  //                  <td colspan="3" style="text-align: right;"><strong>VAT (${order.vat_percent || 0} %):</strong></td>
  //                  <td style="text-align: right;">₹ ${order.vat_amount || 0}</td>
  //                </tr>`
  //                  : ''
  //              }
  //              ${
  //                order.discount_amount > 0
  //                  ? `
  //                <tr>
  //                  <td colspan="3" style="text-align: right;"><strong>Discount: </strong></td>
  //                  <td style="text-align: right;">- ₹ ${order.discount_amount || 0}</td>
  //                </tr>`
  //                  : ''
  //              }
  //              <tr>
  //                <td colspan="3" style="text-align: right;"><strong>Total: </strong></td>
  //                <td style="text-align: right;">₹ ${order.total_amount}</td>
  //              </tr>
  //              <tr>
  //                <td colspan="3" style="text-align: right; border-top: 1px dashed #ccc"><strong>Paid Amount: </strong></td>
  //                <td style="text-align: right; border-top: 1px dashed #ccc">₹ ${order.paid_amount || order.bill_amount || 0}</td>
  //              </tr>
  //              ${
  //                order.waveoff_amount !== null && order.waveoff_amount !== undefined && order.waveoff_amount !== 0
  //                  ? `
  //                <tr>
  //                  <td colspan="3" style="text-align: right;"><strong>Waveoff Amount: </strong></td>
  //                  <td style="text-align: right;"> ₹ ${order.waveoff_amount || 0}</td>
  //                </tr>`
  //                  : ''
  //              }
  //            </tbody>
  //          </table>
  //          <div style="text-align: center; font-size: 12px;">
  //            <p style="margin: 10px; font-size: 12px;"><strong>Thanks, Visit Again</strong></p>
  //          </div>
  //        </div>
  //      `;

  //     const printWindow = window.open('', '_blank');
  //     printWindow.document.write(printDiv.innerHTML);
  //     printWindow.document.close();
  //     printWindow.print();
  //     printWindow.close();

  //     document.body.removeChild(printDiv);
  //     toast.success('Invoice printed successfully!');
  //   } catch (err) {
  //     console.error('Error fetching order or user data:', err);
  //     toast.error('Failed to print invoice. Please try again.');
  //   } finally {
  //     setPrinting((prev) => ({ ...prev, [orderId]: false }));
  //   }
  // };

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
              ${ord.table_no ? `<strong>Table:</strong> ${ord.table_no}` : ord.token ? `<strong>Token:</strong> ${ord.token}` : ''}
            </td>
          </tr>
          ${ord.customer_name ? `<tr><td colspan="2"><strong>Customer:</strong> ${ord.customer_name}</td></tr>` : ''}
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
            ${items
        .map(
          (item) => `
              <tr>
                <td>${item.dish_name}</td>
                <td style="text-align: center;">${item.quantity}</td>
              </tr>
            `
        )
        .join('')}
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
              ${ord.table_no ? `<strong>Table:</strong> ${ord.table_no}` : ord.token ? `<strong>Token:</strong> ${ord.token}` : ''}
            </td>
          </tr>
          ${ord.customer_name ? `<tr><td colspan="2"><strong>Customer:</strong> ${ord.customer_name}</td></tr>` : ''}
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
            ${items
        .map(
          (item) => `
              <tr>
                <td>${item.dish_name}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: center;">₹${item.dish_price}</td>
                <td style="text-align: right;">₹${(item.dish_price * item.quantity).toFixed(2)}</td>
              </tr>
            `
        )
        .join('')}

            <tr>
              <td colspan="3" style="text-align: right; border-top: 1px solid #ccc; padding-top: 10px;">
                <strong>Sub Total:</strong>
              </td>
              <td style="text-align: right; border-top: 1px solid #ccc; padding-top: 10px;">
                <strong>₹${subTotal.toFixed(2)}</strong>
              </td>
            </tr>

            ${ord.cgst_amount > 0
        ? `
              <tr>
                <td colspan="3" style="text-align: right;">
                  <strong>CGST (${ord.cgst_percent || 0}%):</strong>
                </td>
                <td style="text-align: right;">
                  ₹${parseFloat(ord.cgst_amount).toFixed(2)}
                </td>
              </tr>
            `
        : ''
      }

            ${ord.sgst_amount > 0
        ? `
              <tr>
                <td colspan="3" style="text-align: right;">
                  <strong>SGST (${ord.sgst_percent || 0}%):</strong>
                </td>
                <td style="text-align: right;">
                  ₹${parseFloat(ord.sgst_amount).toFixed(2)}
                </td>
              </tr>
            `
        : ''
      }

            ${ord.vat_amount > 0
        ? `
              <tr>
                <td colspan="3" style="text-align: right;">
                  <strong>VAT (${ord.vat_percent || 0}%):</strong>
                </td>
                <td style="text-align: right;">
                  ₹${parseFloat(ord.vat_amount).toFixed(2)}
                </>
              </tr>
            `
        : ''
      }

            ${ord.discount_amount > 0
        ? `
              <tr>
                <td colspan="3" style="text-align: right;">
                  <strong>Discount:</strong>
                </td>
                <td style="text-align: right;">
                  ₹${parseFloat(ord.discount_amount).toFixed(2)}
                </td>
              </tr>
            `
        : ''
      }

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

  const formatCurrencyPDF = (amount) => {
    return `INR ${parseFloat(amount).toFixed(2)}`;
  };

  const exportToExcel = async () => {
    try {
      setExporting(true);
      setExportProgress(10);

      // Build query string from export filters
      const params = new URLSearchParams();
      if (exportFilters.orderSource) params.append('order_source', exportFilters.orderSource);
      if (exportFilters.orderStatus) params.append('order_status', exportFilters.orderStatus);
      if (exportFilters.orderType) params.append('order_type', exportFilters.orderType);
      if (exportFilters.tableArea) params.append('table_area', exportFilters.tableArea);
      if (exportFilters.fromDate) params.append('startDate', exportFilters.fromDate);
      if (exportFilters.toDate) params.append('endDate', exportFilters.toDate);
      if (exportFilters.paymentType) params.append('payment_type', exportFilters.paymentType);
      params.append('limit', 10000); // Fetch all records for export

      setExportProgress(30);

      const response = await axios.get(`${process.env.REACT_APP_API}/order/get-all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setExportProgress(60);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch orders for export');
      }

      const orders = response.data.data;
      if (orders.length === 0) {
        throw new Error('No orders found for the selected filters');
      }

      setExportProgress(80);

      // Transform data for Excel
      const excelData = orders.map((order) => ({
        'Order No': order.order_no || order._id,
        Date: format(new Date(order.order_date), 'dd-MMM-yyyy'),
        Time: format(new Date(order.order_date), 'HH:mm'),
        'Customer Name': order.customer_name || 'Guest',
        'Customer Phone': order.customer_phone || '-',
        'Order Type': order.order_type,
        'Order Source': order.order_source,
        'Table No': order.table_no || '-',
        'Table Area': order.table_area || '-',
        'Payment Type': order.payment_type || '-',
        'Sub Total': order.sub_total,
        CGST: order.cgst_amount || 0,
        SGST: order.sgst_amount || 0,
        'Total Amount': order.total_amount,
        Status: order.order_status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

      // Generate filename
      const fromDateStr = exportFilters.fromDate ? format(new Date(exportFilters.fromDate), 'dd-MMM-yyyy') : 'All';
      const toDateStr = exportFilters.toDate ? format(new Date(exportFilters.toDate), 'dd-MMM-yyyy') : 'All';
      const filename = `Order_History_${fromDateStr}_to_${toDateStr}.xlsx`;

      XLSX.writeFile(workbook, filename);

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
    try {
      setExporting(true);
      setExportProgress(10);

      // Build query string from export filters
      const params = new URLSearchParams();
      if (exportFilters.orderSource) params.append('order_source', exportFilters.orderSource);
      if (exportFilters.orderStatus) params.append('order_status', exportFilters.orderStatus);
      if (exportFilters.orderType) params.append('order_type', exportFilters.orderType);
      if (exportFilters.tableArea) params.append('table_area', exportFilters.tableArea);
      if (exportFilters.fromDate) params.append('startDate', exportFilters.fromDate);
      if (exportFilters.toDate) params.append('endDate', exportFilters.toDate);
      if (exportFilters.paymentType) params.append('payment_type', exportFilters.paymentType);
      params.append('limit', 10000);

      setExportProgress(30);

      const response = await axios.get(`${process.env.REACT_APP_API}/order/get-all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setExportProgress(50);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch orders for export');
      }

      const orders = response.data.data;
      if (orders.length === 0) {
        throw new Error('No orders found for the selected filters');
      }

      const doc = new jsPDF();
      let yPosition = 20;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(35, 179, 244);
      doc.text(COMPANY_NAME, 105, yPosition, { align: 'center' });
      yPosition += 10;

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Order History Report', 105, yPosition, { align: 'center' });
      yPosition += 10;

      // Filter info
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const filterText = `Period: ${exportFilters.fromDate || 'All'} to ${exportFilters.toDate || 'All'} | Source: ${exportFilters.orderSource || 'All'} | Status: ${exportFilters.orderStatus || 'All'}`;
      doc.text(filterText, 105, yPosition, { align: 'center' });
      yPosition += 15;

      // Summary
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
          fillColor: [35, 179, 244],
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

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i += 1) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(128, 128, 128);
        doc.text(`${COMPANY_NAME} | Order History | Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
        doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 105, 289, { align: 'center' });
      }

      setExportProgress(95);

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

  const handlePrint = async (orderId) => {
    try {
      setPrinting((prev) => ({ ...prev, [orderId]: true }));
      setPrintingStatus(true);

      const userRes = await axios.get(`${process.env.REACT_APP_API}/user/get`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      const orderRes = await axios.get(`${process.env.REACT_APP_API}/order/get/${orderId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      const order = orderRes.data.data;

      const userData = userRes.data;

      const groupedByCounter = {};
      order.order_items.forEach((item) => {
        const counterName = item.counter || 'Default';
        if (!groupedByCounter[counterName]) groupedByCounter[counterName] = [];
        groupedByCounter[counterName].push(item);
      });

      const printWindow = window.open('', '_blank');

      if (!printWindow) {
        toast.error('Popup blocked! Please allow popups.');
        return;
      }

      let allBillsHTML = '';

      allBillsHTML += printFullBill(order, userData, order.order_items, order.sub_total);

      Object.entries(groupedByCounter).forEach(([counterName, items]) => {
        const subTotal = items.reduce((sum, i) => sum + i.dish_price * i.quantity, 0);

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
        `);
      printWindow.document.close();

      printWindow.focus();
    } catch (err) {
      console.error('Print error:', err);
      toast.error('Failed to print bills');
    } finally {
      setPrinting((prev) => ({ ...prev, [orderId]: false }));
      setPrintingStatus(false);
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
        Cell: ({ value }) => format(new Date(value), 'dd MMM yyyy'),
      },
      {
        Header: 'Time',
        accessor: 'order_date',
        id: 'order_time',
        headerClassName: 'text-small text-uppercase w-15',
        disableSortBy: true,
        Cell: ({ value }) => format(new Date(value), 'HH:mm'),
      },
      {
        Header: 'Name',
        accessor: 'customer_name',
        headerClassName: 'text-small text-uppercase w-15',
        sortable: true,
        isSorted: sortBy === 'customer_name',
        isSortedDesc: sortBy === 'customer_name' && sortOrder === 'desc',
        Cell: ({ value }) => value || 'Guest',
      },
      {
        Header: 'Type',
        accessor: 'order_type',
        headerClassName: 'text-small text-uppercase w-15',
        sortable: true,
        isSorted: sortBy === 'order_type',
        isSortedDesc: sortBy === 'order_type' && sortOrder === 'desc',
        Cell: ({ value }) => (
          <Badge bg={value === 'Dine In' ? 'primary' : value === 'Takeaway' ? 'warning' : value === 'Delivery' ? 'success' : 'secondary'} className="rounded-pill px-3">
            {value}
          </Badge>
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
          <Badge bg={value === 'Manager' ? 'info' : value === 'Captain' ? 'primary' : value === 'QSR' ? 'secondary' : 'dark'} className="rounded-pill px-3">
            {value}
          </Badge>
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
          <Badge bg={value === 'Paid' || value === 'Save' || value === 'Completed' ? 'success' : value === 'KOT' ? 'warning' : value === 'Cancelled' ? 'danger' : 'secondary'} className="rounded-pill px-3">
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
      <>
        <HtmlHead title={title} description={description} />
        <Row>
          <Col>
            <section className="scroll-section" id="title">
              <div className="page-title-container">
                <h1 className="mb-0 pb-0 display-4">{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </div>
            </section>
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h5>Loading Order History...</h5>
              <p className="text-muted">Please wait while we fetch your orders</p>
            </div>
          </Col>
        </Row>
      </>
    );
  }

  return (
    <>
      <HtmlHead title={title} description={description} />

      <Row>
        <Col>
          <section className="scroll-section" id="title">
            <div className="page-title-container mb-4">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </div>
          </section>

          {error && (
            <Alert variant="danger" className="mb-4">
              <CsLineIcons icon="error" className="me-2" />
              {error}
            </Alert>
          )}

          {/* Search and Controls */}
          <div>
            <Row className="mb-3 g-2 align-items-center">
              <Col xs="12" sm="auto" className="flex-grow-1">
                <div className="order-history-custom-search-container shadow-sm d-flex align-items-center px-2">
                  <CsLineIcons icon="search" size="18" className="text-primary opacity-75 ms-1 me-2" />
                  <Form.Control
                    type="text"
                    className="border-0 bg-transparent shadow-none"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ height: '40px', fontSize: '14px' }}
                  />
                  {searchTerm && (
                    <div className="cursor-pointer text-muted px-1" onClick={() => setSearchTerm('')}>
                      <CsLineIcons icon="close" size="14" />
                    </div>
                  )}
                </div>
              </Col>
              <Col xs="auto" className="ms-auto ms-sm-0">
                <div className="d-flex gap-2">
                  <Button
                    className="order-history-custom-control-btn shadow-sm"
                    onClick={handleExportClick}
                    disabled={totalRecords === 0 || loading}
                    title="Export Orders"
                  >
                    <CsLineIcons icon="download" size="18" />
                  </Button>
                  <Button
                    className={`order-history-custom-control-btn shadow-sm ${showFilters ? 'active' : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                    title="Filters"
                    disabled={loading}
                  >
                    <CsLineIcons icon={showFilters ? 'close' : 'filter'} size="18" />
                    {getActiveFilterCount() > 0 && (
                      <Badge
                        bg="danger"
                        className="position-absolute rounded-pill border border-2 border-white"
                        style={{ top: '-5px', right: '-5px', fontSize: '10px', padding: '4px 6px' }}
                      >
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

            {/* Filter Section */}
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
                            className="w-100 rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-between px-4"
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
                          className="rounded-pill px-4 border-0 shadow-sm bg-white"
                          style={{ height: '44px', fontSize: '14px', appearance: 'none' }}
                        />
                      </Col>
                      <Col xs="6" sm="6" md="2">
                        <Form.Label className="small fw-bold text-muted mb-1">To</Form.Label>
                        <Form.Control
                          type="date"
                          value={filters.toDate}
                          onChange={(e) => handleFilterChange('toDate', e.target.value)}
                          className="rounded-pill px-4 border-0 shadow-sm bg-white"
                          style={{ height: '44px', fontSize: '14px', appearance: 'none' }}
                        />
                      </Col>

                      {/* Order Status Filter */}
                      <Col xs="12" sm="6" md="3">
                        <Form.Label className="small fw-bold text-muted mb-1">Status</Form.Label>
                        <Dropdown className="w-100">
                          <Dropdown.Toggle
                            variant="white"
                            className="w-100 rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-between px-4"
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
                            className="w-100 rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-between px-4"
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

                      {/* Table Area Filter */}
                      {/* <Col md={2} className="mb-3">
                      <Form.Label className="small text-muted">Table Area</Form.Label>
                      <Form.Control
                        type="text"
                        size="sm"
                        placeholder="Table Area"
                        value={filters.tableArea}
                        onChange={(e) => handleFilterChange('tableArea', e.target.value)}
                      />
                    </Col> */}
                    </Row>
                  </div>
                </Card.Body>
              </Card>
            </Collapse>

            {/* Show table or "no data" message */}
            {data.length === 0 && !loading ? (
              <Alert
                variant="info"
                className="text-center border-0 shadow-sm"
                style={{ borderRadius: '1rem', backgroundColor: 'rgba(35, 179, 244, 0.05)', color: '#23b3f4' }}
              >
                <CsLineIcons icon="inbox" size={24} className="me-2" />
                No orders found. {searchTerm || getActiveFilterCount() > 0 ? 'Try adjusting your search or filters.' : 'Orders will appear here once created.'}
              </Alert>
            ) : (
              <>
                {/* Table View for Desktop */}
                <Row className="d-none d-md-flex">
                  <Col xs="12" style={{ overflow: 'auto' }}>
                    <Table className="react-table rows" tableInstance={tableInstance} onSort={handleSort} />
                  </Col>
                </Row>

                {/* Card View for Mobile */}
                <Row className="d-md-none g-3">
                  {data.map((order, idx) => (
                    <Col key={idx} xs="12">
                      <Card className="border-0 shadow-sm hover-scale-up" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
                        <Card.Body className="p-3 position-relative">
                          <div
                            className="position-absolute"
                            style={{
                              top: '-10px',
                              right: '-10px',
                              width: '60px',
                              height: '60px',
                              borderRadius: '50%',
                              background: 'rgba(35, 179, 244, 0.1)',
                              filter: 'blur(10px)',
                            }}
                          />
                          <div className="d-flex justify-content-between align-items-start mb-3 position-relative">
                            <div>
                              <div className="fw-bolder text-primary mb-1" style={{ fontSize: '14px' }}>
                                {order.order_no || 'ORD-0000'}
                              </div>
                              <div className="text-muted small fw-medium">{format(new Date(order.order_date), 'dd MMM yyyy, HH:mm')}</div>
                            </div>
                            <Badge
                              bg={order.order_status === 'Paid' || order.order_status === 'Completed' || order.order_status === 'Save' ? 'success' : order.order_status === 'KOT' ? 'warning' : 'secondary'}
                              className="rounded-pill px-3 py-1"
                            >
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
                              <div className="fw-bolder text-dark" style={{ fontSize: '15px' }}>
                                ₹{parseFloat(order.total_amount).toFixed(2)}
                              </div>
                            </Col>
                          </Row>

                          <div className="d-flex justify-content-between align-items-center">
                            <Badge bg={order.order_source === 'Manager' ? 'info' : order.order_source === 'Captain' ? 'primary' : order.order_source === 'QSR' ? 'secondary' : 'dark'} className="rounded-pill px-3 py-1">
                              {order.order_source}
                            </Badge>
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="btn-icon btn-icon-only rounded-circle"
                                onClick={() => history.push(`/operations/order-details/${order.id}`)}
                              >
                                <CsLineIcons icon="eye" size="14" />
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                className="btn-icon btn-icon-only rounded-circle"
                                onClick={() => handlePrint(order.id)}
                                disabled={printing[order.id]}
                              >
                                {printing[order.id] ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="print" size="14" />}
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
                <div
                  className="sw-5 sh-5 rounded-circle d-flex justify-content-center align-items-center me-3"
                  style={{ backgroundColor: 'rgba(35, 179, 244, 0.1)' }}
                >
                  <CsLineIcons icon="download" size="20" style={{ color: '#23b3f4' }} />
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
                      <Form.Label className="fw-bolder mb-3 text-uppercase text-muted" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                        Export Format
                      </Form.Label>
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
                              <Form.Check type="radio" className="ms-2" checked={exportFormat === 'excel'} onChange={() => { }} />
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
                              <Form.Check type="radio" className="ms-2" checked={exportFormat === 'pdf'} onChange={() => { }} />
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </div>

                    {/* Export Filters */}
                    <Form.Label className="fw-bolder mb-3 text-uppercase text-muted" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                      Filter Data
                    </Form.Label>

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
                            <Dropdown.Menu
                              className="w-100 shadow-lg border-0 animate__animated animate__fadeIn"
                              style={{ borderRadius: '1rem', maxHeight: '250px', overflowY: 'auto' }}
                            >
                              <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderSource: '' })}>All Sources</Dropdown.Item>
                              <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderSource: 'Manager' })}>Manager</Dropdown.Item>
                              <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderSource: 'Captain' })}>Captain</Dropdown.Item>
                              <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderSource: 'QSR' })}>QSR</Dropdown.Item>
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
                            <Dropdown.Menu
                              className="w-100 shadow-lg border-0 animate__animated animate__fadeIn"
                              style={{ borderRadius: '1rem', maxHeight: '250px', overflowY: 'auto' }}
                            >
                              <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderStatus: '' })}>All Status</Dropdown.Item>
                              <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderStatus: 'Paid' })}>Paid</Dropdown.Item>
                              <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderStatus: 'Save' })}>Save</Dropdown.Item>
                              <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderStatus: 'KOT' })}>KOT</Dropdown.Item>
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
                            <Dropdown.Menu
                              className="w-100 shadow-lg border-0 animate__animated animate__fadeIn"
                              style={{ borderRadius: '1rem', maxHeight: '250px', overflowY: 'auto' }}
                            >
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
                            <Dropdown.Menu
                              className="w-100 shadow-lg border-0 animate__animated animate__fadeIn"
                              style={{ borderRadius: '1rem', maxHeight: '250px', overflowY: 'auto' }}
                            >
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
                    <Spinner animation="border" style={{ color: '#23b3f4', width: '3rem', height: '3rem' }} />
                  </div>
                  <h4 className="fw-bold mb-2">Generating Report</h4>
                  <p className="text-muted mb-4">Please wait while we compile your data into {exportFormat === 'excel' ? 'Excel' : 'PDF'}...</p>
                  <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                    <ProgressBar now={exportProgress} label={`${exportProgress}%`} style={{ height: '10px', backgroundColor: '#f3f4f6' }}>
                      <ProgressBar now={exportProgress} style={{ backgroundColor: '#23b3f4' }} />
                    </ProgressBar>
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0 pb-4 px-4">
              <Button variant="light" onClick={() => setShowExportModal(false)} disabled={exporting} className="rounded-pill px-4">
                Close
              </Button>
              {!exporting && (
                <Button variant="primary" onClick={handleExportConfirm} className="rounded-pill px-4 border-0" style={{ backgroundColor: '#23b3f4' }}>
                  Generate {exportFormat === 'excel' ? 'Excel' : 'PDF'}
                </Button>
              )}
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
    </>
  );
};

export default OrderHistory;
