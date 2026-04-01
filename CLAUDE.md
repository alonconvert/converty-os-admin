@AGENTS.md

# Admin Panel (converty-os/admin-app)

**Stack:** Next.js 14 · TypeScript · No external UI library (all inline styles)  
**Dev server:** `npm run dev` — runs on port 3200  
**Typecheck:** `npx tsc --noEmit` — run after every TypeScript change

## UI Structure

`UI_STRUCTURE.md` in this directory is the authoritative reference for the admin panel's page layout, navigation, component inventory, and design conventions. Read it before:
- Adding or modifying any page
- Adding nav items to the Sidebar
- Changing StatusBar pills
- Updating mock data shape

## Key Files

| File | Role |
|------|------|
| `app/layout.tsx` | Root layout — Sidebar + StatusBar + main |
| `components/Sidebar.tsx` | Collapsible nav, T4 banner, IST clock, operator mode |
| `components/StatusBar.tsx` | Dark top strip — agency health, queue, CPL, AI spend |
| `components/ApprovalQueue.tsx` | Live countdown approval cards (keyboard shortcuts A/E/R) |
| `components/MorningBriefing.tsx` | IST-gated morning modal, exception clients |
| `lib/mock-data.ts` | All mock data + TypeScript types — single source of truth |
| `app/globals.css` | DM Sans + DM Serif Display fonts, CSS variables, animations |

## Design Rules

- **Light mode only** — never dark mode
- **Hebrew text:** always `dir="rtl"` + `fontFamily: "Heebo, sans-serif"` + `textAlign: "right"`
- **Timezone:** always `Intl.DateTimeFormat({ timeZone: "Asia/Jerusalem" })` — never manual UTC offsets
- **KPI numbers:** `fontFamily: "'DM Serif Display', serif"` or className `num-display`
- **Live timers:** `useEffect` + `setInterval`, always return `clearInterval` cleanup
- **Trust vs Health scores:** separate systems with separate color palettes — do not conflate
- **Scale target:** 120 clients (current: 37) — show as `37/120` in UI, not `37/37`
