# Plan — Nomba Payment & Top-up Dropdown Upgrades

## Execution Steps
1. **Normalize Nomba BASE URL**: Trim trailing `/v1` from the configured base URL in [nomba.service.ts](file:///home/zenmi/Projects/vendormind/src/shared/nomba.service.ts).
2. **Fix Access Token Path**: Update access token extraction to look inside the `data` object returned by the Nomba API (`body.data.access_token`).
3. **Apply Kobo Scaling**: Multiply `amountNGN` by 100 in checkout creation in [nomba.service.ts](file:///home/zenmi/Projects/vendormind/src/shared/nomba.service.ts).
4. **Custom Amount Input Field**: Replace the select element on [Wallet.tsx](file:///home/zenmi/Projects/vendormind/dashboard/src/pages/Wallet.tsx) with a number input field for custom top-up entry, and append filter pills for quick presets.

## Verification
- Rebuild dashboard and check compilation.
- Execute E2E verification test and ensure 4/4 passing.
