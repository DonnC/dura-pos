// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await b.newPage({viewport:{width:390,height:844}});p.setDefaultTimeout(10000);
  const url=pathToFileURL(path.join(__dirname,'-cdx-counter.html')).href;
  const act=a=>p.locator(`[data-action="${a}"]:visible`).first().click();
  await p.goto(url+'?fresh=1&reports=sample&screen=reports');
  const before=await p.evaluate(()=>({cash:s.cash,sales:s.sales,count:s.saleCount,stock:s.products.map(p=>p.stock),pending:s.pending}));
  await p.locator('#report-place').selectOption('all');
  assert.match(await p.locator('#report-net').innerText(),/USD 104.50/);
  assert.match(await p.locator('#report-coverage-summary').innerText(),/Incomplete/);
  await act('report-coverage');assert.match(await p.locator('#screen').innerText(),/Market stall/);
  await act('reports');await p.locator('#report-period').selectOption('yesterday');
  assert.match(await p.locator('#report-net').innerText(),/USD 220.00/);
  assert.match(await p.locator('#report-profit').innerText(),/USD 83.00/);
  await p.setViewportSize({width:1024,height:768});await p.evaluate(()=>document.fonts.ready);
  await p.screenshot({path:path.join(__dirname,'-cdx-tablet-report-yesterday.png')});
  await p.setViewportSize({width:390,height:844});
  await act('report-sales');
  assert.match(await p.locator('#screen').innerText(),/USD 235.00/);
  assert.match(await p.locator('#screen').innerText(),/USD 15.00/);
  await act('reports');await p.locator('#report-period').selectOption('today');
  await p.locator('#report-place').selectOption('market');
  assert.match(await p.locator('#report-net').innerText(),/Not available/);
  await p.locator('#report-place').selectOption('all');await p.locator('#report-period').selectOption('custom');
  await p.locator('#report-start').fill('2026-11-10');await p.locator('#report-end').fill('2026-11-09');
  assert.match(await p.locator('#report-filter-error').innerText(),/End date/);
  assert.equal(await p.locator('#report-net').count(),0,'Invalid dates must clear previous totals');
  await p.locator('#report-start').fill('2026-11-09');
  assert.match(await p.locator('#report-net').innerText(),/USD 220.00/);
  await p.locator('#report-end').fill('2026-11-11');
  assert.match(await p.locator('#report-filter-error').innerText(),/Choose dates up to/);
  await p.locator('#report-end').fill('2026-11-09');await p.locator('#report-start').fill('2026-10-01');
  assert.match(await p.locator('#report-filter-error').innerText(),/31 days/);
  await p.locator('#report-start').fill('2026-11-09');
  await p.setViewportSize({width:1024,height:768});
  assert.equal(await p.locator('#report-start').inputValue(),'2026-11-09');
  await p.goto(url+'?reports=sample&screen=reports');
  assert.equal(await p.locator('#report-period').inputValue(),'custom');
  assert.equal(await p.locator('#report-place').inputValue(),'all');
  await act('report-cash');
  assert.match(await p.locator('#screen').innerText(),/Latest drawer snapshots/);
  assert.match(await p.locator('#screen').innerText(),/USD 70.50/);
  assert.match(await p.locator('#screen').innerText(),/ZWG 135.00/);
  assert.doesNotMatch(await p.locator('#screen').innerText(),/205.50/,'Currencies must not be added');
  await act('reports');await p.locator('#report-period').selectOption('today');await act('report-coverage');
  await act('report-refresh');await act('close');
  assert.match(await p.locator('#screen').innerText(),/older figures/);
  assert.deepEqual(await p.evaluate(()=>({cash:s.cash,sales:s.sales,count:s.saleCount,stock:s.products.map(p=>p.stock),pending:s.pending})),before,
    'Reporting must not mutate financial or stock state');
  await act('reports');await p.locator('#report-period').selectOption('week');
  assert.match(await p.locator('#report-net').innerText(),/USD 324.50/);
  await p.goto(url+'?fresh=1&screen=reports');
  await p.evaluate(()=>{s.sales=0;s.saleCount=0;render();});
  assert.match(await p.locator('#report-net').innerText(),/USD 0.00/);
  assert.doesNotMatch(await p.locator('#report-body').innerText(),/No figures loaded/);
  await p.locator('#report-period').selectOption('yesterday');
  assert.match(await p.locator('#report-body').innerText(),/No figures loaded/);
  await act('report-reset');assert.match(await p.locator('#report-net').innerText(),/USD 0.00/);
  await p.goto(url+'?fresh=1&seed=1&reports=sample&screen=reports&state=empty');
  assert.equal(await p.evaluate(()=>count()),3,'An empty report must not clear the basket');
  await p.goto(url+'?fresh=1&reports=sample&screen=reports&state=error');
  await act('report-retry');assert(await p.locator('#report-net').count());
  await p.goto(url+'?fresh=1&role=worker&screen=report-cash');
  assert.match(await p.locator('h1').innerText(),/Owner access/);
  if(process.argv.includes('--interactions-only')){
    console.log('PASS: period/place math, missing versus zero, custom dates, retained filters, currencies and access.');return;
  }
  const errors=[];p.on('pageerror',e=>errors.push(e.message));let layouts=0;
  for(const [width,height] of [[320,740],[390,844],[768,1024],[1024,768]]){
   await p.setViewportSize({width,height});
   for(const mode of ['','&theme=dark','&text=large']){
    for(const scene of ['reports','report-sales','report-cash','report-coverage']){
     await p.goto(`${url}?fresh=1&reports=sample&screen=${scene}${mode}`);
     assert(await p.locator('h1').count());
     assert(!(await p.evaluate(()=>[...document.querySelectorAll('main,#dock,.app')]
       .some(el=>el.scrollWidth>el.clientWidth+1))),`${width} ${scene} ${mode}: overflow`);
     assert(!(await p.evaluate(()=>[...document.querySelectorAll('input,select')]
       .some(el=>!el.labels?.length&&!el.getAttribute('aria-label')))),'Unlabelled input');
     const dock=await p.locator('#dock').boundingBox();
     assert(!dock||dock.y+dock.height<=height+1,'Unreachable action');layouts++;
    }
   }
  }
  for(const [device,width,height] of [['phone',390,844],['tablet',1024,768]]){
   await p.setViewportSize({width,height});
   for(const scene of ['reports','report-sales','report-cash','report-coverage']){
    await p.goto(`${url}?fresh=1&reports=sample&screen=${scene}`);
    await p.evaluate(()=>document.fonts.ready);
    await p.screenshot({path:path.join(__dirname,`-cdx-${device}-${scene}.png`)});
   }
  }
  await p.goto(pathToFileURL(path.join(__dirname,'-cdx-preview.html')).href+'?journey=reports&device=landscape');
  const frame=p.frameLocator('#primary');await frame.locator('#report-place').waitFor();
  assert.equal(await frame.locator('body').evaluate(()=>innerWidth),1024);
  assert.deepEqual(errors,[]);
  console.log(`PASS: period/place math, coverage, missing versus zero, dates, retained filters and currencies; ${layouts} layouts and nine captures.`);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
