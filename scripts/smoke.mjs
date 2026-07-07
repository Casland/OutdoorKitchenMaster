import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';

const fileUrl = pathToFileURL(new URL('../dist/index.html', import.meta.url).pathname.slice(1)).href;
const browser = await chromium.launch();
const results = [];
const check = (name, ok, extra='') => { results.push(`${ok?'PASS':'FAIL'} ${name}${extra?' — '+extra:''}`); };

// ---- mobile viewport, file:// protocol ----
const ctx = await browser.newContext({ viewport: { width: 375, height: 720 }, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(fileUrl);
await page.waitForTimeout(400);

// dashboard
check('dashboard renders', await page.locator('.dashboard').count() === 1);
check('4 open-decision cards', await page.locator('.od-card').count() === 4);
check('flags panel present', await page.locator('.flags-card .flag').count() === 4, String(await page.locator('.flags-card .flag').count()));
check('pipeline has 10 phases', await page.locator('.pipeline-row').count() === 10);
check('locked table rows', await page.locator('.locked-table tbody tr').count() === 23);
const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
check('no horizontal scroll on dashboard', !hScroll);

// phase -1 via nav
await page.goto(fileUrl + '#/phase/-1');
await page.waitForTimeout(300);
check('phase -1 renders', (await page.locator('.phase-page h1').textContent())?.includes('Plumbing Rough-In'));
check('phase -1 has diagram inline', await page.locator('.phase-page .diagram svg').count() >= 1);
check('phase -1 work checklist items', await page.locator('#phase--1-intro .checklist:not(.buy-list) .check-row').count() === 7, String(await page.locator('#phase--1-intro .checklist:not(.buy-list) .check-row').count()));
check('phase -1 buy list has 14 lines', await page.locator('.buy-list .check-row').count() === 14, String(await page.locator('.buy-list .check-row').count()));
check('phase -1 preflight videos', await page.locator('[data-video]').count() >= 2);

// checkbox toggle + persistence (a real work item, not a buy line)
await page.evaluate(() => { document.getElementById('phase--1-intro').open = true; });
const firstBox = page.locator('#phase--1-intro .checklist:not(.buy-list) .check-hit').first();
const bb = await firstBox.boundingBox();
check('tap target >= 48px', bb.width >= 44 && bb.height >= 44, `${Math.round(bb.width)}x${Math.round(bb.height)}`);
await firstBox.click();
await page.waitForTimeout(200);
check('row marked done', await page.locator('.check-row.done').count() === 1);
await page.reload(); await page.waitForTimeout(400);
check('persists after reload', await page.locator('.check-row.done').count() === 1);
const pctText = await page.locator('[data-progress-phase] .progress-label').textContent();
check('progress label updates', pctText.includes('1/'), pctText.trim());

// phase 1: runner structure — tracker on top, stations, gate arming
await page.goto(fileUrl + '#/phase/1'); await page.waitForTimeout(300);
check('phase 1 gate station present', await page.locator('details.station-gate').count() === 1);
check('phase 1 open-decision banner', await page.locator('.open-banner').count() === 1);
check('phase 1 stations', await page.locator('details.station').count() === 9, String(await page.locator('details.station').count()));
check('tracker dots on top', await page.locator('.run-top .dot').count() === 9);
check('progress rail under dots', await page.locator('.run-top .run-track [data-progress-phase]').count() === 1);
const trackerBox = await page.locator('.run-top').boundingBox();
const stationsBox = await page.locator('.run-stations').boundingBox();
check('tracker above stations', trackerBox.y < stationsBox.y);
check('step videos attached (1.1 has 2)', await page.locator('#step-11-cut-the-studs [data-video]').count() === 2);
const gateNext = page.locator('[data-gate-arm]');
check('gate Next disabled until confirmed', await gateNext.getAttribute('disabled') !== null);
const hScroll1 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
check('no horizontal scroll on phase 1', !hScroll1);

// header toggle: open a collapsed station, then tap header again to close it
const st12 = page.locator('#step-12-assemble-wall-panels-flat-tilt-up');
await st12.locator('summary').click(); await page.waitForTimeout(150);
check('header tap expands', await st12.getAttribute('open') !== null);
check('expanding pins current', (await st12.getAttribute('class'))?.includes('current'));
await st12.locator('summary').click(); await page.waitForTimeout(150);
check('header tap again collapses', await st12.getAttribute('open') === null);

// Next advances: open PF, click Start work → 1.1 becomes current+open
await page.locator('[data-dot="preflight"]').click(); await page.waitForTimeout(300);
await page.locator('#preflight [data-run="next"]').click(); await page.waitForTimeout(400);
check('Next advances to 1.1', (await page.locator('#step-11-cut-the-studs').getAttribute('class'))?.includes('current') && (await page.locator('#step-11-cut-the-studs').getAttribute('open')) !== null);

// pin → dashboard resume chip
await page.goto(fileUrl + '#/'); await page.waitForTimeout(300);
check('dashboard resume chip', ((await page.locator('.dash-resume a').textContent()) ?? '').includes('Step 1.1'));

// anchor deep link
await page.goto(fileUrl + '#/phase/1@step-16-openings-and-blocking-do-now-or-regret-it-list');
await page.waitForTimeout(1500);
const anchorVisible = await page.evaluate(() => {
  const el = document.getElementById('step-16-openings-and-blocking-do-now-or-regret-it-list');
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.top > -50 && r.top < 300;
});
check('deep-link anchor scrolls', anchorVisible);

// lightbox (open the station holding the diagram first)
await page.goto(fileUrl + '#/phase/-1'); await page.waitForTimeout(300);
await page.locator('[data-dot="phase--1-intro"]').click(); await page.waitForTimeout(400);
await page.locator('.diagram').first().click();
await page.waitForTimeout(200);
check('lightbox opens with svg', await page.locator('#lightbox[open] svg').count() === 1);
await page.locator('[data-lb="close"]').click();

// decisions
await page.goto(fileUrl + '#/decisions'); await page.waitForTimeout(300);
check('25 decision cards', await page.locator('.decision').count() === 25);
check('decision D16 anchor exists', await page.locator('#D16').count() === 1);
await page.locator('[data-decision-filter="open"]').click(); await page.waitForTimeout(200);
const openCards = await page.locator('.decision').count();
check('open filter shows open + alsoOpen', openCards === 3, String(openCards)); // D11 + D07 + D13

// materials
await page.goto(fileUrl + '#/materials'); await page.waitForTimeout(300);
check('3 materials groups', await page.locator('.materials-table').count() === 3);
await page.locator('[data-materials-view="phase"]').click(); await page.waitForTimeout(300);
check('by-phase view renders', await page.locator('.phase-filter').count() === 1);

// search
await page.goto(fileUrl + '#/'); await page.waitForTimeout(200);
await page.locator('[data-open-search]').click();
await page.fill('#search input', 'weep');
await page.waitForTimeout(200);
const hits = await page.locator('.search-hits li').count();
check('search "weep" finds hits', hits >= 3, String(hits));

// journal + reference
await page.goto(fileUrl + '#/journal'); await page.waitForTimeout(200);
check('journal entry renders', await page.locator('.journal-entry').count() === 1);
await page.goto(fileUrl + '#/reference'); await page.waitForTimeout(300);
check('gallery has 8 diagrams', await page.locator('.gallery .diagram').count() === 8);

// print route
await page.goto(fileUrl + '#/print/phase/1'); await page.waitForTimeout(300);
check('print phase renders', await page.locator('.print-phase').count() === 1);
await page.goto(fileUrl + '#/print/shopping/1'); await page.waitForTimeout(300);
check('print shopping renders', await page.locator('.shopping-table').count() >= 1);

// safety language fidelity
await page.goto(fileUrl + '#/phase/0'); await page.waitForTimeout(300);
const p0text = await page.locator('.phase-page').textContent();
check('verbatim: kill circuits verify dead', p0text.includes('Kill both circuits at the panel. Verify dead.'));
await page.goto(fileUrl + '#/phase/8'); await page.waitForTimeout(300);
const p8text = await page.locator('.phase-page').textContent();
check('verbatim: soapy water leak test', p8text.includes('leak-test every fitting with soapy water'));

check('zero console errors', errors.length === 0, errors.slice(0,3).join(' | '));

console.log(results.join('\n'));
const fails = results.filter(r => r.startsWith('FAIL'));
console.log(`\n${results.length - fails.length}/${results.length} passed`);
await browser.close();
process.exit(fails.length ? 1 : 0);
