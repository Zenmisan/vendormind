# Specification — Theme Toggle & Orders Filters

## Problem
1. **Filters Visual Bug**: The "All" filter pill in the Orders view has a solid white background with white text when selected in dark mode, making the text invisible.
2. **Theme Customization**: The dashboard needs support for a global Light / Dark theme toggle so vendors can customize their workspace.

## Proposed Changes
1. **Filter Pills**: Update the CSS rules for `.filter-pill.active` to use a combination of theme-appropriate background and text colors (neon green background with dark-theme background text) to guarantee readability in both modes.
2. **Light/Dark Toggle**:
   - Scope the dark theme overrides in `index.css` under the `html.dark` class.
   - Implement a theme toggle button in `Sidebar.tsx` utilizing React state and `localStorage` to toggle the `.dark` class on `document.documentElement`.
   - Update `Landing.tsx` logo sources to select light or dark assets dynamically based on the active theme.
