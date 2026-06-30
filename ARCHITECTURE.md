# Architecture — Public Burger Website

Analisi architetturale generata da graphify il 2026-06-30.
Grafo: 572 nodi · 875 edge · 46 community · da 131 file sorgente.

---

## Struttura generale

Il repository contiene **due codebase React parallele** che coesistono nella stessa repo:

| Percorso | Stack | Stato |
|---|---|---|
| `src/` | React + Supabase diretto + WhatsApp | Legacy / prototipo |
| `FILIPPO/src/` | React + Hono + Cloudflare Workers + api.ts | Versione attiva |

Le due codebase non si toccano quasi mai — producono 236 nodi "deboli" (≤1 connessione) nel grafo proprio perché non condividono moduli. Tutto il codice nuovo va in `FILIPPO/src/`.

---

## God nodes — i veri punti di accoppiamento

| Nodo | Edge | Ruolo |
|---|---|---|
| `Vite React Starter Template` | 39 | Nodo concettuale — sorgente comune di tutti i `.tsx` |
| `useConfig()` | 23 | Config runtime globale (orari, manutenzione, checkout) |
| `compilerOptions` | 20 | TypeScript config condivisa tra `tsconfig.app` e `tsconfig.node` |
| `useAuth()` | 17 | Autenticazione e ruoli |
| `api` | 16 | Client HTTP verso Cloudflare Workers (Hono) |
| `useCart()` | 11 | Stato carrello globale |

---

## I due context globali: `useConfig()` vs `useAuth()`

Sono separati in modo pulito e con responsabilità distinte.

### `useConfig()` — 23 edge, 5 community
Governa **come funziona l'app**: orari di apertura, stato manutenzione, checkout attivo.
Viene consumato da:
- Cart & Checkout Flow (`CheckoutModal`, `OpenStatus`, `ProductCard`)
- Checkout & Config Context (`MaintenanceGuard`, `useOpeningHours`, `SettingsManagement`, `CheckoutPage`)
- Kitchen Display & Menu Mgmt (`KitchenDisplay`)
- Layout Shell (`Footer`, `Header`)
- Rider Tracker & GPS (`RiderTracker`)

**Rischio:** singolo punto di failure. Se `ConfigContext` è lento o non disponibile, blocca 5 community in parallelo.

### `useAuth()` — 17 edge, 4 community
Governa **chi sei**: accesso, ruoli, admin vs rider vs cliente.
Viene consumato da:
- Auth & Admin Layout (`AdminLayout`, `AdminDashboard`, `RiderScanner`, `AuthPage`, `ProfilePage`)
- Checkout & Config Context (`CheckoutPage`) — per associare l'ordine all'utente
- Layout Shell (`Header`) — mostra stato login
- Order Details Page (`OrderDetailsPage`) — pagina protetta

**Sovrapposizione con `useConfig()`:** solo `CheckoutPage` e `Header` usano entrambi. La separazione regge.

---

## `api.ts` — il confine client/server

`FILIPPO/src/services/api.ts` è il client HTTP verso il backend Hono su Cloudflare Workers. Tutti i suoi 16 edge sono in ingresso — è un service layer puro.

**Chi usa il server:**
- Auth & Admin Layout (`AuthContext`, `ProfilePage`, `AdminDashboard`, `RiderScanner`)
- Cart & Checkout Flow (`MenuPage`)
- Checkout & Config Context (`MaintenanceGuard`, `ConfigContext`, `CheckoutPage`, `SettingsManagement`)
- Kitchen Display & Menu Mgmt (`KitchenDisplay`, `MenuManagement`, `OrderManagement`, `StatsManagement`)
- Order Details Page (`OrderDetailsPage`)
- Rider Tracker & GPS (`RiderTracker`)

**Chi NON usa il server (solo client-side):**
- Showcase & Menu UI — dati statici da `menuData.ts`
- Food Cost & Recipe Analysis — tutto locale
- Burger Configurator — logica locale
- Gamification & Order Tiers — KV locale o Cloudflare KV

---

## Flusso ordine: dal cliente alla cucina

### Percorso A — `src/` (legacy, WhatsApp diretto)
```
ShowcasePage → CartFAB
  → CartPanel.tsx
      → buildWhatsAppMessage()
      → incrementOrderCount()  [gamification]
      → saveOrder()            [orders.ts → Supabase]
      → getStoredUser()        [supabase.ts]
  → [WhatsApp link]
```
Non passa per `api.ts`. Va diretto a Supabase e WhatsApp.

### Percorso B — `FILIPPO/src/` (Hono, versione attiva)
```
MenuPage → CartDrawer [CartContext]
  → CheckoutModal / CheckoutPage
      → useCart()           stato carrello
      → useConfig()         orari e stato servizio
      → useAuth()           identità utente
      → useOpeningHours()   gate: il ristorante è aperto?
      → generateWhatsAppLink()  [whatsappUtils.ts]
      → api.ts              salva ordine su Cloudflare Worker
  → KitchenDisplay.tsx
      → api.ts  [polling]   riceve gli ordini
      → useConfig()         legge stato servizio
  → OrderManagement.tsx
      → api.ts              aggiorna stato ordini
```

**Note:**
- `useOpeningHours()` è il gate del checkout: se chiuso, il flusso si interrompe prima di tutto
- WhatsApp è ancora nel loop anche nella versione Hono — probabilmente come canale parallelo o fallback
- La cucina non riceve push: fa **polling** su `api.ts`. Non ci sono WebSocket nel grafo

---

## Flusso rider — geolocalizzazione in background

Il sistema è a tre strati disaccoppiati:

### 1. Dispositivo del rider (Service Worker)
```
service-worker.js  [public/]
  startPeriodicUpdates()
    → requestLocationFromMainThread()   chiede GPS al tab aperto
    → handleLocationUpdate()            riceve coordinate
  → postMessage al main thread

serviceWorker.ts  [FILIPPO/src/utils/]
  registerServiceWorker()    registra il SW
  listenToServiceWorker()    ascolta i messaggi GPS
  startBackgroundTracking()  avvia ciclo di invio
  stopBackgroundTracking()   ferma il ciclo
    → api.ts                 invia posizione al backend
```

Il Service Worker non può accedere direttamente al GPS — chiede al tab aperto via `postMessage`. Il GPS gira anche quando il browser è in background.

### 2. Check-in del turno (admin)
```
RiderScanner.tsx
  → useAuth()   solo admin può usarlo
  → api         registra il rider come "in servizio" (probabilmente via QR)
```

### 3. Mappa admin (RiderTracker)
```
RiderTracker.tsx
  → useConfig()      legge config (rider attivo?)
  → api              polling posizioni dal backend
  → ISOLA_DEL_LIRI   coordinate hardcoded del ristorante (centro mappa)
  → RiderHistory     storico posizioni
  → RiderLocation    posizione corrente
```

**Note:**
- `RiderTracker` e `serviceWorker.ts` non hanno edge diretti: si parlano solo attraverso il backend
- Anche il tracker usa **polling**, non WebSocket — c'è latenza tra posizione reale e mappa admin
- `ISOLA_DEL_LIRI` è hardcoded in `RiderTracker.tsx`

---

## Modulo BM25 / Design System — universo isolato

La community "Search & Design Core" (community 5) **non fa parte del sito burger**.
È la toolchain interna dello skill `ui-ux-pro-max` installato in `.claude/skills/`:

```
.claude/skills/ui-ux-pro-max/scripts/
  core.py        → BM25, _search_csv(), detect_domain(), search()
  search.py      → format_output() per Claude
  design_system.py ← importa core.py
```

`BM25` serve a cercare tra CSV di design guidelines (palette, font, componenti) quando Claude invoca lo skill. Zero edge verso React, Supabase, Hono o qualsiasi componente del sito.

---

## Connessioni ambigue — da verificare

- **`Logo MACELL 1980 Brand Design Asset` → `Public Burger Brand Identity`** `[AMBIGUOUS]`
  Il PDF del logo della macelleria e il concetto di brand identity del sito sono collegati con bassa confidenza. La relazione esiste (stessa famiglia imprenditoriale) ma non è esplicitata nel codice.

---

## Duplicazioni rilevate dal grafo

| Pattern | Dettaglio |
|---|---|
| Skill duplicati | Ogni skill è installato sia in `.agents/skills/` che in `.claude/skills/` — contenuto identico, due alberi paralleli |
| `tsconfig.app.json` vs `tsconfig.node.json` | Stesse `compilerOptions`, due community separate (7 e 9) |
| `menuData.ts` vs `menuData.backup2.ts` | Dati menu duplicati — il backup ha tipi leggermente diversi (`BurgerDef`, `FryDef`) |
| Community 34 vs 35 | Logos identici (Deliveroo, Just Eat, Macelleria) sia in root che in `public/` |

---

## Mappa delle community principali

| # | Nome | Cohesion | Nodi chiave |
|---|---|---|---|
| 0 | Admin Dashboard & Stats | 0.05 | `AdminPage`, `orders.ts`, `DailyStat` |
| 2 | Cart & Checkout Flow | 0.09 | `CartDrawer`, `CheckoutModal`, `CartContext`, `useCart` |
| 3 | Showcase & Menu UI | 0.10 | `ShowcasePage`, `BurgerFilter`, `CartFAB` |
| 10 | Auth & Admin Layout | 0.18 | `AuthContext`, `useAuth`, `AdminLayout` |
| 11 | Checkout & App Config Context | 0.18 | `ConfigContext`, `useConfig`, `MaintenanceGuard` |
| 12 | Kitchen Display & Menu Mgmt | 0.14 | `KitchenDisplay`, `OrderManagement`, `api` |
| 13 | Food Cost & Recipe Analysis | 0.14 | `FoodCostTab`, `FCRecipe`, `FCIngredient` |
| 18 | Burger Configurator | 0.24 | `BurgerConfigurator`, `buildSteps`, `CartBurger` |
| 20 | Supabase Auth & Login | 0.22 | `supabase.ts`, `PBUser`, `LoginPage` |
| 24 | Hono API & Auth Utils | 0.32 | `auth_utils.ts`, `hashPassword`, `index.ts` |
| 25 | Gamification & Order Tiers | 0.29 | `gamification.ts`, `getTier`, `TIERS` |
| 27 | Layout Shell | 0.38 | `Header`, `Footer`, `Layout` |
| 28 | Rider Tracker & GPS | 0.29 | `RiderTracker`, `RiderLocation`, `ISOLA_DEL_LIRI` |
| 31 | Service Worker Registration | 0.40 | `serviceWorker.ts`, `startBackgroundTracking` |
| 32 | Service Worker Location | 0.50 | `service-worker.js`, `startPeriodicUpdates` |

Le community con cohesion < 0.10 (Admin Dashboard, Cart & Checkout, TypeScript configs) sono candidate a una suddivisione in moduli più piccoli.
