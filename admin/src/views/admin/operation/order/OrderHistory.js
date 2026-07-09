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

  // Table areas fetched from DB
  const [tableAreas, setTableAreas] = useState([]);

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

  // Fetch table areas from DB on mount
  useEffect(() => {
    const fetchTableAreas = async () => {
      try {
        const res = await axios.get(`${API_BASE}/table/get-all`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (res.data && res.data.data) {
          const areas = [...new Set(res.data.data.map((item) => item.area).filter(Boolean))];
          setTableAreas(areas);
        }
      } catch (err) {
        console.error('Failed to fetch table areas:', err);
      }
    };
    fetchTableAreas();
  }, [API_BASE]);

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

  const handlePrint = async (orderId) => {
    await openPrintWindow(orderId, setPrinting);
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

      const totalAmount = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const avgOrderValue = totalAmount / orders.length;

      // Combined Single Sheet AOA Data
      const sheetData = [
        ['ORDER HISTORY REPORT'],
        [],
        ['Company:', COMPANY_NAME, '', 'Export Date:', format(new Date(), 'dd MMM yyyy HH:mm')],
        [],
        ['KPI SUMMARY'],
        ['Total Orders', 'Total Revenue', 'Average Order Value'],
        [orders.length, totalAmount, avgOrderValue],
        [],
        ['FILTERS APPLIED'],
      ];

      // Dynamic Filters
      if (exportFilters.fromDate || exportFilters.toDate) {
        sheetData.push([
          'Date Range:',
          `${exportFilters.fromDate ? format(new Date(exportFilters.fromDate), 'dd MMM yyyy') : 'All'} to ${
            exportFilters.toDate ? format(new Date(exportFilters.toDate), 'dd MMM yyyy') : 'All'
          }`,
        ]);
      }
      if (exportFilters.orderSource) sheetData.push(['Order Source:', exportFilters.orderSource]);
      if (exportFilters.orderStatus) sheetData.push(['Order Status:', exportFilters.orderStatus]);
      if (exportFilters.orderType) sheetData.push(['Order Type:', exportFilters.orderType]);
      if (exportFilters.paymentType) sheetData.push(['Payment Type:', exportFilters.paymentType]);

      // Spacer before Main Table
      sheetData.push([]);
      sheetData.push([]);

      // Main Table Header
      const tableHeaderRowIndex = sheetData.length;
      sheetData.push(['Order No', 'Date & Time', 'Customer', 'Type', 'Table Area', 'Source', 'Payment Mode', 'Total Amount', 'Status']);

      // Main Table Rows
      orders.forEach((order) => {
        const orderDate = new Date(order.order_date);
        const tableDetails = order.table_area ? `${order.table_area}${order.table_no ? ` - T${order.table_no}` : ''}` : (order.table_no ? `T${order.table_no}` : (order.token ? `Token ${order.token}` : 'N/A'));
        sheetData.push([
          order.order_no || order._id || '',
          format(orderDate, 'dd-MM-yyyy HH:mm'),
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

      // Set column widths to accommodate all columns beautifully
      sheet['!cols'] = [
        { wch: 20 }, // Order No / KPI Label 1
        { wch: 18 }, // Date & Time / KPI Label 2
        { wch: 20 }, // Customer / KPI Label 3
        { wch: 12 }, // Type
        { wch: 18 }, // Table Area
        { wch: 12 }, // Source
        { wch: 15 }, // Payment Mode
        { wch: 15 }, // Total Amount
        { wch: 12 }  // Status
      ];

      // Format KPI Summary cells (Row 7, index 6)
      if (sheet.A7) {
        sheet.A7.t = 'n';
        sheet.A7.z = '#,##0';
      }
      if (sheet.B7) {
        sheet.B7.t = 'n';
        sheet.B7.z = '"Rs. "#,##0.00';
      }
      if (sheet.C7) {
        sheet.C7.t = 'n';
        sheet.C7.z = '"Rs. "#,##0.00';
      }

      // Format Main Table Total Amount column (Column H is index 7)
      const range = XLSX.utils.decode_range(sheet['!ref']);
      const startTableDataRow = tableHeaderRowIndex + 1;
      for (let R = startTableDataRow; R <= range.e.r; R += 1) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: 7 }); // Column H
        if (sheet[cellAddress] && typeof sheet[cellAddress].v === 'number') {
          sheet[cellAddress].z = '"Rs. "#,##0.00';
          sheet[cellAddress].t = 'n';
        }
      }

      // Enable auto-filter for the table header down to the last row
      sheet['!autofilter'] = { ref: `A${tableHeaderRowIndex + 1}:I${range.e.r + 1}` };

      XLSX.utils.book_append_sheet(wb, sheet, 'Order History');

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

      const doc = new jsPDF('portrait', 'mm', 'a4');
      const docWidth = doc.internal.pageSize.getWidth(); // 210
      const docHeight = doc.internal.pageSize.getHeight(); // 297

      let yPosition = 0;

      // 1. BRAND BORDER ACCENT
      doc.setFillColor(35, 179, 244); // Brand Cyan
      doc.rect(0, 0, docWidth, 4, 'F');
      yPosition += 4;

      // 2. HEADER BANNER
      doc.setFillColor(31, 41, 55); // Premium Charcoal dark grey
      doc.rect(0, yPosition, docWidth, 38, 'F');
      
      // Brand Logo Text / Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('THE BOX', 15, yPosition + 15);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(156, 163, 175); // Lighter muted grey
      doc.text('PREMIUM ORDER MANAGEMENT SYSTEM', 15, yPosition + 20);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(35, 179, 244); // Accent color for document title
      doc.text('ORDER HISTORY REPORT', 15, yPosition + 29);

      // Header Metadata (Right Aligned)
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('REPORT GENERATED', docWidth - 15, yPosition + 12, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(209, 213, 219);
      doc.text(format(new Date(), 'dd MMM yyyy HH:mm'), docWidth - 15, yPosition + 17, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('BUSINESS NAME', docWidth - 15, yPosition + 25, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(209, 213, 219);
      doc.text(COMPANY_NAME, docWidth - 15, yPosition + 30, { align: 'right' });

      yPosition += 38; // Now at 42

      // 3. STATS CARDS SECTION
      yPosition += 10; // 52
      
      const totalAmount = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const avgOrderValue = totalAmount / orders.length;

      // Draw three nice KPI cards side-by-side
      const cardWidth = 56;
      const cardHeight = 22;
      const cardGap = 6;
      const startX = 15;

      const formatCurrencyForCard = (amount) => {
        const val = new Intl.NumberFormat('en-IN', {
          maximumFractionDigits: 0,
        }).format(amount || 0);
        return `Rs. ${val}`;
      };

      const kpiCards = [
        { title: 'TOTAL ORDERS', value: orders.length.toString(), color: [35, 179, 244] },
        { title: 'TOTAL REVENUE', value: formatCurrencyForCard(totalAmount), color: [16, 185, 129] }, // Green
        { title: 'AVG ORDER VALUE', value: formatCurrencyForCard(avgOrderValue), color: [245, 158, 11] } // Orange
      ];

      kpiCards.forEach((card, idx) => {
        const xPos = startX + idx * (cardWidth + cardGap);
        
        // Card Background
        doc.setFillColor(248, 250, 252); // extremely soft slate grey/white
        doc.roundedRect(xPos, yPosition, cardWidth, cardHeight, 3, 3, 'F');

        // Left Highlight bar in card
        doc.setFillColor(card.color[0], card.color[1], card.color[2]);
        doc.rect(xPos, yPosition, 1.5, cardHeight, 'F');

        // Card Text
        doc.setTextColor(100, 116, 139); // Slate 500
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(card.title, xPos + 5, yPosition + 7);

        doc.setTextColor(15, 23, 42); // Slate 900
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(card.value, xPos + 5, yPosition + 15);
      });

      yPosition += cardHeight + 8; // Now at 82

      // 4. FILTERS SECTION
      const activeFilters = [];
      if (exportFilters.fromDate || exportFilters.toDate) {
        activeFilters.push({ label: 'Date Period', val: `${exportFilters.fromDate ? format(new Date(exportFilters.fromDate), 'dd MMM yyyy') : 'All'} to ${exportFilters.toDate ? format(new Date(exportFilters.toDate), 'dd MMM yyyy') : 'All'}` });
      }
      if (exportFilters.orderSource) activeFilters.push({ label: 'Source', val: exportFilters.orderSource });
      if (exportFilters.orderStatus) activeFilters.push({ label: 'Status', val: exportFilters.orderStatus });
      if (exportFilters.orderType) activeFilters.push({ label: 'Type', val: exportFilters.orderType });
      if (exportFilters.paymentType) activeFilters.push({ label: 'Payment', val: exportFilters.paymentType });

      if (activeFilters.length > 0) {
        doc.setFillColor(243, 244, 246); // Light gray
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
          doc.text(`${filt.label}: `, xFilt, yFilt, { align: 'left' });
          doc.setFont('helvetica', 'bold');
          doc.text(filt.val, xFilt + doc.getTextWidth(`${filt.label}: `), yFilt);
          doc.setFont('helvetica', 'normal');
        });

        yPosition += 12 + Math.ceil(activeFilters.length / 2) * 5 + 6;
      } else {
        yPosition += 2;
      }

      // 5. ORDERS TABLE TITLE
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
          const tableDetails = order.table_area ? `${order.table_area}${order.table_no ? ` - T${order.table_no}` : ''}` : (order.table_no ? `T${order.table_no}` : (order.token ? `Token ${order.token}` : 'N/A'));
          return [
            order.order_no || (order._id || '').substring(18),
            format(orderDate, 'dd-MM-yy HH:mm'),
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
        headStyles: {
          fillColor: [31, 41, 55], // Deep charcoal headers
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 2.5,
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 2,
          textColor: [55, 65, 81],
        },
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
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        margin: { left: 10, right: 10 },
        didDrawPage: (pageData) => {
          const totalPagesCount = doc.internal.getNumberOfPages();
          doc.setPage(pageData.pageNumber);
          
          doc.setDrawColor(229, 231, 235);
          doc.line(10, docHeight - 15, docWidth - 10, docHeight - 15);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(156, 163, 175);
          doc.text(`${COMPANY_NAME}   |   Order History Report   |   Page ${pageData.pageNumber} of ${totalPagesCount}`, docWidth / 2, docHeight - 9, { align: 'center' });
        }
      });

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

  const handleExportConfirm = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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
        <div className="page-title-container mt-5 pt-1 mt-md-0 pt-md-0">
          <Row>
            <Col xs="12" md="7">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>
                {title}
              </h1>
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

      <div className="page-title-container mb-4 mt-5 pt-1 mt-md-0 pt-md-0">
        <Row className="g-0 align-items-center">
          <Col xs="auto" className="me-auto">
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>
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

      {/* Filter Section */}

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
                  <Button variant="link" className="p-0 text-danger text-decoration-none small fw-bold" onClick={handleClearFilters}>
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
                  <Col xs="12" sm="6" md="2">
                    <Form.Label className="small fw-bold text-muted mb-1">From</Form.Label>
                    <div
                      className="d-flex align-items-center bg-white shadow-sm rounded-pill px-3"
                      style={{ height: '44px', border: '1px solid #f1f5f9', minWidth: 0, overflow: 'hidden' }}
                    >
                      <CsLineIcons icon="calendar" size="14" className="text-primary me-2 flex-shrink-0" />
                      <Form.Control
                        type="date"
                        value={filters.fromDate}
                        onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                        className="border-0 bg-transparent shadow-none p-0 w-100"
                        style={{ fontSize: '13px', outline: 'none', minWidth: 0 }}
                      />
                    </div>
                  </Col>
                  <Col xs="12" sm="6" md="2">
                    <Form.Label className="small fw-bold text-muted mb-1">To</Form.Label>
                    <div
                      className="d-flex align-items-center bg-white shadow-sm rounded-pill px-3"
                      style={{ height: '44px', border: '1px solid #f1f5f9', minWidth: 0, overflow: 'hidden' }}
                    >
                      <CsLineIcons icon="calendar" size="14" className="text-primary me-2 flex-shrink-0" />
                      <Form.Control
                        type="date"
                        value={filters.toDate}
                        onChange={(e) => handleFilterChange('toDate', e.target.value)}
                        className="border-0 bg-transparent shadow-none p-0 w-100"
                        style={{ fontSize: '13px', outline: 'none', minWidth: 0 }}
                      />
                    </div>
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

                  {/* Table Area Filter */}
                  {tableAreas.length > 0 && (
                    <Col xs="12" sm="6" md="3">
                      <Form.Label className="small fw-bold text-muted mb-1">Table Area</Form.Label>
                      <Dropdown className="w-100">
                        <Dropdown.Toggle
                          variant="white"
                          className="w-100 rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-between px-3"
                          style={{ height: '44px', fontSize: '14px' }}
                        >
                          {filters.tableArea || 'All Areas'}
                        </Dropdown.Toggle>
                        <Dropdown.Menu
                          className="w-100 shadow-lg border-0 animate__animated animate__fadeIn"
                          style={{ borderRadius: '1.25rem', padding: '0.75rem', marginTop: '8px', maxHeight: '350px', overflowY: 'auto' }}
                        >
                          <Dropdown.Item active={filters.tableArea === ''} onClick={() => handleFilterChange('tableArea', '')}>All Areas</Dropdown.Item>
                          {tableAreas.map((area) => (
                            <Dropdown.Item key={area} active={filters.tableArea === area} onClick={() => handleFilterChange('tableArea', area)}>
                              {area}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </Col>
                  )}
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
            style={{ borderRadius: '1rem', backgroundColor: 'rgba(30, 168, 231, 0.05)', color: '#1ea8e7' }}
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
                          background: 'rgba(30, 168, 231, 0.1)',
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
                          bg={order.order_status === 'Paid' || order.order_status === 'Completed' || order.order_status === 'Save' ? 'success' : order.order_status === 'KOT' ? 'warning' : order.order_status === 'Cancelled' ? 'danger' : 'secondary'}
                          className="rounded-pill px-3 py-1"
                        >
                          {order.order_status}
                        </Badge>
                      </div>

                      <Row className="mb-3 g-0 border-top pt-2" style={{ borderColor: '#f3f4f6' }}>
                        <Col xs="6">
                          <div className="text-muted small mb-1">Type</div>
                          <Badge bg={order.order_type === 'Dine In' ? 'primary' : order.order_type === 'Takeaway' ? 'warning' : order.order_type === 'Delivery' ? 'success' : 'secondary'} className="rounded-pill px-3 py-1">
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

              <Form onSubmit={(e) => e.preventDefault()}>
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
                          <Form.Check type="radio" className="ms-2" checked={exportFormat === 'excel'} onChange={() => {}} />
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
                          <Form.Check type="radio" className="ms-2" checked={exportFormat === 'pdf'} onChange={() => {}} />
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
                        <div 
                          className="d-flex align-items-center flex-grow-1 bg-white shadow-sm rounded-pill px-3" 
                          style={{ height: '44px', border: '1px solid #f1f5f9' }}
                        >
                          <CsLineIcons icon="calendar" size="16" className="text-primary me-2" />
                          <Form.Control
                            type="date"
                            value={exportFilters.fromDate}
                            onChange={(e) => setExportFilters({ ...exportFilters, fromDate: e.target.value })}
                            className="border-0 bg-transparent shadow-none p-0 w-100"
                            style={{ fontSize: '14px', outline: 'none' }}
                          />
                        </div>
                        <div 
                          className="d-flex align-items-center flex-grow-1 bg-white shadow-sm rounded-pill px-3" 
                          style={{ height: '44px', border: '1px solid #f1f5f9' }}
                        >
                          <CsLineIcons icon="calendar" size="16" className="text-primary me-2" />
                          <Form.Control
                            type="date"
                            value={exportFilters.toDate}
                            onChange={(e) => setExportFilters({ ...exportFilters, toDate: e.target.value })}
                            className="border-0 bg-transparent shadow-none p-0 w-100"
                            style={{ fontSize: '14px', outline: 'none' }}
                          />
                        </div>
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
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderSource: 'Restaurant Website' })}>
                            Restaurant Website
                          </Dropdown.Item>
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
                      <Dropdown className="w-100">
                        <Dropdown.Toggle
                          variant="white"
                          className="w-100 rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-between px-4"
                          style={{ height: '44px', fontSize: '14px' }}
                        >
                          {exportFilters.tableArea || 'All Areas'}
                        </Dropdown.Toggle>
                        <Dropdown.Menu
                          className="w-100 shadow-lg border-0 animate__animated animate__fadeIn"
                          style={{ borderRadius: '1rem', maxHeight: '250px', overflowY: 'auto' }}
                        >
                          <Dropdown.Item active={exportFilters.tableArea === ''} onClick={() => setExportFilters({ ...exportFilters, tableArea: '' })}>All Areas</Dropdown.Item>
                          {tableAreas.length > 0 ? (
                            tableAreas.map((area) => (
                              <Dropdown.Item key={area} active={exportFilters.tableArea === area} onClick={() => setExportFilters({ ...exportFilters, tableArea: area })}>
                                {area}
                              </Dropdown.Item>
                            ))
                          ) : (
                            <Dropdown.Item disabled className="text-muted">No areas configured</Dropdown.Item>
                          )}
                        </Dropdown.Menu>
                      </Dropdown>
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
          <Button type="button" variant="light" onClick={() => setShowExportModal(false)} disabled={exporting} className="rounded-pill px-4">
            Close
          </Button>
          <Button
            type="button"
            onClick={handleExportConfirm}
            disabled={exporting}
            className="px-4 py-2 rounded-pill d-flex align-items-center manage-table-custom-btn-outline"
          >
            {exporting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Generating...
              </>
            ) : (
              <>
                <CsLineIcons icon="download" className="me-2" size="18" stroke="currentColor" />
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
