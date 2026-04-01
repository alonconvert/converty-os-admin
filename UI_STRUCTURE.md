# Converty OS — Admin Panel UI Structure

**Panel URL:** http://localhost:3200 (dev) | Next.js 14, TypeScript  
**Purpose:** Operator interface for managing the full Converty OS agency — 37 clients (target: 120), approval queue, campaigns, creative, system health.  
**Theme:** Always light/white. DM Serif Display for KPI numbers, DM Sans for body, Heebo for Hebrew text.

---

## Layout

```
┌──────────────┬──────────────────────────────────────────┐
│              │  StatusBar (dark strip, persists)        │
│   Sidebar    ├──────────────────────────────────────────┤
│  (collapsible│                                          │
│  224px / 56px│           <page content>                 │
│  icon rail)  │                                          │
└──────────────┴──────────────────────────────────────────┘
```

### Sidebar (`components/Sidebar.tsx`)
- Collapsible: 224px expanded ↔ 56px icon-only rail
- Logo: "C" indigo square + "Converty OS / Agency Panel"
- T4 Crisis banner: red blinking strip appears when `systemStats.t4Active > 0`
- Live IST clock in footer (`Intl.DateTimeFormat`, `timeZone: "Asia/Jerusalem"`, 30s interval)
- Operator mode toggle: Online (green) / Unavailable (amber)
- Canary badge: purple block when `canaryDeployment.active`

**Nav items (in order):**
| Route | Label | Badge |
|-------|-------|-------|
| `/` | Dashboard | — |
| `/clients` | Clients | — |
| `/conversations` | Conversations | `pendingApprovals` count |
| `/pulse` | Pulse | — |
| `/campaigns` | Campaigns | — |
| `/creative` | Creative | — |
| `/reports` | Reports | — |
| `/system` | System | — |

### StatusBar (`components/StatusBar.tsx`)
Persistent dark strip (`#0f1117`) at top of every page. Renders:
- **Agency** health score (green/amber/red)
- **Clients** `activeClients/clientCapacity` (e.g. 35/120)
- **Queue** — urgent (pulsing red) when `pendingApprovals > 0`
- **T4** — urgent when `t4Active > 0`
- **Leads** today
- **CPL** vs target (green if on/under, amber if over)
- **AI Spend** today in ₪
- **Canary** version + hours remaining (when active)
- Right side: operator mode dot + IST clock

---

## Pages

### `/` — Dashboard (`app/page.tsx`)
**Purpose:** Morning command center. Surface only what needs the operator's eye.

**Components rendered:**
- `MorningBriefing` (modal, IST 09:00–13:00 window only) — overnight summary, exception clients, auto-approval countdown
- `ApprovalQueue` — pending conversations with confidence bars, countdown timers, approve/edit/reject

**Sections:**
1. **KPI row (8 cards):** Active Clients (of 37 · target 120), Leads Today, Pending Queue, Auto-Approved, Monthly Spend, At-Risk Clients, Supervised Slots, Agency Health
2. **Approval Queue** — left column, live countdown timers, Hebrew message previews, trust delta on approve
3. **Overnight Summary** — 4 counters (leads, auto-approved, trust changes, campaign actions)
4. **Portfolio Heatmap** — 37 color-coded dots (green/amber/red by trust, sized by budget), shows 37/120 target
5. **Churn Risk quadrant** — 2×2 grid: Green/Yellow/Orange/Red counts
6. **Recent Leads** — last 5, source badge + status badge
7. **Agent Log** — last 6 system events with AI cost per entry

---

### `/clients` — Clients (`app/clients/page.tsx`)
**Purpose:** Full portfolio table with trust and health inline.

**Features:**
- Search + filter by trust level / status
- **Trust column:** progress bar + score + level badge (Autonomous/SemiAuto/Supervised) + threshold proximity warning
- **Trust popover:** click score → breakdown of events (+approved, -corrections, -edits, -rejections, -factual errors, -complaints, decay) + last 5 events + hysteresis buffer
- **Health Score column:** colored tier badge + progress bar (Green/Yellow/Orange/Red)
- **Leads column:** 7-day sparkline + today's count
- **CPL vs target:** color-coded (green if under, red if over)
- Decay warning badge: if `lastInteractionDays > 14`
- Renewal warning badge: if `renewalDays < 14`
- Supervised cap counter in summary: `X/12 Supervised slots`
- **Client Drawer:** slide-in from right, full profile (trust score + breakdown, health dimensions, 7-day sparklines, key metrics)
- Sub-nav: `/clients/health` health dashboard

---

### `/clients/health` — Client Health Dashboard (`app/clients/health/page.tsx`)
**Purpose:** Churn risk overview + proactive care queue.

**Sections:**
1. **Proactive Care Queue** (blue callout) — quiet, healthy (green) clients with `lastInteractionDays >= 7`; surfaces them for a proactive outreach gift. Per PRD: "Quiet clients — the best clients — receive the most proactive care."
2. **Churn Risk quadrant** — 4 filter buttons (Green/Yellow/Orange/Red) with client count and names
3. **Agency Average Dimensions** — 5-bar row showing avg across all clients
4. **Per-client rows** — SVG score ring (donut) + 5-dim bar breakdown + warnings (renewal <14d, inactive >14d) + expandable detail with intervention CTA for orange/red

**Health Score formula (5 dimensions):**
- Engagement 25% · Performance 25% · Tone Quality 20% · Payment 15% · NPS 15%

---

### `/conversations` — Conversations (`app/conversations/page.tsx`)
**Purpose:** Message-level approval interface. Operator reads exceptions, not threads.

**Features:**
- Tier badges: T1 (green) / T2 (blue) / T3 (amber) / T4 (red, pulsing border)
- `AutoSendCountdown`: live MM:SS countdown per message
- Confidence display + trust delta preview (+2 on approve)
- Hebrew message bubbles: `dir="rtl"`, `fontFamily: Heebo`
- Edit mode: RTL textarea with auto-height
- Reject chips (4 options incl. "Factual error") → sent to training queue
- All Clear flow: clears human takeover, shows Hebrew AI re-entry ACK
- Cancel Auto-send for `auto_queued` conversations
- Sentiment emoji: 😠/😊/😐

---

### `/campaigns` — Campaigns (`app/campaigns/page.tsx`)
**Purpose:** Campaign performance + AI change approval queue.

**Features:**
- **AI Change Approval Queue** (top) — pending changes grouped by risk tier
- **Risk tier badges:** Autonomous (green) / 24h Approve (amber) / Immediate (red)
- `CPLSparkline`: SVG with dashed target line, actual line colored red/green vs target
- **Learning Phase badge** 🎓 LEARNING on campaigns still in learning
- Quality Score (Google campaigns)
- **Action Modal** — 11 actions grouped by risk tier, each labeled with required approval level
- Per-campaign: pending AI change with current→proposed reasoning

**Campaign Risk Tiers:**
- `autonomous` — AI executes without approval
- `approve_24h` — queued, operator has 24h window
- `immediate` — requires immediate operator decision

---

### `/creative` — Creative (`app/creative/page.tsx`)
**Purpose:** A/B test management, landing page variants, ad copy review queue. Per PRD: "Two versions of every landing page and creative are always live."

**Tabs:**
1. **A/B Tests** — per-test card showing:
   - Type badge (Landing Page / Ad Copy / Visual)
   - Variant A vs B metrics (leads, CPL, conv%)
   - Winner highlighted green
   - Confidence bar (80% threshold for auto-switch)
   - End Test / Deploy Winner Now / Force Winner actions
2. **Landing Pages** — table of all client LPs with URL, variants count, active variant, leads/week, CPL, last updated
3. **Ad Copy Queue** — AI-generated Hebrew copy cards (headline + description), Approve+A/B test / Edit / Reject actions

---

### `/reports` — Reports (`app/reports/page.tsx`)
**Purpose:** Weekly performance report generation and delivery to clients.

**Sections:**
- **KPI row:** Total leads, Avg CPL vs target, Weekly spend, Reports ready
- **Client list** — all clients with 7-day sparkline, CPL alert (red if over target), View / Send / Regenerate actions
- **Weekly Delivery Schedule** sidebar — default: "Sunday before 09:30 IST" (per PRD), WhatsApp delivery
- **AI Cost snapshot** sidebar — today's spend by model, link to full report
- Sub-nav: `/reports/costs`

---

### `/reports/costs` — AI Cost Report (`app/reports/costs/page.tsx`)
**Purpose:** Track Claude API spend by agent, model, and client.

**Sections:**
- Period toggle (Today / 7 Days / Month)
- KPI row: AI Spend, Monthly Budget, Avg Cost/Lead, Total API Calls
- **Daily spend chart** — stacked bar (Haiku / Sonnet / Opus per day)
- **Model breakdown** — spend + call count per model
- **Cost by Agent table** — Reply Drafter, QA Reviewer, Morning Briefing, Trust Evaluator, Campaign Optimizer, T4 Escalator
- **Cost by Client table** — with % of ad budget column

---

### `/system` — System (`app/system/page.tsx`)
**Purpose:** Infrastructure health, kill switch, trust engine overview, agent log.

**Sections:**
1. **Global Kill Switch** — toggle (currently active), Emergency Stop button, Telegram /kill command note
2. **Canary Deployment** inline panel — version, hours remaining, 3-metric comparison vs baseline
3. **Service Health** — 8-service grid: Railway, Supabase, Green API, Claude, Telegram, Google Ads, Meta, Voicenter (unconfigured)
4. **Nightly Optimization Loop** — last run time, next run, campaigns reviewed, actions taken, last loop action log
5. **Trust Engine** — all 8 clients with trust + health dual-bar mini cards
6. **Agent Log** — full log with type badge (AI/LEAD/CAMPAIGN/ALERT/SYSTEM) + message + time + cost

**Sub-nav:** `/system/prompts` (Canary Dashboard)

---

### `/system/prompts` — Prompt Canary Dashboard (`app/system/prompts/page.tsx`)
**Purpose:** Deploy, monitor, and rollback AI prompt versions with 24h canary window.

**Sections:**
1. **Active Canary status bar** — progress bar, 3 client names, 3-metric comparison vs baseline
2. **Live hourly trend charts** — approval rate, QA pass rate, edit rate line charts
3. **Prompt Version History** — expandable table: v2.1 (canary), v2.0 (stable), v1.9 (retired), v1.8 (retired) with changelogs
4. **Rollback modal** — safety copy, confirm/cancel
5. **Promote modal** — promote to all 37 clients when 24h window complete

**Canary Metrics tracked:** Approval rate, QA pass rate, edit rate — compared against baseline

---

### `/onboarding` — Client Onboarding (`app/onboarding/page.tsx`)
**Purpose:** Step-by-step new client setup flow.

**Steps:**
1. Pre-Intake Form — client fills 24h before session
2. WhatsApp History — import + tone extraction (3-8 min)
3. Tone Review — approve 5 AI-drafted Hebrew sample messages (Approve / Edit / Reject)
4. Campaign OAuth — Google/Meta API access + initial sync
5. Brand Config — logo, colors, font, image style
6. Go-Live Gates — 5 checkboxes, launch button unlocks when all complete

**Go-Live Gates (must all be ✓):**
- Tone extraction reviewed
- Campaign sync: minimum threshold
- QA Phase B enabled (DB access for fact-checking)
- Brand config present
- Escalation rules documented

---

## Key Components

### `components/ApprovalQueue.tsx`
- Countdown timer: live MM:SS from `minutesRemaining` prop via `setInterval`
- ConfidenceBar: green ≥85%, amber ≥70%, red below
- Keyboard shortcuts: A=approve, E=edit, R=reject (first item, `useEffect` keydown)
- Hebrew RTL preview: `dir="rtl"`, `fontFamily: Heebo`
- Trust delta preview: "+2 trust on approve" per card
- Reject confirmation: 4 chips including "Factual error", sends to training queue
- All Clear flow → Hebrew AI re-entry ACK

### `components/MorningBriefing.tsx`
- Shows automatically IST 09:00–13:00 (`Intl.DateTimeFormat`, `timeZone: "Asia/Jerusalem"`)
- Exception clients: churnTier red/orange, trustScore <40, renewalDays <14, status paused (max 7)
- Auto-approval pending section
- Overnight summary from `overnightSummary` export
- Dismisses to floating "📋 Today's Brief" button
- Slides in from right side

---

## Mock Data (`lib/mock-data.ts`)

**Exports:**
- `mockClients` — 8 clients with full fields (trustScore, level, healthScore, healthDimensions, churnTier, trustBreakdown, leadsWeekly[7], cplTarget, clientCredit, renewalDays, thresholdProximity, hysteresisBuffer, lastInteractionDays)
- `mockConversations` — 4 conversations with ageMinutes, autoSendMinutes, trustDeltaOnApprove, tier, confidence
- `mockLeads` — 5 leads
- `mockCampaigns` — 6 campaigns with riskTier, learningPhase, cplWeekly[7], pendingAiChange
- `mockSystemLogs` — 10 entries with cost field
- `systemStats` — agency-wide counters (totalClients: 37, activeClients: 35, **clientCapacity: 120**, leadsToday, pendingApprovals, t4Active, supervisedClients/Cap, monthlyCpl/Target, aiSpendToday)
- `operatorConfig` — mode, name
- `agencyHealthScore` — 71
- `canaryDeployment` — active, version, hoursRemaining, clients, metrics
- `overnightSummary` — leadsReceived, messagesAutoApproved, trustChanges, campaignChanges
- `autoApprovalQueue` — snapshot for countdown display

**Types:** `ChurnTier`, `TrustLevel`, `OperatorMode`, `CampaignRiskTier`, `TrustBreakdown`, `HealthDimensions`, `PendingAiChange`

---

## Design Conventions

| Element | Convention |
|---------|-----------|
| KPI numbers | `fontFamily: 'DM Serif Display', serif` |
| Hebrew text | `dir="rtl"`, `fontFamily: "Heebo, sans-serif"` |
| Timezone | All times in IST via `Intl.DateTimeFormat({ timeZone: "Asia/Jerusalem" })` |
| Trust colors | Green ≥75, Amber 40–74, Red <40 |
| Health tier colors | Green: #059669 · Yellow: #ca8a04 · Orange: #ea580c · Red: #be123c |
| Campaign risk | Autonomous: green · 24h: amber · Immediate: red |
| Background | `#F7F8FA` page bg, `#fff` cards |
| Sidebar/StatusBar | `#0f1117` dark |
| Primary accent | `#4F46E5` indigo |
| Canary accent | `#7c3aed` violet |
| Border | `#e5e7eb` card borders, `#f3f4f6` dividers |
| Live timers | `useEffect` + `setInterval` with `clearInterval` cleanup |
| All pages | Light mode only — no dark mode |
