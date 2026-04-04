// ── Meta Creatives API Client ───────────────────────────────────────────────
// Wraps all /api/meta-creatives/* endpoints on the Converty OS backend.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "";

// ── Types ───────────────────────────────────────────────────────────────────

export type BatchStatus = "draft" | "generating" | "review" | "approved" | "rejected";
export type ConceptStatus = "pending" | "approved" | "rejected";
export type ReviewAction = "approved" | "rejected" | "regenerate";

export interface MetaBatch {
  id: string;
  client_id: string;
  brief: Record<string, unknown> | null;
  status: BatchStatus;
  batch_size: number;
  transcript_id: string | null;
  transcript_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConceptData {
  visualIdea?: {
    overlayStyle?: string | null;
    styleKeywords?: string[];
    imagenPrompt?: string;
  };
  onImageText?: {
    headline?: string | null;
    subline?: string | null;
    cta?: string | null;
  };
  adCopy?: {
    primaryText?: string | null;
    body?: string | null;
  };
}

export interface MetaConcept {
  id: string;
  batch_id: string;
  concept_data: ConceptData | null;
  image_url: string | null;
  final_image_url: string | null;
  status: ConceptStatus;
  score: number | null;
  feedback: Record<string, unknown> | null;
  created_at: string;
}

export interface MetaLogo {
  logoId: string;
  clientId: string;
  originalUrl: string;
  cleanUrl: string | null;
  hasCleanVersion: boolean;
  format: string;
}

export interface MetaTemplate {
  id: string;
  name: string;
  industry: string;
  description: string;
  rules: Record<string, unknown>;
  exampleImages: string[];
  createdAt: string;
}

export interface MetaProfile {
  clientId: string;
  approvedStyles: string[];
  rejectedStyles: string[];
  preferredHeadlinePatterns: string[];
  approvedOverlayStyles: string[];
}

export interface ReviewResult {
  success: boolean;
  conceptId: string;
  action: string;
  metaPush?: {
    queued: boolean;
    adAccountId: string;
    note: string;
  } | null;
}

// ── Fetch helper ────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${API_KEY}`,
    ...(options.headers as Record<string, string> || {}),
  };

  // Add JSON content-type unless it's FormData (multipart)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

// ── Batch endpoints ─────────────────────────────────────────────────────────

export async function createBatch(params: {
  clientId: string;
  batchSize?: number;
  transcriptText?: string;
  transcriptId?: string;
}): Promise<{ batch: MetaBatch }> {
  return apiFetch("/api/meta-creatives/batches", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function fetchBatches(params?: {
  clientId?: string;
  status?: BatchStatus;
  limit?: number;
}): Promise<{ batches: MetaBatch[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.clientId) query.set("clientId", params.clientId);
  if (params?.status) query.set("status", params.status);
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch(`/api/meta-creatives/batches${qs ? `?${qs}` : ""}`);
}

export async function fetchBatchesByClient(
  clientId: string,
  limit = 20
): Promise<{ batches: MetaBatch[]; total: number }> {
  return apiFetch(`/api/meta-creatives/batches/${clientId}?limit=${limit}`);
}

// ── Concept endpoints ───────────────────────────────────────────────────────

export async function fetchConcepts(
  batchId: string
): Promise<{ concepts: MetaConcept[]; total: number }> {
  return apiFetch(`/api/meta-creatives/concepts/${batchId}`);
}

export async function reviewConcept(
  conceptId: string,
  action: ReviewAction,
  feedback?: string
): Promise<ReviewResult> {
  return apiFetch(`/api/meta-creatives/concepts/${conceptId}/review`, {
    method: "PATCH",
    body: JSON.stringify({ action, feedback }),
  });
}

// ── Profile & templates ─────────────────────────────────────────────────────

export async function fetchProfile(
  clientId: string
): Promise<{ profile: MetaProfile }> {
  return apiFetch(`/api/meta-creatives/profile/${clientId}`);
}

export async function fetchTemplates(): Promise<{
  templates: MetaTemplate[];
  total: number;
}> {
  return apiFetch("/api/meta-creatives/templates");
}

// ── Logo endpoints ──────────────────────────────────────────────────────────

export async function uploadLogo(
  clientId: string,
  file: File
): Promise<MetaLogo> {
  const form = new FormData();
  form.append("logo", file);
  return apiFetch(`/api/meta-creatives/logos/${clientId}`, {
    method: "POST",
    body: form,
  });
}

export async function fetchLogo(clientId: string): Promise<MetaLogo> {
  return apiFetch(`/api/meta-creatives/logos/${clientId}`);
}

export async function deleteLogo(clientId: string): Promise<void> {
  return apiFetch(`/api/meta-creatives/logos/${clientId}`, {
    method: "DELETE",
  });
}
