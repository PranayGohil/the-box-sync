import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
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
import { AuthContext } from 'contexts/AuthContext';
import { openPrintWindow } from 'utils/printUtils';

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
  const [sortBy, setSortBy] = useState('order_no');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    orderStatus: '',
    orderType: '',
    fromDate: '',
    toDate: '',
  });

  const COMPANY_NAME = 'The Box';

  // Export states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportFilters, setExportFilters] = useState({
    orderStatus: '',
    orderType: '',
    orderSource: 'QSR',
    paymentType: '',
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
        order_source: ['QSR'],
      };

      if (searchTerm.trim()) {
        params.search = searchTerm;
      }

      if (filters.orderStatus) {
        params.order_status = filters.orderStatus;
      }
      if (filters.orderType) {
        params.order_type = filters.orderType;
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
      toast.error('Failed to fetch orders.');
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

  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setPageIndex(0);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(localSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearchTerm, handleSearch]);

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
      orderStatus: '',
      orderType: '',
      fromDate: '',
      toDate: '',
    });
    setSearchTerm('');
    setPageIndex(0);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.orderStatus) count++;
    if (filters.orderType) count++;
    if (filters.fromDate) count++;
    if (filters.toDate) count++;
    if (searchTerm) count++;
    return count;
  };

  const handleExportClick = () => {
    setExportFilters({
      orderStatus: filters.orderStatus,
      orderType: filters.orderType,
      orderSource: 'QSR',
      paymentType: '',
      tableArea: '',
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    });
    setShowExportModal(true);
  };

  const formatCurrencyPDF = (amount) => `INR ${parseFloat(amount).toFixed(2)}`;

  const exportToExcel = async () => {
    setExporting(true);
    setExportProgress(10);
    try {
      setExportProgress(20);
      const params = { page: 1, limit: 10000, sortBy: 'order_date', sortOrder: 'desc' };
      if (exportFilters.orderSource) params.order_source = exportFilters.orderSource;
      if (exportFilters.orderStatus) params.order_status = exportFilters.orderStatus;
      if (exportFilters.orderType) params.order_type = exportFilters.orderType;
      if (exportFilters.tableArea) params.table_area = exportFilters.tableArea;
      if (exportFilters.fromDate) params.from = exportFilters.fromDate;
      if (exportFilters.toDate) params.to = exportFilters.toDate;
      if (exportFilters.paymentType) params.payment_type = exportFilters.paymentType;
      setExportProgress(30);
      const response = await axios.get(`${process.env.REACT_APP_API}/order/get-orders`, {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setExportProgress(50);
      if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch orders for export');
      const orders = response.data.data;
      if (orders.length === 0) throw new Error('No orders found for the selected filters');
      const wb = XLSX.utils.book_new();
      const totalAmount = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const avgOrderValue = totalAmount / orders.length;
      const sheetData = [
        ['ORDER HISTORY REPORT'],
        [],
        ['Company:', COMPANY_NAME, '', 'Export Date:', format(new Date(), 'dd MMM yyyy hh:mm a')],
        [],
        ['KPI SUMMARY'],
        ['Total Orders', 'Total Revenue', 'Average Order Value'],
        [orders.length, totalAmount, avgOrderValue],
        [],
        ['FILTERS APPLIED'],
      ];
      if (exportFilters.fromDate || exportFilters.toDate) {
        sheetData.push([
          'Date Range:',
          `${exportFilters.fromDate ? format(new Date(exportFilters.fromDate), 'dd MMM yyyy') : 'All'} to ${
            exportFilters.toDate ? format(new Date(exportFilters.toDate), 'dd MMM yyyy') : 'All'
          }`,
        ]);
      }
      if (exportFilters.orderStatus) sheetData.push(['Order Status:', exportFilters.orderStatus]);
      if (exportFilters.orderType) sheetData.push(['Order Type:', exportFilters.orderType]);
      if (exportFilters.paymentType) sheetData.push(['Payment Type:', exportFilters.paymentType]);
      sheetData.push([]);
      sheetData.push([]);
      const tableHeaderRowIndex = sheetData.length;
      sheetData.push(['Order No', 'Date & Time', 'Customer', 'Type', 'Table Area', 'Source', 'Payment Mode', 'Total Amount', 'Status']);
      orders.forEach((order) => {
        const orderDate = new Date(order.order_date);
        const tableDetails = order.table_area
          ? `${order.table_area}${order.table_no ? ` - T${order.table_no}` : ''}`
          : order.table_no
          ? `T${order.table_no}`
          : order.token
          ? `Token ${order.token}`
          : 'N/A';
        sheetData.push([
          order.order_no || order._id || '',
          format(orderDate, 'dd-MM-yyyy hh:mm a'),
          order.customer_name || 'Guest',
          order.order_type || 'N/A',
          tableDetails,
          order.order_source || 'N/A',
          order.payment_type || 'N/A',
          order.total_amount || 0,
          order.order_status || 'N/A',
        ]);
      });
      const sheet = XLSX.utils.aoa_to_sheet(sheetData);
      sheet['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
      if (sheet.B7) {
        sheet.B7.t = 'n';
        sheet.B7.z = '"Rs. "#,##0.00';
      }
      if (sheet.C7) {
        sheet.C7.t = 'n';
        sheet.C7.z = '"Rs. "#,##0.00';
      }
      const range = XLSX.utils.decode_range(sheet['!ref']);
      for (let R = tableHeaderRowIndex + 1; R <= range.e.r; R += 1) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: 7 });
        if (sheet[cellAddress] && typeof sheet[cellAddress].v === 'number') {
          sheet[cellAddress].z = '"Rs. "#,##0.00';
          sheet[cellAddress].t = 'n';
        }
      }
      sheet['!autofilter'] = { ref: `A${tableHeaderRowIndex + 1}:I${range.e.r + 1}` };
      XLSX.utils.book_append_sheet(wb, sheet, 'Order History');
      setExportProgress(90);
      const fromDateStr = exportFilters.fromDate ? format(new Date(exportFilters.fromDate), 'dd-MMM-yyyy') : 'All';
      const toDateStr = exportFilters.toDate ? format(new Date(exportFilters.toDate), 'dd-MMM-yyyy') : 'All';
      XLSX.writeFile(wb, `Order_History_${fromDateStr}_to_${toDateStr}.xlsx`);
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
      const params = { page: 1, limit: 10000, sortBy: 'order_date', sortOrder: 'desc' };
      if (exportFilters.orderSource) params.order_source = exportFilters.orderSource;
      if (exportFilters.orderStatus) params.order_status = exportFilters.orderStatus;
      if (exportFilters.orderType) params.order_type = exportFilters.orderType;
      if (exportFilters.tableArea) params.table_area = exportFilters.tableArea;
      if (exportFilters.fromDate) params.from = exportFilters.fromDate;
      if (exportFilters.toDate) params.to = exportFilters.toDate;
      if (exportFilters.paymentType) params.payment_type = exportFilters.paymentType;
      setExportProgress(30);
      const response = await axios.get(`${process.env.REACT_APP_API}/order/get-orders`, {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setExportProgress(50);
      if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch orders for export');
      const orders = response.data.data;
      if (orders.length === 0) throw new Error('No orders found for the selected filters');
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const docWidth = doc.internal.pageSize.getWidth();
      const docHeight = doc.internal.pageSize.getHeight();
      let yPosition = 0;
      doc.setFillColor(35, 179, 244);
      doc.rect(0, 0, docWidth, 4, 'F');
      yPosition += 4;
      doc.setFillColor(31, 41, 55);
      doc.rect(0, yPosition, docWidth, 38, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('THE BOX', 15, yPosition + 15);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(156, 163, 175);
      doc.text('PREMIUM ORDER MANAGEMENT SYSTEM', 15, yPosition + 20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(35, 179, 244);
      doc.text('ORDER HISTORY REPORT', 15, yPosition + 29);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('REPORT GENERATED', docWidth - 15, yPosition + 12, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(209, 213, 219);
      doc.text(format(new Date(), 'dd MMM yyyy hh:mm a'), docWidth - 15, yPosition + 17, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('BUSINESS NAME', docWidth - 15, yPosition + 25, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(209, 213, 219);
      doc.text(COMPANY_NAME, docWidth - 15, yPosition + 30, { align: 'right' });
      yPosition += 48;
      const totalAmount = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const avgOrderValue = totalAmount / orders.length;
      const cardWidth = 56;
      const cardHeight = 22;
      const cardGap = 6;
      const startX = 15;
      const formatCurrencyForCard = (amount) => `Rs. ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount || 0)}`;
      const kpiCards = [
        { title: 'TOTAL ORDERS', value: orders.length.toString(), color: [35, 179, 244] },
        { title: 'TOTAL REVENUE', value: formatCurrencyForCard(totalAmount), color: [16, 185, 129] },
        { title: 'AVG ORDER VALUE', value: formatCurrencyForCard(avgOrderValue), color: [245, 158, 11] },
      ];
      kpiCards.forEach((card, idx) => {
        const xPos = startX + idx * (cardWidth + cardGap);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(xPos, yPosition, cardWidth, cardHeight, 3, 3, 'F');
        doc.setFillColor(card.color[0], card.color[1], card.color[2]);
        doc.rect(xPos, yPosition, 1.5, cardHeight, 'F');
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(card.title, xPos + 5, yPosition + 7);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(card.value, xPos + 5, yPosition + 15);
      });
      yPosition += cardHeight + 10;
      const activeFilters = [];
      if (exportFilters.fromDate || exportFilters.toDate)
        activeFilters.push({
          label: 'Date Period',
          val: `${exportFilters.fromDate ? format(new Date(exportFilters.fromDate), 'dd MMM yyyy') : 'All'} to ${
            exportFilters.toDate ? format(new Date(exportFilters.toDate), 'dd MMM yyyy') : 'All'
          }`,
        });
      if (exportFilters.orderStatus) activeFilters.push({ label: 'Status', val: exportFilters.orderStatus });
      if (exportFilters.orderType) activeFilters.push({ label: 'Type', val: exportFilters.orderType });
      if (exportFilters.paymentType) activeFilters.push({ label: 'Payment', val: exportFilters.paymentType });
      if (activeFilters.length > 0) {
        doc.setFillColor(243, 244, 246);
        doc.roundedRect(15, yPosition, docWidth - 30, 12 + Math.ceil(activeFilters.length / 2) * 5, 2, 2, 'F');
        doc.setTextColor(75, 85, 99);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('ACTIVE FILTERS', 20, yPosition + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        activeFilters.forEach((filt, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const xFilt = col === 0 ? 55 : 130;
          const yFilt = yPosition + 6 + row * 5;
          doc.text(`${filt.label}: `, xFilt, yFilt);
          doc.setFont('helvetica', 'bold');
          doc.text(filt.val, xFilt + doc.getTextWidth(`${filt.label}: `), yFilt);
          doc.setFont('helvetica', 'normal');
        });
        yPosition += 12 + Math.ceil(activeFilters.length / 2) * 5 + 6;
      } else {
        yPosition += 2;
      }
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('TRANSACTION LOG', 15, yPosition);
      yPosition += 4;
      setExportProgress(70);
      autoTable(doc, {
        startY: yPosition,
        head: [['Order No', 'Date & Time', 'Customer', 'Type', 'Table Area', 'Source', 'Payment Mode', 'Total Amount', 'Status']],
        body: orders.map((order) => {
          const orderDate = new Date(order.order_date);
          const tableDetails = order.table_area
            ? `${order.table_area}${order.table_no ? ` - T${order.table_no}` : ''}`
            : order.table_no
            ? `T${order.table_no}`
            : order.token
            ? `Token ${order.token}`
            : 'N/A';
          return [
            order.order_no || (order._id || '').substring(18),
            format(orderDate, 'dd-MM-yy hh:mm a'),
            (order.customer_name || 'Guest').substring(0, 15),
            order.order_type || 'N/A',
            tableDetails,
            order.order_source || 'N/A',
            order.payment_type || 'N/A',
            formatCurrencyPDF(order.total_amount),
            order.order_status || 'N/A',
          ];
        }),
        theme: 'striped',
        headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', halign: 'center', cellPadding: 2.5 },
        bodyStyles: { fontSize: 7, cellPadding: 2, textColor: [55, 65, 81] },
        columnStyles: {
          0: { cellWidth: 20, fontStyle: 'bold', textColor: [31, 41, 55] },
          1: { cellWidth: 24, halign: 'center' },
          2: { cellWidth: 24 },
          3: { cellWidth: 16, halign: 'center' },
          4: { cellWidth: 24, halign: 'center' },
          5: { cellWidth: 18, halign: 'center' },
          6: { cellWidth: 22, halign: 'center' },
          7: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: [35, 179, 244] },
          8: { cellWidth: 18, halign: 'center' },
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: 10, right: 10 },
        didDrawPage: (pageData) => {
          const totalPagesCount = doc.internal.getNumberOfPages();
          doc.setPage(pageData.pageNumber);
          doc.setDrawColor(229, 231, 235);
          doc.line(10, docHeight - 15, docWidth - 10, docHeight - 15);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(156, 163, 175);
          doc.text(`${COMPANY_NAME}   |   Order History Report   |   Page ${pageData.pageNumber} of ${totalPagesCount}`, docWidth / 2, docHeight - 9, {
            align: 'center',
          });
        },
      });
      setExportProgress(95);
      const fromDateStr = exportFilters.fromDate ? format(new Date(exportFilters.fromDate), 'dd-MMM-yyyy') : 'All';
      const toDateStr = exportFilters.toDate ? format(new Date(exportFilters.toDate), 'dd-MMM-yyyy') : 'All';
      doc.save(`Order_History_${fromDateStr}_to_${toDateStr}.pdf`);
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

  const handleExportConfirm = () => {
    if (exportFormat === 'excel') exportToExcel();
    else exportToPDF();
  };

  const handlePrint = async (orderId) => {
    await openPrintWindow(orderId, setPrinting);
  };

  const columns = React.useMemo(
    () => [
      {
        Header: 'Order No.',
        accessor: 'order_no',
        id: 'order_no',
        headerClassName: 'text-small text-uppercase w-15',
        sortable: true,
        isSorted: sortBy === 'order_no',
        isSortedDesc: sortBy === 'order_no' && sortOrder === 'desc',
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
        Cell: ({ value }) => format(new Date(value), 'hh:mm a'),
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
          <Badge
            bg={value === 'Dine In' ? 'primary' : value === 'Takeaway' ? 'warning' : value === 'Delivery' ? 'success' : 'secondary'}
            className="rounded-pill px-3"
          >
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
          <Badge
            bg={
              value === 'Paid' || value === 'Save' || value === 'Completed'
                ? 'success'
                : value === 'KOT'
                ? 'warning'
                : value === 'Cancelled'
                ? 'danger'
                : 'secondary'
            }
            className="rounded-pill px-3"
          >
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
              <CsLineIcons icon="eye" size="15" />
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              title="Print"
              className="btn-icon btn-icon-only"
              onClick={() => handlePrint(row.original.id)}
              disabled={printing[row.original.id]}
            >
              {printing[row.original.id] ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="print" size="15" />}
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

  const brandColor = '#23b3f4';

  if (loading && pageIndex === 0) {
    return (
      <div className="container-fluid ps-lg-4 pe-lg-5 py-5 text-center">
        <Spinner animation="border" style={{ color: brandColor }} className="mb-3" />
        <h5>Loading Order History...</h5>
      </div>
    );
  }

  return (
    <>
      <style>{`
        input[type="date"], input[placeholder="DD/MM/YYYY"] {
          position: relative;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%231ea8e7' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 15px center !important;
          background-size: 18px 18px !important;
          padding-right: 40px !important;
        }
        input[type="date"]::-webkit-calendar-picker-indicator, input[placeholder="DD/MM/YYYY"]::-webkit-calendar-picker-indicator {
          cursor: pointer !important;
          display: block !important;
          opacity: 0 !important;
          position: absolute !important;
          right: 0 !important;
          top: 0 !important;
          width: 40px !important;
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          z-index: 2 !important;
        }
      `}</style>
      <div className="container-fluid pb-5">
        <HtmlHead title={title} description={description} />

        <div className="page-title-container mb-4 mt-5 pt-1 mt-md-0 pt-md-0">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: brandColor }}>
                {title}
              </h1>
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

        {/* Search and Controls */}
        <div>
          <Row className="mb-3 g-2 align-items-center">
            <Col xs="12" sm="auto" className="flex-grow-1" style={{ minWidth: '200px' }}>
              <div className="order-history-custom-search-container shadow-sm d-flex align-items-center px-2">
                <CsLineIcons icon="search" size="18" className="text-primary opacity-75 ms-1 me-2" />
                <Form.Control
                  type="text"
                  className="border-0 bg-transparent shadow-none"
                  placeholder="Search orders..."
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  style={{ height: '40px', fontSize: '14px' }}
                />
                {localSearchTerm && (
                  <div className="cursor-pointer text-muted px-1" onClick={() => setLocalSearchTerm('')}>
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
              <div className="d-inline-block me-3 text-muted small">
                Showing {data.length > 0 ? pageIndex * pageSize + 1 : 0}-{Math.min((pageIndex + 1) * pageSize, totalRecords)} of {totalRecords}
              </div>
              <div className="d-inline-block">
                <ControlsPageSize pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
              </div>
            </Col>
          </Row>
        </div>

        <Collapse in={showFilters}>
          <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: '1.25rem', backgroundColor: '#f8f9fa' }}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0 fw-bold d-flex align-items-center" style={{ color: brandColor }}>
                  <CsLineIcons icon="filter" className="me-2" size="18" />
                  Filter Records
                </h5>
                {getActiveFilterCount() > 0 && (
                  <Button variant="link" className="p-0 text-danger text-decoration-none small fw-bold" onClick={handleClearFilters}>
                    <CsLineIcons icon="close" size="12" className="me-1" />
                    Clear All
                  </Button>
                )}
              </div>

              <div>
                <Row className="g-3">
                  {/* Date Range Filter */}
                  <Col xs="6" sm="6" md="3">
                    <Form.Label className="small fw-bold text-muted mb-1">From</Form.Label>
                    <Form.Control
                      type={filters.fromDate ? 'date' : 'text'}
                      placeholder="DD/MM/YYYY"
                      onFocus={(e) => {
                        e.target.type = 'date';
                      }}
                      onBlur={(e) => {
                        if (!e.target.value) e.target.type = 'text';
                      }}
                      value={filters.fromDate}
                      onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                      className="rounded-pill px-3 border-0 shadow-sm text-dark"
                      style={{ height: '44px', fontSize: '14px', paddingRight: '40px' }}
                    />
                  </Col>
                  <Col xs="6" sm="6" md="3">
                    <Form.Label className="small fw-bold text-muted mb-1">To</Form.Label>
                    <Form.Control
                      type={filters.toDate ? 'date' : 'text'}
                      placeholder="DD/MM/YYYY"
                      onFocus={(e) => {
                        e.target.type = 'date';
                      }}
                      onBlur={(e) => {
                        if (!e.target.value) e.target.type = 'text';
                      }}
                      value={filters.toDate}
                      onChange={(e) => handleFilterChange('toDate', e.target.value)}
                      className="rounded-pill px-3 border-0 shadow-sm text-dark"
                      style={{ height: '44px', fontSize: '14px', paddingRight: '40px' }}
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

        {data.length === 0 && !loading ? (
          <Alert
            variant="info"
            className="text-center border-0 shadow-sm"
            style={{ borderRadius: '1rem', backgroundColor: 'rgba(35, 179, 244, 0.05)', color: brandColor }}
          >
            <CsLineIcons icon="inbox" size="24" className="me-2" />
            No orders found. {searchTerm || getActiveFilterCount() > 0 ? 'Try adjusting your search or filters.' : 'Orders will appear here once created.'}
          </Alert>
        ) : (
          <>
            {/* Table View for Desktop */}
            <Row className="d-none d-md-flex">
              <Col xs="12">
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
                          <div className="text-muted small fw-medium">{format(new Date(order.order_date), 'dd MMM yyyy, hh:mm a')}</div>
                        </div>
                        <Badge
                          bg={
                            order.order_status === 'Paid' || order.order_status === 'Completed' || order.order_status === 'Save'
                              ? 'success'
                              : order.order_status === 'KOT'
                              ? 'warning'
                              : order.order_status === 'Cancelled'
                              ? 'danger'
                              : 'secondary'
                          }
                          className="rounded-pill px-3 py-1"
                        >
                          {order.order_status}
                        </Badge>
                      </div>

                      <Row className="mb-3 g-0 border-top pt-2" style={{ borderColor: '#f3f4f6' }}>
                        <Col xs="6">
                          <div className="text-muted small mb-1">Type</div>
                          <Badge
                            bg={
                              order.order_type === 'Dine In'
                                ? 'primary'
                                : order.order_type === 'Takeaway'
                                ? 'warning'
                                : order.order_type === 'Delivery'
                                ? 'success'
                                : 'secondary'
                            }
                            className="rounded-pill px-3 py-1"
                          >
                            {order.order_type}
                          </Badge>
                        </Col>
                        <Col xs="6" className="text-end">
                          <div className="text-muted small">Amount</div>
                          <div className="fw-bolder text-dark" style={{ fontSize: '15px' }}>
                            ₹{parseFloat(order.total_amount).toFixed(2)}
                          </div>
                        </Col>
                      </Row>

                      <div className="d-flex justify-content-between align-items-center">
                        <Badge
                          bg={
                            order.order_source === 'Manager'
                              ? 'info'
                              : order.order_source === 'Captain'
                              ? 'primary'
                              : order.order_source === 'QSR'
                              ? 'secondary'
                              : 'dark'
                          }
                          className="rounded-pill px-3 py-1"
                        >
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
              style={{ backgroundColor: 'rgba(30, 168, 231, 0.1)' }}
            >
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
                  <Form.Label className="fw-bolder mb-3 text-uppercase text-muted" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                    Export Format
                  </Form.Label>
                  <Row className="g-3">
                    <Col xs="12" sm="6">
                      <Card
                        className={`border-2 transition-all cursor-pointer h-100 ${exportFormat === 'excel' ? 'border-primary' : 'border-separator-light'}`}
                        style={{ borderRadius: '1.25rem', backgroundColor: '#fff', transition: 'all 0.3s ease' }}
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
                          <div
                            className={`sw-3 sh-3 rounded-circle border border-2 d-flex align-items-center justify-content-center ${
                              exportFormat === 'excel' ? 'border-primary' : 'border-separator'
                            }`}
                          >
                            {exportFormat === 'excel' && <div className="sw-1 sh-1 rounded-circle bg-primary" />}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs="12" sm="6">
                      <Card
                        className={`border-2 transition-all cursor-pointer h-100 ${exportFormat === 'pdf' ? 'border-primary' : 'border-separator-light'}`}
                        style={{ borderRadius: '1.25rem', backgroundColor: '#fff', transition: 'all 0.3s ease' }}
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
                          <div
                            className={`sw-3 sh-3 rounded-circle border border-2 d-flex align-items-center justify-content-center ${
                              exportFormat === 'pdf' ? 'border-primary' : 'border-separator'
                            }`}
                          >
                            {exportFormat === 'pdf' && <div className="sw-1 sh-1 rounded-circle bg-primary" />}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </div>

                {/* Export Filters */}
                <div className="mb-2">
                  <Form.Label className="fw-bolder mb-3 text-uppercase text-muted" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                    Filter Data
                  </Form.Label>
                  <div className="p-4" style={{ borderRadius: '1.5rem', backgroundColor: '#f8f9fa' }}>
                    <Row className="g-3">
                      {/* Date Range */}
                      <Col xs={12}>
                        <Form.Label className="small fw-bold text-muted mb-2 ms-3">Date Range</Form.Label>
                        <div className="d-flex flex-column flex-sm-row gap-3">
                          <div className="flex-grow-1 position-relative">
                            <Form.Control
                              type={exportFilters.fromDate ? 'date' : 'text'}
                              placeholder="DD/MM/YYYY"
                              onFocus={(e) => {
                                e.target.type = 'date';
                              }}
                              onBlur={(e) => {
                                if (!e.target.value) e.target.type = 'text';
                              }}
                              value={exportFilters.fromDate}
                              onChange={(e) => setExportFilters({ ...exportFilters, fromDate: e.target.value })}
                              className="border-0 shadow-sm rounded-pill px-4 text-dark"
                              style={{ height: '48px', fontSize: '14px', paddingRight: '40px' }}
                            />
                          </div>
                          <div className="flex-grow-1 position-relative">
                            <Form.Control
                              type={exportFilters.toDate ? 'date' : 'text'}
                              placeholder="DD/MM/YYYY"
                              onFocus={(e) => {
                                e.target.type = 'date';
                              }}
                              onBlur={(e) => {
                                if (!e.target.value) e.target.type = 'text';
                              }}
                              value={exportFilters.toDate}
                              onChange={(e) => setExportFilters({ ...exportFilters, toDate: e.target.value })}
                              className="border-0 shadow-sm rounded-pill px-4 text-dark"
                              style={{ height: '48px', fontSize: '14px', paddingRight: '40px' }}
                            />
                          </div>
                        </div>
                      </Col>

                      {/* Status and Type */}
                      <Col xs={12} sm={6}>
                        <Form.Label className="small fw-bold text-muted mb-2 ms-3">Status</Form.Label>
                        <Dropdown className="w-100">
                          <Dropdown.Toggle
                            variant="white"
                            className="w-100 rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-between px-4 no-dropdown-caret"
                            style={{ height: '48px', fontSize: '14px', color: '#1ea8e7' }}
                          >
                            <span>{exportFilters.orderStatus || 'All Status'}</span>
                            <CsLineIcons icon="chevron-right" size="13" />
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="w-100 shadow border-0" style={{ borderRadius: '1rem' }}>
                            <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderStatus: '' })}>All Status</Dropdown.Item>
                            <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderStatus: 'Paid' })}>Paid</Dropdown.Item>
                            <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderStatus: 'Save' })}>Save</Dropdown.Item>
                            <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderStatus: 'KOT' })}>KOT</Dropdown.Item>
                            <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderStatus: 'Cancelled' })}>Cancelled</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </Col>
                      <Col xs={12} sm={6}>
                        <Form.Label className="small fw-bold text-muted mb-2 ms-3">Order Type</Form.Label>
                        <Dropdown className="w-100">
                          <Dropdown.Toggle
                            variant="white"
                            className="w-100 rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-between px-4 no-dropdown-caret"
                            style={{ height: '48px', fontSize: '14px', color: '#1ea8e7' }}
                          >
                            <span>{exportFilters.orderType || 'All Types'}</span>
                            <CsLineIcons icon="chevron-right" size="13" />
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="w-100 shadow border-0" style={{ borderRadius: '1rem' }}>
                            <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderType: '' })}>All Types</Dropdown.Item>
                            <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderType: 'Dine In' })}>Dine In</Dropdown.Item>
                            <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderType: 'Takeaway' })}>Takeaway</Dropdown.Item>
                            <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderType: 'Delivery' })}>Delivery</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </Col>

                      {/* Payment Mode */}
                      <Col xs={12}>
                        <Form.Label className="small fw-bold text-muted mb-2 ms-3">Payment Mode</Form.Label>
                        <Dropdown className="w-100">
                          <Dropdown.Toggle
                            variant="white"
                            className="w-100 rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-between px-4 no-dropdown-caret"
                            style={{ height: '48px', fontSize: '14px', color: '#1ea8e7' }}
                          >
                            <span>{exportFilters.paymentType || 'All Payment Types'}</span>
                            <CsLineIcons icon="chevron-right" size="13" />
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="w-100 shadow border-0" style={{ borderRadius: '1rem' }}>
                            <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, paymentType: '' })}>All Payment Types</Dropdown.Item>
                            <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, paymentType: 'Cash' })}>Cash</Dropdown.Item>
                            <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, paymentType: 'Card' })}>Card</Dropdown.Item>
                            <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, paymentType: 'UPI' })}>UPI</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </Col>
                    </Row>
                  </div>
                </div>

                <div className="mt-4 px-2">
                  <span className="text-primary small" style={{ cursor: 'default' }}>
                    Leave filters empty to export all records.
                  </span>
                </div>
              </Form>
            </>
          ) : (
            <div className="text-center py-5">
              <div className="mb-4">
                <Spinner animation="border" style={{ color: brandColor, width: '3rem', height: '3rem' }} />
              </div>
              <h4 className="fw-bold mb-2">Generating Report</h4>
              <p className="text-muted mb-4">Please wait while we compile your data into {exportFormat === 'excel' ? 'Excel' : 'PDF'}...</p>
              <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                <ProgressBar now={exportProgress} animated style={{ height: '10px', borderRadius: '5px' }} />
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
            style={{ backgroundColor: '#1ea8e7', borderColor: '#1ea8e7', color: '#fff' }}
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
    </>
  );
};

export default OrderHistory;
