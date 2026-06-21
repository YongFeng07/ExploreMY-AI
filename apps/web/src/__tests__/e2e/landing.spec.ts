import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display the landing page', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/ExploreMY/);

    // Hero section
    await expect(
      page.getByRole('heading', { name: /Discover Malaysia/ }),
    ).toBeVisible();

    // CTA buttons
    await expect(
      page.getByRole('link', { name: /Start Exploring/ }),
    ).toBeVisible();

    // Navigation
    await expect(page.getByRole('link', { name: /Sign In/ })).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Sign In/ }).first().click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Get Started/ }).first().click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('should have working stats section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Places Mapped')).toBeVisible();
    await expect(page.getByText('Hidden Gems')).toBeVisible();
    await expect(page.getByText('Transport Modes')).toBeVisible();
  });
});
