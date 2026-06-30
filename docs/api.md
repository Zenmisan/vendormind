# REST API Reference

Base URL: `http://localhost:3000`

---

## Health

### GET /health
```json
{ "status": "ok", "timestamp": "2026-06-13T00:00:00.000Z" }
```

---

## Ops

### GET /ops/dashboard
Real-time operational view.

```json
{
  "timestamp": "...",
  "queues": {
    "inbound":  { "waiting": 0, "active": 1, "completed": 42, "failed": 0 },
    "outbound": { "waiting": 0, "active": 0, "completed": 42, "failed": 0 }
  },
  "activeConversations": 3,
  "lowBalanceVendors": [
    { "id": "1", "name": "Test Shop", "email": "...", "balance": 1.20 }
  ]
}
```

---

## Vendors

### POST /vendors/register
Register a new vendor. Grants $10 free credit.

**Body**
```json
{ "name": "My Shop", "email": "shop@example.com" }
```

**Response**
```json
{ "vendorId": "1", "message": "Vendor registered. Free $10 credit applied." }
```

---

### POST /vendors/:id/catalog
Upload product catalog as `.xlsx` file. Queues embedding jobs for all products.

**Request**: `multipart/form-data`, field name `file`

**Spreadsheet columns** (case-insensitive):
| Column | Alias | Required |
|---|---|---|
| `name` | `ProductName` | ✅ |
| `price` | `Price` | ✅ |
| `description` | `Description` | |
| `stock` | `Stock` | |

**Response**
```json
{ "count": 24, "message": "Catalog ingested. Embedding jobs queued." }
```

---

### GET /vendors/:id/whatsapp/qr
Poll for the WhatsApp QR code during initial pairing.

**Response (waiting)**
```json
{ "status": "waiting", "message": "QR not generated yet" }
```

**Response (ready)**
```json
{ "status": "ready", "qr": "<base64 QR string>" }
```

---

## Wallet

### POST /topup
Add credit to a vendor wallet.

**Body**
```json
{ "vendorId": "1", "amount": 50.00 }
```

**Response**
```json
{ "newBalance": 60.00 }
```

---

## Webhooks

### POST /webhooks/nomba
Receives Nomba payment events. Signature verified with the configured Nomba webhook secret.

Set this URL in the Nomba dashboard webhook settings.

**Event handled**: `payment_success`

On success:
- Order status → `PAID`
- Reserved stock released (decremented from both `reservedStock` and `stock`)
- `SoftReservation` marked released (cancels the 30-min expiry job)
- WhatsApp receipt sent to customer

**Response**: always `{ "received": true }` with HTTP 200 (after sig check).
