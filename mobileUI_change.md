**Customers Table** → Card with hotel name, phone, outstanding balance, action buttons

**Drivers Table** → Already cards (grid layout), just make single column

**Transport/Trips Table** → Card with trip date, driver, KM start→end, distance, status badge

**Expenses Table** → Card with date, category badge, description, amount, action buttons

**Items Table** → Card with item name, 3 price columns (Wash & Press / Dry Clean / Wash & Dry)
as a mini 3-column mini-table inside the card

**Invoice Table** → Card with invoice #, customer, amount, date, status badge, Print button

**Pay Now Table** → Card with order batch, customer, amount due, Pay button prominent

**Deductions Table** → Card view with name, type, amount/%, action buttons

**Recent Actions Table** → Card with timestamp, user, action type badge, description

#### Card Design Specs:
- Background: `var(--card-bg)`, border-radius: 12px, border: 1px solid var(--border)
- Padding: 14px 16px, margin-bottom: 10px
- Top row: bold identifier (batch/invoice #) + status badge (right-aligned)
- Middle rows: key–value pairs in 2-column mini grid (label muted, value normal)
- Bottom row: action buttons (full-width or 2-per-row, min touch target 44px)
- Wrap entire card list in `<div class="mobile-card-list">`

---

## 5. MODALS / POPUPS — Convert to Bottom Sheets on Mobile

### Current (Desktop):
- `modal-overlay`: centered floating dialog (max-width 600px/800px/1000px)
- Opens via `showModal()` / `createModal()` in ui.js

### Mobile Replacement:
On mobile viewports, modals should slide up from the bottom (bottom sheet pattern).

#### Implementation in `ui.js` / `showModal()`:
```css
@media (max-width: 767px) {
  .modal-overlay {
    align-items: flex-end;
    padding: 0;
  }
  .modal {
    border-radius: 20px 20px 0 0;
    max-width: 100%;
    width: 100%;
    max-height: 92vh;
    padding: 20px 16px;
    /* Slide-up animation */
    animation: slideUpModal 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  }
  @keyframes slideUpModal {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
}
```

Add a drag handle indicator at the top of every mobile modal:
```html
<div class="modal-drag-handle"></div> <!-- 36px wide, 4px tall, rounded, centered -->
```

#### Large Modals (modal-lg, modal-xl):
These have selection tables inside them (e.g., Pay Now Options, Add Order with item picker,
Credit Bill builder, Batch Pay Confirm). On mobile:
- Use full-height `max-height: 95vh` bottom sheet
- Move the internal selection table to a card list (same card pattern as section 4)
- The item quantity inputs (+/- stepper buttons instead of number input) — min 44px touch targets
- Summary section sticks to bottom inside the sheet with a sticky footer bar

#### Specific Modal Adjustments:

**Add Order Modal** (orders.js ~line 513):
- Customer dropdown: full width
- Item picker table → card list with + / - stepper
- Price calculation summary: sticky bottom bar inside sheet

**Pay Now Options Modal** (app.js ~line 1284):
- Payment method selector: large touch-friendly toggle buttons (full width)
- Signature Pad: already canvas-based, set to full width, reduce height to 180px on mobile
- Amount input: large font (1.5em) centered, numeric keyboard (`inputmode="decimal"`)

**Credit Bill Modal** (orders.js ~line 253):
- Items table inside → card list
- Keep the + Add New Item button prominent

**Quick Add Item Modal**: Already compact, just ensure inputs are full-width

---

## 6. FORMS — Mobile Input Optimizations

Apply these globally across ALL form inputs:

```html
<!-- Phone numbers -->
<input type="tel" inputmode="numeric" pattern="[0-9]*">

<!-- Amounts / prices -->
<input type="number" inputmode="decimal" step="0.01" min="0">

<!-- Dates -->
<input type="date"> <!-- renders native date picker on mobile - already good -->

<!-- Search fields -->
<input type="search" inputmode="search">
```

- All `.form-input` padding: increase to `14px` on mobile (larger touch targets)
- All `.btn` minimum height: 44px on mobile (Apple HIG / Material touch target spec)
- `.btn-sm` on mobile: use regular btn sizing — "small" buttons are too hard to tap
- Form grid layouts: `grid-template-columns: 1fr 1fr` → `grid-template-columns: 1fr` on mobile
- Select dropdowns: add `font-size: 16px` to prevent iOS auto-zoom on focus

---

## 7. CONTENT PADDING & SPACING

- `#content { padding: 28px }` → `padding: 12px` on mobile
- `#main { margin-left: 240px }` → `margin-left: 0` on mobile (no sidebar)
- `#topbar { height: 64px; padding: 0 28px }` → `height: 52px; padding: 0 16px` on mobile
- Add `padding-bottom: 74px` to `#content` on mobile to avoid bottom nav overlap
  (64px nav + 10px breathing room)
- `.card { padding: 22px }` → `padding: 14px 12px` on mobile
- `.stat-card { padding: 20px 22px }` → `padding: 14px 12px` on mobile
- `.stat-card .value { font-size: 1.9em }` → `font-size: 1.5em` on mobile

---

## 8. DRIVER ROLE — Mobile-Optimized Transport Flow

The Driver role is the primary mobile user. Their workflow is:
1. Start a trip (open Start Trip modal → enter vehicle, starting KM, select customer sequence)
2. View active trip with customer visit order
3. End trip (enter final KM → auto-calculate distance)

For the Driver specifically:
- **Transport page** should have a prominent "▶ Start New Trip" FAB (Floating Action Button)
  at bottom-right (above bottom nav), 56px circle, indigo background
- Active trip card should be pinned at TOP of Transport page with large status badge
- Customer visit sequence: large numbered list, swipe-friendly, check-off as visited
- "End Trip & Enter KM" button: full-width, green, 52px tall — easy to tap

---

## 9. KEYBOARD SHORTCUTS (keyboard.js)

The current `keyboard.js` handles POS shortcuts (Ctrl+N, Escape, etc.).
On mobile, physical keyboard shortcuts are irrelevant.
- Keep all keyboard.js logic intact (for desktop compat) but wrap handlers in:
  `if (!('ontouchstart' in window)) { /* apply keyboard shortcut */ }`
- On mobile, replace keyboard shortcuts with:
  - Swipe-down to close modals (touch event on modal drag handle)
  - Pull-to-refresh on list pages (add a simple PTR implementation)
  - Long-press on table cards → show context menu (Edit / Delete / View)

---

## 10. CHARTS & ANALYTICS (analytics.js / reports.js)

Chart.js charts are already canvas-based and technically responsive if their containers shrink.
Ensure:
- `.chart-container` has `position: relative` (already set) and NO fixed pixel width
- Set `options.responsive: true` and `options.maintainAspectRatio: false` on ALL charts
- Mobile heights: `height: 220px` (down from 300–320px)
- Charts that are side-by-side (`grid-template-columns: 1fr 1fr`) → stack to single column
- Add horizontal scrolling to the **Reports** page bar charts if they have many data points:
  Wrap the canvas in `overflow-x: auto` and set a `min-width` on mobile for readability
- Analytics page stat cards at top: 2-per-row grid on mobile (same as dashboard)

---

## 11. PWA ENHANCEMENTS (Optional but Recommended)

Since this is being rebuilt for mobile, add basic PWA support:

**Add to index.html `<head>`:**
```html
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="SAGA WC">
<meta name="theme-color" content="#0f2d5c">
<link rel="manifest" href="manifest.json">
```

**Create `manifest.json`:**
```json
{
  "name": "Sagacious Washing Center",
  "short_name": "SAGA WC",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f2d5c",
  "theme_color": "#0f2d5c",
  "icons": [{ "src": "icon-192.png", "sizes": "192x192", "type": "image/png" }]
}
```

---

## 12. WHAT NOT TO CHANGE

- **ALL Supabase DB calls** in `db.js` — do not touch
- **ALL business logic** in orders.js, invoice.js, expenses.js, items.js, reports.js
- **ALL role permission checks** (`isAdmin()`, `isDriver()`, `isStaff()`, `canEdit*()`)
- **Gemini AI integration** in gemini.js — keep the SAGA AI FAB, just ensure it stays above
  the bottom nav (z-index and positioning adjust: `bottom: 80px` instead of `bottom: 24px`)
- **Print/PDF templates** in invoice.js — these use `@media print` and are unaffected
- **Supabase real-time subscriptions** and all event listeners in app.js
- **Dark mode** CSS variables and toggle logic
- **Toast notifications** (already positioned top-right, fine on mobile)
- **Processing overlay** animation
- **Pagination** logic — just ensure page buttons are touch-friendly (min 36px per button)

---

## 13. IMPLEMENTATION ORDER (Recommended)

1. **Step 1 — CSS foundation**: Add mobile media queries to `index.html` `<style>` block.
   Hide sidebar, remove main margin-left, add bottom nav placeholder.

2. **Step 2 — Bottom Navigation**: Build the role-aware bottom nav bar + More drawer in
   `ui.js`. Add `renderBottomNav(role)` function called from app.js after role detection.

3. **Step 3 — Modal → Bottom Sheet**: Update `showModal()` in `ui.js` to detect mobile
   and apply bottom-sheet classes.

4. **Step 4 — Content padding & spacing**: Global CSS adjustments for mobile viewport.

5. **Step 5 — Dashboard**: Convert stat grids and chart layout to mobile-stacked.

6. **Step 6 — Orders**: Implement mobile card list for orders table.

7. **Step 7 — Other tables**: Customers, Drivers, Transport, Expenses, Items, Pay Now,
   Invoices, Deductions, Recent Actions — card list pattern.

8. **Step 8 — Forms & modals content**: Fix all form grid layouts inside modals.

9. **Step 9 — Driver UX**: FAB, trip flow, customer sequence list.

10. **Step 10 — Charts**: Responsive heights, stacked layout.

11. **Step 11 — Test all 3 roles**: Admin, Staff, Driver flows end-to-end on 375px viewport.

---

## File List for Reference:
- index.html — shell, CSS, page containers
- app.js — dashboard, customers, drivers, pay now, deductions, recent actions, paynow modals
- orders.js — orders page + all order modals
- transport.js — transport/trips page + trip modals
- expenses.js — expenses page
- items.js — items catalog page
- analytics.js — data analytics page + Chart.js
- reports.js — reports page + Chart.js
- invoice.js — invoice management + print templates
- settings.js — settings page
- ui.js — shared: createModal(), showModal(), hideModal(), toast(), formatters
- db.js — ALL Supabase queries (do not modify)
- keyboard.js — POS keyboard shortcuts (wrap in non-touch guard)
- gemini.js — SAGA AI chat (reposition FAB only)