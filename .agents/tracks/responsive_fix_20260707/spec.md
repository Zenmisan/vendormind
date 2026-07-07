# Specification — Responsive Sidebar Fixes

## Problem
On mobile screens (width < 980px), the dashboard sidebar shifts from vertical layout to horizontal layout. However, because `flex-shrink` is active on `.sidebar-link` by default, the browser squishes the navigation links, causing the text to overlap and clash (e.g. "ConversationsWhatsApp settingsSettings").

## Proposed Changes
1. **Prevent Shrinking**: Add `flex-shrink: 0` to `.sidebar-link` inside the `@media (max-width: 980px)` breakpoint in [index.css](file:///home/zenmi/Projects/vendormind/dashboard/src/index.css).
2. **Improve Spacing & Layout**: Add standard flex `gap` to `.sidebar-nav` and `.sidebar-footer` containers on mobile to give links beautiful breathing space.
3. **Hide Scrollbars**: Hide browser scrollbars on the horizontal navigation lists (`.sidebar-nav` and `.sidebar-footer`) to maintain a clean, premium, native-app-like user experience.
