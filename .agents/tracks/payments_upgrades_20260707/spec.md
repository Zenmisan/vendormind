# Specification — Nomba Payment & Top-up Dropdown Upgrades

## Problem
1. **Nomba API URL Duplication**: In `.env`, `NOMBA_BASE_URL` contains a `/v1` suffix which causes duplicate paths (`/v1/v1/`) when appended in `nomba.service.ts`, leading to 404 API errors and breaking real checkout redirects.
2. **Access Token Path Bug**: The application extracts the auth token from `body.access_token` instead of `body.data.access_token`, resulting in an `undefined` auth token header and triggering a JWT validation error on checkout order creation.
3. **Checkout Amount Units (Kobo vs Naira)**: Unlike physical POS Terminals which require amounts in kobo, Nomba Online Checkout requires amounts in Naira.
4. **Generic Dropdown / Preconfigured Limits**: The select element on the wallet top-up page uses generic browser styling, and limits the user to a few static preconfigured choices rather than allowing custom top-up entry.

## Proposed Changes
1. **URL Normalization**: Update `NombaService` initialization to automatically strip any trailing `/v1` or `/v1/` from `process.env.NOMBA_BASE_URL`.
2. **Fix Access Token Extraction**: Retrieve the token from `body.data.access_token` and calculate token expiry using `body.data.expiresAt`.
3. **Amount Formatting**: Format checkout creation amounts as decimal strings in Naira directly (e.g. `5000.00` for ₦5,000) to ensure the checkout page renders the exact amount.
4. **Custom Amount Input & Presets**: Replace the select element on the top-up card with a number input field allowing any custom amount (min ₦100) and provide filter-styled quick-preset buttons (₦1,000, ₦2,000, ₦5,000, ₦10,000) for fast entry.
