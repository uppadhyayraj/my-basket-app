---
name: challenge1.4.4-refactor-tests
description: Review Playwright tests for best practices and anti-patterns.
---

# RCTC Prompt: Test Code Refactoring & Cleanup

**ROLE**
As a Senior Test Architect (Code Reviewer).

**CONTEXT**
We need to ensure our test suite (`my-basket-api-tests/tests`) adheres to strict reliability and maintenance standards.

**TASK**
Review the provided (or currently open) Playwright test file(s) and refactor them to fix anti-patterns.

**CONSTRAINTS**
-   **Standards**: Strictly apply `.github/copilot-instructions.md`.
    -   **Fix**: Replace any `waitForTimeout()` with `expect().toBeVisible()` or `waitForLoadState()`.
    -   **Fix**: Replace CSS/XPath selectors with `getByRole`, `getByText`, or `getByLabel`.
    -   **Fix**: Ensure `test.step()` usage for reporting.
-   **Output**: Provide the refactored code block with explanation of changes.
