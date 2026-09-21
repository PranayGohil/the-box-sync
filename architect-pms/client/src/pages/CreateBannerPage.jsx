import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAPI } from "../services/api";
import LoadingGlass from "../components/LoadingGlass";
import PageHeader from "../components/common/PageHeader";
import PrismButton from "../components/common/PrismButton";
import { Printer, ArrowLeft, Building2, ChevronDown, Image } from "lucide-react";

/* ──────────────────────────────────────────────
   Site Signage & Project Banner Generator
   Produces a print-perfect A3 construction board
   ────────────────────────────────────────────── */

const STATUS_LABELS = {
  submitted: "Submitted",
  under_scrutiny: "Under Scrutiny",
  query_raised: "Query Raised",
  approved: "Approved",
  rejected: "Rejected",
  rajachitthi_issued: "Rajachitthi Issued",
};

const CreateBannerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(id || "");
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    fetchAPI("/projects?limit=200")
      .then((res) => {
        if (res.success) {
          setProjects(res.data);
          if (!selectedProjectId && res.data.length > 0) {
            setSelectedProjectId(res.data[0]._id);
          }
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    setLoading(true);
    fetchAPI(`/projects/${selectedProjectId}/banner`)
      .then((res) => {
        if (res.success) setBanner(res.banner);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedProjectId]);

  useEffect(() => {
    const handleBefore = () => setIsPrinting(true);
    const handleAfter = () => setIsPrinting(false);
    window.addEventListener("beforeprint", handleBefore);
    window.addEventListener("afterprint", handleAfter);
    return () => {
      window.removeEventListener("beforeprint", handleBefore);
      window.removeEventListener("afterprint", handleAfter);
    };
  }, []);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 60);
  };

  return (
    <div>
      {/* ── Page Header ── */}
      <PageHeader
        title="Site Signage Generator"
        subtitle="Print-ready site display board with municipal permit details"
        icon={Image}
        iconColor="#06b6d4"
        iconBg="#ecfeff"
        showBack
        backLabel="Back"
        onBack={() => navigate(-1)}
        className="print-hide"
      />

      {/* ── Top-Centered Case Selector (before banner, hidden on print) ── */}
      <div
        className="print-hide"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1.5rem",
          width: "100%",
        }}
      >
        <label
          style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "0.4rem",
            textAlign: "center",
          }}
        >
          Select Project Case
        </label>
        <div
          className="banner-select-wrapper"
          style={{ width: "100%", maxWidth: "420px" }}
        >
          <select
            className="banner-select-input"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.caseNo} — {p.projectName}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#64748b",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      {/* ── Board or Loader ── */}
      {loading || !banner ? (
        <LoadingGlass message="Rendering Site Banner..." />
      ) : (
        <>
          <ResponsiveBannerContainer banner={banner} isPrinting={isPrinting} />

          {/* Bottom Action Button (below banner, hidden on print) */}
          <div
            className="print-hide"
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "1.75rem",
              marginBottom: "2.5rem",
            }}
          >
            <PrismButton
              variant="primary"
              size="lg"
              icon={Printer}
              onClick={handlePrint}
            >
              Print / Save PDF
            </PrismButton>
          </div>
        </>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────
   Responsive Banner Scaler (Fits single screen without horizontal scroll)
   ────────────────────────────────────────────── */
const ResponsiveBannerContainer = ({ banner, isPrinting }) => {
  const wrapperRef = useRef(null);
  const boardRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [boardHeight, setBoardHeight] = useState(0);

  useLayoutEffect(() => {
    if (isPrinting) return;
    const handleResize = () => {
      if (wrapperRef.current && boardRef.current) {
        const wrapperWidth = wrapperRef.current.getBoundingClientRect().width;
        const targetWidth = 900;
        const currentHeight = boardRef.current.offsetHeight;
        setBoardHeight(currentHeight);

        if (wrapperWidth > 0 && wrapperWidth < targetWidth) {
          setScale(wrapperWidth / targetWidth);
        } else {
          setScale(1);
        }
      }
    };

    handleResize();

    const resizeObserver = new ResizeObserver(() => handleResize());
    if (wrapperRef.current) resizeObserver.observe(wrapperRef.current);
    if (boardRef.current) resizeObserver.observe(boardRef.current);

    return () => resizeObserver.disconnect();
  }, [banner, isPrinting]);

  const activeScale = isPrinting ? 1 : scale;

  return (
    <div
      ref={wrapperRef}
      className="site-banner-scroll-wrapper"
      style={{
        width: "100%",
        maxWidth: "900px",
        margin: "0 auto",
        height: !isPrinting && activeScale < 1 && boardHeight > 0 ? `${boardHeight * activeScale}px` : "auto",
        overflow: isPrinting ? "visible" : "hidden",
        position: "relative",
      }}
    >
      <div
        className="site-banner-scale-container"
        style={{
          width: "900px",
          transform: isPrinting ? "none" : `scale(${activeScale})`,
          transformOrigin: "top left",
          transition: isPrinting ? "none" : "transform 0.15s ease-out",
        }}
      >
        <div ref={boardRef}>
          <PrintBoard banner={banner} />
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────
   The actual printable board component
   ────────────────────────────────────────────── */
const PrintBoard = ({ banner }) => {
  const statusLabel = STATUS_LABELS[banner.status] || banner.status;

  return (
    <div
      id="printable-site-banner"
      className="site-banner-board"
      style={{
        width: "900px",
        minWidth: "900px",
        background: "#ffffff",
        color: "#111827",
        fontFamily: '"Arial", "Helvetica Neue", sans-serif',
        border: "6px solid #1e3a5f",
        borderRadius: "4px",
        overflow: "hidden",
        boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
        pageBreakInside: "avoid",
      }}
    >
      {/* ── TOP HEADER BAND ── */}
      <div
        className="site-banner-header-band"
        style={{
          background: "#1e3a5f",
          padding: "20px 28px",
          display: "flex",
          alignItems: "center",
          gap: "18px",
          flexWrap: "wrap",
        }}
      >
        {/* Logo Box */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "8px",
            width: "64px",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Building2 size={40} color="#1e3a5f" />
        </div>
        {/* Firm Name */}
        <div style={{ flex: 1, minWidth: "180px" }}>
          <div
            style={{
              color: "#ffffff",
              fontWeight: 900,
              fontSize: "1.35rem",
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              lineHeight: 1.2,
            }}
          >
            {banner.firmTitle}
          </div>
          <div
            style={{
              color: "#93c5fd",
              fontWeight: 700,
              fontSize: "0.78rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginTop: "4px",
            }}
          >
            Chartered Architects &amp; Municipal Consultants
          </div>
        </div>
        {/* Authority Badge */}
        <div
          style={{
            background: "#dc2626",
            color: "#ffffff",
            fontWeight: 900,
            fontSize: "0.7rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            borderRadius: "6px",
            padding: "8px 14px",
            textAlign: "center",
            flexShrink: 0,
            lineHeight: 1.4,
          }}
        >
          Municipal Approved
          <br />
          Construction Site
        </div>
      </div>

      {/* ── PROJECT TITLE BANNER ── */}
      <div
        className="site-banner-title-banner"
        style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
          padding: "22px 28px",
          textAlign: "center",
          borderTop: "3px solid #3b82f6",
          borderBottom: "3px solid #1e3a5f",
        }}
      >
        <h1
          style={{
            color: "#ffffff",
            fontWeight: 900,
            fontSize: "2rem",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            margin: 0,
            lineHeight: 1.2,
            textShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          {banner.projectName}
        </h1>
        <div
          style={{
            marginTop: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              color: "#fbbf24",
              fontWeight: 800,
              fontSize: "1rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Owner:
          </span>
          <span style={{ color: "#fde68a", fontWeight: 700, fontSize: "1rem" }}>
            {banner.ownerName}
          </span>
        </div>
      </div>

      {/* ── PERMIT INFO GRID ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
          borderBottom: "2px solid #1e3a5f",
        }}
      >
        {/* Case No */}
        <div
          style={{
            padding: "16px 24px",
            borderRight: "2px solid #1e3a5f",
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              fontSize: "0.68rem",
              fontWeight: 800,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "6px",
            }}
          >
            Building Permission Case No.
          </div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 900,
              color: "#1e40af",
              letterSpacing: "0.02em",
            }}
          >
            {banner.caseNo}
          </div>
        </div>
        {/* Rajachitthi */}
        <div style={{ padding: "16px 24px", background: "#f0fdf4" }}>
          <div
            style={{
              fontSize: "0.68rem",
              fontWeight: 800,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "6px",
            }}
          >
            Rajachitthi Permit No. &amp; Date
          </div>
          <div
            style={{ fontSize: "1.35rem", fontWeight: 900, color: "#15803d" }}
          >
            {banner.rajachitthiNo || "Pending"}
            {banner.rajachitthiDate ? ` (${banner.rajachitthiDate})` : ""}
          </div>
        </div>
      </div>

      {/* ── SITE LOCATION ── */}
      <div
        style={{
          padding: "14px 24px",
          background: "#f1f5f9",
          borderBottom: "2px solid #1e3a5f",
        }}
      >
        <div
          style={{
            fontSize: "0.68rem",
            fontWeight: 800,
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "4px",
          }}
        >
          📍 Site Location &amp; Plot Details
        </div>
        <div
          style={{
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "#1f2937",
            lineHeight: 1.5,
          }}
        >
          {banner.siteAddress}
        </div>
      </div>

      {/* ── PROFESSIONAL TEAM TABLE ── */}
      <div style={{ padding: "18px 24px", borderBottom: "2px solid #1e3a5f" }}>
        <div
          style={{
            fontSize: "0.72rem",
            fontWeight: 800,
            color: "#1e3a5f",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginBottom: "14px",
            paddingBottom: "8px",
            borderBottom: "2px solid #1e3a5f",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>👷</span> Appointed Professional Team
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px 28px",
          }}
        >
          {[
            { role: "Chief Architect", value: banner.architect },
            { role: "Licensed Engineer", value: banner.engineer },
            { role: "Contractor (COW)", value: banner.contractor },
            { role: "Structural Engineer", value: banner.structuralEngineer },
            { role: "Developer / Builder", value: banner.developer },
            { role: null, value: null }, // spacer
          ].map((row, i) =>
            row.role ? (
              <div key={i}>
                <div
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: "2px",
                  }}
                >
                  {row.role}:
                </div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#111827",
                    lineHeight: 1.4,
                  }}
                >
                  {row.value || "—"}
                </div>
              </div>
            ) : (
              <div key={i} />
            ),
          )}
        </div>
      </div>

      {/* ── STATUS & FOOTER ── */}
      <div
        style={{
          background: "#1e3a5f",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 800,
              color: "#93c5fd",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Permit Status:
          </span>
          <span
            style={{
              background:
                banner.status === "approved" ||
                banner.status === "rajachitthi_issued"
                  ? "#16a34a"
                  : banner.status === "rejected"
                    ? "#dc2626"
                    : "#d97706",
              color: "#ffffff",
              fontWeight: 900,
              fontSize: "0.8rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              borderRadius: "4px",
              padding: "4px 14px",
            }}
          >
            {statusLabel}
          </span>
        </div>
        <div
          style={{
            fontSize: "0.65rem",
            color: "#93c5fd",
            fontWeight: 600,
            textAlign: "right",
            lineHeight: 1.5,
          }}
        >
          * As mandated under Section 263 of Municipal Corporation Act
          <br />
          Display prominently at construction site entrance
        </div>
        <div
          style={{
            fontSize: "0.7rem",
            fontWeight: 800,
            color: "#dbeafe",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          ARCHITECT PMS PLATFORM
        </div>
      </div>
    </div>
  );
};

export default CreateBannerPage;
