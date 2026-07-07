# Track: Fuzzy Catalog Column Detection

**Status:** Completed  
**Date:** 2026-07-07

## Problem
Ingestion hardcoded `name`/`ProductName`/`price`/`Price`. Real files use arbitrary headers.
`lol.xlsx` had "Cake Name", "The Whatnots...", no price column → all rows ingested as undefined/NaN.

## Fix
Case-insensitive fuzzy column detection in `src/gateway/server.ts`:
- `find(patterns)` checks if any column key contains a pattern substring
- name: name/product/item/title/cake/food/menu/service
- price: price/cost/amount/fee/rate/naira/charge
- desc: desc/detail/note/about/whatnot/flavor/info/ingred/spec
- stock: stock/qty/quantity/inventory/count/avail/units
- Unmapped columns concatenated into description
- Price/stock default 0 if no matching column
- Rows with empty name skipped
- Returns 400 with column list if no name column found

## Tasks
- [x] Implement fuzzy column resolver
- [x] Test: lol.xlsx → "Classic Vanilla Bean", desc from "The Whatnots...", price/stock 0
- [x] Gateway restarted
