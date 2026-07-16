import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Spinner, Modal, InputGroup, Badge, Collapse } from 'react-bootstrap';
import axios from 'axios';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import { AuthContext } from 'contexts/AuthContext';
import { getCustomerList } from 'api/customerService';
import { saveTemplate, getTemplates, deleteTemplate } from 'api/campaignTemplateService';

/* ─── Styles ──────────────────────────────────────────────────────────────────── */
const styles = `
  .campaign-card {
    border-radius: 1.1rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 16px rgba(35,179,244,0.06);
    height: 100%;
  }
  .campaign-card-header {
    padding: 1.1rem 1.3rem 0.8rem;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .campaign-card-header-icon {
    width: 34px; height: 34px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .campaign-card-title {
    font-weight: 700;
    color: #1e293b;
    font-size: 0.95rem;
    margin: 0;
  }
  .campaign-card-body { padding: 1.2rem 1.3rem; }

  /* Compose fields */
  .campaign-input {
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.875rem;
    padding: 10px 14px;
    color: #334155;
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%;
    background: #fff;
    outline: none;
    resize: none;
  }
  .campaign-input:focus {
    border-color: #23b3f4;
    box-shadow: 0 0 0 3px rgba(35,179,244,0.12);
  }
  .campaign-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.45rem;
    display: block;
  }
  .char-count {
    font-size: 0.72rem;
    color: #94a3b8;
    text-align: right;
    margin-top: 4px;
  }
  .char-count.warn { color: #f59e0b; }
  .char-count.danger { color: #ef4444; }
  .markdown-hint {
    font-size: 0.72rem;
    color: #94a3b8;
    margin-top: 5px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .markdown-hint span {
    background: #f1f5f9;
    border-radius: 4px;
    padding: 2px 6px;
    font-family: monospace;
    font-size: 0.7rem;
  }

  /* WhatsApp Preview */
  .wa-preview-wrapper {
    background: #ece5dd url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3C/svg%3E");
    border-radius: 12px;
    padding: 1rem;
    min-height: 140px;
    display: flex;
    align-items: flex-start;
  }
  .wa-bubble {
    background: #fff;
    border-radius: 0 12px 12px 12px;
    padding: 10px 14px;
    max-width: 85%;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    position: relative;
  }
  .wa-bubble::before {
    content: '';
    position: absolute;
    top: 0; left: -8px;
    border-width: 0 8px 8px 0;
    border-style: solid;
    border-color: transparent #fff transparent transparent;
  }
  .wa-bubble-text {
    font-size: 0.82rem;
    color: #1e293b;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
  }
  .wa-bubble-bold { font-weight: 700; }
  .wa-bubble-time {
    font-size: 0.65rem;
    color: #94a3b8;
    text-align: right;
    margin-top: 4px;
  }
  .wa-empty-hint {
    color: #a8a196;
    font-size: 0.8rem;
    font-style: italic;
    margin: auto;
    text-align: center;
    width: 100%;
  }

  .customer-search-input {
    border: 1.5px solid #e2e8f0;
    border-radius: 10px 0 0 10px;
    font-size: 0.82rem;
    padding: 8px 12px;
    outline: none;
    flex: 1 1 auto;
    width: 1%;
  }
  .customer-search-input:focus { border-color: #23b3f4; box-shadow: 0 0 0 2px rgba(35,179,244,0.1); }
  .customer-search-btn {
    border: 1.5px solid #e2e8f0;
    border-left: none;
    border-radius: 0 10px 10px 0;
    background: #f8fafc;
    color: #94a3b8;
    padding: 8px 12px;
    transition: all 0.2s;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .customer-search-btn:hover { background: #23b3f4; color: #fff; border-color: #23b3f4; }

  .customer-picker-list {
    max-height: 340px;
    overflow-y: auto;
    margin: 0 -1.3rem;
    padding: 0 1.3rem;
  }
  .customer-picker-list::-webkit-scrollbar { width: 4px; }
  .customer-picker-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

  .customer-picker-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0;
    border-bottom: 1px solid #f8fafc;
    cursor: pointer;
    transition: background 0.15s;
    border-radius: 8px;
    margin: 0 -0.4rem;
    padding-left: 0.4rem;
    padding-right: 0.4rem;
  }
  .customer-picker-row:hover:not(.disabled) { background: #f0f9ff; }
  .customer-picker-row.disabled { opacity: 0.45; cursor: not-allowed; }
  .customer-picker-row.selected { background: rgba(35,179,244,0.06); }

  .picker-avatar {
    width: 34px; height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg,#23b3f4,#0ea5e9);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 700; font-size: 0.82rem;
    flex-shrink: 0;
  }
  .picker-name { font-weight: 600; color: #1e293b; font-size: 0.85rem; line-height: 1.2; }
  .picker-phone { font-size: 0.72rem; color: #94a3b8; }
  .picker-orders {
    margin-left: auto;
    background: rgba(35,179,244,0.1);
    color: #0284c7;
    border-radius: 20px;
    padding: 2px 8px;
    font-size: 0.7rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .selected-counter {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg,#23b3f4,#0ea5e9);
    color: #fff;
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .send-btn {
    background: linear-gradient(135deg, #25d366, #128c7e);
    border: none;
    border-radius: 50px;
    color: #fff;
    font-weight: 700;
    font-size: 0.88rem;
    padding: 10px 24px;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
    box-shadow: 0 4px 14px rgba(18,140,126,0.35);
    width: 100%;
    justify-content: center;
  }
  .send-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #20bf59, #0f7a6e);
    box-shadow: 0 6px 18px rgba(18,140,126,0.45);
    transform: translateY(-1px);
  }
  .send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

  /* Confirmation modal */
  .confirm-customer-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 0.78rem;
    font-weight: 600;
    color: #0284c7;
    margin: 3px;
  }
  .wa-icon-badge {
    width: 20px; 
    height: 20px;
    background: #25d366;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .section-divider {
    border: none;
    border-top: 1px solid #f1f5f9;
    margin: 1rem 0;
  }
  .empty-picker { text-align: center; padding: 2rem 0; color: #94a3b8; font-size: 0.82rem; }
`;

/* ─── Helpers ──────────────────────────────────────────────────────────────────── */
const getInitials = (name) => {
  if (!name) return 'W';
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0][0].toUpperCase();
};

// Convert *bold* and _italic_ markers to JSX for the preview bubble
const renderWhatsAppText = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, li) => {
    // Split by bold (*text*) and italic (_text_) markers
    const parts = line.split(/(\*[^*]+\*|_[^_]+_)/g);
    return (
      // eslint-disable-next-line react/no-array-index-key
      <span key={li}>
        {parts.map((part, pi) => {
          if (part.startsWith('*') && part.endsWith('*')) {
            // eslint-disable-next-line react/no-array-index-key
            return <strong key={pi}>{part.slice(1, -1)}</strong>;
          }
          if (part.startsWith('_') && part.endsWith('_')) {
            // eslint-disable-next-line react/no-array-index-key
            return <em key={pi}>{part.slice(1, -1)}</em>;
          }
          return part;
        })}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
};


const MAX_CHARS = 1000;

/* ─── Component ─────────────────────────────────────────────────────────────────── */
const WhatsappCampaign = () => {
  const title = 'WhatsApp Campaign';
  const description = 'Compose WhatsApp campaigns and send them to your customers.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'crm', text: 'CRM' },
    { to: '', text: 'WhatsApp Campaign' },
  ];

  const history = useHistory();
  const { currentUser } = useContext(AuthContext);

  // Compose state
  const [campaignName, setCampaignName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [couponText, setCouponText] = useState('');
  const [expiryText, setExpiryText] = useState('');

  // Templates state
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedImageFile(file);
      setUploadedImageUrl('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error('Please select an image file.');
    }
  };

  const clearImage = () => {
    setSelectedImageFile(null);
    setImagePreview(null);
    setUploadedImageUrl('');
    const fileInput = document.getElementById('campaign-image-input');
    if (fileInput) fileInput.value = '';
  };

  // Customer picker state
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [loyaltyPreset, setLoyaltyPreset] = useState('all');
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    ordersMin: '',
    ordersMax: '',
    spendMin: '',
    spendMax: '',
    recency: '',
  });

  // Send state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sendStep, setSendStep] = useState(-1); // -1 = overview, 0..N = sequential sending

  const fetchRef = useRef(false);
  const textareaRef = useRef(null);

  const insertPlaceholder = (placeholder) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const newText = before + placeholder + after;
    setMessageText(newText.slice(0, MAX_CHARS));
    setTimeout(() => {
      textarea.focus();
      const nextPos = start + placeholder.length;
      textarea.selectionStart = nextPos;
      textarea.selectionEnd = nextPos;
    }, 0);
  };

  // Fetch restaurant name once
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API}/user/get`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (res.data?.name) setRestaurantName(res.data.name);
      } catch {
        // fallback — leave empty
      }
    };
    fetchRestaurant();
  }, []);

  // Fetch campaign templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const res = await getTemplates();
        if (res.data?.success) {
          setTemplates(res.data.data || []);
        }
      } catch (err) {
        console.error("Error loading templates:", err);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleSelectTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setCampaignName('');
      setMessageText('');
      return;
    }
    const t = templates.find((x) => x._id === templateId);
    if (t) {
      setCampaignName(t.campaignName || '');
      setMessageText(t.messageText || '');
    }
  };

  const handleSaveTemplate = async (e) => {
    if (e) e.preventDefault();
    if (!newTemplateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    if (!messageText.trim()) {
      toast.error("Template message cannot be empty");
      return;
    }
    setSavingTemplate(true);
    try {
      const res = await saveTemplate({
        name: newTemplateName.trim(),
        campaignName: campaignName.trim(),
        messageText: messageText.trim(),
      });
      if (res.data?.success) {
        toast.success("Template saved successfully");
        setShowSaveModal(false);
        setNewTemplateName('');
        const updated = await getTemplates();
        if (updated.data?.success) {
          setTemplates(updated.data.data || []);
          if (res.data.data?._id) {
            setSelectedTemplateId(res.data.data._id);
          }
        }
      }
    } catch (err) {
      console.error("Save template error:", err);
      toast.error(err.response?.data?.message || "Could not save template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!templateId) return;
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await deleteTemplate(templateId);
      if (res.data?.success) {
        toast.success("Template deleted successfully");
        if (selectedTemplateId === templateId) {
          setSelectedTemplateId('');
        }
        const updated = await getTemplates();
        if (updated.data?.success) {
          setTemplates(updated.data.data || []);
        }
      }
    } catch (err) {
      console.error("Delete template error:", err);
      toast.error("Could not delete template");
    }
  };

  // Fetch customer list
  const fetchCustomers = useCallback(async () => {
    if (fetchRef.current) return;
    fetchRef.current = true;
    setLoadingCustomers(true);
    try {
      const res = await getCustomerList({
        page: 1,
        limit: 200,
        search: searchTerm,
        sortBy: 'total_orders',
        sortOrder: 'desc',
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        ordersMin: filters.ordersMin,
        ordersMax: filters.ordersMax,
        spendMin: filters.spendMin,
        spendMax: filters.spendMax,
        recency: filters.recency,
      });
      if (res.data?.success) {
        setCustomers(res.data.data || []);
      }
    } catch {
      toast.error('Could not load customers.');
    } finally {
      setLoadingCustomers(false);
      fetchRef.current = false;
    }
  }, [
    searchTerm,
    filters.fromDate,
    filters.toDate,
    filters.ordersMin,
    filters.ordersMax,
    filters.spendMin,
    filters.spendMax,
    filters.recency,
  ]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleSearch = () => {
    setSearchTerm(searchInput.trim());
    setSelectedCustomers([]);
  };
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') { setSearchInput(''); setSearchTerm(''); }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setSelectedCustomers([]);
  };

  const handlePresetChange = (preset) => {
    setLoyaltyPreset(preset);
    setSelectedCustomers([]);
    if (preset === 'all') {
      setFilters((prev) => ({ ...prev, ordersMin: '', ordersMax: '', spendMin: '', spendMax: '' }));
    } else if (preset === 'vip') {
      setFilters((prev) => ({ ...prev, spendMin: '2000', spendMax: '', ordersMin: '', ordersMax: '' }));
    } else if (preset === 'regular') {
      setFilters((prev) => ({ ...prev, ordersMin: '6', ordersMax: '', spendMin: '', spendMax: '' }));
    } else if (preset === 'new') {
      setFilters((prev) => ({ ...prev, ordersMin: '1', ordersMax: '1', spendMin: '', spendMax: '' }));
    }
  };

  const handleClearFilters = () => {
    setLoyaltyPreset('all');
    setFilters({
      fromDate: '',
      toDate: '',
      ordersMin: '',
      ordersMax: '',
      spendMin: '',
      spendMax: '',
      recency: '',
    });
    setSelectedCustomers([]);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.fromDate) count += 1;
    if (filters.toDate) count += 1;
    if (filters.recency) count += 1;
    if (loyaltyPreset !== 'all' && loyaltyPreset !== 'custom') {
      count += 1;
    } else if (filters.ordersMin || filters.ordersMax || filters.spendMin || filters.spendMax) {
      count += 1;
    }
    return count;
  };

  const toggleCustomer = (customer) => {
    if (!customer.phone) return;
    setSelectedCustomers((prev) => {
      const contains = prev.find((c) => c.phone === customer.phone);
      if (contains) return prev.filter((c) => c.phone !== customer.phone);
      return [...prev, customer];
    });
  };

  const handleSelectAll = () => {
    const validCustomers = customers.filter((c) => c.phone);
    setSelectedCustomers((prev) => {
      const next = [...prev];
      validCustomers.forEach((c) => {
        if (!next.some((s) => s.phone === c.phone)) {
          next.push(c);
        }
      });
      return next;
    });
  };

  const handleDeselectAll = () => {
    setSelectedCustomers([]);
  };

  const isSelected = (customer) => !!selectedCustomers.find((c) => c.phone === customer.phone);
  const isDisabled = (customer) => false;

  // Build final message with variable substitutions
  const buildMessage = (customer = null) => {
    let msg = '';
    if (campaignName.trim()) msg += `*${campaignName.trim()}*\n\n`;

    let body = messageText.trim();
    if (customer) {
      body = body
        .replace(/\{\{customer_name\}\}/g, customer.name || 'Valued Customer')
        .replace(/\{\{restaurant_name\}\}/g, restaurantName || '')
        .replace(/\{\{coupon\}\}/g, couponText || '')
        .replace(/\{\{expiry\}\}/g, expiryText || '');
    } else {
      // Preview mode
      body = body
        .replace(/\{\{customer_name\}\}/g, 'John Doe')
        .replace(/\{\{restaurant_name\}\}/g, restaurantName || 'Our Restaurant')
        .replace(/\{\{coupon\}\}/g, couponText || 'WELCOME10')
        .replace(/\{\{expiry\}\}/g, expiryText || '31-12-2026');
    }

    msg += body;
    if (restaurantName) msg += `\n\n— ${restaurantName}`;
    return msg;
  };

  // Preview message (no phone-specific content)
  const previewMessage = buildMessage();

  const handleSend = () => {
    if (!messageText.trim() || selectedCustomers.length === 0) return;
    setSendStep(-1); // show overview first
    setShowConfirmModal(true);
  };

  // Start the sequential send flow
  const startSequentialSend = () => {
    setSendStep(0);
  };

  // Open WhatsApp for the current step — MUST be called from a direct click handler
  const openCurrentStep = async () => {
    const customer = selectedCustomers[sendStep];
    if (!customer) return;

    if (selectedImageFile) {
      try {
        const item = new ClipboardItem({ [selectedImageFile.type]: selectedImageFile });
        await navigator.clipboard.write([item]);
        toast.info("Image copied to clipboard! Paste (Ctrl+V) in WhatsApp to attach it.", { autoClose: 4000 });
      } catch (err) {
        console.warn("Could not copy image to clipboard automatically: ", err);
      }
    }

    const message = buildMessage(customer);
    const encoded = encodeURIComponent(message);
    let phone = String(customer.phone).replace(/\D/g, '');
    if (phone.length === 10) phone = `91${phone}`;
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');

    const next = sendStep + 1;
    if (next >= selectedCustomers.length) {
      // All done
      setShowConfirmModal(false);
      setSendStep(-1);
      toast.success(`Campaign sent to ${selectedCustomers.length} customer${selectedCustomers.length > 1 ? 's' : ''} via WhatsApp ✓`);
    } else {
      setSendStep(next);
    }
  };

  const closeModal = () => {
    setShowConfirmModal(false);
    setSendStep(-1);
  };

  const charCount = messageText.length;
  const charClass = charCount > MAX_CHARS * 0.9 ? 'danger' : charCount > MAX_CHARS * 0.75 ? 'warn' : '';
  const canSend = messageText.trim().length > 0 && selectedCustomers.length > 0;
  const isSequential = sendStep >= 0;
  const currentCustomer = isSequential ? selectedCustomers[sendStep] : null;

  // Current time for preview
  const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <>
      <style>{styles}</style>
      <HtmlHead title={title} description={description} />

      <div className="qsr-page-title-container text-start">
        <Row className="g-0 align-items-center">
          <Col xs="auto" className="me-auto text-start">
            <h1 className="qsr-page-title">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>

        </Row>
      </div>

      <Row className="g-3 align-items-start">
        {/* ── LEFT: Compose ─────────────────────────────────────────────────── */}
        <Col xs={12} lg={6}>
          <Card className="campaign-card">
            <div className="campaign-card-header">
              <div className="campaign-card-header-icon" style={{ background: 'rgba(35,179,244,0.1)' }}>
                <CsLineIcons icon="edit" size="16" style={{ color: '#23b3f4' }} />
              </div>
              <p className="campaign-card-title">Compose Campaign</p>
            </div>
            <div className="campaign-card-body">

              {/* Select Campaign Template */}
              <div className="mb-3">
                <label className="campaign-label">Select Saved Template</label>
                <div className="d-flex gap-2 align-items-center">
                  <Form.Select
                    value={selectedTemplateId}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    style={{ fontSize: '0.85rem', height: '40px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}
                    disabled={loadingTemplates}
                  >
                    <option value="">-- Start from scratch / Create new --</option>
                    {templates.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </Form.Select>
                  {selectedTemplateId && (
                    <Button
                      variant="outline-danger"
                      className="btn-icon btn-icon-only"
                      onClick={() => handleDeleteTemplate(selectedTemplateId)}
                      title="Delete selected template"
                      style={{ height: '40px', width: '40px', borderRadius: '10px', padding: 0 }}
                    >
                      <CsLineIcons icon="bin" size="16" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Campaign Name */}
              <div className="mb-3">
                <label className="campaign-label">Campaign Name <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="text"
                  className="campaign-input"
                  placeholder="e.g. Weekend Special Offer"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  maxLength={80}
                />
              </div>

              {/* Personalized Variables Inputs */}
              {/* <Row className="g-2 mb-3">
                <Col xs="12" sm="6">
                  <label className="campaign-label">Coupon Code <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                  <input
                    type="text"
                    className="campaign-input"
                    placeholder="e.g. SAVE20"
                    value={couponText}
                    onChange={(e) => setCouponText(e.target.value)}
                    maxLength={30}
                  />
                </Col>
                <Col xs="12" sm="6">
                  <label className="campaign-label">Expiry Date <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                  <input
                    type="text"
                    className="campaign-input"
                    placeholder="e.g. 31-12-2026"
                    value={expiryText}
                    onChange={(e) => setExpiryText(e.target.value)}
                    maxLength={30}
                  />
                </Col>
              </Row> */}

              {/* Campaign Image */}
              {/* <div className="mb-3">
                <label className="campaign-label">Campaign Image <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                <div
                  style={{
                    border: '1.5px dashed #cbd5e1',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    textAlign: 'center',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'border-color 0.2s',
                  }}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#23b3f4'; }}
                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#cbd5e1'; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleImageSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => document.getElementById('campaign-image-input').click()}
                >
                  <input
                    type="file"
                    id="campaign-image-input"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageSelect(e.target.files[0]);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  {imagePreview ? (
                    <div className="position-relative d-inline-block">
                      <img
                        src={imagePreview}
                        alt="Campaign preview"
                        style={{ maxHeight: '120px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        className="position-absolute btn-icon btn-icon-only rounded-circle shadow-sm"
                        style={{ top: '-10px', right: '-10px', width: '24px', height: '24px', padding: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          clearImage();
                        }}
                      >
                        <CsLineIcons icon="close" size="10" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <CsLineIcons icon="file-image" size="24" className="text-muted mb-2" />
                      <div className="small fw-semibold text-muted">Click or drag image to upload</div>
                      <div className="text-muted" style={{ fontSize: '10px' }}>Supports PNG, JPG, JPEG</div>
                    </div>
                  )}
                </div>
              </div> */}

              {/* Message */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="campaign-label mb-0">Message *</label>
                  <div className="d-flex gap-1 flex-wrap justify-content-end">
                    <Button
                      variant="light"
                      size="sm"
                      className="px-2 py-0 border"
                      style={{ fontSize: '0.72rem', borderRadius: '6px', minHeight: '22px' }}
                      onClick={() => insertPlaceholder('{{customer_name}}')}
                    >
                      + Name
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      className="px-2 py-0 border"
                      style={{ fontSize: '0.72rem', borderRadius: '6px', minHeight: '22px' }}
                      onClick={() => insertPlaceholder('{{restaurant_name}}')}
                    >
                      + Restaurant
                    </Button>
                    {/* <Button
                      variant="light"
                      size="sm"
                      className="px-2 py-0 border"
                      style={{ fontSize: '0.72rem', borderRadius: '6px', minHeight: '22px' }}
                      onClick={() => insertPlaceholder('{{coupon}}')}
                    >
                      + Coupon
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      className="px-2 py-0 border"
                      style={{ fontSize: '0.72rem', borderRadius: '6px', minHeight: '22px' }}
                      onClick={() => insertPlaceholder('{{expiry}}')}
                    >
                      + Expiry
                    </Button> */}
                  </div>
                </div>
                <textarea
                  ref={textareaRef}
                  className="campaign-input"
                  rows={6}
                  placeholder="Write your campaign message here..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value.slice(0, MAX_CHARS))}
                />
                <div className="d-flex justify-content-between align-items-center mt-1">
                  <div className={`char-count ${charClass} mb-0`}>{charCount} / {MAX_CHARS}</div>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 text-decoration-none d-flex align-items-center gap-1"
                    style={{ fontSize: '0.78rem', fontWeight: 600, color: '#23b3f4', minHeight: 'auto' }}
                    onClick={() => setShowSaveModal(true)}
                    disabled={!messageText.trim()}
                  >
                    <CsLineIcons icon="save" size="14" />
                    Save as Template
                  </Button>
                </div>
                <div className="markdown-hint">
                  <span>*bold*</span>
                  <span>_italic_</span>
                  <span>~strikethrough~</span>
                  <span style={{ color: '#94a3b8', background: 'transparent', fontFamily: 'inherit', fontSize: '0.7rem' }}>WhatsApp formatting supported</span>
                </div>
              </div>

              <hr className="section-divider" />

              {/* WhatsApp Preview */}
              <div className="mb-1">
                <label className="campaign-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#25d366', display: 'inline-block' }} />
                  WhatsApp Preview
                </label>
                <div className="wa-preview-wrapper">
                  {!messageText.trim() && !campaignName.trim() && !imagePreview ? (
                    <div className="wa-empty-hint">
                      <CsLineIcons icon="chat-group" size="28" style={{ display: 'block', margin: '0 auto 8px' }} />
                      Your message preview will appear here
                    </div>
                  ) : (
                    <div className="wa-bubble" style={{ width: '100%' }}>
                      {imagePreview && (
                        <div className="mb-2" style={{ margin: '-10px -14px 10px', overflow: 'hidden', borderTopLeftRadius: '0', borderTopRightRadius: '12px' }}>
                          <img
                            src={imagePreview}
                            alt="WhatsApp preview"
                            style={{ width: '100%', maxHeight: '180px', objectFit: 'cover' }}
                          />
                        </div>
                      )}
                      <div className="wa-bubble-text">
                        {renderWhatsAppText(buildMessage())}
                      </div>
                      <div className="wa-bubble-time">{nowTime} ✓✓</div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </Card>
        </Col>

        {/* ── RIGHT: Select Customers ────────────────────────────────────────── */}
        <Col xs={12} lg={6}>
          <Card className="campaign-card">
            <div className="campaign-card-header">
              <div className="campaign-card-header-icon" style={{ background: 'rgba(37,211,102,0.1)' }}>
                <CsLineIcons icon="user" size="16" style={{ color: '#25d366' }} />
              </div>
              <p className="campaign-card-title">Select Customers</p>
              <div className="ms-auto">
                <span className="selected-counter">
                  <CsLineIcons icon="check" size="12" />
                  {selectedCustomers.length} Selected
                </span>
              </div>
            </div>
            <div className="campaign-card-body">

              {/* Controls: Search, Filters, Select All */}
              <div className="mb-3 d-flex flex-column gap-2">
                <InputGroup className="flex-nowrap">
                  <input
                    type="text"
                    className="customer-search-input"
                    placeholder="Search by name or phone..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                  />
                  <button type="button" className="customer-search-btn" onClick={handleSearch}>
                    <CsLineIcons icon="search" size="14" />
                  </button>
                </InputGroup>

                <div className="d-flex justify-content-between align-items-center mt-1">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="d-flex align-items-center gap-1 py-1 px-3 rounded-pill position-relative"
                    style={{ fontSize: '0.78rem', fontWeight: 600 }}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <CsLineIcons icon={showFilters ? 'close' : 'filter'} size="12" />
                    Filters
                    {getActiveFilterCount() > 0 && (
                      <Badge
                        bg="danger"
                        className="position-absolute rounded-pill border border-2 border-white"
                        style={{ top: '-8px', right: '-8px', fontSize: '9px', padding: '3px 5px' }}
                      >
                        {getActiveFilterCount()}
                      </Badge>
                    )}
                  </Button>

                  <div className="d-flex gap-2">
                    {customers.length > 0 && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="py-1 px-3 rounded-pill"
                        style={{ fontSize: '0.78rem', fontWeight: 600 }}
                        onClick={handleSelectAll}
                      >
                        Select All
                      </Button>
                    )}
                    {selectedCustomers.length > 0 && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="py-1 px-3 rounded-pill"
                        style={{ fontSize: '0.78rem', fontWeight: 600 }}
                        onClick={handleDeselectAll}
                      >
                        Deselect All
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Collapsible Filter Panel */}
              <Collapse in={showFilters}>
                <div className="p-3 mb-3 border-0 bg-light shadow-none" style={{ borderRadius: '1rem' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold text-muted small">Filter Customers</span>
                    {getActiveFilterCount() > 0 && (
                      <span className="cursor-pointer text-danger small fw-bold" onClick={handleClearFilters}>
                        Clear All
                      </span>
                    )}
                  </div>
                  <Row className="g-2">
                    <Col xs="12">
                      <Form.Select
                        value={loyaltyPreset}
                        onChange={(e) => handlePresetChange(e.target.value)}
                        style={{ fontSize: '0.78rem', height: '34px', borderRadius: '8px' }}
                      >
                        <option value="all">All Loyalty tiers</option>
                        <option value="vip">VIP Spenders ({'>'} ₹2000)</option>
                        <option value="regular">Regulars ({'>'} 5 Visits)</option>
                        <option value="new">New Customers (1 Visit)</option>
                        <option value="custom">Custom Range...</option>
                      </Form.Select>
                    </Col>

                    {loyaltyPreset === 'custom' && (
                      <>
                        <Col xs="6">
                          <Form.Control
                            type="number"
                            placeholder="Min Orders"
                            value={filters.ordersMin}
                            onChange={(e) => handleFilterChange('ordersMin', e.target.value)}
                            style={{ fontSize: '0.75rem', height: '32px', borderRadius: '8px' }}
                          />
                        </Col>
                        <Col xs="6">
                          <Form.Control
                            type="number"
                            placeholder="Max Orders"
                            value={filters.ordersMax}
                            onChange={(e) => handleFilterChange('ordersMax', e.target.value)}
                            style={{ fontSize: '0.75rem', height: '32px', borderRadius: '8px' }}
                          />
                        </Col>
                        <Col xs="6">
                          <Form.Control
                            type="number"
                            placeholder="Min Spend"
                            value={filters.spendMin}
                            onChange={(e) => handleFilterChange('spendMin', e.target.value)}
                            style={{ fontSize: '0.75rem', height: '32px', borderRadius: '8px' }}
                          />
                        </Col>
                        <Col xs="6">
                          <Form.Control
                            type="number"
                            placeholder="Max Spend"
                            value={filters.spendMax}
                            onChange={(e) => handleFilterChange('spendMax', e.target.value)}
                            style={{ fontSize: '0.75rem', height: '32px', borderRadius: '8px' }}
                          />
                        </Col>
                      </>
                    )}

                    <Col xs="12">
                      <Form.Select
                        value={filters.recency}
                        onChange={(e) => handleFilterChange('recency', e.target.value)}
                        style={{ fontSize: '0.78rem', height: '34px', borderRadius: '8px' }}
                      >
                        <option value="">All Activity</option>
                        <option value="active_14">Active (Visited in last 14d)</option>
                        <option value="dormant_30">At Risk (Dormant {'>'} 30d)</option>
                        <option value="dormant_60">Dormant (No visits {'>'} 60d)</option>
                        <option value="dormant_90">Lost (No visits {'>'} 90d)</option>
                      </Form.Select>
                    </Col>
                  </Row>
                </div>
              </Collapse>



              {/* Customer List */}
              <div className="customer-picker-list">
                {loadingCustomers ? (
                  <div className="d-flex justify-content-center align-items-center py-4">
                    <Spinner size="sm" animation="border" style={{ color: '#23b3f4' }} />
                    <span className="ms-2 text-muted" style={{ fontSize: '0.82rem' }}>Loading customers...</span>
                  </div>
                ) : customers.length === 0 ? (
                  <div className="empty-picker">
                    <CsLineIcons icon="user" size="32" />
                    <div className="mt-2">{searchTerm ? 'No customers found.' : 'No customers with phone numbers.'}</div>
                  </div>
                ) : (
                  customers.map((customer, idx) => {
                    const selected = isSelected(customer);
                    const disabled = isDisabled(customer);
                    const noPhone = !customer.phone;
                    return (
                      <div
                        // eslint-disable-next-line react/no-array-index-key
                        key={customer.phone || idx}
                        className={`customer-picker-row ${selected ? 'selected' : ''} ${disabled || noPhone ? 'disabled' : ''}`}
                        onClick={() => !disabled && !noPhone && toggleCustomer(customer)}
                        title={noPhone ? 'No phone number — cannot send WhatsApp' : ''}
                        role="checkbox"
                        aria-checked={selected}
                        tabIndex={disabled || noPhone ? -1 : 0}
                        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!disabled && !noPhone) toggleCustomer(customer); } }}
                      >
                        {/* Checkbox */}
                        <div
                          style={{
                            width: 18, height: 18,
                            borderRadius: '5px',
                            border: selected ? '2px solid #23b3f4' : '2px solid #cbd5e1',
                            background: selected ? '#23b3f4' : '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.15s',
                          }}
                        >
                          {selected && <CsLineIcons icon="check" size="11" style={{ color: '#fff' }} />}
                        </div>

                        {/* Avatar */}
                        <div className="picker-avatar">{getInitials(customer.name)}</div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="picker-name">{customer.name || 'Walk-in'}</div>
                          <div className="picker-phone">{customer.phone || 'No phone'}</div>
                        </div>

                        {/* Orders badge */}
                        {customer.total_orders > 0 && (
                          <span
                            className="picker-orders d-inline-flex align-items-center gap-1 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              history.push(`/crm/customers/${customer.phone}`);
                            }}
                            title="View order history"
                            style={{ zIndex: 10 }}
                          >
                            {customer.total_orders} orders
                            <CsLineIcons icon="eye" size="11" style={{ marginLeft: '2px', color: '#64748b' }} />
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <hr className="section-divider" />

              {/* Selected chips */}
              {selectedCustomers.length > 0 && (
                <div className="mb-3">
                  <div className="campaign-label mb-2">Selected Recipients</div>
                  <div>
                    {selectedCustomers.map((c) => (
                      <span key={c.phone} className="confirm-customer-chip">
                        <div className="wa-icon-badge">
                          <CsLineIcons icon="whatsapp" size="10" style={{ color: '#fff' }} />
                        </div>
                        {c.name || c.phone}
                        <button
                          type="button"
                          onClick={() => setSelectedCustomers((prev) => prev.filter((x) => x.phone !== c.phone))}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#64748b', lineHeight: 1, marginLeft: 2 }}
                          title="Remove"
                        >
                          <CsLineIcons icon="close" size="10" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Send Button */}
              <button
                type="button"
                className="send-btn"
                disabled={!canSend || isSequential}
                onClick={handleSend}
              >
                <>
                  <CsLineIcons icon="send" size="16" />
                  {selectedCustomers.length > 0
                    ? `Send to ${selectedCustomers.length} Customer${selectedCustomers.length > 1 ? 's' : ''}`
                    : 'Send WhatsApp Campaign'}
                </>
              </button>

              {!canSend && (
                <div className="mt-2 text-center" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  {!messageText.trim() && selectedCustomers.length === 0
                    ? 'Write a message and select customers to send'
                    : !messageText.trim()
                      ? 'Write a message first'
                      : 'Select at least one customer'}
                </div>
              )}

            </div>
          </Card>
        </Col>
      </Row>

      {/* ── Modal ────────────────────────────────────────────────────────────── */}
      <Modal show={showConfirmModal} onHide={closeModal} centered size="md" backdrop={isSequential ? 'static' : true} keyboard={!isSequential}>
        {!isSequential ? (
          /* ── Phase 1: Overview ── */
          <>
            <Modal.Header closeButton style={{ border: 'none', paddingBottom: 0 }}>
              <Modal.Title style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                <CsLineIcons icon="send" size="18" className="me-2" style={{ color: '#25d366' }} />
                Confirm Campaign Send
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2 pb-3 px-4">

              {/* Message preview */}
              <div className="mb-3 p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                {campaignName.trim() && (
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.88rem', marginBottom: '4px' }}>{campaignName.trim()}</div>
                )}
                <div style={{ fontSize: '0.82rem', color: '#475569', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '80px', overflow: 'hidden' }}>
                  {messageText.trim()}
                </div>
              </div>

              {/* Recipients */}
              <div className="campaign-label mb-2">Recipients ({selectedCustomers.length})</div>
              <div className="mb-3">
                {selectedCustomers.map((c) => (
                  <span key={c.phone} className="confirm-customer-chip">
                    <div className="wa-icon-badge"><CsLineIcons icon="send" size="9" style={{ color: '#fff' }} /></div>
                    {c.name || 'Walk-in'} · {c.phone}
                  </span>
                ))}
              </div>

              {/* Info */}
              {selectedImageFile && (
                <div className="p-2 rounded-3 d-flex align-items-start gap-2 mb-2"
                  style={{ background: 'rgba(37,211,102,0.07)', border: '1px solid rgba(37,211,102,0.2)', fontSize: '0.75rem', color: '#15803d' }}>
                  <CsLineIcons icon="whatsapp" size="13" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong>Campaign Image Included:</strong> When WhatsApp opens, the image will be copied to your clipboard. Simply <strong>paste (Ctrl+V)</strong> to attach it.
                  </div>
                </div>
              )}
              <div className="p-2 rounded-3 d-flex align-items-start gap-2"
                style={{ background: 'rgba(35,179,244,0.07)', border: '1px solid rgba(35,179,244,0.2)', fontSize: '0.75rem', color: '#0284c7' }}>
                <CsLineIcons icon="info-hexagon" size="13" style={{ flexShrink: 0, marginTop: 1 }} />
                You will send the campaign one customer at a time. Each click opens WhatsApp with the pre-filled message.
              </div>
            </Modal.Body>
            <Modal.Footer style={{ border: 'none', paddingTop: 0 }}>
              <Button variant="light" onClick={closeModal} style={{ borderRadius: '50px', fontWeight: 600, fontSize: '0.82rem' }}>Cancel</Button>
              <button type="button" className="send-btn" style={{ width: 'auto', padding: '8px 22px' }} onClick={startSequentialSend}>
                <CsLineIcons icon="send" size="14" />
                Start Sending
              </button>
            </Modal.Footer>
          </>
        ) : (
          /* ── Phase 2: Sequential Send ── */
          <>
            <Modal.Header style={{ border: 'none', paddingBottom: 0 }}>
              <Modal.Title style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                <CsLineIcons icon="send" size="18" className="me-2" style={{ color: '#25d366' }} />
                Sending Campaign
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2 pb-3 px-4">

              {/* Progress */}
              <div className="mb-3 d-flex align-items-center gap-2">
                {selectedCustomers.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1, height: 6, borderRadius: 6,
                      background: i < sendStep ? '#25d366' : i === sendStep ? '#23b3f4' : '#e2e8f0',
                      transition: 'background 0.3s',
                    }}
                  />
                ))}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1.2rem', textAlign: 'center' }}>
                Customer {sendStep + 1} of {selectedCustomers.length}
              </div>

              {/* Current customer card */}
              {currentCustomer && (
                <div className="p-3 rounded-3 text-center" style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #bbf7d0' }}>
                  <div
                    style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: 'linear-gradient(135deg,#25d366,#128c7e)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 10px',
                      fontSize: '1.2rem', fontWeight: 800, color: '#fff',
                      boxShadow: '0 4px 14px rgba(37,211,102,0.35)',
                    }}
                  >
                    {getInitials(currentCustomer.name)}
                  </div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>{currentCustomer.name || 'Walk-in'}</div>
                  <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '2px' }}>{currentCustomer.phone}</div>
                </div>
              )}

            </Modal.Body>
            <Modal.Footer style={{ border: 'none', paddingTop: 0, flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="send-btn"
                style={{ width: '100%', padding: '11px 22px', fontSize: '0.95rem' }}
                onClick={openCurrentStep}
              >
                <CsLineIcons icon="whatsapp" size="18" />
                Open WhatsApp for {currentCustomer?.name || currentCustomer?.phone}
              </button>
              <button
                type="button"
                onClick={closeModal}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.78rem', cursor: 'pointer', padding: '4px' }}
              >
                Cancel remaining
              </button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* Save Template Modal */}
      <Modal show={showSaveModal} onHide={() => setShowSaveModal(false)} centered size="sm">
        <Modal.Header closeButton style={{ border: 'none', paddingBottom: 0 }}>
          <Modal.Title style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
            Save Message Template
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2 pb-3 px-4">
          <Form onSubmit={handleSaveTemplate}>
            <Form.Group className="mb-3">
              <Form.Label className="campaign-label small mb-1">Template Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Festival Offer, Weekend Special"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                style={{ fontSize: '0.85rem', height: '38px', borderRadius: '8px' }}
                autoFocus
                required
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="light"
                size="sm"
                onClick={() => setShowSaveModal(false)}
                style={{ borderRadius: '50px', fontWeight: 600, fontSize: '0.8rem' }}
                disabled={savingTemplate}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                size="sm"
                style={{ borderRadius: '50px', fontWeight: 600, fontSize: '0.8rem', minWidth: '80px' }}
                disabled={savingTemplate}
              >
                {savingTemplate ? <Spinner animation="border" size="sm" /> : 'Save'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default WhatsappCampaign;
