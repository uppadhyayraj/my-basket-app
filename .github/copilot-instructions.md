---
applyTo: "**/*.ts"
---

# Playwright & TypeScript Testing Standards

## What You Must Do
-   **Architecture**: Always use Page Object Model (POM) for UI tests and Service Object Model for API tests.
-   **Locators**: Use accessible locators (`getByRole`, `getByLabel`, `getByText`) instead of CSS/XPath.
-   **Assertions**: Explicitly use `expect()` for verification. Use `toBeVisible()` for UI state.
-   **API Clients**: Use a centralized `ApiClient` (or `request.newContext`) wrapper.
-   **Types**: Apply strict TypeScript interfaces for all Request/Response bodies.

## What You Must Never Do
-   **No Hard Waits**: Never use `page.waitForTimeout()` or `sleep()`. Use `waitForLoadState` or web-first assertions.
-   **No Raw Selectors**: Avoid `page.locator('.class')` or `page.$('#id')` unless absolutely necessary and documented.
-   **No Flaky Logic**: Do not assume immediate UI updates; allow for animation/network delays via `expect`.

## Code Style
-   Use `test.describe('Feature', () => { ... })` and `test('Scenario', async () => { ... })`.
-   Group logically related tests.
