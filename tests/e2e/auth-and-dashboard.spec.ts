import { test, expect } from "@playwright/test";

// Matches the dev-only PIN hash seeded in .env.local (see scripts/hash-pin.ts
// and README) — never the real family PIN, which must never appear in
// source, tests, or commits.
const DEV_TEST_PIN = "5204";

test.describe("PRD 17.3 core flow", () => {
  test("new device: PIN login -> profile registration -> dashboard -> persistent auto-login", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByPlaceholder("PIN을 입력하세요")).toBeVisible();
    await page.getByPlaceholder("PIN을 입력하세요").fill(DEV_TEST_PIN);
    await page.getByRole("button", { name: "로그인" }).click();

    await expect(page.getByRole("heading", { name: "프로필을 등록해 주세요" })).toBeVisible();
    await page.getByRole("button", { name: "새 구성원으로 등록" }).click();
    await page.getByPlaceholder("예) 아빠, 엄마, 윤호").fill("테스트유저");
    await page.getByPlaceholder("예) 윤호 아이폰, 거실 태블릿").fill("Playwright 기기");
    await page.getByRole("button", { name: "시작하기" }).click();

    await expect(page).toHaveURL(/\/gifticons$/);
    await expect(page.getByText("테스트유저님, 안녕하세요")).toBeVisible();

    // Reload to prove the session persists without re-entering the PIN
    // (PRD 5.1: "같은 기기와 브라우저에서는 이후 비밀번호 입력 없이 접속한다").
    await page.reload();
    await expect(page.getByText("테스트유저님, 안녕하세요")).toBeVisible();
  });

  test("wrong PIN is rejected with an error message", async ({ page }) => {
    await page.goto("/auth");
    await page.getByPlaceholder("PIN을 입력하세요").fill("0000");
    await page.getByRole("button", { name: "로그인" }).click();

    await expect(page.getByText("비밀번호가 올바르지 않습니다.")).toBeVisible();
    await expect(page).toHaveURL(/\/auth$/);
  });
});
