"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchClients, type DbClient } from "@/lib/db";
import {
  fetchBatches,
  fetchBatchById,
  fetchConcepts,
  reviewConcept,
  type MetaBatch,
  type MetaConcept,
  type BatchStatus,
  type ReviewAction,
} from "@/lib/meta-api";

// ── Shared card style (matching dashboard pattern) ──────────────────────────

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid var(--card-border)",
  borderRadius: 10,
  boxShadow: "var(--card-shadow)",
  overflow: "hidden",
};

// ── Status badge config ─────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string; label: string; dot?: string }> = {
  draft:      { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb", label: "טיוטה" },
  generating: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", label: "מייצר", dot: "#3B82F6" },
  review:     { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A", label: "בסקירה", dot: "#F59E0B" },
  approved:   { bg: "#ECFDF5", color: "#065F46", border: "#A7F3D0", label: "אושר" },
  rejected:   { bg: "#FEF2F2", color: "#991B1B", border: "#FECACA", label: "נדחה" },
  pending:    { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A", label: "ממתין", dot: "#F59E0B" },
};

function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "md" }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.draft;
  const isSm = size === "sm";
  return (
    <span
      style={{
        fontSize: isSm ? 11 : 12,
        fontWeight: 700,
        padding: isSm ? "2px 7px" : "3px 10px",
        borderRadius: 20,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        letterSpacing: "0.01em",
      }}
    >
      {s.dot && (
        <span
          className={status === "generating" ? "pill-pulse" : ""}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: s.dot,
            flexShrink: 0,
          }}
        />
      )}
      {s.label}
    </span>
  );
}

// ── Image modal ─────────────────────────────────────────────────────────────

function ImageModal({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(8px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "zoom-out",
        animation: "backdropFadeIn 0.2s ease",
      }}
    >
      <img
        src={src}
        alt="Creative full size"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "90vw",
          maxHeight: "85vh",
          borderRadius: 12,
          boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
          cursor: "default",
          animation: "adminCountUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: "rgba(255,255,255,0.95)",
          border: "none",
          borderRadius: "50%",
          width: 40,
          height: 40,
          fontSize: 20,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#374151",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          transition: "transform 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        &times;
      </button>
    </div>
  );
}

// ── Reject feedback prompt ──────────────────────────────────────────────────

function RejectDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: (feedback: string) => void;
  onCancel: () => void;
}) {
  const [feedback, setFeedback] = useState("");
  return (
    <div
      style={{
        marginTop: 10,
        padding: "10px 12px",
        background: "#FEF2F2",
        borderRadius: 8,
        border: "1px solid #FECACA",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: "#991B1B", marginBottom: 6 }}>
        סיבת הדחייה
      </div>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="למה הקונספט לא מתאים? (לא חובה)..."
        dir="rtl"
        style={{
          width: "100%",
          minHeight: 56,
          padding: "8px 10px",
          borderRadius: 6,
          border: "1px solid #FECACA",
          fontSize: 12,
          fontFamily: "inherit",
          resize: "vertical",
          marginBottom: 8,
          background: "#fff",
        }}
      />
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => onConfirm(feedback)}
          style={{
            fontSize: 11,
            padding: "5px 12px",
            borderRadius: 6,
            border: "none",
            background: "#DC2626",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#B91C1C")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#DC2626")}
        >
          אישור דחייה
        </button>
        <button
          onClick={onCancel}
          style={{
            fontSize: 11,
            padding: "5px 12px",
            borderRadius: 6,
            border: "1px solid var(--card-border)",
            background: "#fff",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          ביטול
        </button>
      </div>
    </div>
  );
}

// ── Action Button ───────────────────────────────────────────────────────────

function ActionBtn({
  children,
  onClick,
  disabled,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant: "approve" | "reject" | "regenerate";
}) {
  const styles = {
    approve:    { bg: "#059669", hoverBg: "#047857", color: "#fff", border: "none" },
    reject:     { bg: "#FEF2F2", hoverBg: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA" },
    regenerate: { bg: "#FFFBEB", hoverBg: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A" },
  };
  const s = styles[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: 11,
        padding: "6px 12px",
        borderRadius: 6,
        border: s.border,
        background: s.bg,
        color: s.color,
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 600,
        transition: "background 0.15s, transform 0.1s",
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = s.hoverBg;
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = s.bg;
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(0.97)";
      }}
      onMouseUp={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {children}
    </button>
  );
}

// ── Loading skeleton ────────────────────────────────────────────────────────

function Skeleton({ width, height }: { width: string | number; height: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 6,
        background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
        backgroundSize: "400% 100%",
        animation: "shimmer 1.5s ease infinite",
      }}
    />
  );
}

function CardSkeleton() {
  return (
    <div style={{ ...CARD, padding: 0 }}>
      <Skeleton width="100%" height={200} />
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        <Skeleton width={60} height={20} />
        <Skeleton width="100%" height={48} />
        <div style={{ display: "flex", gap: 6 }}>
          <Skeleton width={60} height={28} />
          <Skeleton width={50} height={28} />
          <Skeleton width={70} height={28} />
        </div>
      </div>
    </div>
  );
}

// ── Concept Card ────────────────────────────────────────────────────────────

function ConceptCard({
  concept,
  index,
  onAction,
  onImageClick,
}: {
  concept: MetaConcept;
  index: number;
  onAction: (id: string, action: ReviewAction, feedback?: string) => void;
  onImageClick: (url: string) => void;
}) {
  const [showReject, setShowReject] = useState(false);
  const [acting, setActing] = useState(false);
  const [hovered, setHovered] = useState(false);

  const imgUrl = concept.final_image_url || concept.image_url;
  const onImageText = concept.concept_data?.onImageText;
  const adCopy = concept.concept_data?.adCopy;
  const overlayStyle = concept.concept_data?.visualIdea?.overlayStyle;

  const handleAction = async (action: ReviewAction, feedback?: string) => {
    setActing(true);
    await onAction(concept.id, action, feedback);
    setActing(false);
    setShowReject(false);
  };

  const isApproved = concept.status === "approved";
  const isRejected = concept.status === "rejected";

  return (
    <div
      className={`kpi-enter kpi-enter-${Math.min(index + 1, 8)}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...CARD,
        opacity: acting ? 0.5 : 1,
        transition: "opacity 0.2s, transform 0.2s, box-shadow 0.2s",
        transform: hovered && !acting ? "translateY(-2px)" : "none",
        boxShadow: hovered && !acting
          ? "0 8px 25px rgba(0,0,0,0.08)"
          : "var(--card-shadow)",
        borderColor: isApproved
          ? "#A7F3D0"
          : isRejected
            ? "#FECACA"
            : "var(--card-border)",
      }}
    >
      {/* Image thumbnail */}
      <div style={{ position: "relative" }}>
        {imgUrl ? (
          <img
            src={imgUrl}
            alt="Creative concept"
            onClick={() => onImageClick(imgUrl)}
            style={{
              width: "100%",
              aspectRatio: "1",
              objectFit: "cover",
              cursor: "zoom-in",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              aspectRatio: "1",
              background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {concept.status === "pending" ? (
              <>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>ממתין ליצירה...</span>
              </>
            ) : (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                </svg>
                <span style={{ fontSize: 11, color: "#d1d5db" }}>אין תמונה</span>
              </>
            )}
          </div>
        )}

        {/* Status overlay on image corner */}
        <div style={{ position: "absolute", top: 8, right: 8 }}>
          <StatusBadge status={concept.status} />
        </div>

        {/* Overlay style tag */}
        {overlayStyle && imgUrl && (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              fontSize: 9,
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 4,
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              backdropFilter: "blur(4px)",
              letterSpacing: "0.03em",
              textTransform: "uppercase",
            }}
          >
            {overlayStyle}
          </div>
        )}

        {/* Zoom hint on hover */}
        {imgUrl && hovered && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "opacity 0.2s",
              pointerEvents: "none",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "12px 14px" }}>
        {/* On-image text */}
        {onImageText && (onImageText.headline || onImageText.subline || onImageText.cta) && (
          <div
            dir="rtl"
            style={{
              background: "#f9fafb",
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: 10,
              borderInlineStart: "3px solid var(--brand)",
            }}
          >
            {onImageText.headline && (
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3, lineHeight: 1.4 }}>
                {onImageText.headline}
              </div>
            )}
            {onImageText.subline && (
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 3, lineHeight: 1.4 }}>
                {onImageText.subline}
              </div>
            )}
            {onImageText.cta && (
              <div style={{ fontSize: 11, color: "var(--brand)", fontWeight: 700, marginTop: 4 }}>
                {onImageText.cta}
              </div>
            )}
          </div>
        )}

        {/* Ad copy */}
        {adCopy?.primaryText && (
          <div
            dir="rtl"
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              lineHeight: 1.6,
              marginBottom: 10,
            }}
          >
            {adCopy.primaryText}
          </div>
        )}

        {/* Actions */}
        {concept.status === "pending" && !showReject && (
          <div style={{ display: "flex", gap: 6 }}>
            <ActionBtn variant="approve" onClick={() => handleAction("approved")} disabled={acting}>
              אישור
            </ActionBtn>
            <ActionBtn variant="reject" onClick={() => setShowReject(true)} disabled={acting}>
              דחייה
            </ActionBtn>
            <ActionBtn variant="regenerate" onClick={() => handleAction("regenerate")} disabled={acting}>
              יצירה מחדש
            </ActionBtn>
          </div>
        )}

        {/* Approved/rejected confirmation */}
        {isApproved && (
          <div style={{ fontSize: 11, color: "#059669", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
            אושר בהצלחה
          </div>
        )}
        {isRejected && (
          <div style={{ fontSize: 11, color: "#DC2626", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            נדחה
          </div>
        )}

        {showReject && (
          <RejectDialog
            onConfirm={(fb) => handleAction("rejected", fb)}
            onCancel={() => setShowReject(false)}
          />
        )}
      </div>
    </div>
  );
}

// ── Generation Progress ─────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  { key: "distill", label: "מפרק טרנסקריפט", icon: "📝" },
  { key: "copy", label: "כותב קופי", icon: "✍️" },
  { key: "text", label: "טקסט לתמונה", icon: "🔤" },
  { key: "visual", label: "מתכנן ויזואל", icon: "🎨" },
  { key: "imagen1", label: "מייצר רקע", icon: "🖼️" },
  { key: "overlay", label: "מוסיף שכבות", icon: "📐" },
  { key: "composite", label: "מרכיב טקסט + לוגו", icon: "🔲" },
  { key: "resize", label: "מתאים גדלים", icon: "📏" },
];

function GenerationProgress({
  conceptCount,
  pendingCount,
  batchSize,
  pollCount,
  onBack,
}: {
  conceptCount: number;
  pendingCount: number;
  batchSize: number;
  pollCount: number;
  onBack: () => void;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [dots, setDots] = useState("");
  const [elapsed, setElapsed] = useState(0);

  // Cycle through pipeline steps
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((s) => (s + 1) % PIPELINE_STEPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const completedCount = conceptCount > 0 ? conceptCount - pendingCount : 0;
  const totalTarget = batchSize || conceptCount || 1;
  const completedFraction = conceptCount > 0 ? (completedCount / totalTarget) * 100 : 0;

  // Estimated time: ~30s per concept is a rough estimate
  const estTotalSec = totalTarget * 30;
  const estRemaining = Math.max(0, estTotalSec - elapsed);
  const estMinutes = Math.ceil(estRemaining / 60);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${String(sec).padStart(2, "0")}` : `${sec}s`;
  };

  return (
    <div
      className="kpi-enter kpi-enter-5"
      style={{
        ...CARD,
        marginBottom: 18,
        borderTop: "3px solid #3B82F6",
        borderColor: "var(--card-border)",
        borderTopColor: "#3B82F6",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #f3f4f6",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            className="pill-pulse"
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#3B82F6",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
            מייצר קריאייטיב{dots}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
            {formatElapsed(elapsed)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: "var(--text-placeholder)" }}>
            בדיקה #{pollCount + 1} · כל 10 שניות
          </span>
          <button
            onClick={onBack}
            style={{
              fontSize: 11,
              padding: "5px 10px",
              borderRadius: 6,
              border: "1px solid var(--card-border)",
              background: "#fff",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#DC2626";
              e.currentTarget.style.color = "#DC2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--card-border)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            עזוב ושוב אח״כ
          </button>
        </div>
      </div>

      {/* Status info row */}
      <div
        style={{
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#f9fafb",
          borderBottom: "1px solid #f3f4f6",
        }}
      >
        <div style={{ display: "flex", gap: 16 }}>
          <div>
            <span style={{ fontSize: 10, color: "var(--text-placeholder)", fontWeight: 600 }}>יעד</span>
            <span className="num-display" style={{ fontSize: 16, color: "var(--text-primary)", marginInlineStart: 6 }}>
              {totalTarget}
            </span>
          </div>
          <div>
            <span style={{ fontSize: 10, color: "var(--text-placeholder)", fontWeight: 600 }}>מוכנים</span>
            <span className="num-display" style={{ fontSize: 16, color: "#059669", marginInlineStart: 6 }}>
              {completedCount}
            </span>
          </div>
          <div>
            <span style={{ fontSize: 10, color: "var(--text-placeholder)", fontWeight: 600 }}>בתהליך</span>
            <span className="num-display" style={{ fontSize: 16, color: "#D97706", marginInlineStart: 6 }}>
              {pendingCount || (conceptCount === 0 ? totalTarget : 0)}
            </span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {estMinutes > 0 ? `~${estMinutes} דק׳ נותרו (הערכה)` : "כמעט סיום..."}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "0 18px", paddingTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>התקדמות כללית</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8" }}>
            {Math.round(completedFraction)}%
          </span>
        </div>
        <div style={{ width: "100%", height: 8, borderRadius: 4, background: "#EFF6FF", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              borderRadius: 4,
              width: `${Math.max(completedFraction, conceptCount === 0 ? 3 : 5)}%`,
              background: "linear-gradient(90deg, #3B82F6, #818CF8)",
              transition: "width 0.8s ease",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s ease infinite",
              }}
            />
          </div>
        </div>
      </div>

      {/* Pipeline steps */}
      <div style={{ padding: "14px 18px", display: "flex", gap: 4, flexWrap: "wrap" }}>
        {PIPELINE_STEPS.map((step, i) => {
          const isActive = i === activeStep;
          const isDone = i < activeStep;
          return (
            <div
              key={step.key}
              style={{
                fontSize: 11,
                padding: "5px 10px",
                borderRadius: 6,
                background: isActive ? "#EFF6FF" : isDone ? "#ECFDF5" : "#f9fafb",
                color: isActive ? "#1D4ED8" : isDone ? "#065F46" : "var(--text-placeholder)",
                fontWeight: isActive ? 700 : 500,
                border: `1px solid ${isActive ? "#BFDBFE" : isDone ? "#A7F3D0" : "#f3f4f6"}`,
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "all 0.3s ease",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 12 }}>{isDone ? "✓" : step.icon}</span>
              {step.label}
            </div>
          );
        })}
      </div>

      {/* Safety note */}
      <div
        style={{
          padding: "10px 18px",
          borderTop: "1px solid #f3f4f6",
          fontSize: 11,
          color: "var(--text-placeholder)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        אפשר לעזוב את הדף ולחזור — היצירה ממשיכה ברקע. הדף מתעדכן אוטומטית.
      </div>
    </div>
  );
}

// ── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  color,
  index,
  accent,
}: {
  label: string;
  value: number;
  color: string;
  index: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`kpi-enter kpi-enter-${index}`}
      style={{
        ...CARD,
        padding: "14px 16px",
        borderTop: accent ? `3px solid ${color}` : undefined,
      }}
    >
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div
        className="num-display"
        style={{ fontSize: 28, color, lineHeight: 1 }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Batch Detail View ───────────────────────────────────────────────────────

function BatchDetail({ batchId, clients }: { batchId: string; clients: DbClient[] }) {
  const router = useRouter();
  const [batch, setBatch] = useState<MetaBatch | null>(null);
  const [concepts, setConcepts] = useState<MetaConcept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  const loadData = useCallback(async () => {
    try {
      const [conceptResult, batchData] = await Promise.all([
        fetchConcepts(batchId),
        fetchBatchById(batchId),
      ]);
      setConcepts(conceptResult.concepts);
      setBatch(batchData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בטעינה");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll while generating — also poll when 0 concepts (batch just created)
  const isGenerating =
    concepts.some((c) => c.status === "pending") ||
    (concepts.length === 0 && batch && ["draft", "generating"].includes(batch.status));

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      loadData();
      setPollCount((c) => c + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, [isGenerating, loadData]);

  const handleAction = async (conceptId: string, action: ReviewAction, feedback?: string) => {
    try {
      await reviewConcept(conceptId, action, feedback);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "שגיאה");
    }
  };

  const approved = concepts.filter((c) => c.status === "approved").length;
  const rejected = concepts.filter((c) => c.status === "rejected").length;
  const pending = concepts.filter((c) => c.status === "pending").length;

  const clientName = batch ? (clientMap[batch.client_id] || batch.client_id.slice(0, 8)) : "";

  return (
    <div style={{ padding: "24px 16px", maxWidth: 1100 }}>
      {modalImage && <ImageModal src={modalImage} onClose={() => setModalImage(null)} />}

      {/* Back link */}
      <Link
        href="/creatives"
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          marginBottom: 12,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--brand)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        חזרה לרשימה
      </Link>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0, lineHeight: 1.2 }}>
            סקירת באצ׳ {clientName && <span style={{ color: "var(--brand)" }}>— {clientName}</span>}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 11, color: "var(--text-placeholder)", fontFamily: "monospace", letterSpacing: "0.02em" }}>
              {batchId.slice(0, 8)}...
            </span>
            {batch && <StatusBadge status={batch.status} />}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Review progress (only when concepts exist) */}
          {!loading && concepts.length > 0 && (
            <>
              <div style={{ width: 120, height: 6, borderRadius: 3, background: "#f3f4f6", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 3,
                    width: `${((approved + rejected) / concepts.length) * 100}%`,
                    background: rejected > 0 && approved === 0
                      ? "#DC2626"
                      : "linear-gradient(90deg, #059669, #10B981)",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
                {approved + rejected}/{concepts.length}
              </span>
            </>
          )}
          {/* Back to create new — always available */}
          <Link
            href="/creatives/new"
            style={{
              fontSize: 11,
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid var(--card-border)",
              background: "#fff",
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--brand)";
              e.currentTarget.style.color = "var(--brand)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--card-border)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            באצ׳ חדש
          </Link>
        </div>
      </div>

      {/* Stats row */}
      {!loading && concepts.length > 0 && (
        <div
          className="responsive-grid-4"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}
        >
          <KpiCard label="סה״כ" value={concepts.length} color="var(--text-secondary)" index={1} />
          <KpiCard label="אושרו" value={approved} color="#059669" index={2} accent={approved > 0} />
          <KpiCard label="נדחו" value={rejected} color="#DC2626" index={3} accent={rejected > 0} />
          <KpiCard label="ממתינים" value={pending} color="#D97706" index={4} accent={pending > 0} />
        </div>
      )}

      {/* Generation pipeline progress — show when generating OR when empty & batch exists */}
      {isGenerating && (
        <GenerationProgress
          conceptCount={concepts.length}
          pendingCount={pending}
          batchSize={batch?.batch_size ?? 0}
          pollCount={pollCount}
          onBack={() => router.push("/creatives")}
        />
      )}

      {/* Content */}
      {loading ? (
        <div
          className="responsive-grid-4"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}
        >
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div style={{ ...CARD, padding: "48px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#DC2626", marginBottom: 6 }}>שגיאה בטעינה</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>{error}</div>
          <button
            onClick={() => { setError(null); setLoading(true); loadData(); }}
            style={{
              fontSize: 12,
              padding: "7px 16px",
              borderRadius: 6,
              border: "1px solid var(--card-border)",
              background: "#fff",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            נסה שוב
          </button>
        </div>
      ) : concepts.length === 0 && !isGenerating ? (
        <div style={{ ...CARD, padding: "48px 20px", textAlign: "center" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 12 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
            אין קונספטים
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
            הבאצ׳ הזה לא מכיל קונספטים
          </div>
          <Link
            href="/creatives/new"
            style={{
              fontSize: 12,
              padding: "8px 18px",
              borderRadius: 8,
              background: "var(--brand)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            צור באצ׳ חדש
          </Link>
        </div>
      ) : concepts.length > 0 ? (
        <div
          className="responsive-grid-4"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}
        >
          {concepts.map((concept, i) => (
            <ConceptCard
              key={concept.id}
              concept={concept}
              index={i}
              onAction={handleAction}
              onImageClick={(url) => setModalImage(url)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ── Batch List View ─────────────────────────────────────────────────────────

function BatchList({ clients }: { clients: DbClient[] }) {
  const router = useRouter();
  const [batches, setBatches] = useState<MetaBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BatchStatus | "all">("all");
  const [clientFilter, setClientFilter] = useState("");

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  useEffect(() => {
    setLoading(true);
    fetchBatches({
      ...(clientFilter ? { clientId: clientFilter } : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      limit: 100,
    })
      .then((r) => {
        setBatches(r.batches);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "שגיאה"))
      .finally(() => setLoading(false));
  }, [statusFilter, clientFilter]);

  // KPI counts
  const total = batches.length;
  const inReview = batches.filter((b) => b.status === "review").length;
  const approvedCount = batches.filter((b) => b.status === "approved").length;
  const rejectedCount = batches.filter((b) => b.status === "rejected").length;

  const statusTabs: { key: BatchStatus | "all"; label: string; count?: number }[] = [
    { key: "all", label: "הכל", count: total },
    { key: "draft", label: "טיוטה" },
    { key: "generating", label: "בייצור" },
    { key: "review", label: "בסקירה", count: inReview },
    { key: "approved", label: "אושרו" },
    { key: "rejected", label: "נדחו" },
  ];

  return (
    <div style={{ padding: "24px 16px", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            Meta קריאייטיב
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
            ניהול קריאייטיב — יצירת באנרים, סקירה ופרסום
          </p>
        </div>
        <Link
          href="/creatives/new"
          style={{
            fontSize: 12,
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: "var(--brand)",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 700,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 2px 8px rgba(124,58,237,0.25)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(124,58,237,0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(124,58,237,0.25)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          באצ׳ חדש
        </Link>
      </div>

      {/* KPI row */}
      <div
        className="responsive-grid-4"
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}
      >
        <KpiCard label="סה״כ באצ׳ים" value={total} color="var(--text-secondary)" index={1} />
        <KpiCard label="בסקירה" value={inReview} color="#D97706" index={2} accent={inReview > 0} />
        <KpiCard label="אושרו" value={approvedCount} color="#059669" index={3} />
        <KpiCard label="נדחו" value={rejectedCount} color="#DC2626" index={4} />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div
          style={{
            display: "flex",
            gap: 2,
            background: "#f3f4f6",
            borderRadius: 10,
            padding: 3,
          }}
        >
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  fontSize: 12,
                  padding: "5px 12px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  background: isActive ? "#fff" : "transparent",
                  color: isActive ? "var(--text-primary)" : "var(--text-placeholder)",
                  boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: isActive ? "var(--brand)" : "#d1d5db",
                      color: "#fff",
                      padding: "1px 5px",
                      borderRadius: 20,
                      lineHeight: "14px",
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px solid var(--card-border)",
            fontSize: 12,
            fontFamily: "inherit",
            background: "#fff",
            color: "var(--text-primary)",
            cursor: "pointer",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <option value="">כל הלקוחות</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ ...CARD, padding: "48px 20px", textAlign: "center" }}>
          <div className="pill-pulse" style={{ fontSize: 13, color: "var(--text-muted)" }}>
            טוען באצ׳ים...
          </div>
        </div>
      ) : error ? (
        <div style={{ ...CARD, padding: "48px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#DC2626", marginBottom: 6 }}>שגיאה</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{error}</div>
        </div>
      ) : batches.length === 0 ? (
        <div style={{ ...CARD, padding: "56px 20px", textAlign: "center" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1" strokeLinecap="round" style={{ marginBottom: 16 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
            אין באצ׳ים עדיין
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
            צור את הבאצ׳ הראשון שלך כדי להתחיל לייצר קריאייטיב
          </div>
          <Link
            href="/creatives/new"
            style={{
              fontSize: 12,
              padding: "8px 20px",
              borderRadius: 8,
              background: "var(--brand)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            צור באצ׳ ראשון
          </Link>
        </div>
      ) : (
        <div className="responsive-table-wrap" style={{ ...CARD }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["לקוח", "תאריך", "סטטוס", "קונספטים"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 16px",
                      textAlign: "right",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-placeholder)",
                      borderBottom: "1px solid #f3f4f6",
                      whiteSpace: "nowrap",
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batches.map((batch, i) => {
                const date = new Intl.DateTimeFormat("he-IL", {
                  timeZone: "Asia/Jerusalem",
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(batch.created_at));

                return (
                  <tr
                    key={batch.id}
                    className="hoverable"
                    onClick={() => router.push(`/creatives?batchId=${batch.id}`)}
                    style={{
                      borderBottom: i < batches.length - 1 ? "1px solid #f9fafb" : "none",
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                  >
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                      {clientMap[batch.client_id] || batch.client_id.slice(0, 8) + "..."}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }} dir="ltr">
                      {date}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <StatusBadge status={batch.status} />
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
                      {batch.batch_size}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main page component ─────────────────────────────────────────────────────

function CreativesContent() {
  const searchParams = useSearchParams();
  const batchId = searchParams.get("batchId");
  const [clients, setClients] = useState<DbClient[]>([]);

  useEffect(() => {
    fetchClients().then(setClients);
  }, []);

  if (batchId) {
    return <BatchDetail batchId={batchId} clients={clients} />;
  }

  return <BatchList clients={clients} />;
}

export default function CreativesPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "48px 16px", textAlign: "center" }}>
          <div className="pill-pulse" style={{ color: "var(--text-muted)", fontSize: 13 }}>
            טוען...
          </div>
        </div>
      }
    >
      <CreativesContent />
    </Suspense>
  );
}
