# Interface Reinvention: Safari Mobile-First & Interactive Component Matrix

## 1. Mobile-First Safari Design Rules

### Viewport & Safe Area
- **Minimum viewport**: 320px (iPhone SE in portrait)
- **Maximum tested**: 430px (iPhone 15, 15 Pro in portrait); 844px (iPhone 15 Pro Max in landscape)
- **Safe areas**:
  - Top: Dynamic Island / notch clearance (0–48px depending on device)
  - Bottom: Home indicator safe zone (16–34px)
  - Sides: 0px (Edge-to-edge); padding managed in touch targets

### Touch Target & Interaction Zones
- **Minimum touch target**: 44×44px (iOS HIG standard)
- **Recommended target**: 48×48px (better for landscape, small hands)
- **Spacing between targets**: 8px minimum (12px preferred)
- **Bottom navigation bar**:
  - Fixed position above home indicator
  - Height: 56px (including safe area padding)
  - Tab item safe zone: 44×44px centered, 8px horizontal padding
  - 5 tabs maximum (4 recommended for 320px viewport)

### Orientation Transitions
- Portrait: Full-height scrollable content below top bar
- Landscape: Compact studio controls, hidden discovery nav, content re-flows to horizontal scroll or split view
- Transition: No flashing; state preserved during rotation

### Scrolling & Momentum
- Native iOS scrolling (momentum, edge bounce, rubber band)
- Implemented via CSS: `-webkit-overflow-scrolling: touch`
- Sticky headers only in scrollable contexts; test for jank at 30fps

---

## 2. Studio Navigation & Desktop Enhancement

### Mobile-Centric (Primary)
- **Bottom tab bar**: Home (Discovery), Studio, Media, Continuity, Release
- **Studio domain switcher**: Horizontal scroll or bottom sheet modal
- **Back button**: Standard iOS back (11+), position: top-left safe area
- **Actions**: Floating Action Button (FAB) or top-right menu button

### Desktop Enhancement (Secondary)
- **Left sidebar** (uncollapses on hover or max-width: 1024px)
- **Top navigation** persists; Studio domain selector moves to sidebar menu
- **Two-pane layout**: Master list + detail view (iPad / desktop)
- **Keyboard shortcuts**: Cmd+K search, Cmd+Option+E edit mode, etc.

---

## 3. Interactive Component Test Matrix

### Data Entry & Forms
| Component | Mobile | Desktop | Behavior | Test Cases |
|-----------|--------|---------|----------|-----------|
| Text Input | Auto-focus → keyboard appears | Focused border only | Label floats on input | Empty → valid → error states |
| Dropdown / Select | Bottom sheet modal | Inline dropdown | Closes on selection or outside tap | Overflow items, keyboard navigation |
| Checkbox / Radio | 48×48px tap target | Standard 20×20px | Visual feedback on toggle | Multi-select, disabled state |
| Date Picker | Scroller wheels (iOS style) | Calendar popover | Defaults to today | Past/future date ranges |
| Textarea | Expandable, max 6 lines | Fixed 4-line or resizable | Auto-grow on multi-line | Paste formatting preservation |

### Navigation & Disclosure
| Component | Mobile | Desktop | Behavior | Test Cases |
|-----------|--------|---------|----------|-----------|
| Tab Navigation | Bottom bar or horizontal scroll | Top bar or sidebar | Active indicator, scroll into view | 4+ tabs, overflow handling |
| Breadcrumb | Collapsed → "…" | Full path | Tappable ancestors | Deep nesting (5+ levels) |
| Modal / Drawer | Full screen or bottom sheet | Centered overlay, 90vh max | Escape key closes | Nested modals, form in modal |
| Menu / Dropdown | Bottom sheet with actions | Popover near trigger | Dismiss on selection | Keyboard navigation, disabled items |

### Display & Feedback
| Component | Mobile | Desktop | Behavior | Test Cases |
|-----------|--------|---------|----------|-----------|
| Toast / Snackbar | Bottom safe area, 44px touch dismiss | Bottom-right corner | Auto-dismiss after 4s or tap | Stacking, long text wrap |
| Spinner / Loading | Center screen, large (24px+) | Centered or inline | Visible for >200ms | Network delays, cancellation |
| Empty State | Full screen, icon + text + CTA | Centered panel | Descriptive message | No results, permission denied |
| Error State | Full screen or in-place banner | Inline or popover | Clear action to resolve | Input error, API error, timeout |
| Badge / Status | Top-right or inline | Varies | Color coded (success, warning, error) | Multiple badges, truncation |

### Rich Interactions
| Component | Mobile | Desktop | Behavior | Test Cases |
|-----------|--------|---------|----------|-----------|
| Swipe Actions | Swipe left → reveal actions | Right-click context menu | Haptic feedback on swipe start | Animation smoothness, gesture conflict |
| Drag & Drop | Long-press + drag (haptic) | Mouse drag | Drop zone highlight | Reordering lists, cross-section drops |
| Pinch Zoom | Native pinch-to-zoom (images, maps) | Scroll wheel zoom | Min 0.5x, max 3x | Map interaction, timeline scrubbing |
| Carousel / Slider | Horizontal swipe, snap-to-item | Click nav dots or arrows | Indicators visible, loop or stop | Touch drag vs. swipe velocity |
| Gesture Recognizers | Tap, long-press, swipe, pinch | Mouse / keyboard equiv. | Haptic on long-press | Gesture conflicts, rapid taps |

---

## 4. Timeline & Relationship Graph Interactions

### Timeline (Interactive)
- **Desktop**: Drag playhead; click events to jump
- **Mobile**: Tap events; long-press to preview; swipe left/right for temporal navigation
- **Zoom**: Pinch or double-tap (desktop: scroll wheel)
- **Labels**: Auto-hide on zoom-out; show on hover/tap
- **Performance**: Virtualize events outside viewport (O(visible) not O(all))

### Relationship Graph (Interactive)
- **Pan**: Two-finger drag (mobile) or click-drag (desktop)
- **Zoom**: Pinch (mobile) or scroll (desktop)
- **Node focus**: Tap to highlight connected edges; long-press to show metadata popover
- **Edge labels**: Appear on hover/tap only; avoid label collision
- **Physics simulation**: Force-directed layout; optionally disable to improve battery life on mobile

---

## 5. Form Submission & Error Recovery

### Submit Flow (Mobile & Desktop)
1. **Validation**: Inline field errors appear immediately (after blur or on submit attempt)
2. **Submit state**: Button disabled, spinner + "Saving…" text
3. **Success**: Toast ("Saved") + silent return or navigate
4. **Error**: Toast or modal with retry CTA; preserve form input
5. **Offline**: Queued submission; retry on connection restore; show "Queued" badge

### Conflict Resolution (Simultaneous Edits)
- **Detection**: New version loaded; modal shows conflict summary
- **UI**:
  - **Accept remote**: Discards local edits
  - **Keep local**: Overwrites remote (requires confirmation + reason)
  - **Merge**: Side-by-side diff editor (desktop) or sequential approval (mobile)
- **Audit**: Conflict resolution logged with reason and actor

---

## 6. Accessibility & Usability

### Colors & Contrast
- **Text on background**: WCAG AA (4.5:1) minimum
- **UI on UI**: WCAG AA (3:1) for graphics, disabled states
- **Dark mode**: Automatic system preference (prefers-color-scheme)
- **High contrast mode**: Thicker borders, increased spacing

### Focus & Keyboard Navigation
- **Focus indicator**: 2px solid ring, 4px offset, accessible color
- **Tab order**: Logical, left-to-right top-to-bottom
- **Skip links**: "Skip to content", "Skip to main nav" (hidden, visible on focus)
- **Keyboard shortcuts**: Cmd+S save, Cmd+Z undo, Escape close modal

### Screen Reader (VoiceOver / TalkBack)
- **Semantic HTML**: `<button>`, `<nav>`, `<main>`, `<article>`
- **ARIA labels**: `aria-label`, `aria-labelledby` for unlabeled controls
- **Live regions**: `aria-live="polite"` for async updates (toasts, status)
- **Announcements**: "Change saved" on submit, "1 error" on validation failure

---

## 7. Device-Specific Optimizations

### Battery & Performance
- **Reduce motion**: Respect `prefers-reduced-motion: reduce`; disable animations
- **Frame rate**: Target 60fps; use `requestAnimationFrame` and `will-change` CSS judiciously
- **Network**: Lazy-load images, compress SVGs, bundle-split large features
- **Bluetooth & NFC**: Prepare for future integrations; abstract behind provider interface

### Haptic Feedback
- **Long-press**: Subtle tick (`UIImpactFeedbackGenerator(.light)`)
- **Drag start/drop**: Heavier feedback (`.medium` or `.heavy`)
- **Success**: Three light ticks (pattern recognition)
- **Error**: Single heavy tick (failure alert)
- **Fallback**: Users can disable system-wide; provide visual alternatives

### Notch & Island Awareness
- CSS: `env(safe-area-inset-*)` for padding
- Test on iPhone 14+ with Dynamic Island
- Avoid fixed UI in top 48px or bottom 34px safe zones

---

## 8. Testing Checklist

### Manual Testing (Required)
- [ ] iPhone SE (320px portrait), iPhone 15 (430px portrait), iPhone 15 Max (844px landscape)
- [ ] iPad (768px portrait, 1024px landscape)
- [ ] Chrome DevTools mobile emulation (throttled 4G, 30fps)
- [ ] Touch interactions: tap, double-tap, long-press, swipe, pinch
- [ ] Form submission: empty, validation error, network error, success
- [ ] Navigation: back button, tab switching, modal dismiss
- [ ] Accessibility: VoiceOver on iOS, keyboard-only navigation on desktop
- [ ] Dark mode: verify contrast, verify color-coded elements remain distinguishable
- [ ] Offline: toggle airplane mode; verify queued submission UI

### Automated Testing (Cypress / Playwright)
- Component interactions: form submit, validation, error states
- Viewport regression: 320px, 768px, 1024px, 1440px
- Accessibility: axe-core, ARIA attributes, color contrast

---

## 9. Migration Path

1. **Audit current components**: Identify which lack 44px touch targets, accessibility labels, or mobile layout
2. **Refactor by domain**: Studio → Discovery → Media pages
3. **Add telemetry instrumentation**: Track interaction latency, error rates
4. **Deploy incrementally**: Feature-flag mobile-first rules; monitor crash rates and performance
