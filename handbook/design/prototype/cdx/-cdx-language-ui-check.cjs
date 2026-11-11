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
  const p=await b.newPage({viewport:{width:390,height:844}});
  const url=pathToFileURL(path.join(__dirname,'-cdx-counter.html')).href;
  await p.goto(url+'?fresh=1&role=worker&seed=1');
  assert.match(await p.locator('.identity').innerText(),/Cashier/);
  assert(!(await p.locator('#connection').isVisible()),'Healthy account header has no persistent status bar');
  assert(!/practice/i.test(await p.locator('.appbar').innerText()));
  await p.evaluate(()=>navigate('shop'));
  assert(!/practice shop/i.test(await p.locator('.hero').innerText()));
  assert.equal(await p.locator('[data-action="reports"]').count(),0);
  await p.evaluate(()=>navigate('reports'));assert.match(await p.locator('h1').innerText(),/Owner access/);
  const guarded=await p.evaluate(()=>[...ownerScreens]);
  for(const route of guarded){
   await p.evaluate(route=>navigate(route),route);assert.match(await p.locator('h1').innerText(),/Owner access/,route);
   assert.equal(await p.evaluate(()=>count()),3,'Owner boundary preserves cashier basket');
  }
  await p.goto(url+'?fresh=1&appearance=practice');
  assert.equal(await p.locator('#mode-marker').innerText(),'Practice');
  await p.evaluate(()=>{save();history.replaceState(null,'',location.pathname);});await p.reload();
  assert.equal(await p.locator('#mode-marker').innerText(),'Practice','Mode reminder is selected once');
  await p.goto(url+'?fresh=1&offline=1');assert(await p.locator('#connection').isVisible());
  const scenes=['sell','shop','stock','cashup','people','staff','reports','report-sales','report-trend','sync','restore','fiscal'];
  for(const role of ['owner','worker'])for(const scene of scenes){
   await p.goto(`${url}?fresh=1&seed=1&role=${role}&screen=${scene}&reports=sample&access=sample`);
   const text=await p.locator('body').innerText();
   assert(!/\b(seller|staff|phones?|inventory)\b/i.test(text),`${role} ${scene}: old vocabulary`);
  }
  for(const [device,width,height] of [['phone',390,844],['tablet',1024,768]]){
   await p.setViewportSize({width,height});
   for(const role of ['owner','worker']){
    await p.goto(`${url}?fresh=1&seed=1&role=${role}&screen=shop`);await p.evaluate(()=>document.fonts.ready);
    await p.screenshot({path:path.join(__dirname,`-cdx-${device}-${role==='owner'?'owner':'cashier'}-shop.png`)});
   }
  }
  console.log('PASS: canonical role, compact account header and owner/cashier boundaries.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
