import { mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const menu = (page: Page) => page.getByRole('button', { name: 'Game menu', exact: true });
const saveDialog = (page: Page) => page.getByRole('dialog', { name: 'Save game', exact: true });
const saveButton = (page: Page) => saveDialog(page).getByRole('button', { name: 'Save game', exact: true });
const storedProgress = (page: Page) => page.evaluate(() => localStorage.getItem('blunder-club-v1'));
async function openSave(page: Page) {
  await menu(page).click();
  await page.getByRole('dialog', { name: 'Game menu', exact: true }).getByRole('button', { name: 'Save game', exact: true }).click();
  await expect(saveDialog(page)).toBeVisible();
}

async function loginTestAccount(page: Page, subject: string) {
  await page.evaluate(async sub => {
    const { cloudServices } = await import('/src/firebase-client.ts');
    const { GoogleAuthProvider, signInWithCredential } = await import('/node_modules/.vite/deps/firebase_auth.js');
    const services = cloudServices();
    if (!services?.auth.emulatorConfig || services.auth.app.options.projectId !== 'demo-nextmove') throw new Error('Use the local demo emulators.');
    const now = Math.floor(Date.now() / 1000);
    const jwt = [btoa(JSON.stringify({ alg: 'none', typ: 'JWT' })), btoa(JSON.stringify({ sub, name: 'Test player',
      email: `${sub}@example.invalid`, iss: 'https://accounts.google.com', aud: 'demo-key', iat: now, exp: now + 3600 })), '']
      .map(part => part.replace(/=+$/, '')).join('.');
    await signInWithCredential(services.auth, GoogleAuthProvider.credential(jwt));
  }, subject);
  await expect(page.getByRole('button', { name: 'Your account and saved progress' })).toBeVisible();
  await expect(menu(page)).toBeEnabled();
}

test('saves actual moves from a warning and keeps the guest game through reload and replay', async ({ page }) => {
  await page.goto('/#/play?moves=e4,e5,Qh5,Nc6&candidate=Qxe5%2B&stage=2');
  await expect(page.getByText('Move not played', { exact: true })).toBeVisible();
  const original = await storedProgress(page);
  await openSave(page);
  await expect(saveDialog(page).getByText('4 half-moves · In progress', { exact: true })).toBeVisible();
  await saveDialog(page).getByRole('checkbox', { name: 'Add to favorites' }).check();
  await saveButton(page).click();
  await expect(saveDialog(page).getByRole('status')).toHaveText('Game saved on this device.');
  expect(await storedProgress(page)).toBe(original);
  await page.keyboard.press('Escape');
  await expect(saveDialog(page)).toHaveCount(0);
  await expect(menu(page)).toBeFocused();
  await expect(page.getByText('Move not played', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Move not played', { exact: true })).toBeVisible();
  await menu(page).click();
  await page.getByRole('button', { name: 'My games · Paste a PGN', exact: true }).click();
  await expect(page.locator('.library-game-row')).toHaveCount(1);
  await page.getByRole('link', { name: 'Open finish', exact: true }).click();
  await expect(page.getByLabel('Selected move')).toHaveValue('4');
  await expect(page.getByText('Nc6', { exact: true }).last()).toBeVisible();
  await page.getByRole('link', { name: 'Back to game', exact: true }).click();
  await expect(page.getByText('Move not played', { exact: true })).toBeVisible();
});

test('saves the full game while the board shows a turning point', async ({ page }) => {
  await page.goto('/#/play?moves=e4,e5,Qh5,Nc6,Qxe5%2B,Nxe5,Nf3,Nxf3%2B&review=4&stage=2');
  await expect(page.getByText('Your second chance', { exact: true })).toBeVisible();
  await openSave(page);
  await expect(saveDialog(page).getByText('8 half-moves · In progress', { exact: true })).toBeVisible();
  await saveButton(page).click();
  await saveDialog(page).getByRole('button', { name: 'View my games' }).click();
  await page.getByRole('link', { name: 'Open finish', exact: true }).click();
  await expect(page.getByLabel('Selected move')).toHaveValue('8');
  await expect(page.getByText('Nxf3+ · Check', { exact: true })).toBeVisible();
});

test('offers a save at game completion with usable keyboard controls at each viewport', async ({ page }) => {
  const fen = '7k/5Q2/6K1/8/8/8/8/8 w - - 0 1';
  await page.goto('/#/position?mode=play&fen=' + encodeURIComponent(fen));
  await expect(page.locator('.hint-actions .secondary-button')).toBeVisible();
  await page.getByRole('button', { name: /^f7, white queen/ }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: /^g7, empty/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Game complete', { exact: true })).toBeVisible();
  const completionSave = page.getByRole('button', { name: 'Save game', exact: true });
  for (const [label, width, height] of [['desktop', 1440, 900], ['phone', 320, 568], ['landscape', 844, 390]] as const) {
    await page.setViewportSize({ width, height });
    await expect.poll(() => page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollHeight <= innerHeight + 1 && root.scrollWidth <= innerWidth + 1 &&
        ['.board-wrap', '.board-toolbar', '.coach-dock'].every(selector => {
          const bounds = document.querySelector(selector)!.getBoundingClientRect();
          return bounds.top >= 0 && bounds.left >= 0 && bounds.bottom <= innerHeight + 1 && bounds.right <= innerWidth + 1;
        });
    })).toBe(true);
    await completionSave.focus();
    await page.keyboard.press('Enter');
    await expect(saveDialog(page).getByText('1 half-move · White won', { exact: true })).toBeVisible();
    await expect(saveButton(page)).toBeEnabled();
    const bounds = await saveDialog(page).boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height);
    expect(await saveDialog(page).evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(bounds!.width);
    if (process.env.CAPTURE_UI) {
      mkdirSync('.impeccable/review', { recursive: true });
      await page.screenshot({ path: `.impeccable/review/${label}-save-game.png` });
    }
    await page.keyboard.press('Escape');
    await expect(completionSave).toBeFocused();
  }
  await completionSave.click();
  await saveButton(page).click();
  await saveDialog(page).getByRole('button', { name: 'View my games', exact: true }).click();
  await page.getByRole('link', { name: 'Open finish', exact: true }).click();
  await expect(page.getByText('Qg7# · Checkmate', { exact: true })).toBeVisible();
});

test('hides the action for an empty board, lessons, and practice attempts', async ({ page }) => {
  for (const route of ['#/play', '#/learn/italian?moves=e4,e5', '#/position?fen=' + encodeURIComponent('7k/5Q2/6K1/8/8/8/8/8 w - - 0 1')]) {
    await page.goto('/' + route);
    await menu(page).click();
    await expect(page.getByRole('dialog', { name: 'Game menu' }).getByRole('button', { name: 'Save game', exact: true })).toHaveCount(0);
  }
});

test('reports a failed device save and leaves the game available', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.transaction.db.name === 'nextmove-library-v1') {
        throw new DOMException('Device storage is full', 'QuotaExceededError');
      }
      return put.apply(this, args);
    };
  });
  await page.goto('/#/play?moves=e4,e5');
  await expect(page.locator('.hint-actions .secondary-button')).toBeVisible();
  const original = await storedProgress(page);
  await openSave(page);
  await saveButton(page).click();
  await expect(saveDialog(page).getByRole('alert')).toContainText('Device storage is full');
  await expect(saveDialog(page).getByRole('status')).toHaveCount(0);
  await expect(saveButton(page)).toBeEnabled();
  expect(await storedProgress(page)).toBe(original);
  expect(errors).toEqual([]);
});

test('keeps a synced save in its account and drops an unfinished save request on account switch', async ({ page }) => {
  const alice = `save-alice-${crypto.randomUUID()}`;
  const bob = `save-bob-${crypto.randomUUID()}`;
  await page.goto('/#/play');
  await loginTestAccount(page, alice);
  await page.goto('/#/play?moves=e4,e5');
  await expect(page.locator('.hint-actions .secondary-button')).toBeVisible();
  await openSave(page);
  await saveButton(page).click();
  await expect(saveDialog(page).getByRole('status')).toHaveText('Game saved to your account.');
  await page.keyboard.press('Escape');
  await page.goto('/#/play?moves=d4,d5');
  await expect(page.locator('.hint-actions .secondary-button')).toBeVisible();
  await openSave(page);
  await page.evaluate(() => {
    const digest = crypto.subtle.digest.bind(crypto.subtle);
    crypto.subtle.digest = (...args) => {
      crypto.subtle.digest = digest;
      return new Promise(resolve => {
        (window as typeof window & { finishGameDigest?: () => void }).finishGameDigest = () => { void digest(...args).then(resolve); };
      });
    };
  });
  await saveButton(page).click();
  await expect(saveDialog(page).getByRole('button', { name: 'Saving…' })).toBeDisabled();
  await loginTestAccount(page, bob);
  await expect(saveDialog(page)).toHaveCount(0);
  await page.evaluate(() => (window as typeof window & { finishGameDigest?: () => void }).finishGameDigest?.());
  await page.goto('/#/games');
  await expect(page.getByText('Games saved to your account', { exact: true })).toBeVisible();
  await expect(page.locator('.library-game-row')).toHaveCount(0);
  await page.getByRole('link', { name: 'Back to game', exact: true }).click();
  await loginTestAccount(page, alice);
  await page.goto('/#/games');
  await expect(page.getByText('Games saved to your account', { exact: true })).toBeVisible();
  await expect(page.locator('.library-game-row')).toHaveCount(1);
  await page.getByRole('link', { name: 'Open finish', exact: true }).click();
  await expect(page.getByText('e5', { exact: true }).last()).toBeVisible();
});
