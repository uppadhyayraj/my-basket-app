---
name: generate-ui-framework
description: Generate resilient, isolated UI tests using Playwright.
---

# RCTC Prompt: UI Test Generation

**ROLE**
As a Senior Test Automation Engineer for "MyBasket Lite", your goal is to create resilient, isolated UI tests using Playwright and TypeScript.

**CONTEXT**
- **Architecture**: Next.js frontend relying on microservices.
- **Testing Strategy**: Tests must be independent of backend availability. We use Playwright's `page.route()` to mock all network requests.
- **Project Structure**:
    - **Page Objects**: Located in `tests/pages/` (e.g., `HomePage.ts`). Tests must use these classes for interaction, not raw locators.
    - **Specs**: Located in `tests/integration/`.
    - **Helpers**: `playwright.config.ts` handles screenshots on failure.
- **Key Pattern**: `Page Object Interaction` -> `API Mocking` -> `UI Verification`.

**TASK**
Generate a Playwright test file (`[Target Feature Name].spec.ts`) that verifies the **[Specific User Flow]**.
Reference the existing `HomePage` class if applicable. If new Page Objects are needed, define them inline or request their creation.

**CONSTRAINTS (follow exactly)**
1.  **Isolation (Mock Everything)**:
    -   Intercept ALL relevant API calls using `page.route('**/api/[endpoint]/**', ...)`.
    -   Provide realistic JSON responses (200 OK for success, 4xx/5xx for error cases).
    -   Do not allow any traffic to hit the real backend or `localhost:3000/api`.
2.  **Page Object Usage**:
    -   Instantiate Page Objects at the start of the test.
    -   Use semantic methods (e.g., `homePage.addFirstProductToBasket()`) rather than direct `page.click()`.
3.  **Step-by-Step Reporting**:
    -   Wrap logical blocks in `test.step('Description', async () => { ... })`.
4.  **Verification**:
    -   Assert on USER-VISIBLE changes (toasts, URL updates, element visibility).
    -   Do not just assert that the API was called; assert the UI *reacted* to it.
5.  **Code Style**:
    -   Use `test.describe` for grouping.
    -   Use `expect(locator).toBeVisible()` with appropriate timeouts for async UI updates.
