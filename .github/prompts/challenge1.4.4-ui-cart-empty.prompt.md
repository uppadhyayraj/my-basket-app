---
name: challenge1.4.4-ui-cart-empty
description: Verify that the Cart page displays an 'empty' message when no items are added.
---

# RCTC Prompt: Cart Empty State UI Test

**ROLE**
As a QA Automation Specialist using Playwright.

**CONTEXT**
We need to ensure the Cart Page (`src/app/cart/page.tsx`) handles the "no items" state gracefully by showing a clear message to the user.

**TASK**
Create a Playwright UI test that:
1.  Navigate to the Cart page.
2.  Mocks the `/api/cart` endpoint to return an empty array `[]`.
3.  Verifies the "Empty State" UI element is visible.

**CONSTRAINTS**
-   **Skill**: Use `testing_framework` (Procedure A: UI Test Creation).
-   **Assertion**: Specifically assert text "Your cart is empty" (or matching UI constant) is visible.
-   **Isolation**: Do NOT check backend database; rely purely on the network mock.
