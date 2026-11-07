import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const arrow = (page: Page) => page.locator('.hint-arrow');
const playHint = (page: Page) => page.locator('.hint-actions .secondary-button');
const progress = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('blunder-club-v1') || '{}'));
async function settings(page: Page) { await page.getByRole('button', {name:'Coach settings'}).click(); }
async function close(page: Page) { await page.getByRole('dialog').getByRole('button', {name:'Back to board'}).click(); }
async function fits(page: Page) {
  await expect.poll(() => page.evaluate(() => {
    const root=document.documentElement;
    return root.scrollHeight<=innerHeight+1 && root.scrollWidth<=innerWidth+1 && ['.board-wrap','.opening-label','.board-toolbar','.coach-dock'].every(selector=>{
      const r=document.querySelector(selector)!.getBoundingClientRect();return r.top>=0 && r.left>=0 && r.bottom<=innerHeight+1 && r.right<=innerWidth+1;
    });
  })).toBe(true);
}

test('automatic lesson hints persist help; opt-out and manual hints survive reload', async ({page}) => {
  await page.goto('/#/learn/italian');
  await expect(arrow(page)).toHaveCount(1);
  await expect(playHint(page)).toHaveText(/Play e4/);
  expect((await progress(page)).studyRun.helped).toBe(true);
  await page.getByRole('button',{name:'Hide hint',exact:true}).click();
  await expect(arrow(page)).toHaveCount(0);
  await page.getByRole('button',{name:/^e2, white pawn/}).click();
  await page.getByRole('button',{name:/^e4, empty/}).click();
  await expect(playHint(page)).toHaveText(/Play Nf3/);
  await settings(page);
  await page.getByRole('switch',{name:'Automatic hints'}).click();
  await expect(page.getByRole('switch',{name:'Automatic hints'})).not.toBeChecked();
  await close(page);
  await expect(arrow(page)).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button',{name:'Show hint',exact:true})).toBeVisible();
  expect((await progress(page)).autoHints).toBe(false);
  expect((await progress(page)).studyRun.helped).toBe(true);
  await page.getByRole('button',{name:'Show hint',exact:true}).click();
  await expect(playHint(page)).toHaveText(/Play Nf3/);
  await page.reload();
  await expect(playHint(page)).toHaveText(/Play Nf3/);
});

test('assisted completion and repeat without hints keep independent evidence honest', async ({page}) => {
  await page.goto('/#/learn/italian');
  for(let i=0;i<6;i++) await playHint(page).click();
  await expect(page.getByRole('heading',{name:'Now you see it.'})).toBeVisible();
  expect((await progress(page)).studyResults.italian.independent).toBe(0);
  await page.getByRole('button',{name:'Try without hints',exact:true}).click();
  await expect(arrow(page)).toHaveCount(0);
  expect((await progress(page)).studyRun.helped).toBe(false);
  await page.reload();
  await expect(page.getByRole('button',{name:'Show hint',exact:true})).toBeVisible();
  for(const [from,to] of [['e2','e4'],['g1','f3'],['f1','c4'],['e1','g1'],['d2','d3'],['b1','c3']]) {
    await page.getByRole('button',{name:new RegExp(`^${from}, white`)}).focus();await page.keyboard.press('Enter');
    await page.getByRole('button',{name:new RegExp(`^${to}, `)}).focus();await page.keyboard.press('Enter');
    await expect(arrow(page)).toHaveCount(0);
  }
  expect((await progress(page)).studyResults.italian.independent).toBe(1);
  await page.getByRole('button',{name:'Play from here',exact:true}).click();
  await expect(playHint(page)).toBeVisible();
  await expect(page).not.toHaveURL(/recall=1/);
});

test('pieces, automatic hints and settings fit desktop, phone and short landscape', async ({page}) => {
  mkdirSync('.impeccable/review',{recursive:true});
  await page.goto('/#/learn/italian');await expect(arrow(page)).toHaveCount(1);
  for(const [name,width,height] of [['desktop',1440,900],['phone',320,568],['landscape',844,390]] as const) {
    await page.setViewportSize({width,height});await fits(page);
    await page.screenshot({path:`.impeccable/review/pieces-hints-${name}.png`});
    await settings(page);await page.getByRole('switch',{name:'Automatic hints'}).scrollIntoViewIfNeeded();
    await expect(page.getByRole('switch',{name:'Automatic hints'})).toBeVisible();
    await page.screenshot({path:`.impeccable/review/hint-settings-${name}.png`});await close(page);
  }
});

test('live hints follow turns and obey after-game mode and saved opt-out', async ({page}) => {
  const errors: string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/#/play');await expect(playHint(page)).toBeVisible();
  for(const [width,height] of [[320,568],[844,390],[1440,900]]) {await page.setViewportSize({width,height});await fits(page);}
  await playHint(page).click();await expect(playHint(page)).toBeVisible();
  await expect.poll(async ()=>(await progress(page)).moves.length).toBe(2);
  await settings(page);await page.getByRole('button',{name:'After the game',exact:true}).click();await close(page);
  await expect(arrow(page)).toHaveCount(0);
  await page.reload();await expect(page.getByRole('button',{name:'Show hint',exact:true})).toBeVisible();
  await settings(page);await page.getByRole('button',{name:'Before a mistake',exact:true}).click();await close(page);
  await expect(playHint(page)).toBeVisible();
  await settings(page);await page.getByRole('switch',{name:'Automatic hints'}).click();await close(page);
  await page.reload();await expect(page.getByRole('button',{name:'Show hint',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Show hint',exact:true}).click();await expect(playHint(page)).toBeVisible();
  expect(errors).toEqual([]);
});

test('automatic promotion hint and check use the same clear pieces', async ({page}) => {
  await page.goto('/#/position?mode=play&fen='+encodeURIComponent('7k/4P3/5K2/8/8/8/8/8 w - - 0 1'));
  await expect(playHint(page)).toBeVisible();
  await page.getByRole('button',{name:/^e7, white pawn/}).click();await page.getByRole('button',{name:/^e8, empty/}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').locator('.chess-piece')).toHaveCount(4);
  await page.getByRole('button',{name:'Promote to queen'}).click();
  await expect.poll(async ()=>(await progress(page)).moves.length).toBeGreaterThan(0);
  await page.goto('/#/position?mode=play&fen='+encodeURIComponent('4r1k1/8/8/8/8/8/8/4K3 w - - 0 1'));
  await expect(playHint(page)).toBeVisible();
  await expect(page.getByRole('button',{name:/^e1, white king.*check/})).toBeVisible();
});


test('restored warning does not show a hint from the earlier position', async ({page}) => {
  await page.goto('/#/play?moves=e4,e5,Qh5,Nc6&candidate=Qxe5%2B&stage=1');
  await expect(page.getByText('Move not played',{exact:true})).toBeVisible();
  await expect(arrow(page)).toHaveCount(0);
});

test('several good game options preview without playing and retain the chosen move on reload', async ({page}) => {
  await page.goto('/#/play');
  const choices=page.getByRole('group',{name:'Moves to consider'}).getByRole('button');
  await expect.poll(()=>choices.count()).toBeGreaterThan(1);
  expect(await choices.count()).toBeLessThanOrEqual(3);
  const second=choices.nth(1);const san=await second.textContent();
  await second.focus();await page.keyboard.press('Enter');
  await expect(second).toHaveAttribute('aria-pressed','true');
  await expect(playHint(page)).toHaveText(`Play ${san}`);
  expect((await progress(page)).moves).toEqual([]);
  const selected=new URLSearchParams(page.url().split('?')[1]).get('hintMove');
  await page.reload();await expect(playHint(page)).toHaveText(`Play ${san}`);
  expect(new URLSearchParams(page.url().split('?')[1]).get('hintMove')).toBe(selected);
  for(const [name,width,height] of [['desktop',1440,900],['phone',320,568],['landscape',844,390]] as const) {
    await page.setViewportSize({width,height});await fits(page);
    await page.screenshot({path:`.impeccable/review/subtle-options-${name}.png`});
    for(const choice of await choices.all()) expect((await choice.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await playHint(page).click();
  await expect.poll(async ()=>(await progress(page)).moves[0]).toBe(san);
});

test('lesson alternatives use their own arrow, explanation, Play and assisted result', async ({page}) => {
  await page.goto('/#/practice/save-rook');
  const choices=page.getByRole('group',{name:'Moves to consider'}).getByRole('button');
  await expect(choices).toHaveCount(3);
  await page.getByRole('button',{name:'Preview Ra2',exact:true}).click();
  await expect(playHint(page)).toHaveText('Play Ra2');
  await expect(page.locator('#square-a1')).toHaveClass(/hinted/);
  await expect(page.locator('#square-a2')).toHaveClass(/hinted/);
  expect((await progress(page)).moves).toEqual([]);
  await page.reload();await expect(playHint(page)).toHaveText('Play Ra2');
  await page.getByRole('button',{name:'Why?',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Ra2 moves your rook from a1 to a2.');await close(page);
  for(const [width,height] of [[320,568],[844,390],[1440,900]]) {await page.setViewportSize({width,height});await fits(page);}
  await playHint(page).click();await expect(page.getByRole('heading',{name:'Now you see it.'})).toBeVisible();
  expect((await progress(page)).moves).toEqual(['Ra2']);
  expect((await progress(page)).studyResults['save-rook'].independent).toBe(0);
  await page.goto('/#/learn/italian');await expect(playHint(page)).toHaveText('Play e4');
  await expect(page.getByRole('group',{name:'Moves to consider'})).toHaveCount(0);
});
