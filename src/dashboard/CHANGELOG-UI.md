# CHANGELOG UI — FiloDiretto Studio

> **Nota stack:** il back office attuale è la dashboard Express (`src/dashboard/index.html`), non Next.js.
> Le specifiche App Router/shadcn sono adattate incrementalmente su questo codebase.

## SETUP + TASK 1 — Naming (2026-05-24)

### Utente
- Sidebar allineata a un unico catalogo voci (`src/dashboard/lib/nav.js`).
- **Identità** → **Identità Brand** (sidebar).
- **Push Notification** → **Push & Notifiche** (sidebar).
- **Leads / People / Dipendenti** → **Contatti** (HR e default Ads).
- **Attività** → **Log Attività** (sidebar + H1).
- **Audience Platform** → **Audience** (H1).
- **Gestione Utenti** → **Utenti** (H1).
- Tab browser Filo light: `Identità Brand · Filo Diretto` (senza brand intermedio).

### Tecnico
- `src/dashboard/lib/nav.js` — single source of truth NAV.
- `src/dashboard/lib/utils.js` — helper `cn()` per task futuri.
- `src/dashboard/styles/tokens.css` — token brand/danger/shadcn aliases.
- `data-section-id` su voci sidebar per sync automatica.

### Decisioni
- Nessuno scaffold Next.js: evita rewrite del monolite da 440k righe.
- Product line **Engage/Live** mantiene override `data-menu-key` (Customer, ecc.).

## Prossimi task (non ancora implementati)
- TASK 2 PageHeader
- TASK 5–6 Sidebar collapsible + AppHeader
- TASK 3 EmptyState, 4 DangerZone, …
