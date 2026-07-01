# Tasks: Dashboard API Endpoints

## Task 1: Implement Products API Endpoint
**Priority**: P0 (Critical)  
**Estimate**: 1 hour  
**Dependencies**: None

### Description
Add `GET /vendors/:id/products` endpoint to the Fastify server that returns paginated product list for a vendor.

### Acceptance Criteria
- [ ] Endpoint accepts vendor ID as path parameter
- [ ] Endpoint validates vendor ID format (valid BigInt)
- [ ] Endpoint verifies vendor exists (return 404 if not found)
- [ ] Endpoint queries products filtered by vendorId
- [ ] Response includes: id, name, description, price, stock, reservedStock, imageUrl, createdAt, updatedAt
- [ ] All BigInt IDs are converted to strings
- [ ] All Decimal prices are converted to strings
- [ ] All Date objects are converted to ISO strings
- [ ] Pagination is implemented with page and limit query params
- [ ] Pagination defaults: page=1, limit=50, max limit=100
- [ ] Response includes pagination metadata: page, limit, total, totalPages
- [ ] Sorting is supported via sortBy and sortOrder query params
- [ ] Sort fields are validated against whitelist
- [ ] Invalid inputs return 400 error with clear message
- [ ] Database errors return 500 with error message
- [ ] Errors are logged using Fastify logger

### Implementation Notes
- Add endpoint handler in `src/gateway/server.ts` after the catalog ingestion endpoint
- Use `prisma.vendor.findUnique()` to verify vendor exists
- Use `prisma.product.findMany()` with where clause and pagination
- Use `prisma.product.count()` in parallel with data query for total
- Whitelist sort fields: name, price, stock, createdAt, updatedAt
- Use try-catch for BigInt parsing
- Follow existing error handling patterns in server.ts

### Files to Modify
- `src/gateway/server.ts`

---

## Task 2: Implement Orders API Endpoint
**Priority**: P0 (Critical)  
**Estimate**: 1 hour  
**Dependencies**: None

### Description
Add `GET /vendors/:id/orders` endpoint to the Fastify server that returns paginated order list with customer information.

### Acceptance Criteria
- [ ] Endpoint accepts vendor ID as path parameter
- [ ] Endpoint validates vendor ID format (valid BigInt)
- [ ] Endpoint verifies vendor exists (return 404 if not found)
- [ ] Endpoint queries orders filtered by vendorId
- [ ] Query includes customer join to get name and phoneNumber
- [ ] Query includes items array to count item quantity
- [ ] Response includes: id, customer, total, status, createdAt, updatedAt, itemCount
- [ ] Customer field shows name if available, otherwise phoneNumber
- [ ] All BigInt IDs are converted to strings
- [ ] All Decimal totals are converted to strings
- [ ] All Date objects are converted to ISO strings
- [ ] Orders are sorted by createdAt DESC (most recent first)
- [ ] Pagination is implemented with page and limit query params
- [ ] Pagination defaults: page=1, limit=50, max limit=100
- [ ] Response includes pagination metadata: page, limit, total, totalPages
- [ ] Optional status filter via query param
- [ ] Status filter validates against whitelist: PENDING, PAID, CANCELED, DELIVERED
- [ ] Invalid inputs return 400 error with clear message
- [ ] Database errors return 500 with error message
- [ ] Errors are logged using Fastify logger

### Implementation Notes
- Add endpoint handler in `src/gateway/server.ts` after products endpoint
- Use `prisma.vendor.findUnique()` to verify vendor exists
- Use `prisma.order.findMany()` with where clause, include customer and items
- Use `prisma.order.count()` in parallel with data query for total
- Build dynamic where clause for optional status filter
- Whitelist status values: PENDING, PAID, CANCELED, DELIVERED
- Calculate itemCount as `order.items.length`
- Use try-catch for BigInt parsing
- Follow existing error handling patterns in server.ts

### Files to Modify
- `src/gateway/server.ts`

---

## Task 3: Update Products Page Frontend
**Priority**: P0 (Critical)  
**Estimate**: 30 minutes  
**Dependencies**: Task 1

### Description
Update the Products.tsx component to fetch products from the new API endpoint instead of the health check endpoint.

### Acceptance Criteria
- [ ] `load()` function calls `/vendors/${VENDOR_ID}/products` instead of `/health`
- [ ] Response is parsed as JSON
- [ ] `products` array is extracted from response data
- [ ] State is updated with fetched products
- [ ] Fetch errors are caught and logged to console
- [ ] Error log includes endpoint URL and error details
- [ ] On error, products state is set to empty array
- [ ] Loading state is managed in finally block
- [ ] Empty state displays when products array is empty
- [ ] Existing search functionality continues to work
- [ ] Existing sort functionality continues to work
- [ ] Existing upload functionality continues to work
- [ ] Refresh button triggers reload
- [ ] No TypeScript errors
- [ ] No console warnings in development

### Implementation Notes
- Modify the `load` async function in `dashboard/src/pages/Products.tsx`
- Add try-catch-finally block for proper error handling
- Use `console.error()` for logging failures
- Preserve existing Product interface and state structure
- Keep all existing UI components and styling
- Test with populated database and empty database

### Files to Modify
- `dashboard/src/pages/Products.tsx`

---

## Task 4: Update Orders Page Frontend
**Priority**: P0 (Critical)  
**Estimate**: 30 minutes  
**Dependencies**: Task 2

### Description
Update the Orders.tsx component to fetch orders from the new API endpoint instead of returning empty array.

### Acceptance Criteria
- [ ] `load()` function calls `/vendors/${VENDOR_ID}/orders` endpoint
- [ ] Response is parsed as JSON
- [ ] `orders` array is extracted from response data
- [ ] State is updated with fetched orders
- [ ] Fetch errors are caught and logged to console
- [ ] Error log includes endpoint URL and error details
- [ ] On error, orders state is set to empty array
- [ ] Loading state is managed in finally block
- [ ] Empty state displays when orders array is empty
- [ ] Existing search functionality continues to work
- [ ] Existing status filter functionality continues to work
- [ ] Refresh button triggers reload
- [ ] Order date formatting displays correctly
- [ ] Order status badges display correctly
- [ ] No TypeScript errors
- [ ] No console warnings in development

### Implementation Notes
- Modify the `load` async function in `dashboard/src/pages/Orders.tsx`
- Add try-catch-finally block for proper error handling
- Use `console.error()` for logging failures
- Preserve existing order interface and state structure
- Keep all existing UI components and styling
- Test with populated database and empty database
- Verify customer names display correctly (or phone as fallback)

### Files to Modify
- `dashboard/src/pages/Orders.tsx`

---

## Task 5: Manual Testing & Validation
**Priority**: P0 (Critical)  
**Estimate**: 1 hour  
**Dependencies**: Task 3, Task 4

### Description
Perform comprehensive manual testing of both endpoints and frontend pages to verify all requirements are met.

### Acceptance Criteria

**Backend API Testing**:
- [ ] Products endpoint returns data for vendor ID 1
- [ ] Products endpoint returns 404 for non-existent vendor ID
- [ ] Products endpoint returns 400 for invalid vendor ID (e.g., "abc")
- [ ] Products endpoint respects page parameter
- [ ] Products endpoint respects limit parameter
- [ ] Products endpoint returns correct pagination metadata
- [ ] Orders endpoint returns data for vendor ID 1
- [ ] Orders endpoint returns 404 for non-existent vendor ID
- [ ] Orders endpoint returns 400 for invalid vendor ID
- [ ] Orders endpoint respects page parameter
- [ ] Orders endpoint respects limit parameter
- [ ] Orders endpoint filters by status correctly
- [ ] Orders endpoint returns 400 for invalid status
- [ ] Orders endpoint shows customer name when available
- [ ] Orders endpoint shows phone when customer name is null
- [ ] All BigInt IDs are strings in responses
- [ ] All Decimal values are strings in responses
- [ ] All dates are ISO format strings in responses

**Frontend Testing**:
- [ ] Products page loads without errors
- [ ] Products page displays loading skeleton during fetch
- [ ] Products page displays all products in table
- [ ] Products page shows empty state when no products
- [ ] Products page search filters products correctly
- [ ] Products page sorting works on all columns
- [ ] Products page upload triggers refresh after success
- [ ] Products page handles API errors gracefully
- [ ] Orders page loads without errors
- [ ] Orders page displays loading skeleton during fetch
- [ ] Orders page displays all orders in table
- [ ] Orders page shows empty state when no orders
- [ ] Orders page search filters orders correctly
- [ ] Orders page status filter buttons work
- [ ] Orders page handles API errors gracefully
- [ ] No console errors in browser
- [ ] No unhandled promise rejections

**Performance Testing**:
- [ ] Products endpoint responds in < 100ms (network tab)
- [ ] Orders endpoint responds in < 150ms (network tab)
- [ ] Pages remain responsive during data fetching

**Data Integrity Testing**:
- [ ] Product prices display correctly (no precision loss)
- [ ] Order totals display correctly (no precision loss)
- [ ] Product stock counts are accurate
- [ ] Reserved stock is calculated correctly (stock - reservedStock)
- [ ] Order dates are formatted correctly
- [ ] Customer information displays correctly

### Implementation Notes
- Use browser DevTools Network tab to verify API calls
- Use browser Console to check for errors
- Test with database containing various data states:
  - Empty vendor (no products, no orders)
  - Vendor with products but no orders
  - Vendor with orders but no products
  - Vendor with both products and orders
- Test edge cases:
  - Products with null descriptions
  - Orders with customers without names
  - Large page/limit values
  - Invalid query parameters
- Use curl or Postman to test API endpoints directly
- Verify TypeScript compilation with `npm run build` or `tsc --noEmit`

### Files to Test
- `src/gateway/server.ts` (API endpoints)
- `dashboard/src/pages/Products.tsx`
- `dashboard/src/pages/Orders.tsx`

---

## Implementation Order

1. **Task 1**: Implement Products API Endpoint (backend)
2. **Task 2**: Implement Orders API Endpoint (backend)
3. **Task 3**: Update Products Page Frontend
4. **Task 4**: Update Orders Page Frontend
5. **Task 5**: Manual Testing & Validation

Tasks 1 and 2 can be implemented in parallel if desired, but should be completed before tasks 3 and 4.

## Estimated Total Time
- Task 1: 1 hour
- Task 2: 1 hour
- Task 3: 30 minutes
- Task 4: 30 minutes
- Task 5: 1 hour
- **Total: 4 hours** (includes buffer for testing and debugging)
