# PublicBurger — Design System MASTER

> **Fonte:** generato con `ui-ux-pro-max` il 2026-06-29, sintetizzato con il brand esistente del sito.
> **Regola di lettura:** Quando costruisci una pagina specifica, controlla prima `design-system/pages/[nome-pagina].md`.
> Se esiste, le sue regole sovrascrivono questo file. Altrimenti usa esclusivamente questo file.

---

## 1. Identità del Brand

| Attributo | Valore |
|-----------|--------|
| **Nome** | Public Burger |
| **Categoria** | Street Food / Burger Shop |
| **Stile UI** | Vibrant & Block-based — caldo, energico, appetitoso |
| **Audience** | Consumer locale, mobile-first, giovani adulti |
| **Stack** | React + TypeScript + Vite + Tailwind CSS v3 + Framer Motion |

**Personalità del brand:** audace, diretto, caldo, artigianale. NON generico, NON SaaS, NON "AI startup".

---

## 2. Palette Colori

### 2a. Colori Attuali (Brand Esistente)

Il sito usa attualmente questa palette. **Da mantenere come riferimento principale.**

| Ruolo | Hex | Variabile CSS | Utilizzo |
|-------|-----|---------------|----------|
| **Dark BG** | `#1a0a10` | `--pb-dark` | Sfondo principale, header hero, popup, nav dark |
| **Primary** | `#CF6990` | `--pb-primary` | CTA, badge, highlight, active states |
| **Primary Dark** | `#A8456B` | `--pb-primary-dark` | Prezzi, testi accento su sfondo chiaro |
| **Primary Light** | `#FBE8EF` | `--pb-primary-light` | Background hover cards, selected states |
| **Surface** | `#FFFFFF` | `--pb-surface` | Card background, modali |
| **Surface Gray** | `#F2F2F7` | `--pb-surface-gray` | Input background (iOS style) |
| **Text Primary** | `#1a0a10` | `--pb-text` | Testi principali su sfondo chiaro |
| **Text Muted** | `rgba(0,0,0,0.35)` | `--pb-text-muted` | Testi secondari, label |
| **Border** | `rgba(0,0,0,0.08)` | `--pb-border` | Divisori, bordi card |

### 2b. Palette Warm Expansion (Raccomandato per futuri componenti)

Aggiunta dalla ricerca `ui-ux-pro-max` per estendere il brand verso palette più calde/appetitose.

| Ruolo | Hex | Utilizzo consigliato |
|-------|-----|----------------------|
| **Amber Accent** | `#A16207` | Badge promo, tag "in evidenza", prezzi speciali |
| **Warm Red** | `#DC2626` | Errori, badge urgenza, allerte |
| **Cream BG** | `#FEF2F2` | Sezioni chiare alternative al bianco puro |
| **Deep Brown** | `#450A0A` | Testo su sfondi crema, alternativa al dark |
| **Warm Border** | `#FECACA` | Separatori nelle sezioni warm |

### 2c. Token Tailwind (da aggiungere in `tailwind.config.js` se necessario)

```js
// tailwind.config.js — extend colors
colors: {
  pb: {
    dark:         '#1a0a10',
    primary:      '#CF6990',
    'primary-dk': '#A8456B',
    'primary-lt': '#FBE8EF',
    amber:        '#A16207',
    red:          '#DC2626',
    cream:        '#FEF2F2',
  }
}
```

### 2d. CSS Custom Properties (da aggiungere in `index.css` se necessario)

```css
:root {
  --pb-dark:          #1a0a10;
  --pb-primary:       #CF6990;
  --pb-primary-dark:  #A8456B;
  --pb-primary-light: #FBE8EF;
  --pb-surface:       #FFFFFF;
  --pb-surface-gray:  #F2F2F7;
  --pb-text:          #1a0a10;
  --pb-text-muted:    rgba(0,0,0,0.35);
  --pb-border:        rgba(0,0,0,0.08);
  --pb-amber:         #A16207;
  --pb-red:           #DC2626;
  --pb-cream:         #FEF2F2;
}
```

---

## 3. Tipografia

### 3a. Font in Uso Attualmente

```css
/* Già importato in ShowcasePage.tsx */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

font-family: 'Inter', system-ui, sans-serif; /* applicato globalmente via style tag */
```

**Inter** è una scelta eccellente: neutro, leggibile, moderno. **Da mantenere per body text.**

### 3b. Font Raccomandato (Display / Headings)

Per dare più carattere al brand su sezioni hero, titoli sezione, popup:

**Opzione A — Restaurant Elegance** (raccomandato da `ui-ux-pro-max`):
```css
/* Heading: Playfair Display SC — elegante, culinary, memorabile */
/* Body: Karla — leggero, leggibile, complementare */
@import url('https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600;700&family=Playfair+Display+SC:wght@400;700&display=swap');
```

**Opzione B — Street Food Energy** (più vicina allo stile esistente del sito):
```css
/* Heading: Righteous — bold, energico, street */
/* Body: Inter — già in uso */
@import url('https://fonts.googleapis.com/css2?family=Righteous&family=Inter:wght@300;400;500;600&display=swap');
```

**Opzione C — Kinetic / Urban** (per sezioni hero aggressive):
```css
/* Space Grotesk — single-family dominante, uppercase, bold */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
```

> **Decisione attuale:** il sito usa Inter ovunque. Prima di cambiare, testare Righteous solo sull'hero e vedere se il brand guadagna carattere senza perdere leggibilità.

### 3c. Type Scale

| Token | Size | Weight | Line-height | Utilizzo |
|-------|------|--------|-------------|----------|
| `display-xl` | 4rem / 64px | 900 | 0.95 | Hero principale |
| `display-lg` | 2.625rem / 42px | 800 | 1.0 | Titoli popup, sezione hero |
| `heading-xl` | 1.875rem / 30px | 700 | 1.1 | Titoli sezione |
| `heading-lg` | 1.5rem / 24px | 700 | 1.2 | Titoli card, nome burger |
| `heading-md` | 1.25rem / 20px | 600 | 1.3 | Sottotitoli |
| `label-xl` | 0.875rem / 14px | 700 | 1.0 | Badge, CTA uppercase |
| `label-lg` | 0.75rem / 12px | 600 | 1.0 | Tag, tracking widest |
| `label-sm` | 0.625rem / 10px | 600 | 1.0 | Micro-label (tracking 0.3em) |
| `body-lg` | 1rem / 16px | 400 | 1.6 | Corpo testo principale |
| `body-md` | 0.875rem / 14px | 400 | 1.5 | Ingredienti, descrizioni |
| `body-sm` | 0.75rem / 12px | 400 | 1.4 | Allergeni, note secondarie |

> ⚠️ **Regola iOS critica:** Tutti gli `<input>` devono avere `font-size: 16px` (text-base) o superiore. Sotto i 16px Safari fa zoom automatico.

---

## 4. Sistema di Spacing

Basato su scala 4px/8px (Material Design standard).

| Token | Valore | Tailwind | Utilizzo tipico |
|-------|--------|----------|-----------------|
| `space-1` | 4px | `p-1`, `gap-1` | Micro gap, icon spacing |
| `space-2` | 8px | `p-2`, `gap-2` | Gap tra elementi vicini |
| `space-3` | 12px | `p-3`, `gap-3` | Padding interno badge/tag |
| `space-4` | 16px | `p-4`, `gap-4` | Padding standard card |
| `space-5` | 20px | `p-5` | Padding card mobile |
| `space-6` | 24px | `p-6`, `gap-6` | Section padding interno |
| `space-8` | 32px | `p-8` | Padding card desktop |
| `space-10` | 40px | `py-10` | Spaziatura tra sezioni |
| `space-12` | 48px | `py-12` | Sezioni principali |
| `space-16` | 64px | `py-16` | Hero padding |

**Z-index scale:**
```
base:     0
content:  10
sticky:   20
dropdown: 30
fixed:    40
modal:    100
toast:    200
```

---

## 5. Bordi e Raggi

| Token | Valore | Utilizzo |
|-------|--------|----------|
| `rounded` | 8px | Tag, badge piccoli |
| `rounded-xl` | 12px | Card menu, input |
| `rounded-2xl` | 16px | Card grosse, modal |
| `rounded-3xl` | 24px | Modali bottom sheet, CartPanel |
| `rounded-full` | 9999px | Avatar, badge qty, pill button |

---

## 6. Ombre (Elevation)

| Token | Valore | Utilizzo |
|-------|--------|----------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Card a riposo |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Card hover leggero |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.10)` | Modal, dropdown |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | CartPanel, popup principale |
| `shadow-pink` | `0 4px 24px rgba(207,105,144,0.18)` | Card burger hover (brand) |

---

## 7. Pattern Componenti

### 7a. Buttons

```tsx
// PRIMARY — CTA principale (es. "Aggiungi al carrello")
className="px-6 py-3 rounded-2xl bg-[#1a0a10] text-white text-[11px] font-bold uppercase tracking-[0.25em] 
           hover:bg-[#CF6990] transition-colors duration-200 cursor-pointer min-h-[44px]"

// SECONDARY — ghost button (es. "Torna al menu")
className="px-6 py-3 rounded-2xl border-2 border-[#CF6990] text-[#CF6990] text-[11px] font-bold uppercase 
           tracking-[0.25em] hover:bg-[#FBE8EF] transition-colors duration-200 cursor-pointer min-h-[44px]"

// PILL — size selector, filtri
className="px-4 py-2 rounded-full border border-black/15 text-[10px] font-semibold uppercase tracking-[0.2em]
           text-black/60 hover:border-[#CF6990] hover:text-[#CF6990] hover:bg-[#FBE8EF]/50 
           transition-all duration-200 cursor-pointer min-h-[44px]"

// ICON ACTION — rimuovi, minus
className="w-7 h-7 rounded-full border border-black/15 text-black/40 hover:border-[#CF6990] 
           hover:text-[#CF6990] flex items-center justify-center transition-colors duration-200 cursor-pointer"
```

**Regole:**
- Sempre `cursor-pointer` su tutti i clickable
- `min-h-[44px]` su tutti i bottoni (touch target minimo)
- Transizioni: sempre `150–300ms`, mai `0ms`
- Stati: hover + active + disabled (opacity 0.4 + `cursor-not-allowed`)

### 7b. Cards (Menu Item)

```tsx
// BURGER CARD
className="bg-white rounded-2xl shadow-sm border border-black/5 px-5 py-6 mb-3 cursor-pointer 
           hover:border-[#CF6990]/50 hover:bg-[#FBE8EF]/25 hover:shadow-[0_4px_24px_rgba(207,105,144,0.12)] 
           transition-colors duration-300"

// FRIES / SALSE CARD (action card)
className="motion.button ... rounded-2xl border border-black/8 bg-white px-5 py-4 cursor-pointer 
           hover:border-[#CF6990]/40 hover:bg-[#FBE8EF]/20 transition-colors duration-200"
```

**Regole card:**
- Background sempre `bg-white` (mai trasparente)
- Border `border-black/5` → `border-[#CF6990]/50` su hover
- Shadow aumenta su hover (no trasformazioni di layout)
- Badge qty: `bg-[#CF6990] text-white rounded-full text-[10px] font-bold`

### 7c. Badge / Tag

```tsx
// POPULAR badge
className="inline-block text-[9px] font-bold text-white bg-[#CF6990] rounded px-2 py-0.5 
           tracking-widest uppercase leading-none whitespace-nowrap"

// SIZE badge (nel carrello)
className="text-[11px] font-bold uppercase tracking-wide text-[#A8456B] bg-[#FBE8EF] px-2 py-0.5 rounded-full"

// COMBO badge
className="text-[11px] font-bold uppercase tracking-wide text-[#8B6914] bg-[#FFF3CC] px-2 py-0.5 rounded-full"

// CATEGORY tag (micro-label)
className="text-[9px] tracking-[0.3em] uppercase text-black/25 font-semibold"
```

### 7d. Input Fields

```tsx
// STANDARD INPUT (CartPanel, form)
className="w-full rounded-xl border border-black/10 bg-[#F2F2F7] px-4 py-3 text-base font-medium 
           focus:outline-none focus:border-[#CF6990] focus:bg-white placeholder-black/20 transition-all"

// Regola iOS: font-size SEMPRE text-base (16px) o superiore negli input
// Aggiungere: touch-action: manipulation (via style o plugin)
```

### 7e. Modali / Bottom Sheets

```tsx
// OVERLAY
className="fixed inset-0 z-[100] flex items-end md:items-center justify-center"

// BACKDROP
className="absolute inset-0 bg-black/70 backdrop-blur-sm"

// CARD (bottom sheet mobile)
className="relative w-full md:max-w-md bg-white flex flex-col max-h-[80vh] shadow-2xl 
           rounded-t-3xl md:rounded-3xl overflow-hidden"
```

**Regole modali:**
- Sempre `backdrop-blur-sm` sull'overlay
- Bottom sheet su mobile (`rounded-t-3xl`), centrato su desktop (`md:rounded-3xl`)
- `document.body.style.overflow = 'hidden'` quando aperto (scroll lock)
- Chiusura su click overlay + swipe down su mobile
- `AnimatePresence` con `initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}`

### 7f. Navigation (SubNav)

```tsx
// TAB ATTIVO
className="shrink-0 px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] font-semibold rounded-full 
           bg-[#1a0a10] text-white"

// TAB INATTIVO
className="shrink-0 px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] font-semibold rounded-full 
           text-black/40 hover:text-black/70 transition-colors"

// CONTAINER nav (horizontal scroll mobile)
className="flex gap-1 px-4 py-3 overflow-x-auto scrollbar-none"
```

---

## 8. Animazioni (Framer Motion)

### 8a. Principi

| Principio | Valore |
|-----------|--------|
| **Durata micro** | 150–200ms (hover, tap feedback) |
| **Durata standard** | 250–350ms (card open, modal) |
| **Durata complessa** | 400–500ms (page transition, splash) |
| **Easing entrata** | `[0.16, 1, 0.3, 1]` (ease-out springy) |
| **Easing uscita** | `ease-in` |
| **Exit = 60–70% durata entrata** | |

### 8b. Preset Usati nel Sito

```tsx
// CARD HOVER (Framer Motion)
whileHover={{ scale: 1.01 }}
whileTap={{ scale: 0.97 }}
transition={{ type: 'spring', stiffness: 500, damping: 20 }}

// MODAL ENTRY
initial={{ y: 60, opacity: 0 }}
animate={{ y: 0, opacity: 1 }}
exit={{ y: 60, opacity: 0 }}
transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}

// FADE UP (scroll reveal — CSS, non Framer)
// .pb-reveal → .pb-visible via IntersectionObserver
@keyframes pbFadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

// TICKER (seamless loop)
// useAnimationFrame + useMotionValue
// Dual-copy content, reset by +halfWidth

// TOAST
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -10 }}
```

### 8c. Regole Animazione

- ✅ Usa sempre `transform` e `opacity` — mai `width`, `height`, `top`, `left`
- ✅ `AnimatePresence mode="wait"` con `exit` prop esplicito per evitare overlap
- ✅ Max 1–2 elementi animati per schermata contemporaneamente
- ✅ Rispetta `prefers-reduced-motion`: disabilita animazioni se attivo
- ❌ Mai bloccare l'input utente durante un'animazione
- ❌ Mai animare layout properties (margin, padding, flex-grow)

---

## 9. Responsività

### Breakpoints

| Nome | Min-width | Tailwind | Uso |
|------|-----------|----------|-----|
| Mobile S | 320px | default | Base design |
| Mobile L | 375px | default | Target principale |
| Tablet | 768px | `md:` | Layout a 2 colonne |
| Desktop | 1024px | `lg:` | Layout esteso |
| Wide | 1440px | `xl:` / `2xl:` | Max content width |

### Regole Mobile-First

- Container max: `max-w-4xl mx-auto` per contenuto, `max-w-md` per panel/modali
- Padding orizzontale: `px-4` mobile, `px-6 md:px-16` desktop
- Touch targets: `min-h-[44px] min-w-[44px]` su tutti gli elementi interattivi
- `touch-action: manipulation` su pulsanti/card per eliminare 300ms delay
- Input: `font-size: 16px` minimo per prevenire zoom iOS
- Viewport: `width=device-width, initial-scale=1.0` (NO `user-scalable=no`, NO `maximum-scale`)

---

## 10. Accessibilità

| Regola | Standard |
|--------|----------|
| Contrasto testo normale | Min 4.5:1 (WCAG AA) |
| Contrasto testo grande (18px+) | Min 3:1 |
| Focus ring | Visibile, 2–3px, colore `#CF6990` |
| Alt text immagini | Sempre su immagini significative |
| Aria-label | Su bottoni icon-only |
| Keyboard nav | Tab order logico, no focus trap |
| `prefers-reduced-motion` | Riduce/elimina animazioni se richiesto |

---

## 11. Anti-Pattern (NON usare mai)

- ❌ Emoji come icone strutturali (usa SVG: Heroicons, Lucide)
- ❌ Colori viola/blu/gradients da SaaS
- ❌ Input con font-size < 16px su mobile
- ❌ Touch target < 44px
- ❌ Animazioni > 500ms su micro-interazioni
- ❌ Animare `width`, `height`, `margin`, `padding`
- ❌ `user-scalable=no` nel viewport meta
- ❌ Testo con contrasto < 4.5:1
- ❌ `cursor: default` su elementi cliccabili
- ❌ Scroll lock dimenticato su modali aperti
- ❌ `AnimatePresence` senza `exit` prop (causa overlap)
- ❌ `font-size` in px hardcodato nei component (usa Tailwind tokens)
- ❌ Z-index casuali (usa la scala definita sopra)

---

## 12. Checklist Pre-Consegna

Prima di ogni modifica UI:

### Visual
- [ ] Niente emoji come icone (SVG)
- [ ] Palette colori rispettata (primary `#CF6990`, dark `#1a0a10`)
- [ ] Contrasto testo ≥ 4.5:1
- [ ] Focus state visibile su tutti gli elementi interattivi

### Interazione
- [ ] `cursor-pointer` su tutti i cliccabili
- [ ] `min-h-[44px]` su tutti i bottoni/touch target
- [ ] Transizioni 150–300ms (mai 0ms)
- [ ] Scroll lock attivo quando modale aperto
- [ ] `touch-action: manipulation` su card/bottoni

### Responsive
- [ ] Testato a 375px (mobile S)
- [ ] Testato a 768px (tablet)
- [ ] Nessun overflow-x orizzontale
- [ ] Input con font-size ≥ 16px

### Animazioni
- [ ] `exit` prop esplicito in `AnimatePresence`
- [ ] Solo `transform` e `opacity` animati
- [ ] `prefers-reduced-motion` gestito

---

*Generato con `ui-ux-pro-max` — dati da `colors.csv`, `typography.csv`, `ux-guidelines.csv`, `stacks/react.csv`, `stacks/html-tailwind.csv`, `products.csv`, `styles.csv`.*
*Ricerche: street food restaurant warm energetic appetizing · color warm amber brown cream · typography bold energetic street food · ux animation mobile touch scroll · stack react + html-tailwind*
