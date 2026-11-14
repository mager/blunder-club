import { mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

async function setupProfile(page: Page, legacy = false) {
  await page.goto('/#/games');
  return page.evaluate(async ({ legacy }) => {
    const { cloudServices } = await import('/src/firebase-client.ts');
    const { GoogleAuthProvider, signInWithCredential } = await import('/node_modules/.vite/deps/firebase_auth.js');
    const { createImportedGame, parseGamePgn } = await import('/src/imported-games.ts');
    const { CloudLibrary } = await import('/src/library-cloud.ts');
    const services = cloudServices();
    if (!services || services.auth.app.options.projectId !== 'demo-nextmove' || !services.auth.emulatorConfig) throw new Error('Only demo emulators are allowed.');
    const uid = 'social-test-' + crypto.randomUUID();
    const jwt = [btoa(JSON.stringify({ alg: 'none', typ: 'JWT' })).replace(/=/g, ''), btoa(JSON.stringify({ sub: uid, email: uid + '@example.invalid', name: 'PRIVATE ACCOUNT NAME', iss: 'https://accounts.google.com', aud: 'demo-key', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 })).replace(/=/g, ''), ''].join('.');
    const user = await signInWithCredential(services.auth, GoogleAuthProvider.credential(jwt));
    const cloud = new CloudLibrary(services.db);
    const first = await cloud.write(user.user.uid, { ...await createImportedGame(parseGamePgn('1. f3 e5 2. g4 Qh4# 0-1'), 'b'), title: 'A queen finds the finish', favorite: true }, 0);
    const second = await cloud.write(user.user.uid, { ...await createImportedGame(parseGamePgn('1. e4 e5 2. Nf3 Nc6 3. Bc4 *'), 'w'), title: 'Learning the Italian', favorite: true }, 0);
    const published = legacy ? await cloud.publish(user.user.uid, 'Old profile', [first], 0) : null;
    return { first, second, href: published ? '#/profile/' + published.settings!.publicId : '' };
  }, { legacy });
}

test('personal profile preview, spotlight, stories, sharing and anonymous replay', async ({ page, browser }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  const { first, second } = await setupProfile(page);
  await page.goto('/#/me'); await page.reload();
  await page.getByLabel('Public name', { exact: true }).fill('Learning one move at a time');
  await page.getByLabel('About you', { exact: true }).fill('I keep the games that teach me something.');
  await page.getByRole('radio', { name: 'Rook', exact: true }).check();
  await page.getByRole('checkbox', { name: first.title, exact: true }).check();
  await page.getByRole('checkbox', { name: second.title, exact: true }).check();
  await page.getByLabel('Spotlight game', { exact: true }).selectOption(first.publicId);
  await page.getByLabel('Why I kept it: ' + first.title, { exact: true }).fill('The queen needed only one open diagonal.');
  await page.getByRole('button', { name: 'Preview public profile', exact: true }).click();
  const preview = page.getByRole('dialog', { name: 'Public profile preview' });
  await expect(preview.getByText('I keep the games that teach me something.', { exact: true })).toBeVisible();
  await expect(preview.getByText('The queen needed only one open diagonal.', { exact: true })).toBeVisible();
  await expect(preview.getByRole('button', { name: 'Copy profile link' })).toHaveCount(0);
  await preview.getByRole('button', { name: 'Publish profile', exact: true }).click();
  const href = await page.getByRole('link', { name: 'View public profile' }).getAttribute('href');
  const context = await browser.newContext(); const visitor = await context.newPage();
  await visitor.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('denied'); } }, configurable: true }));
  await visitor.goto('http://127.0.0.1:5176/' + href);
  await expect(visitor.getByRole('heading', { name: 'Learning one move at a time', exact: true })).toBeVisible();
  await expect(visitor.getByLabel('Rook avatar')).toBeVisible();
  await expect(visitor.locator('.profile-spotlight')).toContainText(first.title);
  await expect(visitor.getByText('PRIVATE ACCOUNT NAME')).toHaveCount(0);
  await expect(visitor.getByText('Your style notes')).toHaveCount(0);
  await page.getByLabel('About you', { exact: true }).fill('This draft must stay private.');
  await visitor.reload();
  await expect(visitor.getByText('I keep the games that teach me something.', { exact: true })).toBeVisible();
  await expect(visitor.getByText('This draft must stay private.')).toHaveCount(0);
  mkdirSync('.impeccable/review', { recursive: true });
  for (const [label, width, height] of [['desktop', 1440, 900], ['mobile', 320, 568], ['landscape', 844, 390]] as const) {
    await visitor.setViewportSize({ width, height });
    await visitor.goto('http://127.0.0.1:5176/' + href);
    await expect(visitor.getByRole('heading', { name: 'Learning one move at a time', exact: true })).toBeVisible();
    await visitor.getByRole('button', { name: 'Replay', exact: true }).last().scrollIntoViewIfNeeded();
    await expect(visitor.getByRole('button', { name: 'Replay', exact: true }).last()).toBeVisible();
    await visitor.evaluate(() => scrollTo(0, 0));
    expect(await visitor.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if (process.env.CAPTURE_UI) await visitor.screenshot({ path: `.impeccable/review/social-${label}.png`, fullPage: true });
  }
  await visitor.setViewportSize({ width: 1440, height: 900 });
  await visitor.getByRole('button', { name: 'Copy profile link', exact: true }).click();
  await expect(visitor.getByLabel('Share link', { exact: true })).toHaveValue('http://127.0.0.1:5176/' + href);
  await expect(visitor.getByText('Link copied.', { exact: true })).toHaveCount(0);
  await visitor.locator('.profile-spotlight').getByRole('button', { name: 'Copy game link', exact: true }).click();
  const finish = await visitor.locator('.profile-spotlight').getByLabel('Share link', { exact: true }).inputValue();
  expect(finish).toContain('/games/' + first.publicId + '?ply=4');
  await visitor.goto(finish); await expect(visitor.getByLabel('Selected move')).toHaveValue('4');
  await expect(visitor.getByText('Qh4# · Checkmate', { exact: true })).toBeVisible();
  await visitor.getByRole('button', { name: 'Previous move', exact: true }).focus(); await visitor.keyboard.press('ArrowLeft');
  await expect(visitor.getByLabel('Selected move')).toHaveValue('3');
  expect(await visitor.evaluate(() => localStorage.getItem('blunder-club-v1'))).toBeNull();
  await context.close();
  await page.reload(); await expect(page.getByLabel('About you', { exact: true })).toHaveValue('I keep the games that teach me something.');
  await expect(page.getByLabel('Spotlight game', { exact: true })).toHaveValue(first.publicId);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByLabel('About you', { exact: true })).toHaveCount(0);
  await expect(page.getByText('The queen needed only one open diagonal.', { exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('old profiles render and long personal details fit all target sizes', async ({ page }) => {
  const { first, href } = await setupProfile(page, true);
  await page.goto('/' + href);
  await expect(page.getByRole('heading', { name: 'Old profile', exact: true })).toBeVisible();
  await expect(page.getByLabel('Knight avatar')).toBeVisible();
  await page.goto('/#/me');
  await page.getByLabel('Public name', { exact: true }).fill('A'.repeat(40));
  await page.getByLabel('About you', { exact: true }).fill('B'.repeat(160));
  await page.getByLabel('Why I kept it: ' + first.title, { exact: true }).fill('C'.repeat(160));
  await page.getByRole('button', { name: 'Preview public profile', exact: true }).click();
  await page.getByRole('button', { name: 'Update public profile', exact: true }).click();
  mkdirSync('.impeccable/review', { recursive: true });
  for (const [label, width, height] of [['desktop', 1440, 900], ['mobile', 320, 568], ['landscape', 844, 390]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/#/me');
    await expect(page.getByLabel('About you', { exact: true })).toHaveValue('B'.repeat(160));
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if (process.env.CAPTURE_UI) await page.screenshot({ path: `.impeccable/review/social-${label}-editor.png`, fullPage: true });
    await page.goto('/' + href);
    await expect(page.getByRole('heading', { name: 'A'.repeat(40), exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if (process.env.CAPTURE_UI) await page.screenshot({ path: `.impeccable/review/social-${label}-long.png`, fullPage: true });
    await page.getByRole('button', { name: 'Copy profile link', exact: true }).focus();
    await expect(page.getByRole('button', { name: 'Copy profile link', exact: true })).toBeFocused();
  }
});
