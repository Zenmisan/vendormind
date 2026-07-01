# Technical Design: Dashboard API Endpoints

## Overview

This design implements the missing backend API endpoints and frontend integrations to make the VendorMind dashboard functional. Currently, the Products page hits `/health` endpoint and ignores the response, while the Orders page makes no API calls at all—both display empty tables despite data existing in the database.

## High-Level Design

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Dashboard Frontend                        │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Products.tsx    │         │   Orders.tsx     │         │
│  │  - Fetch products│         │  - Fetch orders  │         │
│  │  - Display table │         │  - Display table │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
└───────────┼──────────────────────────────┼──────────────────┘
            │                              │
            │ GET /vendors/:id/products    │ GET /vendors/:id/orders
            │                              │
┌───────────┼──────────────────────────────┼──────────────────┐
│           ▼                              ▼                   │
│  ┌────────────────────────────────────────────────┐         │
│  │         Fastify Gateway (server.ts)            │         │
│  │  - Products endpoint handler                   │         │
│  │  - Orders endpoint handler                     │         │
│  └────────────────────┬───────────────────────────┘         │
└─────────────────────────┼─────────────────────────────────────┘
                          │
                          │ Prisma queries
                          ▼
              ┌────────────────────────┐
              │   PostgreSQL Database  │
              │   - vendors            │
              │   - products           │
              │   - orders             │
              │   - customers          │
              │   - order_items        │
              └────────────────────────┘
```

### API Endpoints

#### 1. GET /vendors/:id/products

**Purpose**: Retrieve all products for a specific vendor with pagination support

**Request Parameters**:
- Path: `id` (string) - Vendor ID
- Query (optional):
  - `page` (number, default: 1) - Page number
  - `limit` (number, default: 50) - Items per page
  - `sortBy` (string, default: 'name') - Sort field
  - `sortOrder` (string, default: 'asc') - Sort direction

**Response Format**:
```typescript
{
  products: Array<{
    id: string;
    name: string;
    description: string | null;
    price: string;
    stock: number;
    reservedStock: number;
    imageUrl: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Error Responses**:
- 400: Invalid vendor ID format
- 404: Vendor not found
- 500: Database error

#### 2. GET /vendors/:id/orders

**Purpose**: Retrieve all orders for a specific vendor with customer information

**Request Parameters**:
- Path: `id` (string) - Vendor ID
- Query (optional):
  - `page` (number, default: 1) - Page number
  - `limit` (number, default: 50) - Items per page
  - `status` (string, optional) - Filter by order status

**Response Format**:
```typescript
{
  orders: Array<{
    id: string;
    customer: string;  // Customer name or phone number
    total: string;
    status: string;    // PENDING | PAID | CANCELED | DELIVERED
    createdAt: string;
    updatedAt: string;
    itemCount: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Error Responses**:
- 400: Invalid vendor ID format or invalid status filter
- 404: Vendor not found
- 500: Database error

### Data Flow

#### Products Page Flow
1. User navigates to Products page
2. `Products.tsx` mounts and calls `load()`
3. Frontend makes GET request to `/vendors/1/products`
4. Backend validates vendor ID
5. Backend queries database via Prisma
6. Backend transforms BigInt IDs to strings
7. Backend returns JSON response
8. Frontend updates state and renders table

#### Orders Page Flow
1. User navigates to Orders page
2. `Orders.tsx` mounts and calls `load()`
3. Frontend makes GET request to `/vendors/1/orders`
4. Backend validates vendor ID
5. Backend queries database with customer join
6. Backend transforms data (BigInt → string, customer info)
7. Backend returns JSON response
8. Frontend updates state and renders table

## Low-Level Design

### Backend Implementation

#### File: `src/gateway/server.ts`

##### 1. Products Endpoint Handler

```typescript
// ── Products List ─────────────────────────────────────────────
fastify.get<{ 
  Params: { id: string };
  Querystring: { 
    page?: string; 
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}>('/vendors/:id/products', async (request, reply) => {
  // Validate and parse vendor ID
  let vendorId: bigint;
  try {
    vendorId = BigInt(request.params.id);
  } catch {
    return reply.status(400).send({ error: 'Invalid vendor ID format' });
  }

  // Verify vendor exists
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true }
  });
  
  if (!vendor) {
    return reply.status(404).send({ error: 'Vendor not found' });
  }

  // Parse pagination parameters
  const page = Math.max(1, parseInt(request.query.page || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(request.query.limit || '50')));
  const skip = (page - 1) * limit;

  // Parse sort parameters
  const sortBy = request.query.sortBy || 'name';
  const sortOrder = request.query.sortOrder || 'asc';
  
  // Validate sortBy field
  const allowedSortFields = ['name', 'price', 'stock', 'createdAt', 'updatedAt'];
  const orderByField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
  const orderByDirection = sortOrder === 'desc' ? 'desc' : 'asc';

  // Fetch products with pagination
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { vendorId },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        reservedStock: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { [orderByField]: orderByDirection },
      skip,
      take: limit
    }),
    prisma.product.count({ where: { vendorId } })
  ]);

  // Transform response (BigInt → string, Decimal → string)
  const transformedProducts = products.map(p => ({
    id: p.id.toString(),
    name: p.name,
    description: p.description,
    price: p.price.toString(),
    stock: p.stock,
    reservedStock: p.reservedStock,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString()
  }));

  return {
    products: transformedProducts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
});
```

**Error Handling**:
- Try-catch wrapper for BigInt parsing
- Vendor existence check
- Input validation for pagination params
- Whitelist for sortBy fields to prevent SQL injection
- Default values for all optional parameters

**Performance Considerations**:
- Parallel execution of count and data queries using `Promise.all`
- Index exists on `vendorId` (from schema)
- Pagination limits max results per request
- Only fetch needed fields (no heavy embedding data)

##### 2. Orders Endpoint Handler

```typescript
// ── Orders List ───────────────────────────────────────────────
fastify.get<{ 
  Params: { id: string };
  Querystring: { 
    page?: string; 
    limit?: string;
    status?: string;
  };
}>('/vendors/:id/orders', async (request, reply) => {
  // Validate and parse vendor ID
  let vendorId: bigint;
  try {
    vendorId = BigInt(request.params.id);
  } catch {
    return reply.status(400).send({ error: 'Invalid vendor ID format' });
  }

  // Verify vendor exists
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true }
  });
  
  if (!vendor) {
    return reply.status(404).send({ error: 'Vendor not found' });
  }

  // Parse pagination parameters
  const page = Math.max(1, parseInt(request.query.page || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(request.query.limit || '50')));
  const skip = (page - 1) * limit;

  // Build where clause with optional status filter
  const whereClause: any = { vendorId };
  if (request.query.status) {
    const validStatuses = ['PENDING', 'PAID', 'CANCELED', 'DELIVERED'];
    if (!validStatuses.includes(request.query.status.toUpperCase())) {
      return reply.status(400).send({ error: 'Invalid status filter' });
    }
    whereClause.status = request.query.status.toUpperCase();
  }

  // Fetch orders with customer join and item count
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        total: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            name: true,
            phoneNumber: true
          }
        },
        items: {
          select: {
            id: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.order.count({ where: whereClause })
  ]);

  // Transform response
  const transformedOrders = orders.map(o => ({
    id: o.id.toString(),
    customer: o.customer.name || o.customer.phoneNumber,
    total: o.total.toString(),
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    itemCount: o.items.length
  }));

  return {
    orders: transformedOrders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
});
```

**Error Handling**:
- Try-catch wrapper for BigInt parsing
- Vendor existence check
- Status filter validation against whitelist
- Graceful handling of missing customer name (fallback to phone)

**Performance Considerations**:
- Parallel execution of count and data queries
- Index exists on `vendorId` (from schema)
- Only select needed customer fields
- Count items via array length (no separate query)
- Default sort by `createdAt DESC` (most recent first)

### Frontend Implementation

#### File: `dashboard/src/pages/Products.tsx`

##### Changes Required

**Current Implementation**:
```typescript
const load = async () => {
  setLoading(true);
  try {
    const res = await fetch(`${API}/health`);
    if (res.ok) setProducts([]);
  } catch {}
  setLoading(false);
};
```

**New Implementation**:
```typescript
const load = async () => {
  setLoading(true);
  try {
    const res = await fetch(`${API}/vendors/${VENDOR_ID}/products`);
    if (!res.ok) {
      console.error('Failed to load products:', res.status, res.statusText);
      setProducts([]);
      return;
    }
    const data = await res.json();
    setProducts(data.products || []);
  } catch (error) {
    console.error('Error loading products:', error);
    setProducts([]);
  } finally {
    setLoading(false);
  }
};
```

**Key Changes**:
1. Change endpoint from `/health` to `/vendors/${VENDOR_ID}/products`
2. Parse JSON response and extract `products` array
3. Add proper error logging
4. Add finally block for consistent loading state management
5. Handle empty response gracefully

**Optional Enhancement** (pagination support):
```typescript
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);

const load = async (pageNum = 1) => {
  setLoading(true);
  try {
    const res = await fetch(`${API}/vendors/${VENDOR_ID}/products?page=${pageNum}&limit=50`);
    if (!res.ok) {
      console.error('Failed to load products:', res.status, res.statusText);
      setProducts([]);
      return;
    }
    const data = await res.json();
    setProducts(data.products || []);
    setPage(data.pagination.page);
    setTotalPages(data.pagination.totalPages);
  } catch (error) {
    console.error('Error loading products:', error);
    setProducts([]);
  } finally {
    setLoading(false);
  }
};
```

#### File: `dashboard/src/pages/Orders.tsx`

##### Changes Required

**Current Implementation**:
```typescript
const load = async () => {
  setLoading(true);
  setOrders([]);
  setLoading(false);
};
```

**New Implementation**:
```typescript
const load = async () => {
  setLoading(true);
  try {
    const res = await fetch(`${API}/vendors/${VENDOR_ID}/orders`);
    if (!res.ok) {
      console.error('Failed to load orders:', res.status, res.statusText);
      setOrders([]);
      return;
    }
    const data = await res.json();
    setOrders(data.orders || []);
  } catch (error) {
    console.error('Error loading orders:', error);
    setOrders([]);
  } finally {
    setLoading(false);
  }
};
```

**Key Changes**:
1. Add actual API call to `/vendors/${VENDOR_ID}/orders`
2. Parse JSON response and extract `orders` array
3. Add proper error handling and logging
4. Add finally block for consistent loading state

**Optional Enhancement** (status filter integration):
```typescript
const load = async () => {
  setLoading(true);
  try {
    const statusParam = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
    const res = await fetch(`${API}/vendors/${VENDOR_ID}/orders${statusParam}`);
    if (!res.ok) {
      console.error('Failed to load orders:', res.status, res.statusText);
      setOrders([]);
      return;
    }
    const data = await res.json();
    setOrders(data.orders || []);
  } catch (error) {
    console.error('Error loading orders:', error);
    setOrders([]);
  } finally {
    setLoading(false);
  }
};

// Re-fetch when status filter changes
useEffect(() => { load(); }, [statusFilter]);
```

## Data Transformation Logic

### BigInt Handling

PostgreSQL `BIGINT` maps to JavaScript `BigInt`, which cannot be serialized to JSON directly. All ID fields must be converted:

```typescript
// ✅ Correct
id: product.id.toString()

// ❌ Wrong - throws error
return { id: product.id }
```

### Decimal Handling

Prisma returns `Decimal` type for price fields. Convert to string for JSON serialization:

```typescript
// ✅ Correct
price: product.price.toString()

// ❌ Wrong - may lose precision
price: Number(product.price)
```

### Date Handling

Convert Date objects to ISO strings:

```typescript
createdAt: order.createdAt.toISOString()
```

### Customer Name Fallback

Orders may have customers without names (only phone numbers):

```typescript
customer: order.customer.name || order.customer.phoneNumber
```

## Error Handling Strategy

### Backend Error Responses

All errors follow consistent format:

```typescript
{
  error: string;  // Human-readable error message
  code?: string;  // Optional error code for programmatic handling
}
```

### Frontend Error Handling

1. **Network Errors**: Catch and log, display empty state
2. **HTTP Errors**: Log status code, display empty state
3. **Parse Errors**: Catch JSON parse failures, display empty state
4. **User Feedback**: Console logs for debugging (toast notifications in future)

### Logging Strategy

**Backend**:
- Use Fastify's built-in logger
- Log all errors at ERROR level
- Log validation failures at WARN level

**Frontend**:
- Console.error for all failures
- Include endpoint URL and error details
- Preserve existing empty state UX

## Performance Considerations

### Database Query Optimization

1. **Indexes**: Leverage existing indexes on `vendorId`
2. **Field Selection**: Only select needed fields (exclude embedding vectors)
3. **Pagination**: Limit max results to prevent memory issues
4. **Parallel Queries**: Use `Promise.all` for count + data queries

### Expected Query Performance

For typical vendor with:
- 100-1000 products
- 50-500 orders

Expected response times:
- Products endpoint: <100ms
- Orders endpoint: <150ms (due to join)

### Caching Strategy (Future)

Not implemented in this sprint, but consider:
- Redis cache for product lists (invalidate on catalog upload)
- ETag support for conditional requests
- Client-side caching with SWR or React Query

## Testing Strategy

### Backend Tests

**Unit Tests** (to be added):
```typescript
describe('GET /vendors/:id/products', () => {
  test('returns products for valid vendor', async () => {
    // Test happy path
  });
  
  test('returns 404 for non-existent vendor', async () => {
    // Test vendor not found
  });
  
  test('returns 400 for invalid vendor ID', async () => {
    // Test invalid BigInt
  });
  
  test('respects pagination parameters', async () => {
    // Test pagination logic
  });
});
```

### Manual Testing Checklist

**Products Endpoint**:
- [ ] Products display for vendor with products
- [ ] Empty state displays for vendor with no products
- [ ] Pagination works (if implemented)
- [ ] Sorting works (if implemented)
- [ ] Invalid vendor ID returns 400
- [ ] Non-existent vendor returns 404

**Orders Endpoint**:
- [ ] Orders display for vendor with orders
- [ ] Empty state displays for vendor with no orders
- [ ] Customer name displays correctly
- [ ] Customer phone displays when name is null
- [ ] Status filter works (if implemented)
- [ ] Date formatting is correct

**Frontend Integration**:
- [ ] Products page loads without errors
- [ ] Orders page loads without errors
- [ ] Loading skeletons display during fetch
- [ ] Error states handled gracefully
- [ ] Data displays in tables correctly

## Deployment Considerations

### Environment Variables

No new environment variables required. Uses existing:
- `PORT` - API server port
- `DATABASE_URL` - PostgreSQL connection string

### Database Migrations

No schema changes required. Existing indexes sufficient.

### Backward Compatibility

New endpoints are additive. No breaking changes to existing API.

### Rollback Strategy

If issues occur:
1. Revert backend changes (remove new endpoints)
2. Revert frontend changes (restore old load functions)
3. System returns to previous (non-functional) state

## Security Considerations

### Input Validation

1. **Vendor ID**: Validated as valid BigInt
2. **Pagination params**: Clamped to safe ranges (1-100)
3. **Sort fields**: Whitelist validation
4. **Status filter**: Whitelist validation

### SQL Injection Prevention

- All queries use Prisma (parameterized queries)
- No raw SQL
- All user inputs validated before query construction

### Authorization (Future - Sprint 2)

Current implementation uses hardcoded `VENDOR_ID = '1'`. Sprint 2 will add:
- JWT-based authentication
- Vendor ID from authenticated session
- Endpoint protection middleware

### Data Exposure

Only expose necessary fields:
- ✅ Product names, prices, stock
- ❌ Embedding vectors (excluded from select)
- ❌ Internal customer IDs (only names/phones)

## Success Criteria

This design is considered successful when:

1. **Functional Requirements**:
   - [ ] Products page displays actual products from database
   - [ ] Orders page displays actual orders from database
   - [ ] Both pages show loading states during fetch
   - [ ] Both pages show empty states when no data
   - [ ] Error states are handled gracefully

2. **Non-Functional Requirements**:
   - [ ] Response times < 200ms for typical data sizes
   - [ ] No runtime errors in browser console
   - [ ] No unhandled promise rejections
   - [ ] Proper TypeScript types maintained

3. **Code Quality**:
   - [ ] Consistent error handling patterns
   - [ ] Proper data transformation (BigInt, Decimal)
   - [ ] Clean separation of concerns
   - [ ] No code duplication

## Out of Scope

The following are explicitly **not** included in this sprint:

1. **Authentication**: Still uses hardcoded `VENDOR_ID = '1'`
2. **Authorization**: No permission checks
3. **Real-time updates**: No WebSocket or polling
4. **Advanced filtering**: Basic pagination only
5. **Search**: Client-side only (no backend search)
6. **Caching**: No Redis or HTTP caching
7. **Rate limiting**: No API rate limits
8. **Monitoring**: No metrics or tracing
9. **Testing**: Manual testing only (no automated tests)

These will be addressed in future sprints or as separate features.

## Components and Interfaces

### Backend Component: Fastify Gateway (server.ts)

**Purpose**: Expose RESTful endpoints for dashboard consumption

**Interface**:
```typescript
interface ProductsEndpoint {
  method: 'GET'
  path: '/vendors/:id/products'
  queryParams: {
    page?: number    // Default: 1
    limit?: number   // Default: 50, Max: 100
  }
  response: ProductsResponse
}

interface OrdersEndpoint {
  method: 'GET'
  path: '/vendors/:id/orders'
  response: OrdersResponse
}
```

**Responsibilities**:
- Validate vendorId parameter as BigInt
- Parse and validate pagination parameters
- Execute Prisma queries with appropriate filters and joins
- Transform BigInt/Decimal types to JSON-safe strings
- Return appropriate HTTP status codes (200, 400, 404, 500)
- Log errors for debugging

### Frontend Component: Products.tsx

**Purpose**: Display paginated product catalog with search and sort

**Interface**:
```typescript
interface ProductsPageState {
  products: Product[]
  loading: boolean
  error: string | null
  page: number
  total: number
  query: string
  sortField: keyof Product
  sortAsc: boolean
}

interface ProductsPageActions {
  load: (page?: number) => Promise<void>
  uploadCatalog: (file: File) => Promise<void>
  toggleSort: (field: keyof Product) => void
}
```

**Responsibilities**:
- Fetch products from API on mount and refresh
- Handle pagination state and UI
- Client-side search filtering
- Client-side sorting
- Display loading skeletons and error states
- Maintain catalog upload functionality

### Frontend Component: Orders.tsx

**Purpose**: Display order list with customer names and status filtering

**Interface**:
```typescript
interface OrdersPageState {
  orders: Order[]
  loading: boolean
  error: string | null
  query: string
  statusFilter: OrderStatus | 'ALL'
}

interface OrdersPageActions {
  load: () => Promise<void>
}
```

**Responsibilities**:
- Fetch orders from API on mount and refresh
- Client-side search by order ID or customer name
- Client-side status filtering
- Display loading skeletons and error states
- Format currency and dates for Nigerian locale
