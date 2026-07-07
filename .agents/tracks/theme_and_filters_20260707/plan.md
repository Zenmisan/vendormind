# Plan — Theme Toggle & Orders Filters

## Execution Steps
1. **Refine Filter Pill Styles**: Fix active state text and background colors inside `index.css`.
2. **Setup Global Theme Scope**: Prefix dark-mode variable overrides and component rules in `index.css` with `html.dark` to allow toggleable rendering.
3. **Build Theme State and Toggle Control**: Add theme hook state in `Sidebar.tsx` and place a Sun/Moon switcher control in the sidebar footer.
4. **Dynamic Logos**: Switch landing page assets conditionally.
5. **Prisma Postgres casing bugfix**: Resolve `vendor_id` to `"vendorId"` column mapping error in database raw SQL queries to restore 4/4 passing E2E tests.

6. **Favicon Setup**: Configure `<link rel="icon">` in [index.html](file:///home/zenmi/Projects/vendormind/dashboard/index.html) to point to `/logo-dark.png`.

## Verification
- Run `bun run scripts/verify.ts` and ensure all 4/4 tests pass.
