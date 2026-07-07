# Specification — Link Previews (Open Graph Metadata)

## Problem
When sharing the VendorMind website URL on chat applications (like WhatsApp) or social platforms, it shows a generic text-only link preview without any branding logo, description, or image preview.

## Proposed Changes
1. **Open Graph Tags**: Add HTML meta tags (`og:title`, `og:description`, `og:image`, `og:type`) inside the `<head>` of [index.html](file:///home/zenmi/Projects/vendormind/dashboard/index.html).
2. **Twitter/X Tags**: Add Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`) for rich previews on Twitter.
3. **Branding Assets**: Reference `/logo-dark.png` as the preview image for maximum visual consistency.
