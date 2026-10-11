# CampusBite UI direction — The campus lunch club

Design direction by Astra; implementation by Sol. Web is the primary surface. Preserve every existing route, API contract, permission, payment state, and order action. The design is a fresh composition around the current product, not a new product workflow.

## Character

CampusBite should feel like the best little food counter on campus: confident, lively, useful, and familiar. Take cues from printed menus, canteen trays, pickup tickets, and campus posters. Build contrast through large typography, flat color fields, clean dark rules, food imagery, and compact operational information. Avoid ambient gradient blobs, frosted glass, identical cards for every section, generic SaaS feature grids, and manufactured usage statistics.

## Exact foundations

| Token | Value | Purpose |
| --- | --- | --- |
| background | `#F5F1E8` | Warm oat page canvas |
| foreground | `#20251D` | Deep olive ink and strong dark sections |
| card / popover | `#FFFEF9` | Paper white panels |
| primary | `#C9472B` | Tomato actions and selected emphasis |
| primary foreground | `#FFFFFF` | Text on tomato |
| secondary | `#E8EBDA` | Sage surfaces |
| secondary foreground | `#20251D` | Text on sage |
| accent | `#E1EE9D` | Chartreuse highlights and dark-panel active navigation |
| accent foreground | `#20251D` | Text on chartreuse |
| muted | `#ECEDE5` | Skeletons / quiet surfaces |
| muted foreground | `#62695C` | Accessible secondary text |
| border / input | `#D9DDCE` | Quiet rules |
| ring | `#9A3825` | Keyboard focus |
| success | `#286044` | Ready / collected / success |
| warning | `#8A5716` | Waiting and attention |
| destructive | `#B52E30` | Failure / cancellation / destructive actions |

Use `Barlow Condensed` 600/700/800 for the wordmark, hero, page titles, and large metrics. Use `DM Sans` 400/500/600/700 for all controls, descriptions, card titles, and tables. If font loading is unavailable, use an explicit condensed sans fallback for display and system sans for body. Avoid condensed text for detailed data. Use tabular numerals for prices, quantities, status counts, and OTPs.

Hero display: `clamp(3.6rem, 8vw, 7rem)`, 0.92 line height, 700/800, uppercase. App page headings: 44–48px desktop / 34px phone, 1.02 line height. Form titles: 36px. Body: 15–16px / 1.5–1.65; metadata: 12–13px; eyebrow: 11px, uppercase, .14em tracking, 700.

Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96. Content max width 1240px. Page gutter 32px desktop / 24px tablet / 16px phone. App vertical rhythm 32px between major sections, 20px inside panels. Avoid double padding from both Layout and page wrappers.

Radii: 10–12px buttons and fields, 16px utility panels, 20px food image panels, 999px tags. Standard panels have 1px borders and no shadow. Use a 4px hard offset shadow or slight rotation only on a decorative landing receipt. Elevation only for menus/dialogs and sticky action docks. Icons: Lucide at 18–20px, consistent stroke width.

## Shared components and files

- `src/index.css`: replace tokens, fonts, global gradient background, typography, and body line height. Keep focus treatment, safe-area support, reduced-motion support. Introduce reusable classes for `.eyebrow`, `.page-heading`, `.section-heading`, `.paper-panel`, and `.ticket-divider` rather than broad selectors tied to incidental Tailwind classes.
- `components/ui/button.jsx`: tomato primary, olive/ink secondary option if needed, quiet outlined controls. Minimum default height 44px; 48px major actions. Never apply a translate animation to every button. Hover changes fill/border; pressed scale is optional and subtle. Keep existing props, variants, Radix Slot, refs, disabled behavior.
- `components/ui/card.jsx`: flat paper panel, border, 16px radius. No default blur, large shadow, or hover motion. Food cards can opt in to image hover.
- `components/ui/input.jsx`, `textarea.jsx`, `select.jsx`: paper or white field, 44–48px height, 12px radius, clear labels and errors. Preserve validation state and native form semantics.
- `components/ui/badge.jsx`, shared `StatusBadge.jsx`: light status-colored tints with darker readable text, icon or dot plus textual label. Status must never depend on color alone.
- `components/shared/EmptyState.jsx`: compact line illustration/icon on sage disk, clear human heading, one helpful action. No giant blank vertical gap on phones.
- `components/shared/OrderTimeline.jsx`: clear connected progress steps; desktop horizontal only when labels fit, mobile vertical. Use one filled active node, checkmarks for completed nodes, neutral upcoming steps. Preserve cancellation/failure states.
- Optional new reusable files: `shared/Brand.jsx`, `shared/PageHeader.jsx`, `layout/AuthLayout.jsx`. Reuse these to ensure identity across every route.

## Brand mark

Use a compact tomato square with a cream bite/C mark or a consistent utensil icon, paired with a bold condensed `CampusBite` wordmark. The mark can be code-native SVG. In dark areas, use chartreuse mark and paper wordmark. Never put a gradient behind the brand icon. Small supporting label: `THE CAMPUS FOOD CLUB` on public pages only; functional role labels inside the app.

## Landing — `pages/LandingPage.jsx`

Header: wordmark left, a small `Made for campus life` phrase in the middle if space allows, `Log in` text action and tomato `Get started` right. 76–84px tall, bottom rule optional. Retain existing login/register destinations.

Hero: generous two-column 52/48 composition. Eyebrow `GOOD FOOD. ZERO QUEUES.`. Oversized headline `YOUR BREAK.` then tomato `YOUR BITE.`. Supporting copy: `Order from your campus favourites. We’ll let you know when it’s time to pick up.` Primary `Find your next bite` to the existing entry route; secondary `I have an account` to login. Beneath: a simple inline assurance row `Campus outlets / Easy ordering / Pickup updates`, not metric cards.

Right: oversized sage tray stage with one or two irregular food plates and a tilted white receipt. Real food photography is ideal when available; CSS/SVG plate and tray artwork is viable and avoids a dependency on remote assets. Receipt copy `PICK UP. / DIG IN.` plus `ORDER → PREP → PICKUP`. It is a brand illustration, so do not imply a fake live store, time, transaction, or popularity count. Add small tomato circular stamp `LESS WAIT. MORE BREAK.` if it stays legible. Keep the artwork balanced and fully inside the viewport.

Below: full-width deep olive panel with small label `FROM HUNGRY TO HAPPY` and three ruled steps in one row: `01 Find your favourite`, `02 Make it yours`, `03 Grab & go`. Chartreuse numbers, paper headings, muted light copy. Follow with a shorter sage/cream two-column promise section and a tomato CTA block if the page needs more depth. Footer: brand, concise campus purpose, existing author attribution. Do not inflate the page with repeated CTA/card sections.

At mobile: header logo and actions fit at 360px; hero copy first; art below at ~300px height; typography 56–68px depending on viewport; step band stacks with separators. Buttons can be full width below 400px.

## Auth — `pages/auth/*.jsx`

Introduce shared `AuthLayout`: desktop full-height split, ~45% deep olive brand panel / 55% oat form zone. Left has logo top, huge paper `GOOD FOOD. / GOOD TO GO.` midsection, chartreuse highlight, and understated tray/ticket graphic. Keep enough visual interest to be a designed page without distracting from the form. Right: top `Back to campus` home link; 420px max-width form centered horizontally; eyebrow context, left-aligned 36px title, concise subtitle, fields, one primary action, alternate auth link. Avoid nesting the entire form inside another floating glass card.

Login retains remember me, password visibility, forgot-password, email checks, role redirects, and loading/errors. Register retains all current fields and role selection; selected role can appear as a segmented option with icon and short label. Password requirements stay immediately below password field. Register form may scroll naturally; never vertically center a tall form into clipped content. Forgot/reset/verify reuse the shell with appropriate contextual copy. Verification success/failure gets a clear symbol, message, and existing next action.

Mobile: reduce branding to a compact top wordmark and optional one-line promise. Omit desktop editorial panel. Use 20px padding and natural document scrolling. Password toggle remains keyboard accessible.

## Shared navigation — `layout/Layout.jsx`, `Navbar.jsx`

Student/faculty desktop: 76px horizontal cream header, wordmark, `Find food` and `My orders` links with strong active state, right account/avatar, bell, and dark olive cart pill with count. Do not bury the two primary routes inside a menu. Maintain profile/logout behaviors and notification access.

Mobile student navigation: top brand and bell/profile; fixed bottom bar with four destinations `Food`, `Orders`, `Cart`, `Account`, visible labels and active tomato accent. Reserve bottom padding equal to bar + safe area. The menu-page cart dock must sit above this navigation, or use one consolidated dock. Never overlap checkout, OTP, PWA nudge, or page footer with fixed UI.

Store desktop: 232–248px persistent deep olive rail, brand top, `STORE WORKSPACE` role label, Dashboard / Orders / Menu / Settings links, active chartreuse block, account/logout at bottom. Main content uses fluid open canvas with a compact top utility row and notifications. At tablet collapse to narrow icon rail only if labels remain accessible. On mobile use horizontal top section tabs or a drawer; keep orders one tap away.

Admin already has its own sidebar in `AdminDashboardPage.jsx`; restyle that existing shell using the same rail system rather than adding a second sidebar through Layout. Preserve its Overview / Users / Stores / Orders / Account routes.

## Student browse — `pages/student/StoresPage.jsx`

Open page heading, no rounded heading container. Eyebrow `YOUR CAMPUS, SERVED FRESH`; title `WHAT’S ON THE MENU?`; secondary greeting uses actual user name only if available. Right-side search on desktop, full-width beneath on phone. Do not add filters for unprovided metadata.

Active orders get a prominent olive/sage horizontal strip above the grid with actual count, simple status cue, and `Track orders`. Restriction/reliability warnings remain above browse content, visually separate and readable.

Section row `Campus favourites` or `All outlets` with actual outlet count. Three-column desktop / two-column tablet / one-column phone card grid. Cards: 16:10 real image; fallback sage illustration with storefront icon and initials instead of orange gradient. Outlet name bold 20px; description capped to two lines; actual opening hours; bottom rule and `Explore menu` with arrow. Use a real link for keyboard navigation, avoid nested buttons inside a clickable card. No invented stars, time estimates, “Open now,” or discounts.

## Store menu — `pages/student/StoreMenuPage.jsx`

Small breadcrumb/back action, then a compact 2-column outlet masthead (details left, 220px photo right) instead of a huge stacked photo header. Title 40px, description 15px. Search and horizontal category tabs in a single clean toolbar; categories use actual data, active deep olive pill.

Desktop: two-column menu-item grid with horizontal food cards, ~120px square image aligned right, title/description/price left, add/quantity control in consistent bottom row. This feels like a menu and improves browsing density. At larger widths a slim sticky summary rail is optional, only if no behavior duplication. Tablet/mobile: one-column horizontal cards, image 96px, 44px quantity targets. Mark unavailable clearly and keep controls disabled as now.

Sticky cart summary: olive background, paper text, count and total, chartreuse `View bag` action; on mobile reserve enough page space and position above bottom navigation. Preserve cart-conflict dialog and current single-store-cart rules.

## Bag, checkout, tracking, history

- `CartPage.jsx`: heading `YOUR NEXT GOOD BITE.` with store context. Desktop 7/5 split item list and sticky receipt summary. Item rows separated by rules, useful thumbnail, clear quantity controls and removal. Summary ticket uses dashed divider before total, huge total, tomato checkout action. Mobile stacks and retains summary at bottom without covering items.
- `CheckoutPage.jsx`: calm, clear payment workflow. Small labeled progress row `Review → Payment → Pickup`. Keep exact current QR, store UPI ID, reference, optional transaction ID, pending/failed/success states and confirmations. QR sits on white with ample quiet margin and a strong amount above. Copy buttons adjacent to the actual values. Summary sticky on desktop. Do not claim instant verified payment; current app uses store-side verification. Do not turn payment initiation or confirmation into an automatic action.
- `OrderTrackingPage.jsx`: one primary progress panel, actual status as hero, order/store context, timeline, and next relevant action. Ready state gets a chartreuse pickup ticket with large monospace/tabular OTP and explicit collection instruction. On-the-way confirmation stays prominent where required. Item details and payment details become secondary panels. Do not show illustrative fake ETA.
- `OrderHistoryPage.jsx`: `YOUR ORDERS` header, existing status tabs as compact pills, order rows/cards with store, timestamp, ID, status, total, and clear view action. Preserve existing filters/pagination/reorder functionality if any. Mobile hierarchy puts store/status first and total/action last.
- `ProfilePage.jsx`: open header and 2-column account form/security panel desktop, one-column mobile. Use an initials avatar on sage, tidy grouped sections, current validation/security behavior. Keep trust/restriction data meaningful and unhidden.

## Store operations

- `StoreDashboardPage.jsx`: page title `TODAY AT THE COUNTER`, actual store name beneath; open header. Four horizontal KPI cells in one bordered paper strip on desktop, 2×2 on phone: pending, orders, revenue, active menu. Huge condensed numerals, tiny status/icon, no four competing rainbow gradients. Pending count can use tomato tint when nonzero. Recent order list occupies 2/3; quick actions 1/3 with dark olive highlighted `Manage orders`. Preserve actual datasets and filters.
- `StoreOrdersPage.jsx`: title `ORDER BOARD`, compact filter tabs with actual counts, consistent clean tickets/rows. Put ID + elapsed/created time on top, customer/items in center, state and next action at bottom/right. Maintain all current transitions/confirmation rules. No drag-and-drop unless already supported. Real-time/polling behavior stays unchanged.
- `OrderDetailPage.jsx`: main order ticket with items, current status, and state-specific primary action; customer/payment/OTP verification in distinct side sections. Danger actions lower priority but still discoverable. Visually distinguish payment verification from food preparation status.
- `MenuManagementPage.jsx`: title `THE MENU`, search/category toolbar and primary add action. Editable items in rows on desktop (thumbnail, item, category, price, availability, actions), cards on phone. Clearly label availability switch. Existing add/edit dialogs adopt paper shell, strong title, proper field grouping, footer actions.
- `StoreSettingsPage.jsx`: sections for outlet details, opening hours, payment setup, and other existing controls. Use a left section summary or two columns only if it helps existing form length; avoid introducing hidden tabs that lose unsaved state. QR/image uploads display helpful previews and preserve validation.

## Admin — `pages/admin/AdminDashboardPage.jsx`

Keep current navigation and data components. Restyle sidebar to olive, selected nav to chartreuse, top heading/eyebrow to condensed editorial system. Overview metrics become calm paper cells with one tomato focus metric; do not fabricate charts if only summary numbers exist. Tables: sage-tinted header, 13px medium labels, 56–64px rows, thin horizontal rules, numeric alignment, legible status chips, subtle hover. Search/filter toolbar one plane above table, pagination one plane below. Keep users/store/order forms, filters, pagination, moderation and account controls intact. On phone scroll only the table region horizontally, never the entire page.

## Native app continuity (follow-up scope if included)

Native code is under `app/`, not `mobile/`. `app/src/theme/index.ts` currently uses React Native Paper MD3 and Inter plus dynamic wallpaper colors. Preserve native navigation and Paper semantics. Map the new light palette into M3 roles and existing screen components; coordinate the dark palette deliberately rather than blindly inverting web colors. Brand identity can stay fixed for logo/art while dynamic theme behavior remains user-responsive. Useful focal files: `components/StoreCard.tsx`, `MenuItemCard.tsx`, `ScreenBars.tsx`, `screens/student/HomeScreen.tsx`, auth screens, and navigator tab-bar styles. Do not apply web CSS layouts directly to native.

## Acceptance

At minimum inspect landing, login/register, student browse/menu/cart/checkout/tracking, store dashboard/orders/menu, and admin overview/table at 1440px and 390px. Check 360px horizontal overflow, sticky/nav collisions, longest store/item/user names, zero/one/many items, absent media, empty/error/loading states, keyboard focus, dialogs, disabled actions, and reduced motion. Run existing build and lint; distinguish pre-existing issues from new failures. Authenticated visual QA can use local test fixtures where necessary but must not create real purchases, change live orders, or falsify displayed production data.
