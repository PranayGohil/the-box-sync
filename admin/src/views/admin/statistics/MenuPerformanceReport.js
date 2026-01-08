import React, { useState, useEffect, useContext } from 'react';
import { Button, Row, Col, Card, Table, Form, Spinner, Alert, Badge, ProgressBar, Modal, Toast, ToastContainer } from 'react-bootstrap';
import axios from 'axios';
import { format } from 'date-fns';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthContext } from 'contexts/AuthContext';

const MenuPerformanceReport = () => {
  const title = 'Menu Performance Report';
  const description = 'Comprehensive Menu and Dish Performance Analysis';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboards', text: 'Dashboards' },
    { to: 'statistics', text: 'Statistics' },
    { to: 'reports/menu', text: 'Menu Performance' },
  ];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  const { currentUser } = useContext(AuthContext);

  // Export states
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Export options modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeSummary: true,
    includeAllDishes: true,
    dishesLimit: 'all',
    includeCategoryPerformance: true,
    includeMealTypePerformance: true,
    includePerformanceDistribution: true,
    includeCharts: true,
  });

  const [startDate, setStartDate] = useState(format(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMealType, setSelectedMealType] = useState('all');

  const API_BASE = process.env.REACT_APP_API;
  const COMPANY_NAME = `${currentUser?.name || 'TheBox'}`;

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

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

  const fetchMenuReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        period: 'custom',
        start_date: startDate,
        end_date: endDate,
      };

      const response = await axios.get(`${API_BASE}/statistics/menu/report`, {
        ...getHeaders(),
        params,
      });

      setReportData(response.data);
    } catch (err) {
      console.error('Error fetching menu report:', err);
      setError(err.response?.data?.error || 'Failed to load menu report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuReport();
  }, []);

  // Show toast notification
  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Filter dishes based on selected category and meal type
  const getFilteredDishes = () => {
    if (!reportData) return [];

    return reportData.dishPerformance.filter((dish) => {
      const categoryMatch = selectedCategory === 'all' || dish.category === selectedCategory;
      const mealTypeMatch = selectedMealType === 'all' || dish.mealType === selectedMealType;
      return categoryMatch && mealTypeMatch;
    });
  };

  const filteredDishes = getFilteredDishes();

  // Get unique categories and meal types for filters
  const categories = reportData ? ['all', ...new Set(reportData.dishPerformance.map((d) => d.category).filter(Boolean))] : ['all'];
  const mealTypes = reportData ? ['all', ...new Set(reportData.dishPerformance.map((d) => d.mealType).filter(Boolean))] : ['all'];

  // Calculate performance metrics
  const getPerformanceLevel = (dish) => {
    if (!reportData) return 'average';
    const avgRevenue = reportData.summary.totalRevenue / reportData.summary.totalDishes;
    if (dish.totalRevenue >= avgRevenue * 1.5) return 'excellent';
    if (dish.totalRevenue >= avgRevenue * 0.7) return 'good';
    return 'poor';
  };

  // Enhanced Excel Export
  const exportToExcel = async () => {
    if (!reportData) return;

    setExporting(true);
    setExportProgress(10);
    setExportType('Excel');

    try {
      const wb = XLSX.utils.book_new();

      // Dashboard Sheet
      if (exportOptions.includeSummary) {
        setExportProgress(15);

        const topPerformers = reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'excellent').length;
        const avgPerformers = reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'good').length;
        const lowPerformers = reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'poor').length;

        const dashboardData = [
          ['MENU PERFORMANCE DASHBOARD'],
          [],
          ['Company:', COMPANY_NAME],
          ['Report Period:', `${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`],
          ['Generated On:', format(new Date(), 'dd MMM yyyy HH:mm')],
          [],
          ['MENU SUMMARY'],
          ['Metric', 'Value'],
          ['Total Dishes', reportData.summary.totalDishes],
          ['Total Revenue', reportData.summary.totalRevenue],
          ['Total Categories', reportData.summary.totalCategories],
          ['Avg Revenue per Dish', reportData.summary.totalRevenue / reportData.summary.totalDishes],
          [],
          ['PERFORMANCE DISTRIBUTION'],
          ['Category', 'Count', 'Percentage'],
          ['Top Performers (🔥)', topPerformers, `${((topPerformers / reportData.summary.totalDishes) * 100).toFixed(1)}%`],
          ['Average Performers (👍)', avgPerformers, `${((avgPerformers / reportData.summary.totalDishes) * 100).toFixed(1)}%`],
          ['Low Performers (📉)', lowPerformers, `${((lowPerformers / reportData.summary.totalDishes) * 100).toFixed(1)}%`],
          [],
          ['TOP 3 DISHES'],
          ['Rank', 'Dish Name', 'Revenue'],
        ];

        reportData.dishPerformance.slice(0, 3).forEach((dish, idx) => {
          dashboardData.push([idx + 1, dish.dishName, dish.totalRevenue]);
        });

        const dashboardSheet = XLSX.utils.aoa_to_sheet(dashboardData);

        // Set column widths
        dashboardSheet['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 20 }];

        // Apply currency formatting
        dashboardSheet.B10.z = '"Rs. "#,##0';
        dashboardSheet.B12.z = '"Rs. "#,##0';

        XLSX.utils.book_append_sheet(wb, dashboardSheet, 'Dashboard');
      }

      // All Dishes Performance
      if (exportOptions.includeAllDishes) {
        setExportProgress(35);

        const dishLimit =
          exportOptions.dishesLimit === 'all'
            ? reportData.dishPerformance.length
            : exportOptions.dishesLimit === '50'
            ? 50
            : exportOptions.dishesLimit === '100'
            ? 100
            : 20;

        const dishesData = [
          ['ALL DISHES PERFORMANCE ANALYSIS'],
          [],
          ['Rank', 'Dish Name', 'Category', 'Meal Type', 'Special', 'Quantity', 'Revenue', 'Orders', 'Avg Price', 'Revenue/Item', 'Performance'],
        ];

        reportData.dishPerformance.slice(0, dishLimit).forEach((dish, idx) => {
          const performance = getPerformanceLevel(dish);
          const performanceLabel = performance === 'excellent' ? 'Top Seller' : performance === 'good' ? 'Good' : 'Low';

          dishesData.push([
            idx + 1,
            dish.dishName,
            dish.category || 'N/A',
            dish.mealType || 'N/A',
            dish.isSpecial ? 'Yes' : 'No',
            dish.totalQuantity,
            dish.totalRevenue,
            dish.orderCount,
            dish.avgPrice,
            dish.revenuePerItem,
            performanceLabel,
          ]);
        });

        const dishesSheet = XLSX.utils.aoa_to_sheet(dishesData);

        // Set column widths
        dishesSheet['!cols'] = [
          { wch: 8 },
          { wch: 35 },
          { wch: 15 },
          { wch: 12 },
          { wch: 10 },
          { wch: 10 },
          { wch: 15 },
          { wch: 10 },
          { wch: 12 },
          { wch: 15 },
          { wch: 15 },
        ];

        // Apply currency formatting
        const range = XLSX.utils.decode_range(dishesSheet['!ref']);
        for (let R = 3; R <= range.e.r; R += 1) {
          const revenueCell = XLSX.utils.encode_cell({ r: R, c: 6 });
          const avgPriceCell = XLSX.utils.encode_cell({ r: R, c: 8 });
          const revPerItemCell = XLSX.utils.encode_cell({ r: R, c: 9 });

          if (dishesSheet[revenueCell]) dishesSheet[revenueCell].z = '"Rs. "#,##0';
          if (dishesSheet[avgPriceCell]) dishesSheet[avgPriceCell].z = '"Rs. "#,##0';
          if (dishesSheet[revPerItemCell]) dishesSheet[revPerItemCell].z = '"Rs. "#,##0';
        }

        // Enable auto-filter
        dishesSheet['!autofilter'] = { ref: `A3:K${range.e.r + 1}` };

        XLSX.utils.book_append_sheet(wb, dishesSheet, 'All Dishes');
      }

      // Category Performance
      if (exportOptions.includeCategoryPerformance) {
        setExportProgress(55);

        const categoryData = [
          ['CATEGORY PERFORMANCE ANALYSIS'],
          [],
          ['Category', 'Quantity Sold', 'Revenue', 'Orders', 'Unique Dishes', 'Avg Revenue/Dish', '% of Total Revenue'],
        ];

        reportData.categoryPerformance.forEach((cat) => {
          const percentOfTotal = ((cat.totalRevenue / reportData.summary.totalRevenue) * 100).toFixed(2);

          categoryData.push([
            cat.category,
            cat.totalQuantity,
            cat.totalRevenue,
            cat.orderCount,
            cat.uniqueDishCount,
            cat.avgRevenuePerDish,
            `${percentOfTotal}%`,
          ]);
        });

        const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);

        // Set column widths
        categorySheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 18 }, { wch: 18 }];

        // Apply currency formatting
        const range = XLSX.utils.decode_range(categorySheet['!ref']);
        for (let R = 3; R <= range.e.r; R += 1) {
          const revenueCell = XLSX.utils.encode_cell({ r: R, c: 2 });
          const avgRevCell = XLSX.utils.encode_cell({ r: R, c: 5 });

          if (categorySheet[revenueCell]) categorySheet[revenueCell].z = '"Rs. "#,##0';
          if (categorySheet[avgRevCell]) categorySheet[avgRevCell].z = '"Rs. "#,##0';
        }

        XLSX.utils.book_append_sheet(wb, categorySheet, 'Category Performance');
      }

      // Meal Type Performance
      if (exportOptions.includeMealTypePerformance) {
        setExportProgress(70);

        const mealTypeData = [['MEAL TYPE PERFORMANCE'], [], ['Meal Type', 'Quantity Sold', 'Revenue', 'Orders', '% of Total Revenue', 'Avg Order Value']];

        reportData.mealTypePerformance.forEach((meal) => {
          const percentOfTotal = ((meal.totalRevenue / reportData.summary.totalRevenue) * 100).toFixed(2);
          const avgOrderValue = meal.orderCount > 0 ? meal.totalRevenue / meal.orderCount : 0;

          mealTypeData.push([meal.mealType || 'Not Specified', meal.totalQuantity, meal.totalRevenue, meal.orderCount, `${percentOfTotal}%`, avgOrderValue]);
        });

        const mealTypeSheet = XLSX.utils.aoa_to_sheet(mealTypeData);

        // Set column widths
        mealTypeSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 18 }, { wch: 18 }];

        // Apply currency formatting
        const range = XLSX.utils.decode_range(mealTypeSheet['!ref']);
        for (let R = 3; R <= range.e.r; R += 1) {
          const revenueCell = XLSX.utils.encode_cell({ r: R, c: 2 });
          const avgCell = XLSX.utils.encode_cell({ r: R, c: 5 });

          if (mealTypeSheet[revenueCell]) mealTypeSheet[revenueCell].z = '"Rs. "#,##0';
          if (mealTypeSheet[avgCell]) mealTypeSheet[avgCell].z = '"Rs. "#,##0';
        }

        XLSX.utils.book_append_sheet(wb, mealTypeSheet, 'Meal Type Performance');
      }

      // Performance Distribution
      if (exportOptions.includePerformanceDistribution) {
        setExportProgress(85);

        const topPerformers = reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'excellent');
        const avgPerformers = reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'good');
        const lowPerformers = reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'poor');

        const performanceData = [['PERFORMANCE DISTRIBUTION DETAILS'], [], ['Performance Level', 'Count', 'Percentage', 'Total Revenue', 'Avg Revenue/Dish']];

        const perfGroups = [
          { label: 'Top Performers', dishes: topPerformers },
          { label: 'Average Performers', dishes: avgPerformers },
          { label: 'Low Performers', dishes: lowPerformers },
        ];

        perfGroups.forEach((group) => {
          const totalRev = group.dishes.reduce((sum, d) => sum + d.totalRevenue, 0);
          const avgRev = group.dishes.length > 0 ? totalRev / group.dishes.length : 0;
          const percent = ((group.dishes.length / reportData.summary.totalDishes) * 100).toFixed(1);

          performanceData.push([group.label, group.dishes.length, `${percent}%`, totalRev, avgRev]);
        });

        const performanceSheet = XLSX.utils.aoa_to_sheet(performanceData);

        // Set column widths
        performanceSheet['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 18 }, { wch: 20 }];

        // Apply currency formatting
        const range = XLSX.utils.decode_range(performanceSheet['!ref']);
        for (let R = 3; R <= range.e.r; R += 1) {
          const totalRevCell = XLSX.utils.encode_cell({ r: R, c: 3 });
          const avgRevCell = XLSX.utils.encode_cell({ r: R, c: 4 });

          if (performanceSheet[totalRevCell]) performanceSheet[totalRevCell].z = '"Rs. "#,##0';
          if (performanceSheet[avgRevCell]) performanceSheet[avgRevCell].z = '"Rs. "#,##0';
        }

        XLSX.utils.book_append_sheet(wb, performanceSheet, 'Performance Distribution');
      }

      setExportProgress(95);

      // Write file
      XLSX.writeFile(wb, `Menu_Performance_Report_${startDate}_to_${endDate}.xlsx`);

      setExportProgress(100);
      showSuccessToast('Excel report exported successfully!');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      showSuccessToast('Error exporting Excel file');
    } finally {
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
        setExportType('');
      }, 500);
    }
  };

  // Enhanced PDF Export
  const exportToPDF = async () => {
    if (!reportData) return;

    setExporting(true);
    setExportProgress(10);
    setExportType('PDF');

    try {
      const doc = new jsPDF('landscape');
      let yPosition = 20;

      // Executive Summary Page (Cover Page)
      setExportProgress(15);

      // Header with company branding
      doc.setFillColor(68, 114, 196);
      doc.rect(0, 0, 297, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('MENU PERFORMANCE REPORT', 148.5, 20, { align: 'center' });

      doc.setFontSize(14);
      doc.setFont(undefined, 'normal');
      doc.text(COMPANY_NAME, 148.5, 30, { align: 'center' });

      yPosition = 50;
      doc.setTextColor(0, 0, 0);

      // Report Information
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Report Period:', 20, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(`${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`, 70, yPosition);

      yPosition += 8;
      doc.setFont(undefined, 'bold');
      doc.text('Generated:', 20, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(format(new Date(), 'dd MMM yyyy HH:mm'), 70, yPosition);

      yPosition += 15;

      // Key Metrics Summary
      if (exportOptions.includeSummary) {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Executive Summary', 20, yPosition);
        yPosition += 12;

        // Create summary boxes
        const metrics = [
          { label: 'Total Dishes', value: reportData.summary.totalDishes.toString(), color: [68, 114, 196] },
          { label: 'Total Revenue', value: formatCurrencyPDF(reportData.summary.totalRevenue), color: [76, 175, 80] },
          { label: 'Categories', value: reportData.summary.totalCategories.toString(), color: [255, 152, 0] },
          { label: 'Avg Rev/Dish', value: formatCurrencyPDF(reportData.summary.totalRevenue / reportData.summary.totalDishes), color: [156, 39, 176] },
        ];

        metrics.forEach((metric, idx) => {
          const xPos = 20 + idx * 65;

          // Draw colored box
          doc.setFillColor(...metric.color);
          doc.roundedRect(xPos, yPosition, 60, 25, 3, 3, 'F');

          // Label
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          doc.text(metric.label, xPos + 30, yPosition + 9, { align: 'center' });

          // Value
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text(metric.value, xPos + 30, yPosition + 19, { align: 'center' });
        });

        yPosition += 40;
        doc.setTextColor(0, 0, 0);

        // Performance Distribution
        if (exportOptions.includeCharts) {
          const topPerformers = reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'excellent').length;
          const avgPerformers = reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'good').length;
          const lowPerformers = reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'poor').length;

          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text('Performance Distribution:', 20, yPosition);
          yPosition += 8;

          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');

          const perfInsights = [
            `• Top Performers: ${topPerformers} dishes (${((topPerformers / reportData.summary.totalDishes) * 100).toFixed(
              1
            )}%) - Excellent revenue generation`,
            `• Average Performers: ${avgPerformers} dishes (${((avgPerformers / reportData.summary.totalDishes) * 100).toFixed(1)}%) - Meeting expectations`,
            `• Low Performers: ${lowPerformers} dishes (${((lowPerformers / reportData.summary.totalDishes) * 100).toFixed(1)}%) - Need attention or removal`,
          ];

          perfInsights.forEach((insight) => {
            doc.text(insight, 20, yPosition);
            yPosition += 7;
          });

          yPosition += 5;

          // Top 3 Dishes
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text('Top 3 Best Selling Dishes:', 20, yPosition);
          yPosition += 8;

          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');

          reportData.dishPerformance.slice(0, 3).forEach((dish, idx) => {
            doc.text(`${idx + 1}. ${dish.dishName} - ${formatCurrencyPDF(dish.totalRevenue)} (${dish.totalQuantity} units)`, 25, yPosition);
            yPosition += 6;
          });
        }

        // Add new page for detailed data
        doc.addPage();
        yPosition = 20;
      }

      // Top Dishes Table
      if (exportOptions.includeAllDishes) {
        setExportProgress(40);

        const dishLimit =
          exportOptions.dishesLimit === 'all'
            ? 50 // Max 50 for PDF
            : exportOptions.dishesLimit === '100'
            ? 50
            : exportOptions.dishesLimit === '50'
            ? 50
            : 20;

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`Top ${Math.min(dishLimit, 50)} Dishes by Revenue`, 20, yPosition);
        yPosition += 8;

        autoTable(doc, {
          startY: yPosition,
          head: [['Rank', 'Dish', 'Category', 'Qty', 'Revenue', 'Orders', 'Performance']],
          body: reportData.dishPerformance.slice(0, Math.min(dishLimit, 50)).map((dish, idx) => {
            const performance = getPerformanceLevel(dish);
            const perfLabel = performance === 'excellent' ? '🔥 Top' : performance === 'good' ? '👍 Good' : '📉 Low';

            return [
              (idx + 1).toString(),
              dish.dishName.substring(0, 35),
              (dish.category || 'N/A').substring(0, 15),
              dish.totalQuantity.toString(),
              formatCurrencyPDF(dish.totalRevenue),
              dish.orderCount.toString(),
              perfLabel,
            ];
          }),
          theme: 'grid',
          headStyles: {
            fillColor: [68, 114, 196],
            fontSize: 9,
            fontStyle: 'bold',
          },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { cellWidth: 80 },
            2: { cellWidth: 35 },
            3: { halign: 'center', cellWidth: 20 },
            4: { halign: 'right', cellWidth: 35 },
            5: { halign: 'center', cellWidth: 20 },
            6: { halign: 'center', cellWidth: 30 },
          },
          // Highlight top 10
          didParseCell(data) {
            if (data.row.index < 10 && data.section === 'body') {
              data.cell.styles.fillColor = [255, 243, 205];
            }
          },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Category Performance
      if (exportOptions.includeCategoryPerformance) {
        setExportProgress(60);

        if (yPosition > 150) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Category Performance Analysis', 20, yPosition);
        yPosition += 8;

        autoTable(doc, {
          startY: yPosition,
          head: [['Category', 'Dishes', 'Quantity', 'Revenue', 'Orders', '% of Total']],
          body: reportData.categoryPerformance.map((cat) => {
            const percentOfTotal = ((cat.totalRevenue / reportData.summary.totalRevenue) * 100).toFixed(1);

            return [
              cat.category,
              cat.uniqueDishCount.toString(),
              cat.totalQuantity.toString(),
              formatCurrencyPDF(cat.totalRevenue),
              cat.orderCount.toString(),
              `${percentOfTotal}%`,
            ];
          }),
          theme: 'striped',
          headStyles: {
            fillColor: [68, 114, 196],
            fontSize: 10,
            fontStyle: 'bold',
          },
          styles: { fontSize: 9 },
          columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'center' },
            5: { halign: 'center' },
          },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Meal Type Performance
      if (exportOptions.includeMealTypePerformance) {
        setExportProgress(75);

        if (yPosition > 150) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Meal Type Performance', 20, yPosition);
        yPosition += 8;

        autoTable(doc, {
          startY: yPosition,
          head: [['Meal Type', 'Quantity', 'Revenue', 'Orders', '% of Total']],
          body: reportData.mealTypePerformance.map((meal) => {
            const percentOfTotal = ((meal.totalRevenue / reportData.summary.totalRevenue) * 100).toFixed(1);

            return [
              meal.mealType || 'Not Specified',
              meal.totalQuantity.toString(),
              formatCurrencyPDF(meal.totalRevenue),
              meal.orderCount.toString(),
              `${percentOfTotal}%`,
            ];
          }),
          theme: 'grid',
          headStyles: {
            fillColor: [68, 114, 196],
            fontSize: 10,
            fontStyle: 'bold',
          },
          styles: { fontSize: 9 },
          columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'center' },
            4: { halign: 'center' },
          },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Performance Distribution Summary
      if (exportOptions.includePerformanceDistribution) {
        setExportProgress(85);

        if (yPosition > 150) {
          doc.addPage();
          yPosition = 20;
        }

        const topPerformers = reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'excellent');
        const avgPerformers = reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'good');
        const lowPerformers = reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'poor');

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Performance Distribution Summary', 20, yPosition);
        yPosition += 8;

        autoTable(doc, {
          startY: yPosition,
          head: [['Performance Level', 'Count', 'Percentage', 'Total Revenue']],
          body: [
            [
              '🔥 Top Performers',
              topPerformers.length.toString(),
              `${((topPerformers.length / reportData.summary.totalDishes) * 100).toFixed(1)}%`,
              formatCurrencyPDF(topPerformers.reduce((sum, d) => sum + d.totalRevenue, 0)),
            ],
            [
              '👍 Average Performers',
              avgPerformers.length.toString(),
              `${((avgPerformers.length / reportData.summary.totalDishes) * 100).toFixed(1)}%`,
              formatCurrencyPDF(avgPerformers.reduce((sum, d) => sum + d.totalRevenue, 0)),
            ],
            [
              '📉 Low Performers',
              lowPerformers.length.toString(),
              `${((lowPerformers.length / reportData.summary.totalDishes) * 100).toFixed(1)}%`,
              formatCurrencyPDF(lowPerformers.reduce((sum, d) => sum + d.totalRevenue, 0)),
            ],
          ],
          theme: 'striped',
          headStyles: {
            fillColor: [68, 114, 196],
            fontSize: 10,
            fontStyle: 'bold',
          },
          styles: { fontSize: 10 },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'right' },
          },
        });

        yPosition = doc.lastAutoTable.finalY;
      }

      // Footer on each page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i += 1) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`${COMPANY_NAME} | Menu Performance Report | Page ${i} of ${pageCount}`, 148.5, 200, { align: 'center' });
        doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 148.5, 204, { align: 'center' });
      }

      setExportProgress(95);

      doc.save(`Menu_Performance_Report_${startDate}_to_${endDate}.pdf`);

      setExportProgress(100);
      showSuccessToast('PDF report exported successfully!');
    } catch (err) {
      console.error('Error exporting to PDF:', err);
      showSuccessToast('Error exporting PDF file');
    } finally {
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
        setExportType('');
      }, 500);
    }
  };

  // Export with options
  const handleExportClick = (type) => {
    setShowExportModal(true);
    setExportType(type);
  };

  const handleExportConfirm = () => {
    setShowExportModal(false);
    if (exportType === 'Excel') {
      exportToExcel();
    } else if (exportType === 'PDF') {
      exportToPDF();
    }
  };

  if (loading && !reportData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <>
      <HtmlHead title={title} description={description} />

      <div className="page-title-container mb-3">
        <Row>
          <Col>
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Label>Start Date</Form.Label>
              <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label>End Date</Form.Label>
              <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Col>
            <Col md={2}>
              <Form.Label>Category</Form.Label>
              <Form.Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label>Meal Type</Form.Label>
              <Form.Select value={selectedMealType} onChange={(e) => setSelectedMealType(e.target.value)}>
                {mealTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button variant="primary" className="w-100" style={{maxWidth: '150px'}} onClick={fetchMenuReport} disabled={loading}>
                <CsLineIcons icon="sync" className="me-2" />
                {loading ? 'Loading...' : 'Generate'}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {reportData && (
        <>
          {/* Export Buttons */}
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex gap-2 align-items-center">
                <Button variant="success" onClick={() => handleExportClick('Excel')} disabled={exporting}>
                  <CsLineIcons icon="file-text" className="me-2" />
                  Excel
                </Button>
                <Button variant="danger" onClick={() => handleExportClick('PDF')} disabled={exporting}>
                  <CsLineIcons icon="file-text" className="me-2" />
                  PDF
                </Button>

                {exporting && (
                  <div className="flex-grow-1 ms-3">
                    <div className="d-flex align-items-center">
                      <Spinner animation="border" size="sm" className="me-2" />
                      <span className="me-2">Generating {exportType}...</span>
                    </div>
                    <ProgressBar now={exportProgress} label={`${exportProgress}%`} className="mt-2" style={{ height: '20px' }} />
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Summary Cards */}
          <Row className="mb-4">
            <Col lg={3} md={6} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="text-muted mb-1">Total Dishes</div>
                  <div className="text-primary h3 mb-0">{reportData.summary.totalDishes}</div>
                  <div className="text-muted mt-1" style={{fontSize: '12px'}}>Active in menu</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="text-muted mb-1">Total Revenue</div>
                  <div className="text-success h3 mb-0">{formatCurrency(reportData.summary.totalRevenue)}</div>
                  <div className="text-muted mt-1" style={{fontSize: '12px'}}>From all dishes</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="text-muted mb-1">Categories</div>
                  <div className="text-info h3 mb-0">{reportData.summary.totalCategories}</div>
                  <div className="text-muted mt-1" style={{fontSize: '12px'}}>Menu categories</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="text-muted mb-1">Avg Revenue/Dish</div>
                  <div className="text-warning h3 mb-0">{formatCurrency(reportData.summary.totalRevenue / reportData.summary.totalDishes)}</div>
                  <div className="text-muted mt-1" style={{fontSize: '12px'}}>Per dish average</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Category Performance */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Category Performance Overview</h5>
              <Row>
                {reportData.categoryPerformance.map((category, idx) => (
                  <Col lg={4} md={6} key={idx} className="mb-3">
                    <Card className="border">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1">{category.category}</h6>
                            <div className="text-muted" style={{fontSize: '12px'}}>{category.uniqueDishCount} dishes</div>
                          </div>
                          <Badge bg="primary" style={{fontSize: '12px'}}>{category.orderCount} orders</Badge>
                        </div>

                        <div className="mb-2">
                          <div className="d-flex justify-content-between mb-1" style={{fontSize: '12px'}}>
                            <span>Revenue</span>
                            <span className="font-weight-bold text-primary">{formatCurrency(category.totalRevenue)}</span>
                          </div>
                          <ProgressBar now={(category.totalRevenue / reportData.summary.totalRevenue) * 100} variant="success" />
                        </div>

                        <div className="d-flex justify-content-between" style={{fontSize: '12px'}}>
                          <span>Quantity Sold:</span>
                          <span className="font-weight-bold">{category.totalQuantity}</span>
                        </div>
                        <div className="d-flex justify-content-between" style={{fontSize: '12px'}}>
                          <span>Avg Revenue/Dish:</span>
                          <span className="font-weight-bold">{formatCurrency(category.avgRevenuePerDish)}</span>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>

          {/* Meal Type Performance */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Meal Type Performance</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Meal Type</th>
                      <th className="text-end">Quantity Sold</th>
                      <th className="text-end">Revenue</th>
                      <th className="text-end">Orders</th>
                      <th className="text-end">% of Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.mealTypePerformance.map((mealType, idx) => (
                      <tr key={idx}>
                        <td className="font-weight-bold">{mealType.mealType || 'Not Specified'}</td>
                        <td className="text-end">{mealType.totalQuantity}</td>
                        <td className="text-end font-weight-bold text-primary">{formatCurrency(mealType.totalRevenue)}</td>
                        <td className="text-end">{mealType.orderCount}</td>
                        <td className="text-end">{((mealType.totalRevenue / reportData.summary.totalRevenue) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* All Dishes Performance */}
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">All Dishes Performance</h5>
                <Badge bg="secondary">{filteredDishes.length} dishes</Badge>
              </div>

              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Dish Name</th>
                      <th>Category</th>
                      <th>Meal Type</th>
                      <th className="text-end">Quantity</th>
                      <th className="text-end">Revenue</th>
                      <th className="text-end">Orders</th>
                      <th className="text-end">Avg Price</th>
                      <th className="text-end">Revenue/Item</th>
                      <th className="text-center">Special</th>
                      <th className="text-center">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDishes.map((dish, idx) => {
                      const performance = getPerformanceLevel(dish);

                      return (
                        <tr key={idx}>
                          <td>
                            <Badge bg={idx < 10 ? 'primary' : idx < 25 ? 'info' : 'secondary'}>{idx + 1}</Badge>
                          </td>
                          <td className="font-weight-bold">{dish.dishName}</td>
                          <td>{dish.category || 'N/A'}</td>
                          <td>{dish.mealType || 'N/A'}</td>
                          <td className="text-end">{dish.totalQuantity}</td>
                          <td className="text-end font-weight-bold text-primary">{formatCurrency(dish.totalRevenue)}</td>
                          <td className="text-end">{dish.orderCount}</td>
                          <td className="text-end">{formatCurrency(dish.avgPrice)}</td>
                          <td className="text-end">{formatCurrency(dish.revenuePerItem)}</td>
                          <td className="text-center">{dish.isSpecial ? <Badge bg="warning">⭐</Badge> : <span className="text-muted">-</span>}</td>
                          <td className="text-center">
                            <Badge bg={performance === 'excellent' ? 'success' : performance === 'good' ? 'info' : 'danger'}>
                              {performance === 'excellent' ? 'Top Seller' : performance === 'good' ? 'Good' : 'Low'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Performance Distribution */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Performance Distribution</h5>
              <Row>
                <Col md={4}>
                  <Card className="border-success">
                    <Card.Body>
                      <div className="d-flex align-items-center">
                        <div className="sh-5 sw-5 bg-success rounded-xl d-flex justify-content-center align-items-center me-3">
                          <CsLineIcons icon="trend-up" className="text-white" size="20" />
                        </div>
                        <div>
                          <div className="text-muted">Top Performers</div>
                          <div className="h4 mb-0">{reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'excellent').length}</div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-info">
                    <Card.Body>
                      <div className="d-flex align-items-center">
                        <div className="sh-5 sw-5 bg-info rounded-xl d-flex justify-content-center align-items-center me-3">
                          <CsLineIcons icon="activity" className="text-white" size="20" />
                        </div>
                        <div>
                          <div className="text-muted">Average Performers</div>
                          <div className="h4 mb-0">{reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'good').length}</div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-danger">
                    <Card.Body>
                      <div className="d-flex align-items-center">
                        <div className="sh-5 sw-5 bg-danger rounded-xl d-flex justify-content-center align-items-center me-3">
                          <CsLineIcons icon="trend-down" className="text-white" size="20" />
                        </div>
                        <div>
                          <div className="text-muted">Low Performers</div>
                          <div className="h4 mb-0">{reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'poor').length}</div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Alert variant="info" className="mt-3">
                <Alert.Heading className="h6">Performance Insights</Alert.Heading>
                <p className="mb-0" style={{fontSize: '12px'}}>
                  Top performers generate 150% or more of average revenue. Consider promoting low performers or removing them from the menu. Special dishes
                  should ideally be top performers to justify their premium positioning.
                </p>
              </Alert>
            </Card.Body>
          </Card>
        </>
      )}

      {/* Export Options Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Export Options - {exportType}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-4">Select which sections to include in your {exportType} export</p>

          <Form>
            <Form.Check
              type="checkbox"
              id="includeSummary"
              label="Dashboard & Summary Metrics"
              checked={exportOptions.includeSummary}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeSummary: e.target.checked,
                })
              }
              className="mb-3"
            />

            <div className="mb-3">
              <Form.Check
                type="checkbox"
                id="includeAllDishes"
                label="All Dishes Performance"
                checked={exportOptions.includeAllDishes}
                onChange={(e) =>
                  setExportOptions({
                    ...exportOptions,
                    includeAllDishes: e.target.checked,
                  })
                }
              />
              {exportOptions.includeAllDishes && (
                <Form.Group className="mt-2 ms-4">
                  <Form.Label>Number of dishes to include:</Form.Label>
                  <Form.Select
                    value={exportOptions.dishesLimit}
                    onChange={(e) =>
                      setExportOptions({
                        ...exportOptions,
                        dishesLimit: e.target.value,
                      })
                    }
                  >
                    <option value="20">Top 20</option>
                    <option value="50">Top 50</option>
                    <option value="100">Top 100</option>
                    <option value="all">All Dishes</option>
                  </Form.Select>
                </Form.Group>
              )}
            </div>

            <Form.Check
              type="checkbox"
              id="includeCategoryPerformance"
              label="Category Performance Analysis"
              checked={exportOptions.includeCategoryPerformance}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeCategoryPerformance: e.target.checked,
                })
              }
              className="mb-3"
            />

            <Form.Check
              type="checkbox"
              id="includeMealTypePerformance"
              label="Meal Type Performance"
              checked={exportOptions.includeMealTypePerformance}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeMealTypePerformance: e.target.checked,
                })
              }
              className="mb-3"
            />

            <Form.Check
              type="checkbox"
              id="includePerformanceDistribution"
              label="Performance Distribution Analysis"
              checked={exportOptions.includePerformanceDistribution}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includePerformanceDistribution: e.target.checked,
                })
              }
              className="mb-3"
            />

            <Form.Check
              type="checkbox"
              id="includeCharts"
              label="Include Charts & Visual Insights"
              checked={exportOptions.includeCharts}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeCharts: e.target.checked,
                })
              }
              className="mb-3"
            />
          </Form>

          <Alert variant="info" className="mt-4">
            <CsLineIcons icon="info-circle" className="me-2" />
            <strong>Tip:</strong> Include performance distribution to identify which dishes need promotion, adjustment, or removal from your menu for optimal
            profitability.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleExportConfirm}>
            <CsLineIcons icon="download" className="me-2" />
            Export {exportType}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Success Toast */}
      <ToastContainer position="top-end" className="p-3">
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide bg="success">
          <Toast.Header>
            <CsLineIcons icon="check-circle" className="me-2" />
            <strong className="me-auto">Success</strong>
          </Toast.Header>
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default MenuPerformanceReport;
