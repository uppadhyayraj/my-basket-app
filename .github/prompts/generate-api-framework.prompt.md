---
name: generate-api-framework
description: Generate a complete Playwright TypeScript project for API testing.
---

# RCTC Prompt: Generate API Testing Framework

**ROLE**
As a Senior Test Architect, create a robust, scalable API testing framework foundation using Playwright and TypeScript.

**CONTEXT**
-   **Goal**: Bootstrap a new dedicated API testing project.
-   **Standard**: Use Service Object Model (SOM) and strictly typed interfaces.
-   **Environment**: CI/CD ready (dev, staging, prod configurations).

**TASK**
Create a complete Playwright TypeScript project structure with the following requirements:
-   **Project Name**: [INSERT_PROJECT_NAME]
-   **APIs to Test**: [LIST_API_ENDPOINTS]
-   **Base URL**: Use environment-based configuration (e.g., `process.env.BASE_URL`).
-   **Auth**: [None/Bearer Token/API Key/Basic Auth]

**CONSTRAINTS (Structure & Components)**
Generate the files and folders below. Do not omit any component.

1.  **Project Setup Checks**:
    -   `package.json`: Include strict dependencies (playwright, typescript, dotenv, eslint).
    -   `tsconfig.json`: Strict mode enabled.
    -   `playwright.config.ts`: Configured for parallel execution and HTML reporting.
    -   `.gitignore`: Exclude node_modules and test-results.
    -   `README.md`: Detailed setup instructions.

2.  **Framework Structure**:
    -   `/src/pages/` (Service Objects): Class per endpoint (e.g., `CartAPI.ts`).
    -   `/src/utils/`: Auth helpers, data generators, standard error handlers.
    -   `/src/types/`: Interfaces for Requests/Responses.
    -   `/src/fixtures/`: Playwright fixtures extending the base test.
    -   `/tests/`: Feature-organized spec files.
    -   `/config/`: `.env.example` and environment loaders.

3.  **Core Components Implementation**:
    -   **Base API Class**: Wraps `request` context, handles common headers/auth.
    -   **Auth Handler**: Auto-refresh tokens if needed.
    -   **Response Validator**: Utility to check status + schema + headers in one line.
    -   **Logging**: Console output for request/response details on failure.

4.  **Sample Tests (Must Include)**:
    -   CRUD for one resource.
    -   Error scenarios (400, 401, 404).
    -   Integration workflow (Create -> Get -> Delete).

**EXECUTION INSTRUCTIONS**
Fill in the [placeholders] above and execute this prompt to generate the files.
