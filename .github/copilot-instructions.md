---
applyTo: "**/*.ts"
---

# Playwright & TypeScript Testing Standards

## What You Must Do
-   **Architecture**: Always use Page Object Model (POM) for UI tests (extending `BasePage`) and Service Object Model for API tests.
-   **Locators**: Prioritize accessible locators (`getByRole`, `getByLabel`, `getByHeading`). Use `data-testid` only as a secondary option for internal state or complex components where semantic roles are ambiguous.
-   **Assertions**: Explicitly use `expect()` for verification. Use `toBeVisible()` for UI state.
-   **API Clients**: Use a centralized `ApiClient` (or `request.newContext`) wrapper. Externalize `baseURL` to environment variables.
-   **Types**: Apply strict TypeScript interfaces for all Request/Response bodies.

## What You Must Never Do
-   **No Hard Waits**: Never use `page.waitForTimeout()` or `sleep()`. Use `waitForLoadState` or web-first assertions.
-   **No Raw Selectors**: Avoid `page.locator('.class')` or `page.$('#id')` unless absolutely necessary and documented.
-   **No Hardcoded Config**: Never hardcode URLs (e.g., `http://localhost:3000`) or sensitive data in logic files. Use environment variables.
-   **No Flaky Logic**: Do not assume immediate UI updates; allow for animation/network delays via `expect`.

## Code Style
-   Use `test.describe('Feature', () => { ... })` and `test('Scenario', async () => { ... })`.
-   Group logically related tests.
