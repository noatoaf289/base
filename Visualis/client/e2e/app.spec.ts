import { test, expect } from '@playwright/test';

test.describe('Visualis app', () => {
  test('loads and shows package run step', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /visualis/i })).toBeVisible();
    await expect(page.getByLabel(/package id/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /run package/i })).toBeVisible();
  });

  test('run package with mock and reach cube step', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/package id/i).fill('test-pkg');
    await page.getByRole('button', { name: /run package/i }).click();
    await expect(page.getByRole('button', { name: /running/i }).or(page.getByText(/main cube/i))).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/main cube/i).or(page.getByLabel(/main cube/i))).toBeVisible({ timeout: 10000 });
  });
});
