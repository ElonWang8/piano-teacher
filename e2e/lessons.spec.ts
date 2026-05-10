import { test, expect } from "@playwright/test";

test.describe("课程记录流程", () => {
  test("未登录用户重定向到登录页", async ({ page }) => {
    await page.goto("/lessons");
    await expect(page).toHaveURL(/\/login/);
  });

  test("登录后可以查看课程记录页面", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
    await page.goto("/lessons");
    await expect(page.locator("h2")).toContainText("课程记录");
  });
});
