# Challenge 1.4.4: AI Assistant Setup & Prompt Engineering

**Special Thanks**: This guide is based on the insights from **[Raj](https://substack.com/@rajuppadhyay)** and his Democratize Quality articles:
1.  [Teaching Your AI Assistant to Think Like Your QA Team](https://democratizequality.substack.com/p/teaching-your-ai-assistant-to-think)
2.  [Skills vs Instructions vs Prompts vs Coding Agents](https://democratizequality.substack.com/p/skills-vs-instructions-vs-prompts)

---

## Part 1: Project Setup Guide for QA Teams

I have configured `MyBasket Lite` to specific AI standards to ensure consistency across the team. Here is how I stratified my AI context:

### 1. The "Rules": Custom Instructions
**File**: `.github/copilot-instructions.md`
**Purpose**: Passive, always-on enforcement of non-negotiable standards.
**What I covered**:
-   **Architecture**: Mandatory Page Object Model (POM) and Service Object Model usage.
-   **Locators**: Strict use of `getByRole` / `getByLabel` (Accessibility first).
-   **Prohibited**: No `waitForTimeout`, no CSS selectors.
**RCTC Alignment**: This provides the **CONSTRAINT** context for every interaction.

### 2. The "Procedure": Agent Skills
**File**: `.agent/skills/testing_framework/SKILL.md`
**Purpose**: Detailed "How-To" workflows for complex tasks.
**What I covered**:
-   **Procedure A (UI)**: Step-by-step generic flow for creating a Mocked UI test.
-   **Procedure B (API)**: A rigorous 11-point checklist for API coverage (Auth, Boundary, Negative, etc.).
**RCTC Alignment**: This defines the **TASK** execution path.

### 3. The "Template": Prompt Files
**File**: `.github/prompts/*.prompt.md`
**Purpose**: Reusable macros for specific recurring requests.
**What I covered**:
-   `generate-api-framework.prompt.md`: A template to scaffold a new API testing project.
-   `generate-ui-framework.prompt.md`: A template to generate isolated UI tests.
**RCTC Alignment**: These are pre-packaged **ROLE** and **CONTEXT** definitions.

### How to Use This Setup

#### For a UI Test
*User Input*:
> "Use the **testing_framework** skill to create a test for the 'Add to Cart' flow."

*AI Action*:
1.  Reads `SKILL.md` -> Procedure A (UI).
2.  Generates code using `getByRole` (from `copilot-instructions`).
3.   Mocks the network calls (from Skill requirement).

#### For an API Test
*User Input*:
> "Use the **testing_framework** skill to generate API tests for the `/api/login` endpoint."

*AI Action*:
1.  Reads `SKILL.md` -> Procedure B (API).
2.  Generates the Service Object wrapper.
3.  Creates tests for all 11 checklist items (Valid, Invalid, Missing Fields, etc.).

---

## Part 2: Challenge 1.4.4 Prompts (Result)

**Objective**: Generate specific prompts to test the "Empty State", "Integration Flow", and perform "Refactoring".

### Generated Prompt 1: Empty State UI Test
*Saved to*: `.github/prompts/challenge1.4.4-ui-cart-empty.prompt.md`

```markdown
---
name: ui-cart-empty
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
```

### Generated Prompt 2: Integration Test (Hybrid)
*Saved to*: `.github/prompts/challenge1.4.4-integration-cart-hybrid.prompt.md`

```markdown
---
name: integration-cart-hybrid
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
```

### Generated Prompt 3: Refactoring & Cleanup
*Saved to*: `.github/prompts/challenge1.4.4-refactor-tests.prompt.md`

```markdown
---
name: refactor-tests
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
```

### How to Execute (The 3-Step Guide)

Required Setup: Ensure you have GitHub Copilot Chat open in VS Code.

#### 1. The "Empty State" UI Test
**Goal**: Generate a new, isolated UI test file.
**How it works**:
-   **Prompt** defines *What* (Empty state scenario).
-   **Skill** defines *How* (Procedure A: Page Objects + Mocking).
-   **Instructions** define *Quality* (Use `getByRole`, No `waitForTimeout`).

**Execution Steps**:
1.  Open the Chat panel.
2.  Type: `/challenge1.4.4-ui-cart-empty`
3.  **Result**: Copilot will generate a code block (likely `ui-cart-empty.spec.ts`).
4.  **Action**: Save this to `my-basket-api-tests/tests/integration/ui-cart-empty.spec.ts`.

#### 2. The Hybrid Integration Test
**Goal**: Generate a complex test crossing API and UI boundaries.
**How it works**:
-   **Prompt** defines the specific hybrid flow (API Arrange -> UI Act).
-   **Skill** provides the structure for using `api-fixtures` (API side) and Page Objects (UI side).

**Execution Steps**:
1.  Open the Chat panel.
2.  Type: `/challenge1.4.4-integration-cart-hybrid`
3.  **Result**: A test using `request.post` to seed data and `page.goto` to verify it.
4.  **Action**: Save this to `my-basket-api-tests/tests/integration/hybrid-cart.spec.ts`.

#### 3. Refactoring & Cleanup
**Goal**: clean up *existing* dirty code using your standards.
**How it works**:
-   **Instructions** acts as the "Rulebook" (e.g., "Never use XPath").
-   **Prompt** tells Copilot to act as a "Code Reviewer" and apply that rulebook.

**Execution Steps**:
1.  **Open the specific file you want to fix** in your editor (e.g., `my-basket-api-tests/tests/integration/e2e-workflow.spec.ts` or any file you suspect has issues).
2.  Highlight the code (or select all).
3.  Type: `/challenge1.4.4-refactor-tests`
4.  **Result**: Copilot will rewrite the selected code replacing bad patterns (like `waitForTimeout`) with good ones (like `expect().toBeVisible()`).

#### Summary of the "AI Stack" in action
When you run these commands, you don't need to manually paste the Skills or Instructions.
-   **Instructions** are injected automatically (System Prompt).
-   **Skills** are referenced inside the Prompt text ("Use testing_framework Procedure A").
-   **You** just type the slash command.

---

## Part 3: Pull Request Details

**PR Title**: `feat(qa-setup): implement Agent Skills and RCTC Standards`

**Description**:
This PR standardizes our AI-assisted testing workflow by implementing the "Skills vs Instructions" pattern. It also includes the implementation of specific challenges for Cart empty state, hybrid integration testing, and a comprehensive refactor of existing page objects and tests.

**Changes**:
1.  **Added `.github/copilot-instructions.md`**:
    -   Enforces Playwright best practices (No `waitForTimeout`, strict POM usage).
    -   Ensures consistent coding style across the team.
2.  **Added `.agent/skills/testing_framework/SKILL.md`**:
    -   Defines procedural workflows for UI (mocked) and API (comprehensive) testing.
    -   Includes a mandatory 11-point checklist for API test coverage.
3.  **Added Prompts**:
    -   `generate-api-framework.prompt.md`: Boilerplate generator.
    -   `generate-ui-framework.prompt.md`: Generic UI Test generator.
    -   `challenge1.4.4-ui-cart-empty.prompt.md`: Empty State UI Test.
    -   `challenge1.4.4-integration-cart-hybrid.prompt.md`: API Seed + UI Verify.
    -   `challenge1.4.4-refactor-tests.prompt.md`: Code Review & Cleanup.
4.  **Implemented New Tests (Challenge 1.4.4)**:
    -   **Created `tests/pages/CartPage.ts`**:
        -   New Page Object Model for the Cart view.
        -   Includes specific locators for Empty State and helper methods for hybrid testing (`setUserId`, `verifyItemVisible`).
    -   **Created `tests/integration/ui-cart-empty.spec.ts`**:
        -   Isolated UI test mocking the `/api/cart` endpoint.
        -   Verifies the "Your cart is empty" message.
    -   **Created `tests/integration/hybrid-cart.spec.ts`**:
        -   End-to-End Hybrid test (API Arrange -> UI Act -> Assert).
5.  **Refactoring & Code Quality**:
    -   **Refactored `tests/pages/HomePage.ts`**: Replaced fragile CSS selectors with accessible `getByRole` locators.
    -   **Updated Integration Tests**: Enforced `test.step()` usage in `ui-cart-empty.spec.ts` and `hybrid-cart.spec.ts` for granular reporting.

**How to Test**:
-   **Automated Verification**:
    -   Run the full integration suite: `npx playwright test tests/integration`
-   **Manual Prompt Verification**:
    -   Open Copilot Chat.
    -   Type `/challenge1.4.4-ui-cart-empty` to generate the empty state test.
    -   Type `/challenge1.4.4-refactor-tests` (with an open file) to clean up legacy code.
    -   Type `/ui-test-gen` (mapped to `generate-ui-framework`) to generate standard UI tests.

---

### **Recommended Git Strategy**

**Branch Name**: 
`feat/qa-agent-setup-challenge-1-4-4`

**Commit History (Atomic Commits)**:
1. `feat(config): add copilot instructions and testing agent skills`
2. `feat(prompts): add RCTC prompt templates for challenge 1.4.4`
3. `feat(test): implement cart empty state UI test and CartPage POM`
4. `feat(test): implement hybrid integration test with session injection`
5. `refactor(pom): replace fragile CSS selectors with accessible locators in HomePage`
6. `refactor(test): wrap integration tests in test.step blocks for reporting`
7. `docs: update challenge 1.4.4 documentation with PR details`
