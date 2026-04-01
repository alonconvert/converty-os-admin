import { supabase } from "./supabase";

// ── Types ────────────────────────────────────────────────────────────────────

export type TrustLevel = "Autonomous" | "SemiAuto" | "Supervised";
export type ChurnTier = "green" | "yellow" | "orange" | "red";

export interface DbClient {
  id: string;
  name: string;
  business_name: string | null;
  industry: string | null;
  is_active: boolean;
  trust_scores: Record<string, number> | null;
  created_at: string;
  // derived
  trustScore: number;
  level: TrustLevel;
}

export interface DbLead {
  id: string;
  name: string | null;
  source: { type?: string; platform?: string } | null;
  status: string;
  created_at: string;
  client_name: string | null;
}

export interface DbConversation {
  id: string;
  client_id: string;
  message_text: string | null;
  draft_text: string | null;
  status: string;
  sender_name: string | null;
  created_at: string;
  client_name?: string;
}

export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  leadsToday: number;
  pendingApprovals: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function avgTrustScore(trust_scores: Record<string, number> | null): number {
  if (!trust_scores) return 0;
  const vals = Object.values(trust_scores).filter((v) => typeof v === "number");
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function trustLevel(score: number): TrustLevel {
  if (score >= 65) return "Autonomous";
  if (score >= 35) return "SemiAuto";
  return "Supervised";
}

function sourceLabel(source: DbLead["source"]): string {
  if (!source) return "direct";
  return source.platform ?? source.type ?? "direct";
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function fetchClients(): Promise<DbClient[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, business_name, industry, is_active, trust_scores, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((c) => {
    const score = avgTrustScore(c.trust_scores);
    return {
      ...c,
      trustScore: score,
      level: trustLevel(score),
    };
  });
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [clientsRes, leadsTodayRes, pendingRes] = await Promise.all([
    supabase
      .from("clients")
      .select("id, is_active", { count: "exact", head: false })
      .eq("is_active", true),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: false })
      .gte("created_at", todayISO),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: false })
      .eq("status", "pending_approval"),
  ]);

  return {
    totalClients: clientsRes.count ?? 0,
    activeClients: clientsRes.count ?? 0,
    leadsToday: leadsTodayRes.count ?? 0,
    pendingApprovals: pendingRes.count ?? 0,
  };
}

export async function fetchRecentLeads(limit = 5): Promise<DbLead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, name, source, status, created_at, clients!inner(business_name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((l: any) => ({
    id: l.id as string,
    name: l.name as string | null,
    source: l.source as { type?: string; platform?: string } | null,
    status: l.status as string,
    created_at: l.created_at as string,
    client_name: (Array.isArray(l.clients) ? l.clients[0]?.business_name : l.clients?.business_name) ?? null,
    sourceLabel: sourceLabel(l.source),
  }));
}

export async function fetchPendingConversations(limit = 20): Promise<DbConversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, client_id, message_text, draft_text, status, sender_name, created_at")
    .in("status", ["pending_approval", "needs_human"])
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !data) return [];
  return data;
}
