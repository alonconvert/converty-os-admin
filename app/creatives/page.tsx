"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchClients, type DbClient } from "@/lib/db";
import {
  fetchBatches,
  fetchConcepts,
  reviewConcept,
  type MetaBatch,
  type MetaConcept,
  type BatchStatus,
  type ReviewAction,
} from "@/lib/meta-api";

// ── Status badge config ─────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: "#f3f4f6", color: "#9ca3af", label: "טיוטה" },
  generating: { bg: "#EFF6FF", color: "#3B82F6", label: "מייצר" },
  review: { bg: "#FFFBEB", color: "#d97706", label: "בסקירה" },
  approved: { bg: "#f0fdf4", color: "#16a34a", label: "אושר" },
  rejected: { bg: "#fef2f2", color: "#dc2626", label: "נדחה" },
  pending: { bg: "#FFFBEB", color: "#d97706", label: "ממתין" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.draft;
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 700,
        padding: "2px 6px",
        borderRadius: 3,
        background: s.bg,
        color: s.color,
        whiteSpace: "nowrap",
      }}
    >
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
        background: "rgba(0,0,0,0.75)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "zoom-out",
      }}
    >
      <img
        src={src}
        alt="Creative full size"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "90vw",
          maxHeight: "90vh",
          borderRadius: 8,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          cursor: "default",
        }}
      />
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: "rgba(255,255,255,0.9)",
          border: "none",
          borderRadius: "50%",
          width: 36,
          height: 36,
          fontSize: 18,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#374151",
        }}
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
    <div style={{ marginTop: 8 }}>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="סיבת הדחייה (לא חובה)..."
        dir="rtl"
        style={{
          width: "100%",
          minHeight: 60,
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid #fca5a5",
          fontSize: 12,
          fontFamily: "inherit",
          resize: "vertical",
          marginBottom: 6,
        }}
      />
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => onConfirm(feedback)}
          style={{
            fontSize: 11,
            padding: "4px 10px",
            borderRadius: 4,
            border: "none",
            background: "#dc2626",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          אישור דחייה
        </button>
        <button
          onClick={onCancel}
          style={{
            fontSize: 11,
            padding: "4px 10px",
            borderRadius: 4,
            border: "1px solid #e5e7eb",
            background: "#fff",
            color: "#374151",
            cursor: "pointer",
          }}
        >
          ביטול
        </button>
      </div>
    </div>
  );
}

// ── Concept Card ────────────────────────────────────────────────────────────

function ConceptCard({
  concept,
  onAction,
  onImageClick,
}: {
  concept: MetaConcept;
  onAction: (id: string, action: ReviewAction, feedback?: string) => void;
  onImageClick: (url: string) => void;
}) {
  const [showReject, setShowReject] = useState(false);
  const [acting, setActing] = useState(false);

  const imgUrl = concept.final_image_url || concept.image_url;
  const onImageText = concept.concept_data?.onImageText;
  const adCopy = concept.concept_data?.adCopy;

  const handleAction = async (action: ReviewAction, feedback?: string) => {
    setActing(true);
    await onAction(concept.id, action, feedback);
    setActing(false);
    setShowReject(false);
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        overflow: "hidden",
        opacity: acting ? 0.6 : 1,
        transition: "opacity 0.2s",
      }}
    >
      {/* Image thumbnail */}
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
            borderBottom: "1px solid #f3f4f6",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            aspectRatio: "1",
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
            fontSize: 12,
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          {concept.status === "pending" ? "ממתין ליצירה..." : "אין תמונה"}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "10px 12px" }}>
        {/* Status */}
        <div style={{ marginBottom: 8 }}>
          <StatusBadge status={concept.status} />
        </div>

        {/* On-image text */}
        {onImageText && (
          <div
            dir="rtl"
            style={{
              background: "#f9fafb",
              borderRadius: 6,
              padding: "8px 10px",
              marginBottom: 8,
            }}
          >
            {onImageText.headline && (
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 2 }}>
                {onImageText.headline}
              </div>
            )}
            {onImageText.subline && (
              <div style={{ fontSize: 12, color: "#374151", marginBottom: 2 }}>
                {onImageText.subline}
              </div>
            )}
            {onImageText.cta && (
              <div style={{ fontSize: 11, color: "#7C3AED", fontWeight: 600 }}>
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
              color: "#6b7280",
              lineHeight: 1.5,
              marginBottom: 8,
            }}
          >
            {adCopy.primaryText}
          </div>
        )}

        {/* Actions */}
        {concept.status === "pending" && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              onClick={() => handleAction("approved")}
              disabled={acting}
              style={{
                fontSize: 11,
                padding: "5px 10px",
                borderRadius: 5,
                border: "none",
                background: "#22c55e",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              אישור
            </button>
            <button
              onClick={() => setShowReject(true)}
              disabled={acting}
              style={{
                fontSize: 11,
                padding: "5px 10px",
                borderRadius: 5,
                border: "1px solid #fca5a5",
                background: "#fef2f2",
                color: "#dc2626",
                cursor: "pointer",
              }}
            >
              דחייה
            </button>
            <button
              onClick={() => handleAction("regenerate")}
              disabled={acting}
              style={{
                fontSize: 11,
                padding: "5px 10px",
                borderRadius: 5,
                border: "1px solid #fde68a",
                background: "#FFFBEB",
                color: "#d97706",
                cursor: "pointer",
              }}
            >
              יצירה מחדש
            </button>
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

// ── Batch Detail View ───────────────────────────────────────────────────────

function BatchDetail({ batchId }: { batchId: string }) {
  const [concepts, setConcepts] = useState<MetaConcept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

  const loadConcepts = useCallback(async () => {
    try {
      const result = await fetchConcepts(batchId);
      setConcepts(result.concepts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בטעינה");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    loadConcepts();
  }, [loadConcepts]);

  // Poll while generating
  const hasGenerating = concepts.some((c) => c.status === "pending") && concepts.length > 0;
  useEffect(() => {
    if (!hasGenerating) return;
    const interval = setInterval(loadConcepts, 10000);
    return () => clearInterval(interval);
  }, [hasGenerating, loadConcepts]);

  const handleAction = async (conceptId: string, action: ReviewAction, feedback?: string) => {
    try {
      await reviewConcept(conceptId, action, feedback);
      await loadConcepts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "שגיאה");
    }
  };

  const approved = concepts.filter((c) => c.status === "approved").length;
  const rejected = concepts.filter((c) => c.status === "rejected").length;
  const pending = concepts.filter((c) => c.status === "pending").length;

  return (
    <div style={{ padding: "18px 16px", maxWidth: 1100 }}>
      {modalImage && <ImageModal src={modalImage} onClose={() => setModalImage(null)} />}

      {/* Back link + header */}
      <Link
        href="/creatives"
        style={{
          fontSize: 12,
          color: "#6b7280",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 14 }}>&larr;</span> חזרה לרשימה
      </Link>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
            סקירת באצ׳
          </h1>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2, fontFamily: "monospace" }}>
            {batchId}
          </p>
        </div>
      </div>

      {/* Stats row */}
      {!loading && (
        <div
          className="responsive-grid-4"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}
        >
          {[
            { label: "סה״כ", value: concepts.length, color: "#374151" },
            { label: "אושרו", value: approved, color: "#16a34a" },
            { label: "נדחו", value: rejected, color: "#dc2626" },
            { label: "ממתינים", value: pending, color: "#d97706" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              style={{
                background: "#fff",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                padding: "12px 14px",
              }}
            >
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>{kpi.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: kpi.color, lineHeight: 1.1 }}>
                {kpi.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generating notice */}
      {hasGenerating && (
        <div
          style={{
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 14,
            fontSize: 12,
            color: "#1D4ED8",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span className="pill-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6", flexShrink: 0 }} />
          יצירת תמונות בתהליך — הדף מתעדכן אוטומטית כל 10 שניות
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ fontSize: 13, color: "#9ca3af", padding: "40px 0", textAlign: "center" }}>
          טוען קונספטים...
        </div>
      ) : error ? (
        <div style={{ fontSize: 13, color: "#dc2626", padding: "40px 0", textAlign: "center" }}>
          {error}
        </div>
      ) : concepts.length === 0 ? (
        <div style={{ fontSize: 13, color: "#9ca3af", padding: "40px 0", textAlign: "center" }}>
          אין קונספטים עדיין — הבאצ׳ ייווצר בקרוב
        </div>
      ) : (
        <div
          className="responsive-grid-4"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}
        >
          {concepts.map((concept) => (
            <ConceptCard
              key={concept.id}
              concept={concept}
              onAction={handleAction}
              onImageClick={(url) => setModalImage(url)}
            />
          ))}
        </div>
      )}
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

  const statusTabs: { key: BatchStatus | "all"; label: string }[] = [
    { key: "all", label: `הכל (${total})` },
    { key: "draft", label: "טיוטה" },
    { key: "generating", label: "בייצור" },
    { key: "review", label: "בסקירה" },
    { key: "approved", label: "אושרו" },
    { key: "rejected", label: "נדחו" },
  ];

  return (
    <div style={{ padding: "18px 16px", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Meta קריאייטיב</h1>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            ניהול קריאייטיב — יצירת באנרים, סקירה ופרסום
          </p>
        </div>
        <Link
          href="/creatives/new"
          style={{
            fontSize: 12,
            padding: "7px 14px",
            borderRadius: 6,
            border: "none",
            background: "#7C3AED",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          + באצ׳ חדש
        </Link>
      </div>

      {/* KPI row */}
      <div
        className="responsive-grid-4"
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}
      >
        {[
          { label: "סה״כ באצ׳ים", value: total, color: "#374151" },
          { label: "בסקירה", value: inReview, color: inReview > 0 ? "#d97706" : "#9ca3af" },
          { label: "אושרו", value: approvedCount, color: "#16a34a" },
          { label: "נדחו", value: rejectedCount, color: "#dc2626" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              padding: "12px 14px",
            }}
          >
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: kpi.color, lineHeight: 1.1 }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters: status tabs + client dropdown */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <div
          style={{
            display: "flex",
            gap: 2,
            background: "#f3f4f6",
            borderRadius: 8,
            padding: 3,
            width: "fit-content",
          }}
        >
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              style={{
                fontSize: 12,
                padding: "5px 14px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                background: statusFilter === tab.key ? "#fff" : "transparent",
                color: statusFilter === tab.key ? "#111827" : "#9ca3af",
                boxShadow: statusFilter === tab.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          style={{
            padding: "5px 10px",
            borderRadius: 6,
            border: "1px solid #e5e7eb",
            fontSize: 12,
            fontFamily: "inherit",
            background: "#fff",
            color: "#111827",
            cursor: "pointer",
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
        <div style={{ fontSize: 13, color: "#9ca3af", padding: "40px 0", textAlign: "center" }}>
          טוען באצ׳ים...
        </div>
      ) : error ? (
        <div style={{ fontSize: 13, color: "#dc2626", padding: "40px 0", textAlign: "center" }}>
          {error}
        </div>
      ) : batches.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            padding: "40px 0",
            textAlign: "center",
            color: "#9ca3af",
            fontSize: 13,
          }}
        >
          אין באצ׳ים עדיין —{" "}
          <Link href="/creatives/new" style={{ color: "#7C3AED", textDecoration: "underline" }}>
            צור באצ׳ ראשון
          </Link>
        </div>
      ) : (
        <div
          className="responsive-table-wrap"
          style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["לקוח", "תאריך", "סטטוס", "קונספטים", "אושרו", "נדחו"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "9px 14px",
                      textAlign: "right",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#9ca3af",
                      borderBottom: "1px solid #f3f4f6",
                      whiteSpace: "nowrap",
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
                    }}
                  >
                    <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#111827" }}>
                      {clientMap[batch.client_id] || batch.client_id}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#6b7280" }} dir="ltr">
                      {date}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <StatusBadge status={batch.status} />
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#374151", textAlign: "center" }}>
                      {batch.batch_size}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#16a34a", textAlign: "center" }}>
                      —
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#dc2626", textAlign: "center" }}>
                      —
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

// ── Main page component (reads search params) ───────────────────────────────

function CreativesContent() {
  const searchParams = useSearchParams();
  const batchId = searchParams.get("batchId");
  const [clients, setClients] = useState<DbClient[]>([]);

  useEffect(() => {
    fetchClients().then(setClients);
  }, []);

  if (batchId) {
    return <BatchDetail batchId={batchId} />;
  }

  return <BatchList clients={clients} />;
}

export default function CreativesPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "40px 16px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
          טוען...
        </div>
      }
    >
      <CreativesContent />
    </Suspense>
  );
}
