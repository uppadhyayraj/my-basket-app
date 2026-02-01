---
name: testing_framework
description: Step-by-step procedures for creating UI (mocked) and API (service-based) tests.
---

# Testing Framework Skill

## Capability
Execute standardized testing workflows for "MyBasket Lite".
-   **Procedure A**: Create Isolated UI Tests.
-   **Procedure B**: Create Comprehensive API Tests.

---

## Procedure A: UI Test Creation (Frontend)

### 1. Requirements Analysis
-   **Identify User Flow**: Specific steps (e.g., "Checkout").
-   **Identify API Dependencies**: Endpoints to mock (e.g., `/api/orders`).

### 2. Create/Update Page Object
-   **File**: `tests/pages/[PageName].ts`
-   **Standards**:
    -   Extend `BasePage` for common actions (toasts, navigation, etc.).
    -   Prioritize accessible locators (`getByRole`, `getByLabel`, `getByHeading`).
    -   Use `data-testid` as a fallback for non-semantic elements.
-   **Pattern**:
    ```typescript
    import { BasePage } from './BasePage';
    
    export class [PageName] extends BasePage {
      constructor(page: Page) { super(page); }
      readonly submitBtn = this.page.getByRole('button', { name: 'Submit' });
      async performAction() { await this.submitBtn.click(); }
    }
    ```

### 3. Create Test File
-   **File**: `tests/integration/ui-[feature].spec.ts`
-   **Steps**:
    1.  **Mock Network**: Use `page.route` to return 200 OK JSON for all dependencies.
    2.  **Navigate**: `page.goto()` via Page Object.
    3.  **Interact**: Call Page Object methods.
    4.  **Verify**: Assert user-visible changes (URL, Toasts).

---

## Procedure B: API Test Creation (Backend)

### 1. Project Structure Setup
Ensure the following files exist or are created:
-   `/src/pages/[Service]API.ts`: Service Object wrapper.
-   `/src/utils/ApiClient.ts`: Shared request context.

### 2. Create Service Object
-   **File**: `tests/pages/[Service]API.ts`
-   **Steps**:
    1.  Extend Base API class.
    2.  Define methods for each endpoint (create, get, update, delete).
    3.  Type all inputs/outputs with interfaces.

### 3. Generate Test Cases (11-Point Checklist)
For EACH endpoint, write a test file (`tests/api/[feature].spec.ts`) covering:
1.  **Valid Request**: Happy path.
2.  **Optional Fields**: Verify functionality.
3.  **Auth Scenarios**: Invalid/No Token.
4.  **Missing Fields**: 400 Bad Request.
5.  **Invalid Types**: 400 Bad Request.
6.  **Boundary Values**: Max length, min value.
7.  **Large Payload**: Size limits.
8.  **Concurrency**: Race conditions.
9.  **Rate Limiting**: Throttling checks.
10. **Error Validation**: Assert message content.
11. **Integration**: Multi-step workflows.

### 4. Implementation Details
-   **Status Check**: `expect(res.status()).toBe(200)`.
-   **Schema Check**: Validate JSON structure.
-   **Logging**: Log key steps for debugging.
