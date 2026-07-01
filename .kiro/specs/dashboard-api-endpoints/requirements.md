# Requirements: Dashboard API Endpoints

## Problem Statement

The VendorMind dashboard frontend is currently non-functional due to missing backend API endpoints. The Products page attempts to fetch data from the `/health` endpoint and ignores the response, resulting in an empty product table. The Orders page makes no API calls whatsoever and always displays an empty order list. This prevents vendors from viewing their catalog and order history, making the dashboard unusable.

## Goals

### Primary Goals
1. Enable vendors to view their product catalog in the dashboard
2. Enable vendors to view their order history in the dashboard
3. Provide proper error handling and loading states for both pages

### Secondary Goals
1. Implement pagination to handle large datasets efficiently
2. Maintain consistent API response formats across endpoints
3. Ensure proper data type transformations (BigInt, Decimal handling)

## User Stories

### As a vendor, I want to...

**US-1: View Product Catalog**
- **Story**: As a vendor, I want to see all my products in the dashboard so that I can verify my catalog is correct
- **Acceptance Criteria**:
  - When I navigate to the Products page, I see all products I've uploaded
  - Each product shows: name, price, stock, reserved stock, and available quantity
  - Products with descriptions show the description below the name
  - The page shows a loading skeleton while fetching data
  - If I have no products, I see an empty state message
  - If the API fails, I see an empty state (error logged to console)

**US-2: Refresh Product List**
- **Story**: As a vendor, I want to refresh the product list after uploading a catalog so that I can see my new products immediately
- **Acceptance Criteria**:
  - When I click the "Refresh" button, the product list reloads
  - A loading skeleton displays during refresh
  - After successful catalog upload, the product list automatically refreshes

**US-3: View Order History**
- **Story**: As a vendor, I want to see all orders placed through my WhatsApp bot so that I can track sales and fulfillment
- **Acceptance Criteria**:
  - When I navigate to the Orders page, I see all orders for my store
  - Each order shows: order ID, customer name/phone, total amount, status, and date
  - Orders are sorted by date (most recent first)
  - The page shows a loading skeleton while fetching data
  - If I have no orders, I see an empty state message
  - If the API fails, I see an empty state (error logged to console)

**US-4: Filter Orders by Status**
- **Story**: As a vendor, I want to filter orders by status so that I can focus on pending orders or review completed orders
- **Acceptance Criteria**:
  - I can click status filter buttons: All, Pending, Paid, Canceled, Delivered
  - When I select a status filter, the frontend filters the displayed orders
  - The selected filter is visually highlighted
  - The order count updates to reflect filtered results

**US-5: Search Products**
- **Story**: As a vendor, I want to search my products by name or description so that I can quickly find specific items
- **Acceptance Criteria**:
  - I can type in the search box at the top of the Products page
  - As I type, the product list filters in real-time (client-side)
  - Search matches product names and descriptions (case-insensitive)
  - The product count updates to reflect search results

**US-6: Sort Products**
- **Story**: As a vendor, I want to sort products by name, price, or stock so that I can organize my catalog view
- **Acceptance Criteria**:
  - I can click column headers to sort: Name, Price, Stock, Reserved
  - First click sorts ascending, second click sorts descending
  - The active sort column and direction are visually indicated
  - Sorting persists while searching/filtering

## Functional Requirements

### Backend API Requirements

**REQ-1: Products Endpoint**
- **ID**: REQ-1
- **Priority**: P0 (Critical)
- **Description**: Implement `GET /vendors/:id/products` endpoint
- **Details**:
  - Accept vendor ID as path parameter
  - Return array of products with: id, name, description, price, stock, reservedStock, imageUrl, createdAt, updatedAt
  - Support optional pagination via query params: `page`, `limit`
  - Support optional sorting via query params: `sortBy`, `sortOrder`
  - Transform BigInt IDs to strings
  - Transform Decimal prices to strings
  - Return 404 if vendor not found
  - Return 400 if vendor ID format is invalid

**REQ-2: Orders Endpoint**
- **ID**: REQ-2
- **Priority**: P0 (Critical)
- **Description**: Implement `GET /vendors/:id/orders` endpoint
- **Details**:
  - Accept vendor ID as path parameter
  - Return array of orders with: id, customer (name or phone), total, status, createdAt, updatedAt, itemCount
  - Join with customers table to get customer name/phone
  - Support optional pagination via query params: `page`, `limit`
  - Support optional status filter via query param: `status`
  - Sort orders by createdAt descending (most recent first)
  - Transform BigInt IDs to strings
  - Transform Decimal totals to strings
  - Return 404 if vendor not found
  - Return 400 if vendor ID or status format is invalid

**REQ-3: Pagination Support**
- **ID**: REQ-3
- **Priority**: P1 (High)
- **Description**: Both endpoints must support pagination
- **Details**:
  - Accept `page` query param (default: 1, min: 1)
  - Accept `limit` query param (default: 50, min: 1, max: 100)
  - Return pagination metadata: `page`, `limit`, `total`, `totalPages`
  - Use Prisma's `skip` and `take` for efficient pagination
  - Fetch total count in parallel with data query

**REQ-4: Error Handling**
- **ID**: REQ-4
- **Priority**: P0 (Critical)
- **Description**: All endpoints must handle errors consistently
- **Details**:
  - Return 400 for invalid input (bad vendor ID, invalid query params)
  - Return 404 for non-existent vendor
  - Return 500 for database errors
  - All errors return JSON: `{ error: "message" }`
  - Log all errors using Fastify's logger

### Frontend Requirements

**REQ-5: Products Page Integration**
- **ID**: REQ-5
- **Priority**: P0 (Critical)
- **Description**: Update Products.tsx to fetch from new endpoint
- **Details**:
  - Change `load()` function to call `/vendors/${VENDOR_ID}/products`
  - Parse JSON response and extract `products` array
  - Update state with fetched products
  - Handle fetch errors gracefully (log and show empty state)
  - Maintain existing UI: loading skeleton, empty state, product table
  - Maintain existing features: search, sort, upload

**REQ-6: Orders Page Integration**
- **ID**: REQ-6
- **Priority**: P0 (Critical)
- **Description**: Update Orders.tsx to fetch from new endpoint
- **Details**:
  - Change `load()` function to call `/vendors/${VENDOR_ID}/orders`
  - Parse JSON response and extract `orders` array
  - Update state with fetched orders
  - Handle fetch errors gracefully (log and show empty state)
  - Maintain existing UI: loading skeleton, empty state, orders table
  - Maintain existing features: search, status filter

**REQ-7: Loading States**
- **ID**: REQ-7
- **Priority**: P1 (High)
- **Description**: Show loading indicators during API calls
- **Details**:
  - Display loading skeleton while fetching
  - Use `finally` block to ensure loading state resets
  - Prevent multiple simultaneous requests

**REQ-8: Error Logging**
- **ID**: REQ-8
- **Priority**: P1 (High)
- **Description**: Log all API errors to browser console
- **Details**:
  - Log failed fetch attempts with URL and error
  - Log HTTP error responses with status code
  - Log JSON parse errors
  - Do not display error messages to user (show empty state instead)

## Non-Functional Requirements

**NFR-1: Performance**
- Products endpoint must respond in < 100ms for catalogs with < 1000 products
- Orders endpoint must respond in < 150ms for order history with < 500 orders
- Use database indexes on vendorId (already exists)
- Use parallel queries for count + data fetches

**NFR-2: Data Integrity**
- Properly transform BigInt IDs to strings (no precision loss)
- Properly transform Decimal prices to strings (no precision loss)
- Handle null values gracefully (description, customer name)

**NFR-3: Code Quality**
- Maintain TypeScript strict mode compliance
- Follow existing code style and patterns
- Use existing UI components and styles
- No console warnings or errors in development mode

**NFR-4: Security**
- Validate all user inputs (vendor ID, query params)
- Use parameterized queries via Prisma (prevent SQL injection)
- Whitelist allowed sort fields
- Whitelist allowed status values
- Clamp pagination limits to safe ranges

**NFR-5: Maintainability**
- Keep endpoint handlers concise and readable
- Separate validation logic clearly
- Use consistent error response format
- Add inline comments for complex logic

## Constraints

**Technical Constraints**:
- Must use existing Fastify server structure
- Must use existing Prisma client and schema
- Must use existing frontend React components
- Must maintain compatibility with existing API endpoints
- Cannot modify database schema

**Business Constraints**:
- Vendor ID is hardcoded as '1' (auth is Sprint 2)
- No multi-tenant UI support (Sprint 2)
- No real-time updates or WebSocket (future enhancement)
- No backend search/filtering beyond status (client-side only)

**Time Constraints**:
- Sprint 1 scope: 2-3 hours of development
- Must be completed before Sprint 2 (auth)

## Success Metrics

### Functional Success
- [ ] Products page displays actual products from database
- [ ] Orders page displays actual orders from database
- [ ] Both pages show loading states correctly
- [ ] Both pages show empty states when no data
- [ ] Both pages handle errors gracefully
- [ ] Refresh button reloads data
- [ ] Client-side search and filtering work

### Technical Success
- [ ] No TypeScript compilation errors
- [ ] No runtime errors in browser console
- [ ] No unhandled promise rejections
- [ ] Response times meet performance requirements
- [ ] All data transformations are correct (BigInt, Decimal)

### User Experience Success
- [ ] Vendor can view their entire product catalog
- [ ] Vendor can view their complete order history
- [ ] UI remains responsive during data fetching
- [ ] Empty states provide clear guidance
- [ ] Upload workflow remains functional

## Out of Scope

The following are explicitly **NOT** included in this sprint:

1. **Authentication & Authorization**: Vendor ID remains hardcoded as '1'
2. **Multi-vendor UI**: No vendor switching or selection
3. **Real-time Updates**: No WebSocket or polling for live data
4. **Backend Search**: No server-side search/filtering (except status)
5. **Advanced Filtering**: No date range, price range, or multi-field filters
6. **Export Functionality**: No CSV/Excel export
7. **Bulk Actions**: No multi-select or batch operations
8. **Order Details View**: No drill-down to order item details
9. **Product Editing**: No inline editing or update endpoints
10. **Caching**: No Redis or HTTP caching layer
11. **Rate Limiting**: No API rate limits
12. **Monitoring**: No metrics, tracing, or alerting
13. **Automated Tests**: Manual testing only (no unit/integration tests)

## Dependencies

### Required For This Sprint
- Existing Fastify server (`src/gateway/server.ts`)
- Existing Prisma client (`src/shared/prisma/client.ts`)
- Existing database schema (vendors, products, orders, customers)
- Existing frontend components (Sidebar, Products.tsx, Orders.tsx)
- Existing API environment variable (`VITE_API_URL`)

### Blocks Sprint 2
Sprint 2 (Authentication) depends on completion of this sprint:
- Auth middleware will need these endpoints to protect
- JWT validation will intercept requests to these routes
- Vendor ID will be extracted from authenticated session instead of hardcoded

## Risks & Mitigations

**Risk 1: BigInt Serialization Errors**
- **Likelihood**: High
- **Impact**: High (API will fail)
- **Mitigation**: Explicitly convert all BigInt fields to strings in response transform

**Risk 2: Large Dataset Performance**
- **Likelihood**: Medium
- **Impact**: Medium (slow page loads)
- **Mitigation**: Implement pagination with reasonable defaults (50 items per page)

**Risk 3: Missing Customer Names**
- **Likelihood**: Medium (early orders may not have names)
- **Impact**: Low (display issue only)
- **Mitigation**: Fall back to phone number when name is null

**Risk 4: Vendor Not Found**
- **Likelihood**: Low (vendor 1 should exist)
- **Impact**: High (empty dashboard)
- **Mitigation**: Check vendor existence before queries, return 404 with clear error

**Risk 5: Concurrent Catalog Upload**
- **Likelihood**: Low
- **Impact**: Low (stale data after upload)
- **Mitigation**: Refresh product list after successful upload (already implemented)

## Future Enhancements

Potential improvements for future sprints:

1. **Pagination UI**: Add page navigation controls to frontend
2. **Backend Search**: Full-text search on product names/descriptions
3. **Order Details Modal**: Click order to see item breakdown
4. **Product Editing**: Inline price/stock updates
5. **Real-time Updates**: WebSocket for live order notifications
6. **Export**: Download orders/products as CSV
7. **Analytics**: Order trends, revenue charts, top products
8. **Caching**: Redis cache with smart invalidation
9. **Optimistic Updates**: Immediate UI feedback before API confirms
10. **Infinite Scroll**: Replace pagination with auto-load on scroll
