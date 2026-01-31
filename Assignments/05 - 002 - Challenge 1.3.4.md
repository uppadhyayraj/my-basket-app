ROLE
As a Senior QA Engineer specializing in microservices, produce high-quality manual test cases for a backend order flow.

CONTEXT
- Application: MyBasket Lite
- Target Logic: `createOrder` in `microservices/order-service/src/service.ts`
- Endpoint: POST /api/order (service port 3003)
- Notes: The service fetches the user's cart via `CartServiceClient.getCart` and clears it via `CartServiceClient.clearCart`.

TASK
Generate a comprehensive set of manual test cases for the `createOrder` logic, covering Positive (happy path), Negative (invalid inputs), and Edge cases (boundary and race conditions). Organize tests into sections and present each test as a Markdown table row with Test ID, Description, Steps, and Expected Result.

CONSTRAINTS (follow exactly)
- Categories: Provide grouped test cases: Positive, Negative, Edge (include 3–8 tests per group).
- Format: Separate table per group with columns: Test ID | Description | Steps | Expected Result.
- Data-integrity primary checks (required):
  - Always fetch authoritative cart via `CartServiceClient.getCart(userId)` before creating an order; tests must verify this fetch is used for verification.
  - Compute totals in cents to avoid floating-point errors: use priceCents = Math.round(price * 100) and totalCents = Σ(priceCents * quantity). Tests must state this calculation and verify equality.
  - Order total must exactly match cart total in cents. If totals differ expected outcome: order creation is aborted, no order is persisted, cart remains unchanged, and the API returns a 4xx with message: "Data integrity check failed: order total does not match cart total".
  - Item-level consistency: each order item must match a cart item by id (or SKU), price (to cent), and quantity. Mismatches must abort creation as above.
  - Rounding behavior: include tests where item prices have >2 decimals and verify round-to-cent behavior.
- Cart-clear rollback checks:
  - If `clearCart` fails after order creation, tests assume expected behavior is to rollback the created order (no persisted order). Each test must verify rollback (no order found via GET /api/order) and an error logged/returned.
- Input validation:
  - Reject orders with zero/negative quantity, negative prices, or empty items. Expect 4xx and no order created.
- Concurrency / race conditions:
  - Include tests simulating cart changes between `getCart` and order submit. If cart data differs from order payload totals, creation is rejected.
- Boundary/edge values:
  - Very large quantities/prices (check for overflow), zero-amount carts, single-item carts, and maximum allowed items.
- Observability:
  - For failed checks verify logs or returned error messages reference the integrity failure. Specify how to inspect logs or response payload for the reason.
- Test data and preconditions:
  - For each test list required cart state (item ids, prices, quantities), order payload, and required API calls to set up the cart. Use cents math in examples.
- Clear pass/fail criteria:
  - For each test state exact HTTP status expected, response message snippet, and persistence verification steps (call GET /api/order or inspect `orders` store).
- Deliverable constraints:
  - Manual steps only. Steps must be concise (max ~4 bullets). If extra setup is needed reference it in Steps.

---

### Positive Tests

| Test ID | Description | Steps | Expected Result |
|---|---|---|---|
| P-01 | Successful order creation when cart and order totals match exactly (simple two items). | 1) Setup cart via API: itemA(id:A) price 9.99 qty 2, itemB(id:B) price 5.00 qty 1 (cartTotalCents = 999*2 + 500*1 = 2498). 2) POST /api/order with matching payload and total 24.98. 3) Verify response HTTP 201 and order id. 4) GET /api/cart and GET /api/order to confirm cart cleared and order present. | 201 Created; response includes order id; persisted order total = 24.98; cart is empty. Logs show `getCart` used and `clearCart` succeeded. |
| P-02 | Prices with more than two decimals round correctly before total calculation. | 1) Setup cart: itemA price 0.3333 qty 3 (priceCents=Math.round(0.3333*100)=33 cents; totalCents=33*3=99). 2) POST /api/order with payload total 0.99. 3) Verify response 201 and persisted total 0.99. | 201 Created; order total = 0.99; rounding used per-cent rules; logs show calculation used cents math. |
| P-03 | Single-item cart order succeeds. | 1) Setup cart: itemX price 1000.00 qty 1 (totalCents=100000). 2) POST /api/order with matching payload. 3) Verify 201 and cart cleared. | 201 Created; persisted order total = 1000.00; cart is empty. |
| P-04 | Order with multiple quantities succeeds and persists newest-first ordering. | 1) Setup cart: itemA price 2.50 qty 4 (total 10.00). 2) POST /api/order. 3) Verify 201 and GET /api/order list shows created order at index 0. | 201 Created; persisted order total = 10.00; GET /api/order returns order as newest (first). |
| P-05 | Very small fractional prices aggregate correctly. | 1) Setup cart: itemA price 0.01 qty 1, itemB price 0.02 qty 2 (totalCents=1+4=5 => 0.05). 2) POST /api/order. 3) Verify 201 and order total 0.05. | 201 Created; persisted total=0.05; cents math correct. |
| P-06 | Successful creation when server fetches authoritative cart and matches payload. | 1) Populate cart via API. 2) POST /api/order with identical items. 3) Inspect logs to confirm `getCart(userId)` was called before validation. 4) Verify 201 and cart cleared. | 201 Created; `getCart` observed in logs; order persisted and cart cleared. |

### Negative Tests

| Test ID | Description | Steps | Expected Result |
|---|---|---|---|
| N-01 | Data-integrity failure when order total differs from cart total. | 1) Setup cart: itemA price 9.99 qty 1 (cartTotalCents=999). 2) POST /api/order with payload total 10.99 (mismatched). 3) Verify response. 4) Verify no order persisted and cart unchanged. | 400 Bad Request (or configured 4xx); body contains "Data integrity check failed: order total does not match cart total"; GET /api/order shows no new order; GET /api/cart returns original cart. |
| N-02 | Item-level mismatch: different price in order payload for a cart item. | 1) Setup cart: itemA id=A price 5.00 qty 1. 2) POST /api/order where order item A price is 4.99. 3) Verify response and persistence. | 400 Bad Request; error indicates item-level mismatch (integrity failure); no order persisted; cart unchanged. |
| N-03 | Order rejected when an order item quantity is zero or negative. | 1) Setup cart with valid items. 2) POST /api/order where an item has quantity 0. 3) Verify response and persistence. | 400 Bad Request; message about invalid quantity; no order persisted. |
| N-04 | Order rejected when an order item price is negative. | 1) Setup cart. 2) POST /api/order with an item price -1.00. 3) Verify response. | 400 Bad Request; message about invalid price; no order persisted. |
| N-05 | Rounding discrepancy causes rejection when order uses naive float math. | 1) Setup cart: itemA price 0.105 qty 1 (priceCents=11). 2) POST /api/order with payload total 0.10 (incorrect rounding). 3) Verify response and persistence. | 400 Bad Request; integrity error message; no order persisted; logs show cents calculation mismatch. |
| N-06 | Cart-clear failure after order creation must roll back (expected system behavior: rollback). | 1) Setup cart and prepare `clearCart` to fail (simulate network error or stub cart service to return error). 2) POST /api/order with matching totals. 3) Verify POST returns 5xx or 4xx with reconciliation message. 4) GET /api/order to confirm no order persisted. | 500 Internal Server Error (or configured error); order not persisted (rollback confirmed); cart remains unchanged; logs show clearCart failure and rollback action. |

### Edge Tests

| Test ID | Description | Steps | Expected Result |
|---|---|---|---|
| E-01 | Concurrency: cart changed between `getCart` and order submit (another client removes an item). | 1) Setup cart: itemA price 10.00 qty 1. 2) Start POST /api/order but before submit simulate remote client removing itemA (or update cart via API). 3) Complete POST with original payload. 4) Verify response and persistence. | 400 Bad Request (integrity failure); no order persisted; cart reflects the other client's change. |
| E-02 | Very large quantities and prices (overflow risk). | 1) Setup cart: itemA price 1000000000.00 qty 100000 (priceCents and totalCents very large). 2) POST /api/order with matching totals. 3) Verify response and persistence. | If system supports large values: 201 Created; persisted total matches. If not supported: 4xx/5xx with clear error (documented). Test must note expected behavior for the environment. |
| E-03 | Zero-amount cart (all items price 0). | 1) Setup cart: itemA price 0.00 qty 2. 2) POST /api/order with total 0.00. 3) Verify response and persistence. | 201 Created (if allowed) with total 0.00; or 4xx if zero-amount orders are disallowed—state expected behavior. |
| E-04 | Maximum allowed items in cart (boundary). | 1) Fill cart to documented max items (e.g., 100 items). 2) POST /api/order with matching payload. 3) Verify response and persistence. | 201 Created if within limits; otherwise 4xx indicating too many items. Verify persisted order contains all items and total computed in cents. |
| E-05 | Partial item match: cart contains duplicates or split SKUs—order must match item ids and quantities. | 1) Setup cart with itemA qty 2 (two entries or single entry). 2) POST /api/order with two separate lines for itemA totalling qty 2. 3) Verify integrity check treats items by id and sums quantities. | 201 Created if item-level aggregation matches; otherwise 400 with integrity message. |
| E-06 | Observability: failed integrity check surfaces helpful logs and response. | 1) Setup cart where order totals mismatch. 2) POST /api/order. 3) Inspect response body and server logs. | 400 Bad Request; response includes message "Data integrity check failed: order total does not match cart total"; logs contain the same message with `userId` and computed totals in cents. |

---

Notes / Quick verification commands
- Setup cart: `POST http://localhost:3002/api/cart/{userId}` with cart JSON (use API exposed by cart-service).  
- Create order: `POST http://localhost:3003/api/order` (body: CreateOrderRequest).  
- Verify cart: `GET http://localhost:3002/api/cart/{userId}`.  
- Verify orders: `GET http://localhost:3003/api/order?userId={userId}` or `GET /api/order/{orderId}` depending on API.
- Logs: inspect order-service stdout/stderr or centralized logging for lines containing `Data integrity check failed` or `getCart` / `clearCart` invocations.

Pass/Fail guidance
- Pass: API returns expected HTTP status and message, order persistence matches expectations (verify via GET), cart state matches expected (cleared or unchanged), and logs show the key verification steps (cart fetch, cents math, clearCart result).
- Fail: Any deviation from the above (unexpected HTTP status, order created when it should not be, cart incorrectly cleared when it should remain, or missing observability information).
