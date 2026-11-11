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
  await p.goto(url+'?fresh=1&seed=1&access=sample&screen=staff');
  await p.evaluate(()=>{s.pending=[{ref:'T-PAY-0001',basket:{bread:1},amount:100}];});
  await p.locator('#staff-credit').uncheck();await p.locator('#staff-phone-2').uncheck();await act('save-staff');
  assert.match(await p.locator('h1').innerText(),/Check cashier access/);
  await act('access-save');
  assert.match(await p.locator('#screen').innerText(),/Waiting for Device 2/);
  await p.goto(url+'?screen=access-status');
  assert.match(await p.locator('#screen').innerText(),/Waiting for Device 2/);
  await act('staff');await act('access-remove');await act('access-confirm-remove');
  assert.match(await p.locator('h1').innerText(),/Removed on this device/);
  assert.match(await p.locator('#screen').innerText(),/Waiting for Device 2/,'Removed device remains a pending delivery target');
  assert.deepEqual(await p.evaluate(()=>({cash:s.cash,sales:s.sales,history:s.history.length})),
    {cash:7050,sales:8650,history:0});
  assert.equal(await p.evaluate(()=>count()),3);
  assert.equal(await p.evaluate(()=>s.pending.length),1,'Unconfirmed payment must be retained');
  await p.evaluate(()=>{s.role='worker';s.name='Rudo';navigate('sell');});
  assert.match(await p.locator('h1').innerText(),/Selling access removed/);
  assert.equal(await p.locator('[data-action="complete"]').count(),0);
  await p.goto(url+'?fresh=1&role=worker&seed=1&offline=1&access=sample&screen=pay');
  await p.locator('#received').fill('3.50');await act('complete');
  assert.equal(await p.evaluate(()=>s.cash),2400);
  await p.goto(url+'?fresh=1&role=worker&seed=1&access=expired&screen=sell');
  assert.match(await p.locator('h1').innerText(),/Owner check needed/);
  await act('access-recovery');await p.locator('#access-owner-pin').fill('123456');
  await act('access-authorise-shift');
  assert.match(await p.locator('h1').innerText(),/Open your till/);
  assert.equal(await p.evaluate(()=>s.role),'worker');
  await p.locator('#float-usd').fill('10.00');await act('open-shift');await act('money');await act('cashup');
  await p.locator('#counted-usd').fill('10.00');await act('review-count');
  await p.locator('#keep-float').fill('5.00');await act('close-shift');
  assert.equal(await p.evaluate(()=>currentAccessState()),'expired');
  await act('switch-person');await p.locator('#next-person').selectOption('worker');
  await p.locator('#next-pin').fill('123456');await act('start-person');
  assert.match(await p.locator('h1').innerText(),/Owner check needed/);
  await p.goto(url+'?fresh=1&role=worker&seed=1&access=removed&screen=sell');
  await act('access-recovery');await p.locator('#access-owner-pin').fill('111111');
  assert(await p.locator('[data-action="access-supervise"]').isDisabled());
  await p.locator('#access-owner-pin').fill('123456');await act('access-supervise');
  assert.equal(await p.evaluate(()=>s.role),'worker');
  await p.locator('#counted-usd').fill('20.50');await act('review-count');
  await p.locator('#keep-float').fill('5.00');await act('close-shift');await act('switch-person');
  assert.equal(await p.locator('#next-person').inputValue(),'owner');
  await p.locator('#next-pin').fill('123456');await act('start-person');
  assert.equal(await p.evaluate(()=>s.role),'owner');
  assert.equal(await p.evaluate(()=>staffAccess().people[0].enabled),false);
  assert.equal(await p.evaluate(()=>s.held.length),1,'Unfinished basket must be held, not deleted');
  await p.goto(url+'?fresh=1&role=worker&seed=1&features=1&kept=sample&access=sample&screen=pay');
  await p.evaluate(()=>{currentStaff().credit=false;currentStaff().kept=false;render();});
  assert.equal(await p.locator('[data-action="credit"]').count(),0);
  assert.equal(await p.locator('[data-action="kept-checkout"]').count(),0);
  await p.evaluate(()=>navigate('credit'));assert.match(await p.locator('h1').innerText(),/Ask the owner/);
  await p.goto(url+'?fresh=1&role=worker&access=sample&screen=access-remove');
  assert.match(await p.locator('h1').innerText(),/Owner access/);
  if(process.argv.includes('--interactions-only')){
    console.log('PASS: access changes, pending delivery, removal, offline grant expiry and supervised owner handover.');return;
  }
  const errors=[];p.on('pageerror',e=>errors.push(e.message));let layouts=0;
  const scenes=[['staff','owner','sample'],['access-review','owner','sample'],
    ['access-remove','owner','sample'],['access-status','owner','pending'],
    ['my-access','worker','sample'],['access-expired','worker','expired'],
    ['access-removed','worker','removed'],['access-recovery','worker','expired']];
  for(const [width,height] of [[320,740],[390,844],[768,1024],[1024,768]]){
   await p.setViewportSize({width,height});
   for(const mode of ['','&theme=dark','&text=large']){
    for(const [scene,role,state] of scenes){
     await p.goto(`${url}?fresh=1&seed=1&access=${state}&screen=${scene}&role=${role}${mode}`);
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
   for(const [scene,role,state] of scenes.filter(([scene])=>scene!=='access-review')){
    await p.goto(`${url}?fresh=1&seed=1&access=${state}&screen=${scene}&role=${role}`);
    await p.evaluate(()=>document.fonts.ready);
    await p.screenshot({path:path.join(__dirname,`-cdx-${device}-${scene}.png`)});
   }
  }
  await p.goto(pathToFileURL(path.join(__dirname,'-cdx-preview.html')).href+'?journey=access&device=landscape');
  const frame=p.frameLocator('#primary');await frame.locator('#staff-credit').waitFor();
  assert.equal(await frame.locator('body').evaluate(()=>innerWidth),1024);
  assert.deepEqual(errors,[]);
  console.log(`PASS: permissions, queued removal, offline shift/grant expiry, recovery/attribution; ${layouts} layouts and fourteen captures.`);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
