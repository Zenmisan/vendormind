# Plan — Responsive Sidebar Fixes

## Execution Steps
1. **Apply Mobile Sidebar Styles**: Edit [index.css](file:///home/zenmi/Projects/vendormind/dashboard/src/index.css) to add `flex-shrink: 0`, standard `gap` spacing, and hide native scrollbars under the `@media (max-width: 980px)` media query.
2. **Build Verification**: Recompile Vite dashboard (`bun run build`) to verify syntax correctness.

## Verification
- Confirm that `.sidebar-link` contains `flex-shrink: 0` inside the build output.
