/**
 * Date Utility Helpers for Architect PMS
 * Standardizes all date formatting across the client application to DD/MM/YYYY
 */

/**
 * Formats a date string, Date object, or timestamp into DD/MM/YYYY format.
 * @param {string|Date|number} dateInput 
 * @returns {string} Formatted date (e.g., "24/09/2026") or "N/A"
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Formats a date string, Date object, or timestamp into DD/MM/YYYY hh:mm AM/PM format.
 * @param {string|Date|number} dateInput 
 * @returns {string} Formatted date-time (e.g., "24/09/2026 02:30 PM") or "N/A"
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const strHours = String(hours).padStart(2, '0');

  return `${day}/${month}/${year} ${strHours}:${minutes} ${ampm}`;
};

/**
 * Formats a Date object or ISO string into YYYY-MM-DD for native HTML <input type="date"> elements.
 * @param {string|Date|number} dateInput 
 * @returns {string} Formatted date for input (e.g., "2026-09-24") or ""
 */
export const formatDateForInput = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};
