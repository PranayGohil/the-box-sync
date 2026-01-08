import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Badge, Col, Form, Row, Button, Spinner, Alert, Card, Collapse, Modal, ProgressBar } from 'react-bootstrap';
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

const OrderHistory = () => {
  const title = 'Order History';
  const description = 'Order history with advanced filters.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/order-history', text: 'Operations' },
    { to: 'operations/order-history', title: 'Order History' },
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

  const COMPANY_NAME = currentUser.name || 'TheBoxSync';
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
    if (filters.orderSource) count += 1;
    if (filters.orderStatus) count += 1;
    if (filters.orderType) count += 1;
    if (filters.tableArea) count += 1;
    if (filters.fromDate) count += 1;
    if (filters.toDate) count += 1;
    if (searchTerm) count += 1;
    return count;
  };

  const handlePrint = async (orderId) => {
    setPrinting((prev) => ({ ...prev, [orderId]: true }));
    try {
      const orderResponse = await axios.get(`${API_BASE}/order/get/${orderId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

      const userResponse = await axios.get(`${API_BASE}/user/get`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

      const order = orderResponse.data.data;
      const userData = userResponse.data;

      const printDiv = document.createElement('div');
      printDiv.id = 'printable-invoice';
      printDiv.style.display = 'none';
      document.body.appendChild(printDiv);

      printDiv.innerHTML = `
         <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; border: 1px solid #ccc; padding: 10px;">
           <div style="text-align: center; margin-bottom: 10px;">
             <h3 style="margin: 10px;">${userData.name}</h3>
             <p style="margin: 0; font-size: 12px;">${userData.address}</p>
             <p style="margin: 0; font-size: 12px;">
               ${userData.city}, ${userData.state} - ${userData.pincode}
             </p>
             <p style="margin: 10px; font-size: 12px;"><strong>Ph.: </strong> ${userData.mobile}</p>
             ${
               userData.fssai_no && userData.fssai_no !== 'null'
                 ? `<p style="margin: 10px; font-size: 12px;"><strong>FSSAI No:</strong> ${userData.fssai_no}</p>`
                 : ''
             }
             <p style="margin: 10px; font-size: 12px;"><strong>GST No:</strong> ${userData.gst_no}</p>
           </div>
           <hr style="border: 0.5px dashed #ccc;" />
           <p></p>
            <table style="width: 100%; font-size: 12px; margin-bottom: 10px;">
             <tr>
               <td style="width: 50%; height: 30px;">
                 <strong> Name: </strong> ${order?.customer_name || '(M: 1234567890)'} 
               </td>
                <td style="text-align: right;">
                  <strong>${order.order_type}</strong>
               </td>
             </tr>
             <tr>
               <td style="width: 50%; height: 30px;">
                 <strong>Date:</strong> ${new Date(order.order_date).toLocaleString()}
               </td>
              <td style="text-align: right;">
                   ${
                     order.table_no
                       ? ` <strong>Table No: </strong> <span style="margin-left: 5px; font-size: 16px;"> ${order.table_no} </span>`
                       : order.token
                       ? ` <strong>Token No: </strong> <span style="margin-left: 5px; font-size: 16px;"> ${order.token} </span>`
                       : ''
                   } </span>
               </td>
             </tr>
             <tr>
               <td colspan="2"><strong>Bill No:</strong> ${order.order_no || order._id}</td>
             </tr>
           </table>
           <hr style="border: 0.5px dashed #ccc;" />
           <table style="width: 100%; font-size: 12px; margin-bottom: 10px;">
             <thead>
               <tr>
                 <th style="text-align: left; border-bottom: 1px dashed #ccc">Item</th>
                 <th style="text-align: center; border-bottom: 1px dashed #ccc">Qty</th>
                 <th style="text-align: center; border-bottom: 1px dashed #ccc">Price</th>
                 <th style="text-align: right; border-bottom: 1px dashed #ccc">Amount</th>
               </tr>
             </thead>
             <tbody>
               ${order.order_items
                 .map(
                   (item) => `
                 <tr>
                   <td>${item.dish_name}</td>
                   <td style="text-align: center;">${item.quantity}</td>
                   <td style="text-align: center;">${item.dish_price}</td>
                   <td style="text-align: right;">₹ ${item.dish_price * item.quantity}</td>
                 </tr>
               `
                 )
                 .join('')}
               <tr>
                 <td colspan="3" style="text-align: right; border-top: 1px dashed #ccc"><strong>Sub Total: </strong></td>
                 <td style="text-align: right; border-top: 1px dashed #ccc">₹ ${order.sub_total}</td>
               </tr>
               ${
                 order.cgst_amount > 0
                   ? `
                 <tr>
                   <td colspan="3" style="text-align: right;"><strong>CGST (${order.cgst_percent || 0} %):</strong></td>
                   <td style="text-align: right;">₹ ${order.cgst_amount || 0}</td> 
                 </tr>`
                   : ''
               }
               ${
                 order.sgst_amount > 0
                   ? `
                 <tr>
                   <td colspan="3" style="text-align: right;"><strong>SGST (${order.sgst_percent || 0} %):</strong></td>
                   <td style="text-align: right;">₹ ${order.sgst_amount || 0}</td>
                 </tr>`
                   : ''
               }
               ${
                 order.vat_amount > 0
                   ? `
                 <tr>
                   <td colspan="3" style="text-align: right;"><strong>VAT (${order.vat_percent || 0} %):</strong></td>
                   <td style="text-align: right;">₹ ${order.vat_amount || 0}</td>
                 </tr>`
                   : ''
               }
               ${
                 order.discount_amount > 0
                   ? `
                 <tr>
                   <td colspan="3" style="text-align: right;"><strong>Discount: </strong></td>
                   <td style="text-align: right;">- ₹ ${order.discount_amount || 0}</td>
                 </tr>`
                   : ''
               }
               <tr>
                 <td colspan="3" style="text-align: right;"><strong>Total: </strong></td>
                 <td style="text-align: right;">₹ ${order.total_amount}</td>
               </tr>
               <tr>
                 <td colspan="3" style="text-align: right; border-top: 1px dashed #ccc"><strong>Paid Amount: </strong></td>
                 <td style="text-align: right; border-top: 1px dashed #ccc">₹ ${order.paid_amount || order.bill_amount || 0}</td>
               </tr>
               ${
                 order.waveoff_amount !== null && order.waveoff_amount !== undefined && order.waveoff_amount !== 0
                   ? `
                 <tr>
                   <td colspan="3" style="text-align: right;"><strong>Waveoff Amount: </strong></td>
                   <td style="text-align: right;"> ₹ ${order.waveoff_amount || 0}</td>
                 </tr>`
                   : ''
               }
             </tbody>
           </table>
           <div style="text-align: center; font-size: 12px;">
             <p style="margin: 10px; font-size: 12px;"><strong>Thanks, Visit Again</strong></p>
           </div>
         </div>
       `;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(printDiv.innerHTML);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();

      document.body.removeChild(printDiv);
      toast.success('Invoice printed successfully!');
    } catch (err) {
      console.error('Error fetching order or user data:', err);
      toast.error('Failed to print invoice. Please try again.');
    } finally {
      setPrinting((prev) => ({ ...prev, [orderId]: false }));
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
        toast.warning('No orders found with the selected filters');
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
          `${exportFilters.fromDate ? format(new Date(exportFilters.fromDate), 'dd MMM yyyy') : 'All'} to ${
            exportFilters.toDate ? format(new Date(exportFilters.toDate), 'dd MMM yyyy') : 'All'
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
      toast.success(`${orders.length} orders exported successfully!`);
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
        toast.warning('No orders found with the selected filters');
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
            `Date Range: ${exportFilters.fromDate ? format(new Date(exportFilters.fromDate), 'dd MMM yyyy') : 'All'} to ${
              exportFilters.toDate ? format(new Date(exportFilters.toDate), 'dd MMM yyyy') : 'All'
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
      toast.success(`${orders.length} orders exported successfully!`);
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
      <>
        <HtmlHead title={title} description={description} />
        <Row>
          <Col>
            <div className="page-title-container">
              <Row>
                <Col xs="12" md="7">
                  <h1 className="mb-0 pb-0 display-4">{title}</h1>
                  <BreadcrumbList items={breadcrumbs} />
                </Col>
              </Row>
            </div>
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
          <div className="page-title-container">
            <Row className="align-items-center">
              <Col xs="12" md="7">
                <h1 className="mb-0 pb-0 display-4">{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
              <Col xs="12" md="5" className="text-end mt-2 mt-md-0">
                <Button variant="primary" onClick={handleExportClick} disabled={totalRecords === 0}>
                  <CsLineIcons icon="download" className="me-2" />
                  Export
                </Button>
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
            <Row className="mb-3">
              <Col sm="12" md="5" lg="3" xxl="2">
                <div className="d-flex gap-2">
                  <div className="d-inline-block float-md-start me-1 mb-1 mb-md-0 search-input-container w-100 shadow bg-foreground">
                    <ControlsSearch onSearch={handleSearch} />
                  </div>
                  <Button
                    variant={`${showFilters ? 'secondary' : 'outline-secondary'}`}
                    size="sm"
                    className="btn-icon btn-icon-only position-relative"
                    onClick={() => setShowFilters(!showFilters)}
                    title="Filters"
                    disabled={loading}
                  >
                    <CsLineIcons icon={`${showFilters ? 'close' : 'filter'}`} />
                    {getActiveFilterCount() > 0 && (
                      <Badge bg="primary" className="position-absolute top-0 start-100 translate-middle">
                        {getActiveFilterCount()}
                      </Badge>
                    )}
                  </Button>
                </div>
              </Col>
              <Col sm="12" md="7" lg="9" xxl="10" className="text-end">
                <div className="d-inline-block me-2 text-muted">
                  {loading ? (
                    'Loading...'
                  ) : (
                    <>
                      Showing {data.length > 0 ? pageIndex * pageSize + 1 : 0} to {Math.min((pageIndex + 1) * pageSize, totalRecords)} of {totalRecords} entries
                    </>
                  )}
                </div>
                <div className="d-inline-block">
                  <ControlsPageSize pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
                </div>
              </Col>
            </Row>
            <Collapse in={showFilters}>
              <Card className="mb-3">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>Filters</h5>
                    {getActiveFilterCount() > 0 && (
                      <Button variant="outline-danger" size="sm" onClick={handleClearFilters}>
                        <CsLineIcons icon="close" className="me-1" />
                        Clear
                      </Button>
                    )}
                  </div>

                  <div>
                    <Row>
                      {/* Order Source Filter */}
                      <Col md={2} className="mb-3">
                        <Form.Label className="small">Source</Form.Label>
                        <Form.Select size="sm" value={filters.orderSource} onChange={(e) => handleFilterChange('orderSource', e.target.value)}>
                          <option value="">All</option>
                          <option value="Manager">Manager</option>
                          <option value="Captain">Captain</option>
                          <option value="QSR">QSR</option>
                          <option value="Restaurant Website">Restaurant Website</option>
                        </Form.Select>
                      </Col>

                      {/* Date Range Filter */}
                      <Col md={2} className="mb-3">
                        <Form.Label className="small">From</Form.Label>
                        <Form.Control type="date" size="sm" value={filters.fromDate} onChange={(e) => handleFilterChange('fromDate', e.target.value)} />
                      </Col>
                      <Col md={2} className="mb-3">
                        <Form.Label className="small">To</Form.Label>
                        <Form.Control type="date" size="sm" value={filters.toDate} onChange={(e) => handleFilterChange('toDate', e.target.value)} />
                      </Col>

                      {/* Order Status Filter */}
                      <Col md={3} className="mb-3">
                        <Form.Label className="small">Status</Form.Label>
                        <Form.Select size="sm" value={filters.orderStatus} onChange={(e) => handleFilterChange('orderStatus', e.target.value)}>
                          <option value="">All</option>
                          <option value="Paid">Paid</option>
                          <option value="Save">Save</option>
                          <option value="KOT">KOT</option>
                          <option value="Cancelled">Cancelled</option>
                        </Form.Select>
                      </Col>

                      {/* Order Type Filter */}
                      <Col md={3} className="mb-3">
                        <Form.Label className="small">Type</Form.Label>
                        <Form.Select size="sm" value={filters.orderType} onChange={(e) => handleFilterChange('orderType', e.target.value)}>
                          <option value="">All</option>
                          <option value="Dine In">Dine In</option>
                          <option value="Takeaway">Takeaway</option>
                          <option value="Delivery">Delivery</option>
                        </Form.Select>
                      </Col>
                    </Row>
                  </div>
                </Card.Body>
              </Card>
            </Collapse>

            {/* Show table or "no data" message */}
            {data.length === 0 && !loading ? (
              <Alert variant="info" className="text-center">
                <CsLineIcons icon="inbox" size={24} className="me-2" />
                No orders found. {searchTerm || getActiveFilterCount() > 0 ? 'Try adjusting your search or filters.' : 'Orders will appear here once created.'}
              </Alert>
            ) : (
              <>
                <Row>
                  <Col xs="12">
                    <Table className="react-table rows" tableInstance={tableInstance} onSort={handleSort} />
                  </Col>
                  <Col xs="12">
                    <TablePagination paginationProps={paginationProps} />
                  </Col>
                </Row>
              </>
            )}
          </div>
        </Col>
      </Row>

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => !exporting && setShowExportModal(false)} size="lg">
        <Modal.Header closeButton={!exporting}>
          <Modal.Title>Export Order History</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!exporting ? (
            <>
              <p className="text-muted mb-4">Export your order data by selecting filters and a file format.</p>

              <Form>
                {/* Export Format Selection */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Export Format</Form.Label>
                  <div className="d-flex gap-3">
                    <Form.Check
                      type="radio"
                      id="format-excel"
                      label={
                        <div className="d-flex align-items-center">
                          <CsLineIcons icon="file-text" className="me-2 text-success" />
                          <span>EXCEL (.xlsx)</span>
                        </div>
                      }
                      name="exportFormat"
                      value="excel"
                      checked={exportFormat === 'excel'}
                      onChange={(e) => setExportFormat(e.target.value)}
                    />
                    <Form.Check
                      type="radio"
                      id="format-pdf"
                      label={
                        <div className="d-flex align-items-center">
                          <CsLineIcons icon="file-text" className="me-2 text-danger" />
                          <span>PDF (.pdf)</span>
                        </div>
                      }
                      name="exportFormat"
                      value="pdf"
                      checked={exportFormat === 'pdf'}
                      onChange={(e) => setExportFormat(e.target.value)}
                    />
                  </div>
                </Form.Group>

                {/* Export Filters */}
                <Form.Label className="fw-bold mb-3">Filter Orders</Form.Label>

                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Label className="small">Date</Form.Label>
                    <Row>
                      <Col>
                        <Form.Control
                          type="date"
                          size="sm"
                          placeholder="From Date"
                          value={exportFilters.fromDate}
                          onChange={(e) => setExportFilters({ ...exportFilters, fromDate: e.target.value })}
                        />
                      </Col>
                      <Col>
                        <Form.Control
                          type="date"
                          size="sm"
                          placeholder="To Date"
                          value={exportFilters.toDate}
                          onChange={(e) => setExportFilters({ ...exportFilters, toDate: e.target.value })}
                        />
                      </Col>
                    </Row>
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Label className="small">Source</Form.Label>
                    <Form.Select
                      size="sm"
                      value={exportFilters.orderSource}
                      onChange={(e) => setExportFilters({ ...exportFilters, orderSource: e.target.value })}
                    >
                      <option value="">All Sources</option>
                      <option value="Manager">Manager</option>
                      <option value="Captain">Captain</option>
                      <option value="QSR">QSR</option>
                      <option value="Restaurant Website">Restaurant Website</option>
                    </Form.Select>
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Label className="small">Status</Form.Label>
                    <Form.Select
                      size="sm"
                      value={exportFilters.orderStatus}
                      onChange={(e) => setExportFilters({ ...exportFilters, orderStatus: e.target.value })}
                    >
                      <option value="">All Status</option>
                      <option value="Paid">Paid</option>
                      <option value="Save">Save</option>
                      <option value="KOT">KOT</option>
                      <option value="Cancelled">Cancelled</option>
                    </Form.Select>
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Label className="small">Type</Form.Label>
                    <Form.Select size="sm" value={exportFilters.orderType} onChange={(e) => setExportFilters({ ...exportFilters, orderType: e.target.value })}>
                      <option value="">All Types</option>
                      <option value="Dine In">Dine In</option>
                      <option value="Takeaway">Takeaway</option>
                      <option value="Delivery">Delivery</option>
                    </Form.Select>
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Label className="small">Payment Type</Form.Label>
                    <Form.Select
                      size="sm"
                      value={exportFilters.paymentType}
                      onChange={(e) => setExportFilters({ ...exportFilters, paymentType: e.target.value })}
                    >
                      <option value="">All Payment Types</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="Online">Online</option>
                    </Form.Select>
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Label className="small">Table Area</Form.Label>
                    <Form.Control
                      type="text"
                      size="sm"
                      placeholder="Enter table area"
                      value={exportFilters.tableArea}
                      onChange={(e) => setExportFilters({ ...exportFilters, tableArea: e.target.value })}
                    />
                  </Col>
                </Row>
              </Form>

              <Alert variant="info" className="mt-3">
                <CsLineIcons icon="info-circle" className="me-2" />
                <strong>Note:</strong> Apply filters to export specific orders, or leave empty to export all.
              </Alert>
            </>
          ) : (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h5>Exporting Orders...</h5>
              <p className="text-muted mb-3">Please wait while we prepare your {exportFormat === 'excel' ? 'Excel' : 'PDF'} file</p>
              <ProgressBar now={exportProgress} label={`${exportProgress}%`} className="mb-2" style={{ height: '25px' }} />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)} disabled={exporting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleExportConfirm} disabled={exporting}>
            {exporting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Exporting...
              </>
            ) : (
              <>
                <CsLineIcons icon="download" className="me-2" />
                Export {exportFormat === 'excel' ? 'Excel' : 'PDF'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default OrderHistory;
