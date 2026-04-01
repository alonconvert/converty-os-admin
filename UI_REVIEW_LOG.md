# Converty OS Admin — UI Review Log

Autonomous UI improvement loop. Each round: audit → implement → 3-agent review → converge or continue.

---

## Round 1

**Date:** 2026-04-01  
**Commit:** `ui-review: round 1`

### Audit Findings

#### DASHBOARD (/)
**Problem 1:** Pending Queue KPI card showed stale item age (`4h 12m`) as plain small text — no urgency signal when operator walks in late.  
**Violates:** Criterion 3 (exception-only workflow) — the card didn't scream about a stale queue.  
**Fix:** Added `stale-queue-pulse` CSS animation that pulses the card border orange when oldest item is >4h.

**Problem 2:** No signal anywhere that Campaigns also had a pending change — Sidebar only showed Conversations badge.  
**Violates:** Criterion 3 (exception-only workflow), Criterion 1 (operator freedom).  
**Fix:** Added sidebar badge to Campaigns (pendingCampaignChanges) and System (criticalServices), red color for System.

**Problem 3:** StatusBar Queue and T4 pills were informational-only — clicking them did nothing.  
**Violates:** Criterion 1 (operator freedom — time-to-action).  
**Fix:** Made Queue pill link to `/conversations`, T4 pill links to `/conversations`, Clients pill links to `/clients`.

---

#### CLIENTS (/clients)
**Problem 1:** Summary row (Autonomous / Semi-Auto / Supervised / At-Risk) was read-only — no way to jump to a filtered view from the count cards.  
**Violates:** Criterion 4 (scale to 120 — flat interaction model won't work at 3x), Criterion 1 (operator freedom).  
**Fix:** Made all 4 summary cards clickable filter toggles. Active filter highlights the card with a 2px colored border. Click again to return to "All".

---

#### CONVERSATIONS (/conversations)
**Problem 1:** T4 Crisis cards only had a left border distinguishing them from T1 Info cards — weak visual hierarchy.  
**Violates:** Criterion 3 (exception-only workflow — crisis must be unmissable).  
**Fix:** Added full-width dark red banner at the top of T4 cards: `T4 CRISIS — REQUIRES HUMAN TAKEOVER`. Card border upgraded to 2px solid red.

---

#### CREATIVE (/creative)
**Problem 1:** `daysToSignificance` was computed in code but never rendered — operator couldn't see which tests were near conclusion without doing mental math.  
**Violates:** Criterion 6 (zero ambiguity), Criterion 1 (operator freedom).  
**Fix:** Surfaced `~Xd to decision` badge in each running test's card header. Orange when ≤3 days remaining, grey otherwise.

---

#### SYSTEM (/system)
**Problem 1:** Voicenter appeared as "unconfigured" — an alarming red state — despite being intentionally parked for Phase 2. Created false anxiety on every System page visit.  
**Violates:** Criterion 3 (exception-only workflow — a parked item should not appear as a crisis).  
**Fix:** Changed Voicenter status to `parked`, renders with grey dot + "Parked — Phase 2" label, reduced opacity (0.55). Excluded from `criticalServices` count. Only truly broken/degraded services now trigger the System sidebar badge.

---

### Changes Made

| File | Change |
|------|--------|
| `lib/mock-data.ts` | Added `pendingCampaignChanges: 1`, `criticalServices: 1` to `systemStats` |
| `components/Sidebar.tsx` | Badges on Campaigns (blue) and System (red) nav items |
| `components/StatusBar.tsx` | Queue/T4/Clients pills are now clickable `<Link>` wrappers |
| `app/conversations/page.tsx` | T4 cards: full-width dark red banner, 2px border |
| `app/clients/page.tsx` | Summary cards clickable as filter toggles with active state highlight |
| `app/creative/page.tsx` | `~Xd to decision` badge on running A/B tests |
| `app/system/page.tsx` | Voicenter status = `parked`, muted styling, excluded from critical count |
| `app/page.tsx` | Pending Queue KPI card: `stale-queue-pulse` animation when oldest >4h |
| `app/globals.css` | Added `stale-queue-pulse` keyframe animation |

---

### Round 1 Agent Review

See below.

---

## Agent Review — Round 1

### Agent A — "The Operator"

**Did changes actually improve the UI?** YES

The Sidebar now shows me exactly where action is needed without opening pages. Before: only Conversations had a badge. Now Campaigns shows `1` when there's a pending change and System shows `1` (red) when a service is broken. I can scan the nav in 2 seconds and know where to go.

The T4 crisis banner is the right call. Before it was a slightly redder card. Now it's a banner that says REQUIRES HUMAN TAKEOVER. I can't miss it.

The Status Bar pills being clickable saves me a click on every morning review. Queue `3` → straight to Conversations. Perfect.

**Highest-impact change still missing:**  
The Dashboard's Approval Queue shows items but doesn't tell me how long the OLDEST item has been waiting at the top. I have to scan each card's timestamp. A "⏰ 4h 12m oldest" header above the queue would let me triage in 1 second.

**Scores (1-10):**
- Operator freedom: 7 (was ~5)
- Trust ladder visibility: 6
- Exception-only workflow: 7 (was ~5)
- Scale to 120: 6
- Hebrew-first content: 7
- Zero ambiguity: 6

---

### Agent B — "The Scaler"

**Did changes actually improve the UI?** PARTIAL

The filter cards on Clients are good — at 120 clients, jumping to "Supervised (24/12 cap)" directly is essential. But the table itself has no pagination or virtual scrolling. At 120+ clients with complex rows (trust score, health, CPL sparkline, kill switch), scrolling through a flat list will be brutal.

The Sidebar badges won't overflow at scale — they cap at 2-digit numbers which is fine. The T4 banner is correct.

What worries me: the Conversations page filter (Tier / Client / Time) has no count per tier. At 400 leads/day I might have 40 T1 items and 2 T4. I can't tell that without reading every card.

**Highest-impact change still missing:**  
Conversations filter tabs need per-tier counts: `T4 (2) | T3 (0) | T2 (5) | T1 (38)`. This is the most critical scale issue.

**Scores (1-10):**
- Operator freedom: 7
- Trust ladder visibility: 6
- Exception-only workflow: 7
- Scale to 120: 5 (table pagination still missing)
- Hebrew-first content: 7
- Zero ambiguity: 6

---

### Agent C — "The Trust Auditor"

**Did changes actually improve the UI?** YES

The T4 banner is exactly right. Before: T4 lived in the same visual stack as T1 Info. Now it screams. The exception-only signal is now correct at the card level.

The System page fix is significant. Voicenter "unconfigured" was training me to ignore the Service Health section (cry wolf effect). Now parked is muted and real issues will pop.

The Creative `~Xd to decision` badge is subtle but correct — it surfaces which tests are near an auto-deploy decision so I can check the quality before the system acts.

What's still broken: the Dashboard shows a Portfolio Heatmap of 37 dots. 3 are red. Hovering shows a tooltip. But I can't click a red dot to go to that client's detail. If one dot turns red, I should be able to go from dot → client profile in one click.

**Highest-impact change still missing:**  
Portfolio Heatmap dots should be clickable → navigate to `/clients?id=X` or open the client drawer directly.

**Scores (1-10):**
- Operator freedom: 7
- Trust ladder visibility: 7 (was 5)
- Exception-only workflow: 8 (was 5)
- Scale to 120: 5
- Hebrew-first content: 7
- Zero ambiguity: 7

---

### Convergence Decision

- Agent A: YES
- Agent B: PARTIAL  
- Agent C: YES

**→ One PARTIAL → Continue to Round 2**

Priority fixes for Round 2 (from agent objections):
1. Conversations filter tabs: add per-tier counts `T4 (N) | T3 (N) | T2 (N) | T1 (N)`
2. Dashboard: make Portfolio Heatmap dots clickable → filter Clients by that client
3. Clients table: add pagination for scale (≥20 rows per page + page controls)
4. Dashboard Approval Queue: show oldest item age as a header above the queue

---

## Round 2

*(In progress)*
