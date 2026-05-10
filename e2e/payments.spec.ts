import { test, expect } from "@playwright/test";

test.describe("费用管理流程", () => {
  test("登录后可以查看费用管理页面", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
    await page.goto("/payments");
    await expect(page.locator("h2")).toContainText("费用管理");
  });

  test("点击新增缴费打开对话框", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
    await page.goto("/payments");
    await page.click("text=新增缴费");
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[role="dialog"]')).toContainText("新增缴费记录");
  });
});
