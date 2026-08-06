import axios from 'axios';

const API_URL = process.env.REACT_APP_API || 'http://localhost:5000/api';

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

// Invoices
export const getInvoices = async (shopId) => {
  return axios.get(`${API_URL}/accounting/invoices?shopId=${shopId}`, getHeaders());
};

export const createInvoice = async (payload) => {
  return axios.post(`${API_URL}/accounting/invoices`, payload, getHeaders());
};

export const deleteInvoice = async (id) => {
  return axios.delete(`${API_URL}/accounting/invoices/${id}`, getHeaders());
};

export const getInvoicePDFUrl = (id) => {
  const token = localStorage.getItem('token');
  return `${API_URL}/accounting/invoices/${id}/pdf?token=${token}`;
};

// Quotations
export const getQuotations = async (shopId) => {
  return axios.get(`${API_URL}/accounting/quotations?shopId=${shopId}`, getHeaders());
};

export const createQuotation = async (payload) => {
  return axios.post(`${API_URL}/accounting/quotations`, payload, getHeaders());
};

export const getQuotationPDFUrl = (id) => {
  const token = localStorage.getItem('token');
  return `${API_URL}/accounting/quotations/${id}/pdf?token=${token}`;
};

// Sales Orders
export const getSalesOrders = async (shopId) => {
  return axios.get(`${API_URL}/accounting/sales-orders?shopId=${shopId}`, getHeaders());
};

export const createSalesOrder = async (payload) => {
  return axios.post(`${API_URL}/accounting/sales-orders`, payload, getHeaders());
};

export const getSalesOrderPDFUrl = (id) => {
  const token = localStorage.getItem('token');
  return `${API_URL}/accounting/sales-orders/${id}/pdf?token=${token}`;
};

// Purchase Orders
export const getPurchaseOrders = async (shopId) => {
  return axios.get(`${API_URL}/accounting/purchase-orders?shopId=${shopId}`, getHeaders());
};

export const createPurchaseOrder = async (payload) => {
  return axios.post(`${API_URL}/accounting/purchase-orders`, payload, getHeaders());
};

export const updatePurchaseOrderStatus = async (id, status) => {
  return axios.put(`${API_URL}/accounting/purchase-orders/${id}/status`, { status }, getHeaders());
};

export const receivePurchaseItems = async (id, itemsReceived) => {
  return axios.post(`${API_URL}/accounting/purchase-orders/${id}/receive`, { itemsReceived }, getHeaders());
};

export const getPurchaseOrderPDFUrl = (id) => {
  const token = localStorage.getItem('token');
  return `${API_URL}/accounting/purchase-orders/${id}/pdf?token=${token}`;
};

// Credit/Debit Notes
export const getNotes = async (shopId) => {
  return axios.get(`${API_URL}/accounting/notes?shopId=${shopId}`, getHeaders());
};

export const createNote = async (payload) => {
  return axios.post(`${API_URL}/accounting/notes`, payload, getHeaders());
};

export const getNotePDFUrl = (id) => {
  const token = localStorage.getItem('token');
  return `${API_URL}/accounting/notes/${id}/pdf?token=${token}`;
};

// GST Reports
export const getGSTReports = async () => {
  return axios.get(`${API_URL}/accounting/reports/gst`, getHeaders());
};

// Number Series Configuration
export const getNumberSeries = async () => {
  return axios.get(`${API_URL}/accounting/number-series`, getHeaders());
};

export const updateNumberSeries = async (payload) => {
  return axios.post(`${API_URL}/accounting/number-series`, payload, getHeaders());
};
