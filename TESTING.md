# InsiderShield End-to-End Testing Documentation

Welcome to the end-to-end (E2E) testing framework for InsiderShield. This project utilizes **Playwright** with **TypeScript** to write and execute robust browser automation tests.

---

## 1. Folder Structure

The test codebase is fully contained within the `tests/` directory at the root of the project. It is structured as follows:

```
tests/
 ├── auth/               # Test files for authentication, login/logout, and session verification
 ├── employees/          # Test files for employee list and details views
 ├── employeePortal/     # Test files for the employee sandboxed workstation portal
 ├── dashboard/          # Smoke tests and core layout validation for the admin SOC dashboard
 ├── alerts/             # Test files for threat alert lists, alerts lifecycle, and actions
 ├── threatCenter/       # Test files for threat center metrics, drawer details, and investigation
 ├── fixtures/           # Shared static fixture data used across multiple spec files
 │    └── testEmployee.ts
 └── helpers/            # Reusable utility scripts (e.g., login, custom auth steps)
      └── login.ts
```

---

## 2. Configuration (`playwright.config.ts`)

Playwright is configured with the following defaults for local testing:
- **Base URL**: `http://localhost:3000`
- **Retries**: `1` (retries failed tests once to reduce flakiness)
- **Browsers/Projects**:
  - `chromium` (Google Chrome engine)
  - `firefox` (Mozilla Firefox engine)
- **Artifacts on Failure**:
  - **Screenshots**: Saved on failure (`only-on-failure`)
  - **Videos**: Retained on failure (`retain-on-failure`)
  - **Traces**: Recorded and kept on retry (`on-first-retry`)

---

## 3. How to Run Tests

Ensure the local dev/production server is running first before launching the tests:

```bash
# Start local development server (in insidershield root)
npm run dev
```

Then, run one of the following commands in a separate terminal:

### Run all tests in headless mode (default)
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive test runner)
Provides a rich graphical UI to step through tests, view live execution, and inspect DOM snapshops.
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (visible browser windows)
```bash
npm run test:e2e:headed
```

### Run a specific test file
```bash
npx playwright test tests/dashboard/dashboard-smoke.spec.ts
```

---

## 4. How to Debug Tests

If a test fails, you can leverage Playwright's troubleshooting and tracing tools:

1. **Check Failure Artifacts**:
   - Check the `test-results/` directory generated after failures. It contains screenshots, videos of the failing session, and trace archives.
2. **Open Playwright Trace Viewer**:
   - To view the execution timeline, console logs, network requests, and DOM snapshot for each action:
     ```bash
     npx playwright show-trace test-results/your-test-folder/trace.zip
     ```
3. **Use the Playwright Debugger**:
   - Run tests with the inspector to step through each line of code:
     ```bash
     npx playwright test --debug
     ```

---

## 5. How to Create Future Tests

Follow these best practices when extending the E2E testing suite:

1. **Use Reusable Helpers**:
   - For tests requiring admin rights, call `loginAsAdmin(page)` from `tests/helpers/login.ts` inside `test.beforeEach`.
2. **Utilize Fixture Data**:
   - Import mock objects (like `TEST_EMPLOYEE` from `tests/fixtures/testEmployee.ts`) to maintain consistency in input data and avoid hardcoding properties.
3. **Locators & Assertions**:
   - Use user-facing attributes such as placeholders, labels, or roles:
     ```typescript
     await page.getByPlaceholder('Search by name...').fill('Jane');
     ```
   - Always use web-first assertions like `expect(locator).toBeVisible()` or `expect(locator).toHaveText()` which auto-wait for conditions to be met.
4. **Data Isolation (DO NOT mutate data in tests)**:
   - For read-only views, assert existing UI states without modifying the database.
   - If writing tests that modify the database (e.g. creating/updating employees), clean up or revert the changes at the end of the test to keep the test environment pristine.
