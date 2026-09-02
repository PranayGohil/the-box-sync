import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Export tabular data to an Excel (.xlsx) file
 */
export const exportToExcel = ({
  filename = 'Export_Data',
  sheetName = 'Data',
  title = '',
  headers = [],
  data = []
}) => {
  try {
    let ws;
    if (Array.isArray(data[0]) && headers.length > 0) {
      const sheetData = [headers, ...data];
      ws = XLSX.utils.aoa_to_sheet(sheetData);
    } else {
      ws = XLSX.utils.json_to_sheet(data);
    }

    // Auto-compute column widths
    const colWidths = headers.map((h, i) => {
      let maxLen = String(h || '').length;
      data.forEach((row) => {
        const val = Array.isArray(row) ? row[i] : row[h];
        if (val !== undefined && val !== null) {
          maxLen = Math.max(maxLen, String(val).length);
        }
      });
      return { wch: Math.min(Math.max(maxLen + 3, 10), 45) };
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const fname = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    XLSX.writeFile(wb, fname);
  } catch (err) {
    console.error('Export to Excel error:', err);
    throw err;
  }
};

/**
 * Export tabular data to a formatted PDF (.pdf) file
 */
export const exportToPdf = ({
  filename = 'Export_Document',
  title = 'Document Report',
  subtitle = '',
  headers = [],
  data = [],
  orientation = null
}) => {
  try {
    const isLandscape = orientation === 'landscape' || (!orientation && headers.length > 5);
    const doc = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Document Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(title, 40, 36);

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(subtitle, 40, 52);
    }

    const dateStr = `Exported: ${new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })}`;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(dateStr, pageWidth - 40, 36, { align: 'right' });

    // Table
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: subtitle ? 66 : 54,
      margin: { left: 40, right: 40, bottom: 40 },
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59], // sleek dark slate
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'left',
        cellPadding: 6
      },
      bodyStyles: {
        textColor: [51, 65, 85],
        fontSize: 8,
        cellPadding: 5
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // light slate zebra striping
      },
      didDrawPage: (dataHook) => {
        // Page Number in footer
        const totalPages = doc.internal.getNumberOfPages();
        const str = `Page ${dataHook.pageNumber} of ${totalPages}`;
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(str, pageWidth - 40, pageHeight - 16, { align: 'right' });
      }
    });

    const fname = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    doc.save(fname);
  } catch (err) {
    console.error('Export to PDF error:', err);
    throw err;
  }
};
