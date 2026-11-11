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
  await p.goto(url+'?fresh=1&reports=sample&screen=report-trend');
  await p.locator('#report-period').selectOption('last7');
  assert.equal(await p.locator('.owner-chart [role="img"]').count(),1);
  assert.equal(await p.evaluate(()=>ownerDailyReport(reportSelection()).length),7);
  const totals=await p.evaluate(()=>{
    const r=reportSelection(),items=ownerReportItems(r);return {net:r.net,itemNet:items.reduce((n,i)=>n+i.net,0),
      cashiers:ownerGroupedItems(r,'cashier').map(g=>g.label),profit:r.profit};
  });assert.equal(totals.net,totals.itemNet);assert.equal(totals.profit,null);
  assert.deepEqual(totals.cashiers.sort(),['Chipo','Rudo']);
  await p.locator('#report-period').selectOption('yesterday');
  assert.equal(await p.evaluate(()=>reportSelection().profit),5500);
  const scenes=['report-trend','report-products','report-cashiers','report-discounts'];
  for(const scene of scenes){
   await p.goto(`${url}?fresh=1&reports=sample&role=worker&screen=${scene}`);
   assert.match(await p.locator('h1').innerText(),/Owner access/);
  }
  let layouts=0;
  for(const [width,height] of [[320,740],[390,844],[768,1024],[1024,768]]){
   await p.setViewportSize({width,height});
   for(const mode of ['','&theme=dark','&text=large'])for(const scene of scenes){
    await p.goto(`${url}?fresh=1&reports=sample&screen=${scene}${mode}`);
    await p.locator('#report-period').selectOption('last7');
    assert(await p.locator('.owner-chart').count());
    assert(!(await p.evaluate(()=>[...document.querySelectorAll('main,#dock,.app')]
      .some(el=>el.scrollWidth>el.clientWidth+1))),`${scene} ${width} ${mode}`);layouts++;
   }
  }
  for(const [device,width,height] of [['phone',390,844],['tablet',1024,768]]){
   await p.setViewportSize({width,height});
   for(const scene of scenes){
    await p.goto(`${url}?fresh=1&reports=sample&screen=${scene}`);await p.locator('#report-period').selectOption('last7');
    await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:path.join(__dirname,`-cdx-${device}-${scene}-detail.png`)});
   }
  }
  console.log(`PASS: owner-only charts, daily/product/cashier reconciliation, unknown profit and ${layouts} responsive layouts.`);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
