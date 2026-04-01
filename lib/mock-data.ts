// ─── Client types ──────────────────────────────────────────────────────────

export type ChurnTier = 'green' | 'yellow' | 'orange' | 'red';
export type TrustLevel = 'Autonomous' | 'SemiAuto' | 'Supervised';
export type OperatorMode = 'normal' | 'unavailable' | 'vacation';
export type CampaignRiskTier = 'autonomous' | 'approve_24h' | 'immediate';

export interface TrustEvent {
  date: string;
  event: string;
  delta: number;
}

export interface TrustBreakdown {
  approved: number;
  minorCorrections: number;
  significantEdits: number;
  rejections: number;
  factualErrors: number;
  complaints: number;
  decay: number;
  lastEvents: TrustEvent[];
}

export interface HealthDimensions {
  engagement: number;   // 25%
  performance: number;  // 25%
  tone: number;         // 20%
  payment: number;      // 15%
  nps: number;          // 15% (0–100 mapped from 1–10)
}

export interface PendingAiChange {
  type: string;
  description: string;
  riskTier: CampaignRiskTier;
  current: string;
  proposed: string;
  reasoning: string;
}

// ─── Mock clients ──────────────────────────────────────────────────────────

export const mockClients = [
  {
    id: '1',
    name: 'מרפאת שיניים לוי',
    domain: 'dental',
    trustScore: 82,
    level: 'Autonomous' as TrustLevel,
    leadsToday: 7,
    leadsWeekly: [5, 8, 6, 9, 7, 11, 7],
    activeConvs: 2,
    status: 'active',
    lastActivity: '3 min ago',
    lastInteractionDays: 0,
    campaigns: 4,
    monthlyBudget: 8500,
    cplTarget: 95,
    clientCredit: 420,
    renewalDays: 47,
    onboardingStatus: 'live' as const,
    healthScore: 78,
    churnTier: 'green' as ChurnTier,
    healthDimensions: { engagement: 88, performance: 82, tone: 75, payment: 100, nps: 70 },
    trustBreakdown: {
      approved: 52, minorCorrections: -6, significantEdits: -10, rejections: 0, factualErrors: 0, complaints: 0, decay: 0,
      lastEvents: [
        { date: '2026-04-01', event: 'Interaction approved', delta: +2 },
        { date: '2026-03-30', event: 'Interaction approved', delta: +2 },
        { date: '2026-03-28', event: 'Minor correction', delta: -3 },
        { date: '2026-03-25', event: 'Interaction approved', delta: +2 },
        { date: '2026-03-22', event: 'Interaction approved', delta: +2 },
      ],
    } as TrustBreakdown,
    thresholdProximity: null as number | null,
    hysteresisBuffer: 17,
  },
  {
    id: '2',
    name: 'עורך דין כהן',
    domain: 'legal',
    trustScore: 61,
    level: 'SemiAuto' as TrustLevel,
    leadsToday: 3,
    leadsWeekly: [2, 4, 3, 5, 3, 4, 3],
    activeConvs: 1,
    status: 'active',
    lastActivity: '12 min ago',
    lastInteractionDays: 0,
    campaigns: 2,
    monthlyBudget: 5000,
    cplTarget: 80,
    clientCredit: 185,
    renewalDays: 12,
    onboardingStatus: 'live' as const,
    healthScore: 58,
    churnTier: 'yellow' as ChurnTier,
    healthDimensions: { engagement: 62, performance: 58, tone: 55, payment: 90, nps: 50 },
    trustBreakdown: {
      approved: 38, minorCorrections: -9, significantEdits: -10, rejections: -20, factualErrors: 0, complaints: 0, decay: 0,
      lastEvents: [
        { date: '2026-04-01', event: 'Auto-queued (0.88 conf)', delta: 0 },
        { date: '2026-03-29', event: 'Interaction approved', delta: +2 },
        { date: '2026-03-26', event: 'Rejection: wrong tone', delta: -20 },
        { date: '2026-03-24', event: 'Interaction approved', delta: +2 },
        { date: '2026-03-20', event: 'Significant edit', delta: -10 },
      ],
    } as TrustBreakdown,
    thresholdProximity: 14,
    hysteresisBuffer: null as number | null,
  },
  {
    id: '3',
    name: 'גרינברג נדל"ן',
    domain: 'realestate',
    trustScore: 44,
    level: 'SemiAuto' as TrustLevel,
    leadsToday: 12,
    leadsWeekly: [8, 10, 14, 11, 13, 15, 12],
    activeConvs: 4,
    status: 'active',
    lastActivity: '1 min ago',
    lastInteractionDays: 0,
    campaigns: 6,
    monthlyBudget: 22000,
    cplTarget: 100,
    clientCredit: 890,
    renewalDays: 28,
    onboardingStatus: 'live' as const,
    healthScore: 65,
    churnTier: 'yellow' as ChurnTier,
    healthDimensions: { engagement: 78, performance: 65, tone: 60, payment: 80, nps: 60 },
    trustBreakdown: {
      approved: 28, minorCorrections: -6, significantEdits: -20, rejections: 0, factualErrors: 0, complaints: 0, decay: 0,
      lastEvents: [
        { date: '2026-04-01', event: 'Interaction approved', delta: +2 },
        { date: '2026-03-31', event: 'Interaction approved', delta: +2 },
        { date: '2026-03-28', event: 'Significant edit', delta: -10 },
        { date: '2026-03-25', event: 'Significant edit', delta: -10 },
        { date: '2026-03-20', event: 'Interaction approved', delta: +2 },
      ],
    } as TrustBreakdown,
    thresholdProximity: 6,
    hysteresisBuffer: null as number | null,
  },
  {
    id: '4',
    name: 'מוסך אביב',
    domain: 'auto',
    trustScore: 30,
    level: 'Supervised' as TrustLevel,
    leadsToday: 5,
    leadsWeekly: [3, 5, 4, 6, 5, 5, 5],
    activeConvs: 0,
    status: 'active',
    lastActivity: '45 min ago',
    lastInteractionDays: 2,
    campaigns: 3,
    monthlyBudget: 4200,
    cplTarget: 70,
    clientCredit: 50,
    renewalDays: 61,
    onboardingStatus: 'live' as const,
    healthScore: 42,
    churnTier: 'orange' as ChurnTier,
    healthDimensions: { engagement: 40, performance: 45, tone: 38, payment: 70, nps: 30 },
    trustBreakdown: {
      approved: 12, minorCorrections: -9, significantEdits: -20, rejections: -20, factualErrors: -25, complaints: 0, decay: 0,
      lastEvents: [
        { date: '2026-03-30', event: 'Factual error detected', delta: -25 },
        { date: '2026-03-27', event: 'Rejection: wrong info', delta: -20 },
        { date: '2026-03-24', event: 'Interaction approved', delta: +2 },
        { date: '2026-03-20', event: 'Significant edit', delta: -10 },
        { date: '2026-03-15', event: 'Interaction approved', delta: +2 },
      ],
    } as TrustBreakdown,
    thresholdProximity: null as number | null,
    hysteresisBuffer: null as number | null,
  },
  {
    id: '5',
    name: 'ד"ר מירי אופיר',
    domain: 'medical',
    trustScore: 78,
    level: 'Autonomous' as TrustLevel,
    leadsToday: 9,
    leadsWeekly: [7, 9, 8, 10, 9, 11, 9],
    activeConvs: 3,
    status: 'active',
    lastActivity: '8 min ago',
    lastInteractionDays: 0,
    campaigns: 3,
    monthlyBudget: 12000,
    cplTarget: 90,
    clientCredit: 610,
    renewalDays: 83,
    onboardingStatus: 'live' as const,
    healthScore: 82,
    churnTier: 'green' as ChurnTier,
    healthDimensions: { engagement: 90, performance: 85, tone: 80, payment: 100, nps: 80 },
    trustBreakdown: {
      approved: 60, minorCorrections: -3, significantEdits: -10, rejections: 0, factualErrors: 0, complaints: 0, decay: 0,
      lastEvents: [
        { date: '2026-04-01', event: 'Interaction approved', delta: +2 },
        { date: '2026-03-31', event: 'Interaction approved', delta: +2 },
        { date: '2026-03-29', event: 'Interaction approved', delta: +2 },
        { date: '2026-03-27', event: 'Minor correction', delta: -3 },
        { date: '2026-03-25', event: 'Interaction approved', delta: +2 },
      ],
    } as TrustBreakdown,
    thresholdProximity: null as number | null,
    hysteresisBuffer: 13,
  },
  {
    id: '6',
    name: 'קרן פיטנס',
    domain: 'fitness',
    trustScore: 55,
    level: 'SemiAuto' as TrustLevel,
    leadsToday: 14,
    leadsWeekly: [10, 12, 14, 13, 15, 14, 14],
    activeConvs: 1,
    status: 'paused',
    lastActivity: '2h ago',
    lastInteractionDays: 1,
    campaigns: 2,
    monthlyBudget: 3800,
    cplTarget: 60,
    clientCredit: 240,
    renewalDays: 5,
    onboardingStatus: 'live' as const,
    healthScore: 34,
    churnTier: 'orange' as ChurnTier,
    healthDimensions: { engagement: 30, performance: 38, tone: 28, payment: 45, nps: 20 },
    trustBreakdown: {
      approved: 22, minorCorrections: -6, significantEdits: -10, rejections: -20, factualErrors: 0, complaints: 0, decay: -5,
      lastEvents: [
        { date: '2026-03-31', event: 'Time decay (-1/day)', delta: -1 },
        { date: '2026-03-30', event: 'Time decay (-1/day)', delta: -1 },
        { date: '2026-03-28', event: 'Interaction approved', delta: +2 },
        { date: '2026-03-25', event: 'Rejection: wrong tone', delta: -20 },
        { date: '2026-03-20', event: 'Interaction approved', delta: +2 },
      ],
    } as TrustBreakdown,
    thresholdProximity: null as number | null,
    hysteresisBuffer: null as number | null,
  },
  {
    id: '7',
    name: 'עיצוב פנים שרה',
    domain: 'design',
    trustScore: 88,
    level: 'Autonomous' as TrustLevel,
    leadsToday: 2,
    leadsWeekly: [1, 3, 2, 2, 3, 2, 2],
    activeConvs: 1,
    status: 'active',
    lastActivity: '22 min ago',
    lastInteractionDays: 0,
    campaigns: 2,
    monthlyBudget: 6500,
    cplTarget: 120,
    clientCredit: 780,
    renewalDays: 95,
    onboardingStatus: 'live' as const,
    healthScore: 91,
    churnTier: 'green' as ChurnTier,
    healthDimensions: { engagement: 95, performance: 92, tone: 90, payment: 100, nps: 90 },
    trustBreakdown: {
      approved: 72, minorCorrections: -3, significantEdits: 0, rejections: 0, factualErrors: 0, complaints: 0, decay: 0,
      lastEvents: [
        { date: '2026-04-01', event: 'Interaction approved', delta: +2 },
        { date: '2026-03-30', event: 'Interaction approved', delta: +2 },
        { date: '2026-03-28', event: 'Interaction approved', delta: +2 },
        { date: '2026-03-25', event: 'Minor correction', delta: -3 },
        { date: '2026-03-23', event: 'Interaction approved', delta: +2 },
      ],
    } as TrustBreakdown,
    thresholdProximity: null as number | null,
    hysteresisBuffer: 23,
  },
  {
    id: '8',
    name: 'ביטוח ישיר פלוס',
    domain: 'insurance',
    trustScore: 25,
    level: 'Supervised' as TrustLevel,
    leadsToday: 18,
    leadsWeekly: [14, 16, 18, 20, 17, 19, 18],
    activeConvs: 0,
    status: 'active',
    lastActivity: '5 min ago',
    lastInteractionDays: 0,
    campaigns: 5,
    monthlyBudget: 15000,
    cplTarget: 85,
    clientCredit: 120,
    renewalDays: 19,
    onboardingStatus: 'live' as const,
    healthScore: 22,
    churnTier: 'red' as ChurnTier,
    healthDimensions: { engagement: 18, performance: 20, tone: 15, payment: 60, nps: 10 },
    trustBreakdown: {
      approved: 8, minorCorrections: -6, significantEdits: -10, rejections: 0, factualErrors: 0, complaints: -19, decay: 0,
      lastEvents: [
        { date: '2026-04-01', event: 'T4 Crisis — complaint received', delta: -19 },
        { date: '2026-03-31', event: 'Interaction approved', delta: +2 },
        { date: '2026-03-28', event: 'Significant edit', delta: -10 },
        { date: '2026-03-25', event: 'Minor correction', delta: -3 },
        { date: '2026-03-22', event: 'Interaction approved', delta: +2 },
      ],
    } as TrustBreakdown,
    thresholdProximity: null as number | null,
    hysteresisBuffer: null as number | null,
  },
];

// ─── Conversations ──────────────────────────────────────────────────────────
//
// Three types of conversations the operator actually sees:
//   'lead_intake'  — AI drafting first-contact outreach to a new lead ON BEHALF of a client
//   'own_lead'     — Potential new agency client inquiring about Converty's services
//   'client_comm'  — Routine communication between Alon and one of his 37 business-owner clients
//
// What is NOT here: conversations between agency clients and their own leads/customers
// (those are handled by the client directly and are not visible in this system).

export const mockConversations = [
  // ── Lead intake for גרינברג נדל"ן ──────────────────────────────────────────
  {
    id: 'c1',
    conversationType: 'lead_intake' as const,
    clientName: 'גרינברג נדל"ן',
    leadName: 'אמיר בן דוד',          // new lead that arrived for the client
    phone: '+972541234567',
    lastMessage: 'ליד נכנס מגוגל — מעוניין בדירת 3 חדרים במרכז, תקציב ~2M₪',
    draft: 'שלום אמיר! קיבלנו את פנייתך לגרינברג נדל"ן. אנחנו מתמחים בדירות 3-4 חדרים במרכז הארץ ויש לנו עכשיו כמה נכסים מעולים בטווח התקציב שלך. מתי נוח לך לשיחה קצרה של 10 דקות?',
    tier: 'T1',
    confidence: 0.92,
    trustLevel: 'SemiAuto',
    status: 'pending_approval',
    age: '4 min',
    ageMinutes: 4,
    sentiment: 'positive',
    autoSendMinutes: 11,
    trustDeltaOnApprove: +2,
  },
  // ── Routine client communication: ביטוח ישיר פלוס owner upset ──────────────
  {
    id: 'c2',
    conversationType: 'client_comm' as const,
    clientName: 'ביטוח ישיר פלוס',
    leadName: 'יניב אוחנה',            // the insurance company owner / contact
    phone: '+972527654321',
    lastMessage: 'מה קורה עם הפייסבוק השבוע? CPL קפץ ל-95 ומעלה והייתם מבטיחים 85',
    draft: null,                        // Alon handles this personally — no AI draft
    tier: 'T4',
    confidence: 0,
    trustLevel: 'Supervised',
    status: 'needs_human',
    age: '2 min',
    ageMinutes: 2,
    sentiment: 'angry',
    autoSendMinutes: null as number | null,
    takeoverAt: '09:03',
    operatorName: null as string | null,
    reentryAckSent: false,
    trustDeltaOnApprove: 0,
  },
  // ── Converty's own lead: potential new agency client ────────────────────────
  {
    id: 'c3',
    conversationType: 'own_lead' as const,
    clientName: 'Converty | שיווק עצמי',
    leadName: 'רועי שמיר',             // potential new agency client
    phone: '+972501112233',
    lastMessage: 'ראיתי את המודעה — אני מנהל מרפאת פיזיותרפיה ב-3 סניפים, כמה עולה ניהול קמפיינים?',
    draft: 'שלום רועי! שמחים שפנית. אנחנו מנהלים Google + Meta לעסקים ישראליים ומתמחים בבריאות ורפואה. יש לנו ניסיון עם קליניקות דומות ל-CPL של 80-110₪ לליד. אשמח לשיחת היכרות קצרה — מתי נוח?',
    tier: 'T1',
    confidence: 0.89,
    trustLevel: 'Autonomous',
    status: 'pending_approval',
    age: '9 min',
    ageMinutes: 9,
    sentiment: 'positive',
    autoSendMinutes: null as number | null,
    trustDeltaOnApprove: +2,
  },
  // ── Routine client communication: מרפאת שיניים לוי renewal + satisfied ──────
  {
    id: 'c4',
    conversationType: 'client_comm' as const,
    clientName: 'מרפאת שיניים לוי',
    leadName: 'ד"ר אורן לוי',          // dentist / clinic owner
    phone: '+972549876543',
    lastMessage: 'קיבלנו 7 פניות השבוע ו-4 נסגרו כבר! מרוצים מאוד. מתי מחדשים?',
    draft: 'ד"ר לוי, שמחים לשמוע! החידוש האוטומטי ב-18 לאפריל — נשלח לך סיכום ביצועים מלא עם השוואה לחודש הקודם כמה ימים לפני. תודה על האמון!',
    tier: 'T1',
    confidence: 0.87,
    trustLevel: 'Autonomous',
    status: 'auto_queued',
    age: '14 min',
    ageMinutes: 14,
    sentiment: 'positive',
    autoSendMinutes: 1,
    trustDeltaOnApprove: +2,
  },
  // ── Lead intake for עורך דין כהן ────────────────────────────────────────────
  {
    id: 'c5',
    conversationType: 'lead_intake' as const,
    clientName: 'עורך דין כהן',
    leadName: 'נועה לוי',              // new lead that arrived for the lawyer
    phone: '+972552223344',
    lastMessage: 'ליד נכנס מגוגל — שאלה על תביעת פיטורים, הודיעה שנפלטה ממקום עבודתה',
    draft: 'שלום נועה! קיבלנו את פנייתך למשרד עורך דין כהן. אנחנו מתמחים בדיני עבודה ונשמח לעזור בעניין הפיטורים. ייעוץ ראשוני ללא עלות — אפשר לקבוע לשבוע הקרוב?',
    tier: 'T1',
    confidence: 0.85,
    trustLevel: 'SemiAuto',
    status: 'pending_approval',
    age: '18 min',
    ageMinutes: 18,
    sentiment: 'neutral',
    autoSendMinutes: 7,
    trustDeltaOnApprove: +2,
  },
];

// ─── Leads ──────────────────────────────────────────────────────────────────

export const mockLeads = [
  { id: 'l1', clientName: 'גרינברג נדל"ן', name: 'אמיר בן דוד', phone: '+972541111111', source: 'google', status: 'new', createdAt: '10 min ago', score: 85 },
  { id: 'l2', clientName: 'מרפאת שיניים לוי', name: 'שרה כהן', phone: '+972522222222', source: 'facebook', status: 'contacted', createdAt: '25 min ago', score: 72 },
  { id: 'l3', clientName: 'ד"ר מירי אופיר', name: 'יעקב גולד', phone: '+972503333333', source: 'lp', status: 'new', createdAt: '1h ago', score: 60 },
  { id: 'l4', clientName: 'ביטוח ישיר פלוס', name: 'חנה מוזס', phone: '+972514444444', source: 'google', status: 'new', createdAt: '1.5h ago', score: 90 },
  { id: 'l5', clientName: 'קרן פיטנס', name: 'אורן שפירא', phone: '+972535555555', source: 'facebook', status: 'closed', createdAt: '2h ago', score: 55 },
];

// ─── Campaigns ─────────────────────────────────────────────────────────────

export const mockCampaigns = [
  {
    id: 'camp1',
    clientName: 'גרינברג נדל"ן',
    name: 'דירות מרכז - סרץ׳',
    platform: 'google',
    status: 'active',
    spend: 4200,
    budget: 6000,
    leads: 47,
    cpl: 89,
    cplTarget: 100,
    cplWeekly: [102, 97, 94, 91, 88, 90, 89],
    roas: null,
    riskTier: 'autonomous' as CampaignRiskTier,
    learningPhase: false,
    aiLastAction: 'Bid -8% on mobile',
    aiLastActionDays: 2,
    qualityScore: 8,
    bidStrategy: 'Max Conversions',
    topTerms: ['דירות 3 חדרים מרכז', 'דירות למכירה תל אביב', 'קניית דירה ראשונה'],
    pendingAiChange: null as PendingAiChange | null,
  },
  {
    id: 'camp2',
    clientName: 'גרינברג נדל"ן',
    name: 'נדל"ן השקעות - FB',
    platform: 'meta',
    status: 'active',
    spend: 2100,
    budget: 3000,
    leads: 22,
    cpl: 95,
    cplTarget: 100,
    cplWeekly: [110, 105, 100, 98, 96, 94, 95],
    roas: null,
    riskTier: 'approve_24h' as CampaignRiskTier,
    learningPhase: true,
    aiLastAction: null as string | null,
    aiLastActionDays: null as number | null,
    qualityScore: null,
    bidStrategy: 'Lowest Cost',
    topTerms: [],
    pendingAiChange: null as PendingAiChange | null,
  },
  {
    id: 'camp3',
    clientName: 'מרפאת שיניים לוי',
    name: 'ציפויים ואסתטיקה',
    platform: 'google',
    status: 'active',
    spend: 3100,
    budget: 4000,
    leads: 31,
    cpl: 100,
    cplTarget: 95,
    cplWeekly: [88, 92, 95, 98, 101, 100, 100],
    roas: null,
    riskTier: 'approve_24h' as CampaignRiskTier,
    learningPhase: false,
    aiLastAction: 'Added 12 negative keywords',
    aiLastActionDays: 1,
    qualityScore: 7,
    bidStrategy: 'Target CPA ₪95',
    topTerms: ['ציפויים לשיניים', 'הלבנת שיניים מחיר', 'רופא שיניים אסתטי'],
    pendingAiChange: {
      type: 'bid_adjustment',
      description: 'Increase Target CPA to ₪110 — CPL trending above target',
      riskTier: 'approve_24h',
      current: 'Target CPA ₪95',
      proposed: 'Target CPA ₪110',
      reasoning: 'CPL has been ₪100 for 3 weeks vs ₪95 target. Relaxing CPA cap should unlock more conversions.',
    } as PendingAiChange,
  },
  {
    id: 'camp4',
    clientName: 'ד"ר מירי אופיר',
    name: 'ייעוץ גינקולוגי',
    platform: 'google',
    status: 'active',
    spend: 5200,
    budget: 7000,
    leads: 58,
    cpl: 90,
    cplTarget: 90,
    cplWeekly: [95, 93, 91, 90, 89, 90, 90],
    roas: null,
    riskTier: 'autonomous' as CampaignRiskTier,
    learningPhase: false,
    aiLastAction: 'Bid +5% on desktop',
    aiLastActionDays: 0,
    qualityScore: 9,
    bidStrategy: 'Max Conversions',
    topTerms: ['גינקולוג פרטי', 'ייעוץ נשים מחיר', 'רופאת נשים תל אביב'],
    pendingAiChange: null as PendingAiChange | null,
  },
  {
    id: 'camp5',
    clientName: 'ביטוח ישיר פלוס',
    name: 'ביטוח רכב Q2',
    platform: 'meta',
    status: 'paused',
    spend: 1800,
    budget: 5000,
    leads: 19,
    cpl: 95,
    cplTarget: 85,
    cplWeekly: [80, 84, 88, 90, 93, 95, 95],
    roas: null,
    riskTier: 'immediate' as CampaignRiskTier,
    learningPhase: false,
    aiLastAction: null as string | null,
    aiLastActionDays: null as number | null,
    qualityScore: null,
    bidStrategy: 'Lowest Cost',
    topTerms: [],
    pendingAiChange: null as PendingAiChange | null,
  },
  {
    id: 'camp6',
    clientName: 'עורך דין כהן',
    name: 'ייעוץ משפטי - Brand',
    platform: 'google',
    status: 'active',
    spend: 900,
    budget: 1500,
    leads: 12,
    cpl: 75,
    cplTarget: 80,
    cplWeekly: [82, 80, 78, 76, 75, 74, 75],
    roas: null,
    riskTier: 'autonomous' as CampaignRiskTier,
    learningPhase: false,
    aiLastAction: 'Added 8 negative keywords',
    aiLastActionDays: 3,
    qualityScore: 8,
    bidStrategy: 'Manual CPC',
    topTerms: ['עורך דין עבודה', 'ייעוץ משפטי מחיר', 'תביעת פיטורים'],
    pendingAiChange: null as PendingAiChange | null,
  },
];

// ─── System logs ────────────────────────────────────────────────────────────

export const mockSystemLogs = [
  { id: 'log1', type: 'ai', message: 'Claude drafted lead outreach for גרינברג נדל"ן → אמיר בן דוד (conf 0.92)', time: '4 min ago', level: 'info', cost: '₪0.08' },
  { id: 'log2', type: 'lead', message: 'New lead ingested: אמיר בן דוד → גרינברג נדל"ן (Google)', time: '4 min ago', level: 'info', cost: null },
  { id: 'log3', type: 'alert', message: 'T4 client message: יניב אוחנה (ביטוח ישיר פלוס) — CPL complaint, human takeover', time: '2 min ago', level: 'warn', cost: null },
  { id: 'log4', type: 'lead', message: 'New own lead: רועי שמיר (פיזיותרפיה 3 סניפים) — Converty inquiry', time: '9 min ago', level: 'info', cost: null },
  { id: 'log5', type: 'ai', message: 'Claude drafted Converty reply for רועי שמיר (conf 0.89)', time: '9 min ago', level: 'info', cost: '₪0.06' },
  { id: 'log6', type: 'ai', message: 'Auto-queued client reply: ד"ר אורן לוי / מרפאת שיניים לוי (conf 0.87)', time: '14 min ago', level: 'info', cost: '₪0.05' },
  { id: 'log7', type: 'system', message: 'Kill switch checked: system active', time: '15 min ago', level: 'info', cost: null },
  { id: 'log8', type: 'campaign', message: 'Campaign sync completed: 6 campaigns refreshed', time: '22 min ago', level: 'info', cost: null },
  { id: 'log9', type: 'alert', message: 'Trust score drop: ביטוח ישיר פלוס 38→25 (client complaint logged)', time: '1h ago', level: 'warn', cost: null },
  { id: 'log10', type: 'ai', message: 'Morning briefing generated for operator', time: '2h ago', level: 'info', cost: '₪0.14' },
  { id: 'log11', type: 'lead', message: 'New lead ingested: נועה לוי → עורך דין כהן (Google)', time: '18 min ago', level: 'info', cost: null },
  { id: 'log12', type: 'campaign', message: 'Bid adjustment: מרפאת שיניים לוי -8% mobile', time: '2d ago', level: 'info', cost: null },
];

// ─── System stats ───────────────────────────────────────────────────────────

export const systemStats = {
  totalClients: 37,
  activeClients: 35,
  clientCapacity: 120,
  leadsToday: 68,
  pendingApprovals: 3,
  autoApprovedToday: 14,
  totalConversations: 142,
  systemStatus: 'healthy' as const,
  uptime: '99.8%',
  lastSync: '3 min ago',
  monthlySpend: 112400,
  monthlyCpl: 91,
  monthlyCplTarget: 90,
  aiSpendToday: 2.40,
  t4Active: 1,
  supervisedClients: 2,
  supervisedCap: 12,
  orangeRedClients: 3,
  pendingCampaignChanges: 1,
  criticalServices: 1,
};

// ─── Operator & system mode ─────────────────────────────────────────────────

export const operatorConfig = {
  mode: 'normal' as OperatorMode,
  unavailableUntil: null as string | null,
  name: 'אלון',
};

// ─── Agency health score ────────────────────────────────────────────────────

export const agencyHealthScore = 71;

// ─── Canary deployment ──────────────────────────────────────────────────────

export const canaryDeployment = {
  active: true,
  version: 'v2.1',
  hoursRemaining: 18,
  clients: ['מרפאת שיניים לוי', 'עיצוב פנים שרה', 'ד"ר מירי אופיר'],
  approvalRate: 94,
  qaPassRate: 97,
  editRate: 6,
  baselineApprovalRate: 91,
  baselineQaPassRate: 95,
  baselineEditRate: 8,
};

// ─── Overnight summary ──────────────────────────────────────────────────────

export const overnightSummary = {
  leadsReceived: 11,
  messagesAutoApproved: 8,
  trustChanges: 2,
  campaignChanges: 1,
  totalSpend: 4820,
  highlights: [
    'ביטוח ישיר פלוס trust score dropped 38→25 after complaint',
    '8 messages auto-approved overnight across 4 clients',
    'New lead batch: 5 from Google, 6 from Meta',
  ],
};

// ─── Auto-approval queue snapshot ───────────────────────────────────────────

export const autoApprovalQueue = [
  {
    id: 'aq1',
    conversationType: 'client_comm' as const,
    clientName: 'מרפאת שיניים לוי',
    leadName: 'ד"ר אורן לוי',          // dentist / clinic owner (routine client comms)
    minutesRemaining: 1,
    confidence: 87,
    draft: 'ד"ר לוי, שמחים לשמוע! החידוש האוטומטי ב-18 לאפריל — נשלח לך סיכום ביצועים מלא לפני.',
    tier: 'T1',
  },
];
