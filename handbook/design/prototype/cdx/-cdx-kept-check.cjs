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
  p.setDefaultTimeout(10000);
  const url=pathToFileURL(path.join(__dirname,'-cdx-counter.html')).href;
  const act=a=>p.locator(`[data-action="${a}"]:visible`).first().click();
  const receipt=async()=>{if(await p.evaluate(()=>page==='done')){
    assert(await p.locator('.receipt-paper').isVisible(),'Receipt preview opens directly after sale');
  }else await act('receipt');};
  await p.goto(url+'?fresh=1&seed=1&kept=sample&screen=pay');await act('kept-checkout');
  assert.match(await p.locator('h1').innerText(),/Use kept change/);
  await p.locator('#kept-use').fill('1.00');await p.locator('#kept-cash').fill('2.50');
  await p.setViewportSize({width:1024,height:768});
  assert.equal(await p.locator('#kept-use').inputValue(),'1.00');
  await p.goto(url+'?screen=kept-checkout');
  assert.equal(await p.locator('#kept-cash').inputValue(),'2.50');
  await act('kept-save-sale');
  assert.deepEqual(await p.evaluate(()=>({cash:s.cash,sales:s.sales,balance:s.kept.contacts[0].balance})),
    {cash:7300,sales:9000,balance:50});
  await receipt();assert.match(await p.locator('#screen').innerText(),/Kept change used/);
  await p.goto(url+'?fresh=1&kept=sample&role=worker&screen=kept-refund');
  await p.locator('#kept-refund-amount').fill('0.50');await act('kept-review-refund');
  assert(await p.locator('[data-action="kept-save-refund"]').isDisabled());
  await p.locator('#approval-pin').fill('123456');await act('kept-save-refund');
  assert.deepEqual(await p.evaluate(()=>({cash:s.cash,sales:s.sales,balance:s.kept.contacts[0].balance})),
    {cash:2000,sales:2550,balance:100});
  await p.evaluate(()=>actions['kept-save-refund']());
  assert.equal(await p.evaluate(()=>s.cash),2000,'Saved payout must not repeat');
  await p.goto(url+'?fresh=1&seed=1&kept=sample&screen=pay&cash=500');
  await act('kept-keep');await p.locator('#kept-customer').selectOption('kuda');
  await p.locator('#kept-consent').check();await act('kept-save-keep');
  assert.deepEqual(await p.evaluate(()=>({cash:s.cash,sales:s.sales,balance:s.kept.contacts[1].balance})),
    {cash:7550,sales:9000,balance:200});
  await p.goto(url+'?fresh=1&seed=1&kept=sample&screen=kept-checkout');
  await p.locator('#kept-use').fill('2.00');
  assert.match(await p.locator('#kept-error').innerText(),/Only USD 1.50/);
  assert(await p.locator('[data-action="kept-save-sale"]').isDisabled());
  await p.locator('#kept-use').fill('1.50');await p.locator('#kept-cash').fill('2.50');
  await act('kept-save-sale');
  assert.equal(await p.evaluate(()=>s.cash),7250);
  assert.equal(await p.evaluate(()=>s.last.change),50);
  await p.goto(url+'?fresh=1&kept=sample&screen=kept-checkout&seed=1');
  await p.evaluate(()=>{s.basket={bread:1};s.keptCheckout=null;render();});
  await act('kept-save-sale');
  assert.equal(await p.evaluate(()=>s.cash),7050);
  assert.equal(await p.evaluate(()=>s.kept.contacts[0].balance),50);
  await p.goto(url+'?fresh=1&kept=sample&screen=kept-refund');
  await p.evaluate(()=>{s.cash=25;});await p.locator('#kept-refund-amount').fill('0.50');
  assert.match(await p.locator('#kept-refund-error').innerText(),/Only USD 0.25/);
  await p.locator('#kept-refund-amount').fill('2.00');
  assert.match(await p.locator('#kept-refund-error').innerText(),/Only USD 1.50/);
  await p.goto(url+'?fresh=1&seed=1&kept=stale&screen=kept-checkout');
  assert(await p.locator('[data-action="kept-save-sale"]').isDisabled());
  await act('pay');await p.locator('#received').fill('3.50');
  assert(!(await p.locator('[data-action="complete"]').isDisabled()));
  await p.goto(url+'?fresh=1&seed=1&kept=sample&screen=kept-keep&cash=500');
  assert.match(await p.locator('#kept-keep-error').innerText(),/exceeds the practice limit/);
  await p.locator('#kept-customer').selectOption('kuda');await p.locator('#kept-consent').check();
  await p.locator('#kept-customer').selectOption('tariro');
  assert(!(await p.locator('#kept-consent').isChecked()));
  await act('kept-add-customer');await p.locator('#kept-new-name').fill('Nyasha');
  await act('kept-save-customer');assert.equal(await p.locator('#kept-customer').inputValue(),'kept2');
  assert(!(await p.locator('#kept-consent').isChecked()));
  await p.goto(url+'?fresh=1&kept=sample&screen=settings');
  await p.locator('#feature-kept').uncheck();
  assert(await p.locator('[data-action="save-settings"]').isDisabled());
  await p.goto(url+'?fresh=1&screen=kept-account');
  assert.match(await p.locator('h1').innerText(),/Kept change is off/);
  await p.goto(url+'?fresh=1&seed=1&kept=sample&screen=kept-checkout');
  await p.locator('#kept-use').fill('1.00');await act('pay');await act('sell');
  await act('sale-options');await p.locator('#sheet [data-action="hold"]').click();
  assert.equal(await p.evaluate(()=>s.keptCheckout),null,'Held basket must clear customer/payment draft');
  if(process.argv.includes('--interactions-only')){
   console.log('PASS: kept change interactions, reconciliation and held-basket draft isolation.');return;
  }
  const errors=[];p.on('pageerror',e=>errors.push(e.message));let layouts=0;
  for(const [width,height] of [[320,740],[390,844],[768,1024],[1024,768]]){
   await p.setViewportSize({width,height});
   for(const mode of ['','&theme=dark','&text=large']){
    for(const role of ['owner','worker']){
     for(const scene of ['kept-customers','kept-account','kept-checkout','kept-keep','kept-refund','kept-refund-review']){
      await p.goto(`${url}?fresh=1&seed=1&kept=sample&cash=500&screen=${scene}&role=${role}${mode}`);
      assert(await p.locator('h1').count());
      assert(!(await p.evaluate(()=>[...document.querySelectorAll('main,#dock,.app')]
        .some(el=>el.scrollWidth>el.clientWidth+1))),`${width} ${scene} ${mode}: overflow`);
      assert(!(await p.evaluate(()=>[...document.querySelectorAll('input,select')]
        .some(el=>!el.labels?.length&&!el.getAttribute('aria-label')))),'Unlabelled input');
      const dock=await p.locator('#dock').boundingBox();
      assert(!dock||dock.y+dock.height<=height+1,'Dock below viewport');layouts++;
     }
    }
   }
  }
  for(const [device,width,height] of [['phone',390,844],['tablet',1024,768]]){
   await p.setViewportSize({width,height});
   for(const scene of ['account','checkout','keep','refund','refund-review']){
    await p.goto(`${url}?fresh=1&seed=1&kept=sample&cash=500&screen=kept-${scene}`);
    if(scene==='keep'){
      await p.locator('#kept-customer').selectOption('kuda');await p.locator('#kept-consent').check();
    }
    await p.evaluate(()=>document.fonts.ready);
    if(scene==='checkout'){
     const cash=await p.locator('#kept-cash').boundingBox(),dock=await p.locator('#dock').boundingBox();
     assert(cash.y+cash.height<=dock.y,'Cash input must be visible above the action');
     if(device==='phone'){
      const needed=await p.locator('#kept-mobile-needed').boundingBox();
      assert(needed.y+needed.height<=cash.y,'Device must show cash needed before cash input');
     }
    }
    await p.screenshot({path:path.join(__dirname,`-cdx-kept-${device}-${scene}.png`)});
   }
  }
  await p.goto(pathToFileURL(path.join(__dirname,'-cdx-preview.html')).href+'?journey=kept&device=landscape');
  const frame=p.frameLocator('#primary');
  await frame.locator('h1').filter({hasText:'Tariro'}).waitFor();
  assert.equal(await frame.locator('body').evaluate(()=>innerWidth),1024);
  assert.deepEqual(errors,[]);
  console.log(`PASS: kept change use/full use/overpayment, agreement/cap, refund approval, `+
    `cash/debt reconciliation, draft recovery, stale/disabled recovery; ${layouts} layouts and ten captures.`);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
