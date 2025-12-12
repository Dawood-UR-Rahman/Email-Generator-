# Design Guidelines: Temporary Email System

## Design Approach
**Reference-Based**: Drawing inspiration from modern email services (Temp-Mail, Guerrilla Mail) combined with clean SaaS aesthetics (Linear's typography, Stripe's restraint). The design prioritizes clarity, speed, and trust while maintaining a playful, accessible feel for temporary email generation.

## Core Design Principles
1. **Instant Clarity**: Users should understand functionality within 2 seconds
2. **Speed Perception**: Visual feedback for all async operations
3. **Trust Building**: Clean, professional aesthetic despite "temporary" nature
4. **Effortless Actions**: One-click copy, generate, delete operations

---

## Typography System

**Font Stack**: 
- Primary: `Inter` (via Google Fonts) - UI, body, buttons
- Accent: `JetBrains Mono` - Email addresses, technical content

**Hierarchy**:
- Hero/H1: text-5xl md:text-6xl, font-bold, leading-tight
- H2 Sections: text-3xl md:text-4xl, font-bold
- H3 Cards: text-xl md:text-2xl, font-semibold
- Body: text-base, font-normal
- Small/Meta: text-sm, font-medium
- Email Display: text-lg, font-mono, tracking-wide

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16, 20, 24** for consistent rhythm
- Component padding: p-4 to p-8
- Section spacing: py-12 md:py-20 lg:py-24
- Card gaps: gap-6 to gap-8
- Container max-width: max-w-7xl

**Grid Usage**:
- Features/Stats: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Blog posts: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Inbox table: Full-width responsive table with truncation

---

## Component Library

### 1. Navigation Header
- Sticky top navigation (bg-white with subtle shadow on scroll)
- Logo left, navigation center, CTA button right
- Mobile: Hamburger menu with slide-out drawer
- Height: h-16 md:h-20

### 2. Hero Section (Homepage)
- No background image - clean gradient from white to soft orange tint
- Centered content with max-w-4xl
- H1 headline, subtitle (text-xl text-gray-600), primary CTA
- Height: min-h-[60vh], not full viewport

### 3. Email Generator Box (Primary Component)
- Elevated card: rounded-2xl, shadow-xl, p-6 md:p-8
- Email display field: Large text-2xl md:text-3xl, font-mono, bg-gray-50, rounded-lg, p-4
- Action buttons row: Copy (primary), Refresh, Delete, Change Domain, QR Code
- Buttons: rounded-lg, px-4 py-2.5, font-medium
- Sync indicator: Thin progress bar at card top (h-1, animated)

### 4. Stats Section
- 4-column grid on desktop, 2 on tablet, 1 on mobile
- Each stat card: Icon (top), Large number (text-4xl font-bold), Label (text-sm text-gray-600)
- Minimal card style: border border-gray-200, rounded-xl, p-6

### 5. Inbox Table
- Clean table with alternating row backgrounds (bg-gray-50)
- Columns: Sender | Subject | Time
- Hover state: bg-orange-50
- Empty state: Large envelope icon (96x96), "No messages yet" text-2xl, descriptive subtitle
- Mobile: Stack as cards instead of table

### 6. Dashboard Sections (Logged-in Users)
- Sidebar navigation (left): w-64, bg-gray-50, sticky
- Main content area: flex-1, p-6 md:p-8
- Cards for: Custom Domain Setup, Domain Status, Active Inboxes, Notifications
- Card style: bg-white, rounded-xl, shadow-md, p-6

### 7. Admin Panel
- Dark mode sidebar: bg-gray-900, text-white
- Tabs for: Settings, Users, Domains, Emails, Logs
- Data tables with search, filter, pagination
- Action buttons: Approve/Reject, Test Connection, Send Notification

### 8. FAQ Accordion
- Bordered items: border-b border-gray-200
- Question: text-lg font-semibold, py-4
- Expand icon: Chevron rotation transition
- Answer: text-gray-600, pb-4, slide-down animation

### 9. Features Cards
- 3-column grid, 2 on tablet, 1 on mobile
- Card: bg-white, rounded-xl, p-6, hover:shadow-lg transition
- Icon (48x48, orange accent), Title (text-xl font-semibold), Description (text-gray-600)

### 10. Blog Grid
- 3-column masonry-style layout
- Card: Image top (aspect-video), content p-6
- Meta: Author, date (text-sm text-gray-500)
- Title: text-lg font-semibold, hover:text-orange-600

### 11. Footer
- 4-column layout on desktop
- Columns: Logo+About, Quick Links, Resources, Contact
- Newsletter signup: Input + button combo
- Bottom bar: Copyright, social icons, legal links
- bg-gray-900, text-gray-300

---

## Visual Treatments

**Primary Color**: Orange/Coral (#FF6B35 or similar)
- Primary buttons, links, active states, progress bars

**Accent Colors**:
- Success: Green (#10B981)
- Warning: Amber (#F59E0B)
- Error: Red (#EF4444)

**Backgrounds**:
- Page: bg-gray-50
- Cards: bg-white
- Inputs: bg-gray-50 focus:bg-white

**Borders**: border-gray-200 default, border-orange-500 on focus/active

---

## Animations (Minimal)

1. **Sync Progress Bar**: Linear animation, 8-second duration, orange-500
2. **New Email Alert**: Subtle scale-in + fade for new inbox items
3. **Button Hovers**: transform scale-105, transition-all duration-200
4. **Accordion**: max-height transition, 300ms ease
5. **Card Hover**: shadow-md to shadow-xl transition

---

## Responsive Breakpoints

- Mobile: < 768px (stack everything, full-width buttons)
- Tablet: 768px - 1024px (2-column grids)
- Desktop: > 1024px (full multi-column layouts)

---

## Images

**No hero background image** - Use clean gradient background instead

**Icons**: 
- Use Heroicons (outline style) via CDN
- Action buttons: 20x20 icons
- Feature cards: 48x48 icons
- Empty states: 96x96 icons

**User-Generated**:
- QR codes: Generate dynamically for email addresses
- Domain verification status icons (checkmark/warning)

---

## Key UX Patterns

1. **Email Generation**: One-click → Instant feedback → Auto-refresh after 2s
2. **Copy Action**: Click copy → Button text changes to "Copied!" → Icon animation
3. **Domain Dropdown**: Simple select with custom domains grouped separately
4. **Notification Badge**: Red dot on notification icon when unread
5. **Form Validation**: Inline errors, green checkmarks for valid fields