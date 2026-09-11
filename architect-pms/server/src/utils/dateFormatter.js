/**
 * Backend Date Formatter Helper for Architect PMS
 * Standardizes server-generated dates (e.g. Excel exports, banner payloads) to DD/MM/YYYY
 */

/**
 * Formats a date string, Date object, or timestamp to DD/MM/YYYY.
 * @param {string|Date|number} dateInput 
 * @returns {string} Formatted date (e.g. "24/09/2026") or "N/A"
 */
const formatDateDDMMYYYY = (dateInput) => {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

module.exports = {
  formatDateDDMMYYYY,
};
