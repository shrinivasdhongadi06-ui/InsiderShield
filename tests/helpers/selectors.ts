/**
 * Centralized, stable selectors utilizing data-testid attributes to avoid fragility.
 */
export const SELECTORS = {
  admin: {
    emailInput: '[data-testid="admin-email-input"]',
    passwordInput: '[data-testid="admin-password-input"]',
    submitButton: '[data-testid="admin-submit-button"]',
    submitLink: '[data-testid="admin-submit-link"]',
  },
  employee: {
    selectDropdown: '[data-testid="employee-select"]',
    loginButton: '[data-testid="employee-login-button"]',
  },
  workstation: {
    locationSelect: '[data-testid="location-select"]',
    unlockButton: '[data-testid="unlock-workstation-button"]',
  }
};
