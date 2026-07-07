# Plan — Link Previews (Open Graph Metadata)

## Execution Steps
1. **Inject Meta Tags**: Add Open Graph and Twitter Card tags to the `<head>` block of [index.html](file:///home/zenmi/Projects/vendormind/dashboard/index.html) with absolute URL `https://vendormind-z.web.app/logo-dark.png` for crawlers.
2. **Build and Deploy**: Recompile the Vite dashboard using `bun run build`.

## Verification
- Confirm the output index.html contains the absolute `<meta>` image tags.
