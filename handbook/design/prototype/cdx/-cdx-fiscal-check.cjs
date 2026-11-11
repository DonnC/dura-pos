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
  await p.goto(url+'?fresh=1&seed=1&fiscal=unknown&screen=fiscal-queue');
  const before=await p.evaluate(()=>({cash:s.cash,sales:s.sales,basket:s.basket,history:s.history,
    pending:s.pending,products:s.products,active:s.active}));
  await act('fiscal-open');assert.match(await p.locator('h1').innerText(),/Result not confirmed/);
  const ref=await p.locator('#fiscal-reference').innerText();
  await act('fiscal-check');await p.locator('#fiscal-answer').selectOption('accepted');
  await act('fiscal-show-answer');assert.match(await p.locator('h1').innerText(),/Example accepted/);
  assert.equal(await p.locator('#fiscal-reference').innerText(),ref,'Status check keeps receipt identity');
  await p.evaluate(()=>navigate('fiscal-day'));await act('fiscal-close');
  assert.equal(await p.locator('[data-action="fiscal-request-close"]').count(),0,'Waiting receipts prevent close preview');
  assert.deepEqual(await p.evaluate(()=>({cash:s.cash,sales:s.sales,basket:s.basket,history:s.history,
    pending:s.pending,products:s.products,active:s.active})),before);
  await p.evaluate(()=>history.replaceState(null,'',location.pathname));await p.reload();
  await p.evaluate(()=>navigate('fiscal-receipt'));
  assert.match(await p.locator('h1').innerText(),/Example accepted/,'Interrupted preview keeps saved outcome');
  assert.equal(await p.locator('#fiscal-reference').innerText(),ref);
  await p.goto(url+'?fresh=1&fiscal=clear&screen=fiscal-close');
  await p.locator('#fiscal-close-confirm').check();await act('fiscal-request-close');
  assert.match(await p.locator('#screen').innerText(),/Waiting for confirmation/);
  assert.equal(await p.evaluate(()=>s.active),true,'Fiscal-day close does not cash up the till');
  await act('fiscal-close');await act('fiscal-day-answer');await act('fiscal-day-failed');
  assert.match(await p.locator('#screen').innerText(),/Close needs owner review/);
  await act('fiscal-close');await act('fiscal-day-answer');await act('fiscal-day-closed');
  assert.match(await p.locator('#screen').innerText(),/Example closed/);
  assert.equal(await p.evaluate(()=>s.active),true);
  for(const state of ['refused','flagged']){
   await p.goto(`${url}?fresh=1&fiscal=${state}&screen=fiscal-receipt`);
   await act('fiscal-owner-review');await act('fiscal-support');
   assert.match(await p.locator('dialog[open]').innerText(),/F-EX-0015/);
   await act('close');await p.evaluate(()=>navigate('fiscal-close'));
   assert.equal(await p.locator('[data-action="fiscal-request-close"]').count(),0);
  }
  await p.goto(url+'?fresh=1&fiscal=clear&screen=fiscal-day');
  await p.evaluate(()=>{fiscalDemo().firstStatus='flagged';navigate('fiscal-close');});
  assert.equal(await p.evaluate(()=>fiscalOutstanding().length),1,'Single finding alone blocks close');
  assert.equal(await p.locator('[data-action="fiscal-request-close"]').count(),0);
  await p.goto(url+'?fresh=1&fiscal=unknown&role=worker&screen=fiscal-queue');
  assert.equal(await p.locator('[data-action="fiscal-open"]').count(),2,'Worker sees own two examples');
  await p.evaluate(()=>{fiscalDemo().selected='F-EX-0016';navigate('fiscal-receipt');});
  assert.match(await p.locator('h1').innerText(),/Open your own receipt/);
  await p.evaluate(()=>navigate('fiscal-day'));
  assert.match(await p.locator('h1').innerText(),/Owner access/);
  await p.goto(url+'?fresh=1&screen=shop');
  assert.equal(await p.locator('[data-action="fiscal-queue"]').count(),0,'Optional status hidden by default');
  await p.evaluate(()=>navigate('fiscal-setup'));await act('fiscal-enable-preview');
  assert.equal(await p.evaluate(()=>fiscalDemo().enabled),true);
  if(process.argv.includes('--interactions-only')){
   console.log('PASS: fiscal identity, outcome/close guards, owner boundaries and preserved work.');return;
  }
  const errors=[];p.on('pageerror',e=>errors.push(e.message));let layouts=0;
  const scenes=[['fiscal','owner','unknown'],['fiscal-setup','owner','off'],
   ['fiscal-queue','worker','unknown'],['fiscal-receipt','worker','unknown'],
   ['fiscal-check','worker','unknown'],['fiscal-owner-review','owner','refused'],
   ['fiscal-day','owner','ending'],['fiscal-close','owner','clear'],['fiscal-device','owner','certificate']];
  for(const [width,height] of [[320,740],[390,844],[768,1024],[1024,768]]){
   await p.setViewportSize({width,height});
   for(const mode of ['','&theme=dark','&text=large']){
    for(const [scene,role,state] of scenes){
     await p.goto(`${url}?fresh=1&seed=1&fiscal=${state}&screen=${scene}&role=${role}${mode}`);
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
   for(const [scene,state] of [['fiscal-queue','unknown'],['fiscal-receipt','unknown'],
    ['fiscal-owner-review','refused'],['fiscal-day','ending'],['fiscal-close','closing'],['fiscal-device','certificate']]){
    await p.goto(`${url}?fresh=1&seed=1&fiscal=${state}&screen=${scene}`);
    await p.evaluate(()=>document.fonts.ready);
    await p.screenshot({path:path.join(__dirname,`-cdx-${device}-${scene}.png`)});
   }
  }
  await p.goto(pathToFileURL(path.join(__dirname,'-cdx-preview.html')).href+'?journey=fiscal&device=landscape');
  const frame=p.frameLocator('#primary');await frame.locator('h1').filter({hasText:'Fiscal receipt queue'}).waitFor();
  assert.equal(await frame.locator('body').evaluate(()=>innerWidth),1024);
  assert.deepEqual(errors,[]);
  console.log(`PASS: fiscal identity, close guards, owner boundaries, preserved work; ${layouts} layouts and twelve captures.`);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
