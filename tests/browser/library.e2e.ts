import { mkdirSync, readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const pgn = readFileSync('tests/fixtures/pawn-mate.pgn', 'utf8');
async function importGame(page: Page, input = pgn, side = 'White') {
  await page.getByRole('button', { name: 'Paste a game', exact: true }).click();
  await page.getByLabel('PGN', { exact: true }).fill(input);
  await page.getByRole('button', { name: 'Check game', exact: true }).click();
  await page.getByRole('radio', { name: side, exact: true }).check();
  await page.getByRole('button', { name: 'Save game', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}
async function loginTestAccount(page: Page) {
  await page.evaluate(async () => {
    // Only local emulators accept this unsigned, synthetic Google token.
    const { cloudServices } = await import('/src/firebase-client.ts');
    const { GoogleAuthProvider, signInWithCredential } = await import('/node_modules/.vite/deps/firebase_auth.js');
    const services = cloudServices();
    if (!services || services.auth.app.options.projectId !== 'demo-nextmove' || !services.auth.emulatorConfig) throw new Error('Browser tests require the local demo emulators.');
    const jwt = [btoa(JSON.stringify({ alg: 'none', typ: 'JWT' })).replace(/=/g, ''), btoa(JSON.stringify({ sub: 'nextmove-test-' + crypto.randomUUID(), email: 'test-player-' + crypto.randomUUID() + '@example.invalid', name: 'Test player', iss: 'https://accounts.google.com', aud: 'demo-key', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 })).replace(/=/g, ''), ''].join('.');
    await signInWithCredential(cloudServices()!.auth, GoogleAuthProvider.credential(jwt));
  });
  await expect(page.getByText('Games saved to your account', { exact: true })).toBeVisible();
}

test('guest import, duplicate, replay, reload, side edit and original game preservation', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/#/games');
  const original = await page.evaluate(async () => {
    const { emptyProgress } = await import('/src/progress.ts');
    const value = JSON.stringify({ ...emptyProgress(), moves: ['e4', 'e5'], updatedAt: 100, retries: 2 });
    localStorage.setItem('blunder-club-v1', value); return value;
  });
  await page.getByRole('button', { name: 'Paste a game', exact: true }).click();
  await page.getByLabel('PGN', { exact: true }).fill('1. e5 *');
  await page.getByRole('button', { name: 'Check game', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('not legal');
  await expect(page.getByLabel('PGN', { exact: true })).toHaveValue('1. e5 *');
  await page.getByRole('button', { name: 'Close import' }).click();
  await importGame(page);
  await expect(page.getByText('10 checking moves and 9 captures')).toBeVisible();
  await page.getByRole('link', { name: 'Replay', exact: true }).click();
  await expect(page.getByText('Starting position', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next move', exact: true }).click();
  await expect(page).toHaveURL(/ply=1$/);
  await page.reload(); await expect(page.getByLabel('Selected move')).toHaveValue('1');
  await page.getByRole('button', { name: 'Last move', exact: true }).click();
  await expect(page.getByText('h4# · Checkmate', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Previous move', exact: true }).focus();
  await page.keyboard.press('ArrowLeft'); await expect(page.getByLabel('Selected move')).toHaveValue('70');
  await page.goBack(); await expect(page.getByLabel('Selected move')).toHaveValue('71');
  expect(await page.evaluate(() => localStorage.getItem('blunder-club-v1'))).toBe(original);
  await page.getByRole('link', { name: 'Back to games', exact: true }).click();
  await page.getByRole('button', { name: 'Paste a game', exact: true }).click();
  await page.getByLabel('PGN', { exact: true }).fill(pgn);
  await page.getByRole('button', { name: 'Check game', exact: true }).click();
  await expect(page.getByText('This game is already saved. It will count once.')).toBeVisible();
  await page.getByRole('button', { name: 'Keep saved game' }).click();
  await expect(page.locator('.library-game-row')).toHaveCount(1);
  await page.getByRole('button', { name: 'Edit title or side' }).click();
  await page.getByLabel('Your side', { exact: true }).selectOption('b');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await page.getByRole('link', { name: 'Open finish', exact: true }).click();
  await expect(page.locator('.chessboard button').first()).toHaveAttribute('id', 'square-h1');
  await page.getByRole('link', { name: 'Back to game', exact: true }).click();
  await expect(page.getByRole('button', { name: 'New game', exact: true })).toBeVisible();
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('blunder-club-v1')) || '{}').moves).toEqual(['e4', 'e5']);
  expect(errors).toEqual([]);
});

test('test account publishes only selected favorites; anonymous replay and unpublish work', async ({ page, browser }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/#/games'); await importGame(page);
  await loginTestAccount(page);
  await page.getByRole('button', { name: 'Favorite: Player – Opponent', exact: true }).click();
  await page.getByRole('link', { name: 'Profile', exact: true }).click();
  await page.getByLabel('Public name', { exact: true }).fill('The pawn finish');
  await page.getByRole('checkbox', { name: 'Player – Opponent', exact: true }).check();
  await page.getByRole('button', { name: 'Preview public profile', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Public profile preview' })).toBeVisible();
  await page.getByRole('button', { name: 'Publish profile', exact: true }).click();
  const href = await page.getByRole('link', { name: 'View public profile', exact: true }).getAttribute('href');
  expect(href).toMatch(/^#\/profile\/[a-f0-9]{32}$/);
  const visitorContext = await browser.newContext(); const visitor = await visitorContext.newPage();
  await visitor.goto('http://127.0.0.1:5176/' + href);
  await expect(visitor.getByRole('heading', { name: 'The pawn finish', exact: true })).toBeVisible();
  await expect(visitor.getByText('Your style notes')).toHaveCount(0);
  await visitor.getByRole('button', { name: 'Open finish', exact: true }).click();
  await expect(visitor.getByText('h4# · Checkmate', { exact: true })).toBeVisible();
  await visitor.reload(); await expect(visitor.getByLabel('Selected move')).toHaveValue('71');
  await page.getByRole('button', { name: 'Unpublish profile', exact: true }).click();
  await expect(page.getByText('Your profile is no longer public. Your games stay saved.')).toBeVisible();
  await visitor.reload(); await expect(visitor.getByRole('heading', { name: 'Profile not available', exact: true })).toBeVisible();
  expect(await visitor.evaluate(() => localStorage.getItem('blunder-club-v1'))).toBeNull();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.locator('.library-game-row')).toHaveCount(0);
  await visitorContext.close(); expect(errors).toEqual([]);
});

test('replay and profile controls fit desktop, narrow phone and short landscape', async ({ page }) => {
  mkdirSync('.impeccable/review', { recursive: true });
  await page.goto('/#/games');
  await page.setViewportSize({ width: 320, height: 568 });
  await page.getByRole('button', { name: 'Paste a game', exact: true }).click();
  await page.getByLabel('PGN', { exact: true }).fill(pgn);
  if (process.env.CAPTURE_UI) await page.screenshot({ path: '.impeccable/review/mobile-import.png' });
  await page.getByRole('button', { name: 'Check game', exact: true }).click();
  await page.getByRole('radio', { name: 'White', exact: true }).check();
  await page.getByRole('button', { name: 'Save game', exact: true }).click();
  await loginTestAccount(page);
  await page.getByRole('button', { name: 'Favorite: Player – Opponent', exact: true }).click();
  await page.getByRole('link', { name: 'Profile', exact: true }).click();
  await page.getByLabel('Public name', { exact: true }).fill('The pawn finish');
  await page.getByRole('checkbox', { name: 'Player – Opponent', exact: true }).check();
  if (process.env.CAPTURE_UI) { await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: '.impeccable/review/mobile-owner.png', fullPage: true }); }
  await page.getByRole('button', { name: 'Preview public profile', exact: true }).click();
  await page.getByRole('button', { name: 'Publish profile', exact: true }).click();
  const href = await page.getByRole('link', { name: 'View public profile', exact: true }).getAttribute('href');
  for (const [label, width, height] of [['desktop', 1440, 900], ['mobile', 320, 568], ['landscape', 844, 390]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/' + href); await expect(page.getByRole('heading', { name: 'The pawn finish', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if (process.env.CAPTURE_UI) await page.screenshot({ path: `.impeccable/review/${label}-profile.png`, fullPage: true });
    await page.getByRole('button', { name: 'Open finish', exact: true }).click();
    await expect(page.getByText('h4# · Checkmate', { exact: true })).toBeVisible();
    await page.waitForTimeout(150);
    const bounds = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
    expect(bounds.width).toBeLessThanOrEqual(width); expect(bounds.height).toBeLessThanOrEqual(height);
    const controls = await page.getByRole('toolbar', { name: 'Replay moves' }).boundingBox();
    expect(controls!.y + controls!.height).toBeLessThanOrEqual(height);
    await expect(page.getByRole('link', { name: 'Nextmove home', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to game', exact: true })).toBeVisible();
    expect((await page.getByLabel('Selected move').boundingBox())!.width).toBeGreaterThan(80);
    if (process.env.CAPTURE_UI) await page.screenshot({ path: `.impeccable/review/${label}-replay.png`, fullPage: true });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('button', { name: 'Previous move', exact: true }).click();
    await expect(page.getByLabel('Selected move')).toHaveValue('70');
  }
});

test('lesson assistance survives a library detour; imported custom promotion replays', async ({ page }) => {
  await page.goto('/#/learn/italian');
  await expect(page.locator('.hint-arrow')).toHaveCount(1);
  await expect.poll(async () => JSON.parse(await page.evaluate(() => localStorage.getItem('blunder-club-v1')) || '{}').studyRun?.helped).toBe(true);
  await page.getByRole('button', { name: 'Sign in and save progress', exact: true }).click();
  await page.getByRole('button', { name: 'Paste a game', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your games', exact: true })).toBeVisible();
  await importGame(page, '[SetUp "1"]\n[FEN "7k/4P3/5K2/8/8/8/8/8 w - - 0 1"]\n1. e8=Q+ *');
  await page.getByRole('link', { name: 'Open finish', exact: true }).click();
  await expect(page.getByText('e8=Q+ · Check', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back to game', exact: true }).click();
  await expect.poll(async () => JSON.parse(await page.evaluate(() => localStorage.getItem('blunder-club-v1')) || '{}').studyRun?.helped).toBe(true);
});
