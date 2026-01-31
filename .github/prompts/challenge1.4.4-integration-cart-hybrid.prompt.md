---
name: challenge1.4.4-integration-cart-hybrid
description: Hybrid test: Seed data via API, verify via UI.
---

# RCTC Prompt: Cart Hybrid Integration Test

**ROLE**
As a Full-Stack SDET (Software Developer in Test).

**CONTEXT**
We need to verify that data persisted by the backend (`microservices/cart-service/src/routes.ts`) is correctly reflected in the frontend `CartView` (`src/components/cart/CartView.tsx`).

**TASK**
Create a Playwright Integration test that:
1.  **Arrange**: Uses `APIRequestContext` to POST a valid item to the actual Backend API (`/api/cart`).
2.  **Act**: Reloads/Navigates to the Cart UI Page.
3.  **Assert**: Verifies the seeded item appears in the cart sidebar/list using UI Selectors.

**CONSTRAINTS**
-   **Skill**: Use `testing_framework` (Procedure B for API seeding + Procedure A for UI verification).
-   **Real Service**: This is an INTEGRATION test; do NOT mock the API for the "Get" call. Mocking is allowed for external 3rd parties only if necessary.
-   **Data Cleanup**: Ensure the test cleans up the created item `afterTest`.
