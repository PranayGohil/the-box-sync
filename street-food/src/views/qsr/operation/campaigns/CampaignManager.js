import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { Row, Col, Card, Button, Form, Spinner, Modal, InputGroup, Badge } from 'react-bootstrap';
import axios from 'axios';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import { AuthContext } from 'contexts/AuthContext';
import { getCustomerList } from 'api/customerService';

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

  /* Customer picker */
  .customer-search-input {
    border: 1.5px solid #e2e8f0;
    border-radius: 10px 0 0 10px;
    font-size: 0.82rem;
    padding: 8px 12px;
    outline: none;
    width: 100%;
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
    width: 20px; height: 20px;
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

const MAX_SELECTED = 5;
const MAX_CHARS = 1000;

/* ─── Component ─────────────────────────────────────────────────────────────────── */
const CampaignManager = () => {
  const title = 'Campaign Manager';
  const description = 'Compose WhatsApp campaigns and send them to your customers.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/campaigns', text: 'Campaign Manager' },
  ];

  const { currentUser } = useContext(AuthContext);

  // Compose state
  const [campaignName, setCampaignName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [restaurantName, setRestaurantName] = useState('');

  // Customer picker state
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  // Send state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sendStep, setSendStep] = useState(-1); // -1 = overview, 0..N = sequential sending

  const fetchRef = useRef(false);

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

  // Fetch customer list
  const fetchCustomers = useCallback(async () => {
    if (fetchRef.current) return;
    fetchRef.current = true;
    setLoadingCustomers(true);
    try {
      const res = await getCustomerList({ page: 1, limit: 200, search: searchTerm, sortBy: 'total_orders', sortOrder: 'desc' });
      if (res.data?.success) {
        setCustomers(res.data.data || []);
      }
    } catch {
      toast.error('Could not load customers.');
    } finally {
      setLoadingCustomers(false);
      fetchRef.current = false;
    }
  }, [searchTerm]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleSearch = () => {
    setSearchTerm(searchInput.trim());
    setSelectedCustomers([]);
  };
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') { setSearchInput(''); setSearchTerm(''); }
  };

  const toggleCustomer = (customer) => {
    if (!customer.phone) return;
    setSelectedCustomers((prev) => {
      const isSelected = prev.find((c) => c.phone === customer.phone);
      if (isSelected) return prev.filter((c) => c.phone !== customer.phone);
      if (prev.length >= MAX_SELECTED) return prev;
      return [...prev, customer];
    });
  };

  const isSelected = (customer) => !!selectedCustomers.find((c) => c.phone === customer.phone);
  const isDisabled = (customer) => !isSelected(customer) && selectedCustomers.length >= MAX_SELECTED;

  // Build final message
  const buildMessage = (phone) => {
    let msg = '';
    if (campaignName.trim()) msg += `*${campaignName.trim()}*\n\n`;
    msg += messageText.trim();
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
  const openCurrentStep = () => {
    const customer = selectedCustomers[sendStep];
    if (!customer) return;

    const message = buildMessage();
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

      <div className="page-title-container mb-4">
        <Row className="align-items-center g-2">
          <Col>
            <h1 className="mb-0 fw-bold" style={{ color: '#1e293b', fontSize: '1.5rem' }}>{title}</h1>
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

              {/* Message */}
              <div className="mb-3">
                <label className="campaign-label">Message *</label>
                <textarea
                  className="campaign-input"
                  rows={6}
                  placeholder="Write your campaign message here..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value.slice(0, MAX_CHARS))}
                />
                <div className={`char-count ${charClass}`}>{charCount} / {MAX_CHARS}</div>
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
                  {!messageText.trim() && !campaignName.trim() ? (
                    <div className="wa-empty-hint">
                      <CsLineIcons icon="chat-group" size="28" style={{ display: 'block', margin: '0 auto 8px' }} />
                      Your message preview will appear here
                    </div>
                  ) : (
                    <div className="wa-bubble">
                      <div className="wa-bubble-text">
                        {campaignName.trim() && (
                          <>
                            <strong>{campaignName.trim()}</strong>
                            {'\n\n'}
                          </>
                        )}
                        {renderWhatsAppText(messageText)}
                        {restaurantName && (
                          <>
                            {'\n\n'}
                            <span style={{ color: '#64748b', fontSize: '0.78rem' }}>— {restaurantName}</span>
                          </>
                        )}
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
                  {selectedCustomers.length} / {MAX_SELECTED}
                </span>
              </div>
            </div>
            <div className="campaign-card-body">

              {/* Search */}
              <div className="mb-3">
                <InputGroup>
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
              </div>

              {/* Info note */}
              <div
                className="mb-3 px-3 py-2 rounded-3 d-flex align-items-center gap-2"
                style={{ background: 'rgba(35,179,244,0.06)', border: '1px solid rgba(35,179,244,0.15)', fontSize: '0.75rem', color: '#0284c7' }}
              >
                <CsLineIcons icon="info-hexagon" size="13" />
                Maximum {MAX_SELECTED} customers per campaign (WhatsApp limit)
              </div>

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
                        title={noPhone ? 'No phone number — cannot send WhatsApp' : disabled ? `Max ${MAX_SELECTED} customers already selected` : ''}
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
                          <span className="picker-orders">{customer.total_orders} orders</span>
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
    </>
  );
};

export default CampaignManager;
