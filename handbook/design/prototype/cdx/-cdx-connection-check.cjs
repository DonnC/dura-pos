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
  await p.goto(url+'?fresh=1&seed=1&screen=connect');
  await p.evaluate(()=>{s.pending=[{ref:'T-PAY-0001',basket:{bread:1},amount:100}];});
  const before=await p.evaluate(()=>({cash:s.cash,sales:s.sales,basket:s.basket,role:s.role,name:s.name,history:s.history,pending:s.pending,shop:s.shop,currency:s.currency,products:s.products,held:s.held}));
  await act('connection-account');await act('connection-example-account');
  await act('connection-preview-check');
  assert.match(await p.locator('h1').innerText(),/Example connection ready/);
  assert.match(await p.locator('#connection').innerText(),/Saved on this device/);
  assert(!(await p.locator('#connection').isVisible()));
  await act('pair');await p.locator('#pair-phone-name').fill('Counter spare');await act('pair-show-code');
  await act('pair-preview-scan');await p.locator('#join-confirm-shop').check();await act('join-preview-save');
  assert.match(await p.locator('h1').innerText(),/Example device joined/);
  await p.evaluate(()=>navigate('pair-code'));
  assert.match(await p.locator('#screen').innerText(),/already used/);
  await p.evaluate(()=>navigate('restore'));await act('restore-check');
  await p.locator('#restore-understand').check();await act('restore-preview-save');
  assert.match(await p.locator('h1').innerText(),/Example recovery ready/);
  await act('lost-phone');await act('lost-phone-preview');
  assert.match(await p.locator('#screen').innerText(),/Not contacted/);
  assert.deepEqual(await p.evaluate(()=>({cash:s.cash,sales:s.sales,basket:s.basket,role:s.role,name:s.name,history:s.history,pending:s.pending,shop:s.shop,currency:s.currency,products:s.products,held:s.held})),before);
  for(const state of ['wrong-shop','wrong-mode','wrong-currency','newer','damaged','gap']){
   await p.goto(`${url}?fresh=1&recovery=${state}&screen=restore-review`);
   assert(await p.locator('#restore-understand').isDisabled(),state+' backup must stay blocked');
   assert(await p.locator('[data-action="restore-preview-save"]').isDisabled());
  }
  await act('restore');await p.locator('#restore-source').selectOption('archive');await act('restore-check');
  assert(!(await p.locator('#restore-understand').isDisabled()),'Separate compatible archive example');
  await p.goto(url+'?fresh=1&recovery=ready&screen=restore');
  await p.locator('#restore-backup').selectOption('previous');await act('restore-check');
  assert.match(await p.locator('#screen').innerText(),/newer journal records/);
  await p.goto(url+'?fresh=1&recovery=expired&screen=pair-code');
  await act('pair-show-code');await act('pair-preview-scan');
  assert(!(await p.locator('#join-confirm-shop').isDisabled()));
  for(const state of ['wrong-shop','wrong-mode','wrong-currency']){
   await p.goto(`${url}?fresh=1&recovery=${state}&screen=join-review`);
   assert(await p.locator('#join-confirm-shop').isDisabled());
  }
  await p.goto(url+'?fresh=1&recovery=offline&screen=join-review');
  assert(await p.locator('#join-confirm-shop').isDisabled());
  await p.goto(url+'?fresh=1&recovery=offline&screen=connect');await act('sell');await act('add');
  await act('pay');await p.locator('#received').fill('1.00');
  assert(!(await p.locator('[data-action="complete"]').isDisabled()));
  await p.goto(url+'?fresh=1&recovery=unknown&screen=connection-status');
  await act('connection-preview-existing');assert.match(await p.locator('h1').innerText(),/Example connection ready/);
  await p.goto(url+'?fresh=1&recovery=denied&screen=connection-status');
  await act('connection-account');await act('connection-example-account');await act('connection-preview-check');
  assert.match(await p.locator('h1').innerText(),/Example connection ready/);
  await p.goto(url+'?fresh=1&recovery=offline&screen=restore-review');
  assert(await p.locator('#restore-understand').isDisabled());
  await act('restore');await p.locator('#restore-source').selectOption('archive');await act('restore-check');
  assert(!(await p.locator('#restore-understand').isDisabled()));
  await p.goto(url+'?fresh=1&role=worker&screen=restore-review');
  assert.match(await p.locator('h1').innerText(),/Owner access/);
  if(process.argv.includes('--interactions-only')){
   console.log('PASS: connection/pair/restore, expired/wrong/offline guards, preserved work and owner boundaries.');return;
  }
  const errors=[];p.on('pageerror',e=>errors.push(e.message));let layouts=0;
  const scenes=[['connect','owner'],['connection-review','owner'],['connection-status','owner'],
   ['pair','owner'],['pair-code','owner'],['join','worker'],['join-review','worker'],['join-status','worker'],
   ['restore','owner'],['restore-review','owner'],['restore-status','owner'],['lost-phone','owner']];
  for(const [width,height] of [[320,740],[390,844],[768,1024],[1024,768]]){
   await p.setViewportSize({width,height});
   for(const mode of ['','&theme=dark','&text=large']){
    for(const [scene,role] of scenes){
     await p.goto(`${url}?fresh=1&seed=1&recovery=ready&screen=${scene}&role=${role}${mode}`);
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
   for(const scene of ['connection-review','connection-status','pair-code','join-review','restore-review','lost-phone']){
    await p.goto(`${url}?fresh=1&seed=1&recovery=ready&screen=${scene}`);
    await p.evaluate(()=>document.fonts.ready);
    await p.screenshot({path:path.join(__dirname,`-cdx-${device}-${scene}.png`)});
   }
  }
  await p.goto(pathToFileURL(path.join(__dirname,'-cdx-preview.html')).href+'?journey=recovery&device=landscape');
  const frame=p.frameLocator('#primary');await frame.locator('h1').filter({hasText:'Check the shop account'}).waitFor();
  assert.equal(await frame.locator('body').evaluate(()=>innerWidth),1024);
  assert.deepEqual(errors,[]);
  console.log(`PASS: connection, pairing, recovery guards, preserved work; ${layouts} layouts and twelve captures.`);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
