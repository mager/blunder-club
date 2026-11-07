import { mkdirSync, readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const route = (moves: string) => '/#/play?moves=' + encodeURIComponent(moves);
const label = (page: Page) => page.locator('.opening-label');
async function fits(page: Page) {
  await expect.poll(() => page.evaluate(() => {
    const root = document.documentElement;
    const selectors = ['.board-wrap', '.opening-label', '.board-toolbar, .replay-controls', '.coach-dock'];
    return root.scrollHeight <= innerHeight + 1 && root.scrollWidth <= innerWidth + 1 && selectors.every(selector => {
      const rect = document.querySelector(selector)!.getBoundingClientRect();
      return rect.top >= 0 && rect.left >= 0 && rect.bottom <= innerHeight + 1 && rect.right <= innerWidth + 1;
    });
  })).toBe(true);
}

test('opening name follows game, undo, hint, reload and reset at all sizes', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  mkdirSync('.impeccable/review', { recursive: true });
  await page.goto(route('d4,a5,e4,Nc6'));
  await expect(label(page)).toContainText('Ware Defense');
  await expect(page.getByRole('button', {name:'Show hint',exact:true})).toBeEnabled();
  for (const [name, width, height] of [['desktop',1440,900],['phone',320,568],['landscape',844,390]] as const) {
    await page.setViewportSize({width,height});
    await fits(page);
    await page.screenshot({path:`.impeccable/review/opening-${name}.png`});
  }
  await page.reload();
  await expect(label(page)).toContainText('Ware Defense');
  await page.getByRole('button', {name:'Take back your last turn'}).click();
  await expect(label(page)).toContainText("Queen's Pawn Game");
  await page.getByRole('button', {name:'Show hint',exact:true}).click();
  await expect(page.locator('.hint-arrow')).toHaveCount(1);
  await expect(label(page)).toContainText("Queen's Pawn Game");
  await fits(page);
  await page.getByRole('button', {name:'New game',exact:true}).click();
  await page.getByRole('dialog').getByRole('button', {name:'New game Start from the full board.',exact:true}).click();
  await expect(label(page)).toContainText('Play the first move');
  expect(errors).toEqual([]);
});

test('keyboard lesson play updates the opening; replay follows selected history', async ({ page }) => {
  await page.goto('/#/learn/italian');
  await expect(label(page)).toContainText('Play the first move');
  await page.getByRole('button',{name:/^e2, white pawn/}).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button',{name:/^e4, empty/}).focus();
  await page.keyboard.press('Enter');
  await expect(label(page)).toContainText("King's Pawn Game");
  await page.goto('/#/games');
  await page.getByRole('button',{name:'Paste a game',exact:true}).click();
  await page.getByLabel('PGN',{exact:true}).fill('[Opening "Wrong imported name"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 *');
  await page.getByRole('button',{name:'Check game',exact:true}).click();
  await page.getByRole('radio',{name:'White',exact:true}).check();
  await page.getByRole('button',{name:'Save game',exact:true}).click();
  await page.getByRole('link',{name:'Open finish',exact:true}).click();
  await expect(label(page)).toContainText('Italian Game');
  for (const [width,height] of [[320,568],[844,390],[1440,900]]) {
    await page.setViewportSize({width,height}); await fits(page);
  }
  await page.getByRole('toolbar',{name:'Replay moves'}).focus();
  await page.keyboard.press('Home');
  await expect(label(page)).toContainText('Play the first move');
  await page.keyboard.press('End');
  await expect(label(page)).toContainText('Italian Game');
  await page.reload();
  await expect(label(page)).toContainText('Italian Game');
});

test('opening data failure leaves the game usable', async ({page}) => {
  await page.route('**/opening-index*', route => route.abort());
  await page.goto('/#/play');
  await expect(label(page)).toContainText('Name unavailable');
  await expect(page.getByRole('button',{name:'Show hint',exact:true})).toBeEnabled();
});


test('long opening names and unknown practice positions fit small screens', async ({page}) => {
  const index = JSON.parse(readFileSync('src/data/opening-index.json', 'utf8')) as {names:string[];positions:Record<string,number>};
  const name = [...index.names].sort((a,b) => b.length - a.length)[0];
  const position = Object.entries(index.positions).find(([,id]) => index.names[id] === name)![0];
  await page.goto('/#/position?mode=play&fen=' + encodeURIComponent(position + ' 0 12'));
  await expect(label(page)).toContainText(name);
  await expect(page.getByRole('button', {name:'Show hint',exact:true})).toBeEnabled();
  for (const [view,width,height] of [['phone',320,568],['landscape',844,390]] as const) {
    await page.setViewportSize({width,height}); await fits(page);
    await page.screenshot({path:`.impeccable/review/opening-long-${view}.png`});
  }
  await page.goto('/#/position?fen=' + encodeURIComponent('7k/4P3/5K2/8/8/8/8/8 w - - 0 1'));
  await expect(label(page)).toContainText('Not identified');
  await fits(page);
});

test('rehearsal names only the moves in the selected stage', async ({page}) => {
  await page.goto(route('e4,e5,Nf3,Nc6,Bc4,Bc5') + '&review=4&stage=0');
  const replay = page.getByRole('button', {name:'Before',exact:true});
  await expect(replay).toBeVisible({timeout:30000});
  await expect(label(page)).not.toContainText('Italian Game');
  await page.getByRole('button', {name:'Bc4',exact:true}).click();
  await expect(label(page)).toContainText('Italian Game');
  await page.getByRole('button', {name:/Their reply/}).click();
  await expect(label(page)).toContainText('Italian Game');
  await replay.click();
  await expect(label(page)).not.toContainText('Italian Game');
  for (const [width,height] of [[320,568],[844,390]]) {
    await page.setViewportSize({width,height});
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(true);
  }
});
