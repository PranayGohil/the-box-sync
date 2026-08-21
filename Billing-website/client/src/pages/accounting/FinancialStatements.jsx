import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const FinancialStatements = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('trial_balance');
  const [trialBalance, setTrialBalance] = useState(null);
  const [profitLoss, setProfitLoss] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [dayBook, setDayBook] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatements = async () => {
    setLoading(true);
    try {
      if (activeTab === 'trial_balance') {
        const res = await api.get('/accounting/trial-balance');
        if (res.data.success) setTrialBalance(res.data.data);
      } else if (activeTab === 'profit_loss') {
        const res = await api.get('/accounting/profit-loss');
        if (res.data.success) setProfitLoss(res.data.data);
      } else if (activeTab === 'balance_sheet') {
        const res = await api.get('/accounting/balance-sheet');
        if (res.data.success) setBalanceSheet(res.data.data);
      } else if (activeTab === 'day_book') {
        const res = await api.get('/accounting/day-book');
        if (res.data.success) setDayBook(res.data.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load financial statements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, [activeTab]);

  const fmt = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="financial-statements-page-container">
      {/* 1. Header with Responsive Action Button */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Financial Statements & Accounting Reports
          </h4>
          <p className="text-muted small mb-0">
            Authoritative double-entry trial balance, P&L statement, balance sheet, and day book
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end">
          <button className="btn btn-outline-secondary btn-sm flex-fill flex-sm-grow-0" onClick={handlePrint}>
            <i className="bi bi-printer me-1"></i> Print / Export
          </button>
          <button className="btn btn-primary-zenith btn-sm flex-fill flex-sm-grow-0" onClick={fetchStatements}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
        </div>
      </div>

      {/* 2. Responsive Segmented Statement Tabs */}
      <div className="card-zenith p-2 mb-4">
        <div className="d-flex overflow-auto gap-1" style={{ whiteSpace: 'nowrap' }}>
          <button
            className={`btn btn-sm flex-fill ${
              activeTab === 'trial_balance'
                ? 'btn-primary text-white fw-bold shadow-sm'
                : 'btn-outline-secondary bg-white text-dark'
            }`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={() => setActiveTab('trial_balance')}
          >
            <i className="bi bi-scales me-1"></i> Live Trial Balance
          </button>
          <button
            className={`btn btn-sm flex-fill ${
              activeTab === 'profit_loss'
                ? 'btn-primary text-white fw-bold shadow-sm'
                : 'btn-outline-secondary bg-white text-dark'
            }`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={() => setActiveTab('profit_loss')}
          >
            <i className="bi bi-graph-up me-1"></i> Profit & Loss (P&L)
          </button>
          <button
            className={`btn btn-sm flex-fill ${
              activeTab === 'balance_sheet'
                ? 'btn-primary text-white fw-bold shadow-sm'
                : 'btn-outline-secondary bg-white text-dark'
            }`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={() => setActiveTab('balance_sheet')}
          >
            <i className="bi bi-bank me-1"></i> Balance Sheet
          </button>
          <button
            className={`btn btn-sm flex-fill ${
              activeTab === 'day_book'
                ? 'btn-primary text-white fw-bold shadow-sm'
                : 'btn-outline-secondary bg-white text-dark'
            }`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={() => setActiveTab('day_book')}
          >
            <i className="bi bi-calendar-event me-1"></i> Day Book / Journal
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <div className="small text-muted mt-2">Computing double-entry ledgers...</div>
        </div>
      ) : (
        <>
          {/* --- 1. TRIAL BALANCE --- */}
          {activeTab === 'trial_balance' && trialBalance && (
            <div>
              {/* Balanced Status Banner */}
              <div
                className={`p-3 rounded mb-3 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 ${
                  trialBalance.isBalanced
                    ? 'bg-success-subtle text-success border border-success-subtle'
                    : 'bg-danger-subtle text-danger border border-danger-subtle'
                }`}
              >
                <div className="d-flex align-items-center gap-2 fw-bold">
                  <i
                    className={`bi ${
                      trialBalance.isBalanced ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'
                    } fs-5`}
                  ></i>
                  <span>
                    {trialBalance.isBalanced
                      ? 'TRIAL BALANCE IS BALANCED (Total Debit == Total Credit)'
                      : 'TRIAL BALANCE MISMATCH DETECTED'}
                  </span>
                </div>
                <div className="font-mono small fw-bold">
                  Diff: ₹{fmt(Math.abs(trialBalance.grandTotalDebit - trialBalance.grandTotalCredit))}
                </div>
              </div>

              {/* Desktop View Table */}
              <div className="card-zenith p-3 p-sm-4 d-none d-md-block">
                <div className="table-responsive">
                  <table className="table table-bordered align-middle mb-0">
                    <thead className="bg-light">
                      <tr style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <th style={{ width: '15%' }}>Account Code</th>
                        <th style={{ width: '35%' }}>Account Name</th>
                        <th style={{ width: '20%' }}>Classification Group</th>
                        <th style={{ width: '15%' }} className="text-end">Debit (₹)</th>
                        <th style={{ width: '15%' }} className="text-end">Credit (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trialBalance.rows?.map((row, idx) => (
                        <tr key={idx}>
                          <td className="font-mono small">{row.accountCode || '-'}</td>
                          <td className="fw-bold text-dark">{row.accountName}</td>
                          <td>
                            <span className="badge bg-light text-dark border">{row.groupName}</span>
                          </td>
                          <td className="text-end font-mono">
                            {row.debit > 0 ? `₹${fmt(row.debit)}` : '-'}
                          </td>
                          <td className="text-end font-mono">
                            {row.credit > 0 ? `₹${fmt(row.credit)}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-light fw-bold fs-6">
                      <tr>
                        <td colSpan="3" className="text-end text-uppercase">
                          Grand Total:
                        </td>
                        <td className="text-end font-mono text-primary">
                          ₹{fmt(trialBalance.grandTotalDebit)}
                        </td>
                        <td className="text-end font-mono text-primary">
                          ₹{fmt(trialBalance.grandTotalCredit)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Mobile View Cards */}
              <div className="d-md-none">
                {trialBalance.rows?.map((row, idx) => (
                  <div key={idx} className="invoice-card-mobile">
                    <div className="invoice-card-mobile-header">
                      <div className="fw-bold text-dark fs-6 text-truncate" style={{ maxWidth: '65%' }}>
                        {row.accountName}
                      </div>
                      <div className="small text-muted font-mono">
                        {row.accountCode ? `#${row.accountCode}` : ''}
                      </div>
                    </div>
                    <div className="mb-2">
                      <span className="badge bg-light text-muted border">{row.groupName}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top font-mono small">
                      <div>
                        Debit: <span className="fw-bold text-dark">{row.debit > 0 ? `₹${fmt(row.debit)}` : '₹0.00'}</span>
                      </div>
                      <div>
                        Credit: <span className="fw-bold text-dark">{row.credit > 0 ? `₹${fmt(row.credit)}` : '₹0.00'}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Mobile Grand Total Card */}
                <div className="card-zenith p-3 mt-3 bg-light border">
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-muted fw-bold">TOTAL DEBIT:</span>
                    <span className="fw-bold font-mono text-primary">₹{fmt(trialBalance.grandTotalDebit)}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-muted fw-bold">TOTAL CREDIT:</span>
                    <span className="fw-bold font-mono text-primary">₹{fmt(trialBalance.grandTotalCredit)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- 2. PROFIT & LOSS (P&L) --- */}
          {activeTab === 'profit_loss' && profitLoss && (
            <div className="card-zenith p-3 p-sm-4">
              {/* Top Net Profit Banner */}
              <div
                className={`p-3 p-sm-4 rounded mb-4 text-center border ${
                  profitLoss.netProfit >= 0
                    ? 'bg-success-subtle text-success border-success-subtle'
                    : 'bg-danger-subtle text-danger border-danger-subtle'
                }`}
              >
                <div className="small fw-bold text-uppercase" style={{ letterSpacing: '0.04em' }}>
                  NET OPERATING PROFIT / (LOSS) FOR THE PERIOD
                </div>
                <div className="fs-2 fw-extrabold font-mono mt-1">
                  {profitLoss.netProfit >= 0 ? '+' : '-'}₹{fmt(Math.abs(profitLoss.netProfit || 0))}
                </div>
              </div>

              <div className="row g-4">
                {/* Incomes */}
                <div className="col-12 col-md-6">
                  <div className="p-3 bg-light rounded border h-100">
                    <h6 className="fw-bold text-success border-bottom pb-2 mb-3 d-flex justify-content-between align-items-center">
                      <span><i className="bi bi-arrow-down-left-circle me-1"></i> REVENUES & INCOMES</span>
                      <span className="font-mono fs-6">₹{fmt(profitLoss.totalIncome)}</span>
                    </h6>
                    <div className="table-responsive">
                      <table className="table table-sm align-middle mb-0">
                        <tbody>
                          {(!profitLoss.incomes || profitLoss.incomes.length === 0) ? (
                            <tr><td className="text-muted text-center py-2">No income accounts</td></tr>
                          ) : (
                            profitLoss.incomes.map((inc, idx) => (
                              <tr key={idx}>
                                <td>{inc.accountName}</td>
                                <td className="text-end font-mono fw-bold text-success">₹{fmt(inc.amount)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Expenses */}
                <div className="col-12 col-md-6">
                  <div className="p-3 bg-light rounded border h-100">
                    <h6 className="fw-bold text-danger border-bottom pb-2 mb-3 d-flex justify-content-between align-items-center">
                      <span><i className="bi bi-arrow-up-right-circle me-1"></i> EXPENSES & OUTFLOWS</span>
                      <span className="font-mono fs-6">₹{fmt(profitLoss.totalExpense)}</span>
                    </h6>
                    <div className="table-responsive">
                      <table className="table table-sm align-middle mb-0">
                        <tbody>
                          {(!profitLoss.expenses || profitLoss.expenses.length === 0) ? (
                            <tr><td className="text-muted text-center py-2">No expense accounts</td></tr>
                          ) : (
                            profitLoss.expenses.map((exp, idx) => (
                              <tr key={idx}>
                                <td>{exp.accountName}</td>
                                <td className="text-end font-mono fw-bold text-danger">₹{fmt(exp.amount)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- 3. BALANCE SHEET --- */}
          {activeTab === 'balance_sheet' && balanceSheet && (
            <div className="card-zenith p-3 p-sm-4">
              <div className="row g-4">
                {/* Assets */}
                <div className="col-12 col-md-6">
                  <div className="p-3 bg-light rounded border h-100">
                    <h6 className="fw-bold text-primary border-bottom pb-2 mb-3 d-flex justify-content-between align-items-center">
                      <span><i className="bi bi-bank me-1"></i> TOTAL ASSETS</span>
                      <span className="font-mono fs-6">₹{fmt(balanceSheet.totalAssets)}</span>
                    </h6>
                    <div className="table-responsive">
                      <table className="table table-sm align-middle mb-0">
                        <tbody>
                          {(!balanceSheet.assets || balanceSheet.assets.length === 0) ? (
                            <tr><td className="text-muted text-center py-2">No asset accounts</td></tr>
                          ) : (
                            balanceSheet.assets.map((a, idx) => (
                              <tr key={idx}>
                                <td>{a.accountName}</td>
                                <td className="text-end font-mono fw-bold text-primary">₹{fmt(a.amount)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Liabilities & Equity */}
                <div className="col-12 col-md-6">
                  <div className="p-3 bg-light rounded border h-100">
                    <h6 className="fw-bold text-danger border-bottom pb-2 mb-3 d-flex justify-content-between align-items-center">
                      <span><i className="bi bi-credit-card-2-front me-1"></i> LIABILITIES & EQUITY</span>
                      <span className="font-mono fs-6">
                        ₹{fmt((balanceSheet.totalLiabilities || 0) + (balanceSheet.totalEquity || 0))}
                      </span>
                    </h6>
                    <div className="table-responsive">
                      <table className="table table-sm align-middle mb-0">
                        <tbody>
                          {balanceSheet.liabilities?.map((l, idx) => (
                            <tr key={idx}>
                              <td>{l.accountName}</td>
                              <td className="text-end font-mono fw-bold text-danger">₹{fmt(l.amount)}</td>
                            </tr>
                          ))}
                          {balanceSheet.equities?.map((eq, idx) => (
                            <tr key={idx}>
                              <td>{eq.accountName}</td>
                              <td className="text-end font-mono fw-bold text-info">₹{fmt(eq.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- 4. DAY BOOK --- */}
          {activeTab === 'day_book' && dayBook && (
            <div>
              {/* Desktop DataTable */}
              <div className="card-zenith p-3 p-sm-4 d-none d-md-block">
                <h6 className="fw-bold mb-3 text-dark">
                  <i className="bi bi-calendar-event text-primary me-2"></i>
                  Today's Journal Vouchers & Double-Entry Postings
                </h6>
                <div className="table-responsive">
                  <table className="table table-bordered align-middle mb-0">
                    <thead className="bg-light">
                      <tr style={{ fontSize: '0.78rem', textTransform: 'uppercase' }}>
                        <th>Entry #</th>
                        <th>Voucher Type</th>
                        <th>Narration / Details</th>
                        <th className="text-end">Total Debit (₹)</th>
                        <th className="text-end">Total Credit (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!dayBook.entries || dayBook.entries.length === 0) ? (
                        <tr><td colSpan="5" className="text-center text-muted py-4">No journal vouchers recorded today</td></tr>
                      ) : (
                        dayBook.entries.map((e) => (
                          <tr key={e._id}>
                            <td className="font-mono fw-bold text-primary">#{e.entryNo}</td>
                            <td>
                              <span className="badge bg-light text-dark border text-uppercase" style={{ fontSize: '0.68rem' }}>
                                {e.voucherType}
                              </span>
                            </td>
                            <td className="small">{e.narration}</td>
                            <td className="text-end font-mono">₹{fmt(e.totalDebit)}</td>
                            <td className="text-end font-mono">₹{fmt(e.totalCredit)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Touch Cards */}
              <div className="d-md-none">
                {(!dayBook.entries || dayBook.entries.length === 0) ? (
                  <div className="card-zenith p-4 text-center text-muted">
                    <i className="bi bi-calendar-event fs-1 d-block mb-2 text-secondary opacity-50"></i>
                    <div className="fw-bold">No Transactions Today</div>
                    <div className="small">Perform sales, purchases, or payments to generate vouchers.</div>
                  </div>
                ) : (
                  dayBook.entries.map((e) => (
                    <div key={e._id} className="invoice-card-mobile">
                      <div className="invoice-card-mobile-header">
                        <span className="font-mono fw-bold text-primary fs-6">#{e.entryNo}</span>
                        <span className="badge bg-light text-dark border text-uppercase" style={{ fontSize: '0.68rem' }}>
                          {e.voucherType}
                        </span>
                      </div>
                      <div className="mb-2 small text-dark">{e.narration}</div>
                      <div className="d-flex justify-content-between align-items-center pt-2 border-top font-mono small">
                        <div>
                          Debit: <span className="fw-bold text-dark">₹{fmt(e.totalDebit)}</span>
                        </div>
                        <div>
                          Credit: <span className="fw-bold text-dark">₹{fmt(e.totalCredit)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
