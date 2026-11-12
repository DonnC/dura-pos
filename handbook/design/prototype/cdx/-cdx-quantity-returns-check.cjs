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
  const act=async a=>{
    if(a==='return-items'&&!await p.locator('[data-action="return-items"]:visible').count()){
      const id=await p.evaluate(()=>lastSale.id);
      if(await p.evaluate(()=>page==='receipt'))await p.locator('.back[data-action="history"]').click();
      else{await p.locator('nav [data-action="money"]').click();await p.locator('[data-action="history"]:visible').click();}
      await p.locator(`[data-action="return-from-history"][data-id="${id}"]`).click();return;
    }
    await p.locator(`[data-action="${a}"]:visible`).first().click();
  };
  const receipt=async()=>{if(await p.evaluate(()=>page==='done')){
    assert(await p.locator('.receipt-paper').isVisible(),'Receipt preview opens directly after sale');
  }else await act('receipt');};
  await p.goto(url+'?fresh=1&measure=sample&screen=quantity');
  await p.locator('#quantity-value').fill('0.0005');
  assert(await p.locator('[data-action="quantity-save"]').isDisabled());
  await p.locator('#quantity-value').fill('0.375');
  assert.match(await p.locator('#quantity-total').innerText(),/USD 0.90/);
  await p.locator('#quantity-unit').selectOption('g');
  assert.equal(await p.locator('#quantity-value').inputValue(),'375');
  await act('quantity-save');assert.equal(await p.locator('.total').innerText(),'USD 0.90');
  await act('pay');await p.locator('#received').fill('1.00');await act('complete');
  assert.equal(await p.evaluate(()=>s.products.find(p=>p.id==='rice').stock),24625);
  await receipt();await act('return-items');
  await p.locator('#return-qty-0').fill('0.125');await p.locator('#return-restock-0').check();
  await p.locator('#partial-reason').selectOption('wrong');await act('return-review');
  await p.locator('#approval-pin').fill('123456');await act('return-save');
  assert.equal(await p.evaluate(()=>s.cash),7110);
  assert.equal(await p.evaluate(()=>s.sales),8710);
  assert.equal(await p.evaluate(()=>s.products.find(p=>p.id==='rice').stock),24750);
  await receipt();await act('return-items');
  await p.locator('#return-qty-0').fill('0.300');
  assert.match(await p.locator('#partial-error').innerText(),/0.25 kg/);
  await p.locator('#return-qty-0').fill('0.250');await p.locator('#partial-reason').selectOption('damaged');
  await act('return-review');await p.locator('#approval-pin').fill('123456');await act('return-save');
  assert.equal(await p.evaluate(()=>s.cash),7050);
  assert.equal(await p.evaluate(()=>s.sales),8650);
  assert.equal(await p.evaluate(()=>s.products.find(p=>p.id==='rice').stock),24750);
  assert.equal(await p.evaluate(()=>s.last.items[0].qty),375,'Original receipt unchanged');
  await receipt();assert.equal(await p.locator('[data-action="return-items"]').count(),0);
  await p.goto(url+'?fresh=1&seed=1&kept=sample&screen=kept-checkout');
  await act('kept-save-sale');await receipt();await act('return-items');
  await p.locator('#return-qty-0').fill('1');await p.locator('#return-restock-0').check();
  await p.locator('#partial-reason').selectOption('wrong');
  await p.setViewportSize({width:1024,height:768});
  assert.equal(await p.locator('#return-qty-0').inputValue(),'1');
  await p.goto(url+'?screen=return-items');
  assert.equal(await p.locator('#return-qty-0').inputValue(),'1');
  await act('return-review');
  assert.match(await p.locator('#screen').innerText(),/USD 0.43/);
  assert.match(await p.locator('#screen').innerText(),/USD 0.57/);
  await p.evaluate(()=>document.fonts.ready);
  await p.screenshot({path:path.join(__dirname,'-cdx-tablet-return-kept-review.png')});
  await p.locator('#approval-pin').fill('123456');await act('return-save');
  assert.equal(await p.evaluate(()=>s.cash),7193);
  assert.equal(await p.evaluate(()=>s.kept.contacts[0].balance),43);
  await p.evaluate(()=>actions['return-save']());assert.equal(await p.evaluate(()=>s.cash),7193);
  await receipt();await act('return-items');
  await p.locator('#return-qty-0').fill('1');await p.locator('#return-qty-1').fill('1');
  await p.locator('#partial-reason').selectOption('wrong');await act('return-review');
  await p.locator('#approval-pin').fill('123456');await act('return-save');
  assert.equal(await p.evaluate(()=>s.cash),7050);
  assert.equal(await p.evaluate(()=>s.kept.contacts[0].balance),150);
  await p.goto(url+'?fresh=1&seed=1&kept=sample&screen=pay&cash=500');
  await act('kept-keep');await p.locator('#kept-customer').selectOption('kuda');
  await p.locator('#kept-consent').check();await act('kept-save-keep');
  await receipt();await act('return-items');
  await p.locator('#return-qty-0').fill('1');await p.locator('#partial-reason').selectOption('wrong');
  await act('return-review');await p.locator('#approval-pin').fill('123456');await act('return-save');
  assert.equal(await p.evaluate(()=>s.kept.contacts[1].balance),200,'Original change remains owed');
  assert.equal(await p.evaluate(()=>s.cash),7450);
  await p.goto(url+'?fresh=1&measure=sample&returns=sample&screen=return-items');
  await p.evaluate(()=>{s.cash=0;s.products[0].cents=9900;});
  await p.locator('#return-qty-0').fill('1');await p.locator('#partial-reason').selectOption('wrong');
  assert.match(await p.locator('#partial-error').innerText(),/Only USD 0.00/);
  assert.match(await p.locator('#partial-summary').innerText(),/USD 1.00/,'Use original price, not current USD 99.00');
  assert(await p.locator('[data-action="return-review"]').isDisabled());
  assert.deepEqual(await p.evaluate(()=>{
    const item={...products().find(p=>p.id==='rice'),qty:3,lineTotal:1};
    const r={id:'rounding',items:[item],amount:1,currency:s.currency,method:'Cash',who:s.name};
    s.cash=100;s.returnDraft={sale:r.id,qty:['0.001'],restock:[false],reason:'wrong'};
    const amounts=[];
    for(let n=0;n<3;n++){
      const plan=returnPlan(r);amounts.push(plan.amount);
      s.returnTotals={rounding:{qty:[n+1],amount:plan.prior.amount+plan.amount,kept:0}};
    }return amounts;
  }),[0,1,0],'Cumulative rounding must not over-refund a one-cent line');
  if(process.argv.includes('--interactions-only')){
    console.log('PASS: weighed quantities, partial/repeated returns, original prices, kept/cash split, rounding and draft recovery.');return;
  }
  const errors=[];p.on('pageerror',e=>errors.push(e.message));let layouts=0;
  for(const [width,height] of [[320,740],[390,844],[768,1024],[1024,768]]){
   await p.setViewportSize({width,height});
   for(const mode of ['','&theme=dark','&text=large']){
    for(const role of ['owner','worker']){
     for(const scene of ['quantity','return-items','return-review']){
      await p.goto(`${url}?fresh=1&measure=sample&returns=sample&screen=${scene}&role=${role}${mode}`);
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
  }
  for(const [device,width,height] of [['phone',390,844],['tablet',1024,768]]){
   await p.setViewportSize({width,height});
   for(const scene of ['quantity','return-items','return-review']){
    await p.goto(`${url}?fresh=1&measure=sample&returns=sample&screen=${scene}`);
    if(scene==='return-items'){
      await p.locator('#return-qty-0').fill('1');await p.locator('#return-qty-1').fill('0.250');
      await p.locator('#return-restock-1').check();await p.locator('#partial-reason').selectOption('wrong');
    }
    await p.evaluate(()=>document.fonts.ready);
    await p.locator('#screen').evaluate(el=>{el.scrollTop=0;});
    await p.screenshot({path:path.join(__dirname,`-cdx-${device}-${scene}.png`)});
   }
  }
  await p.goto(pathToFileURL(path.join(__dirname,'-cdx-preview.html')).href+'?journey=quantities&device=landscape');
  const frame=p.frameLocator('#primary');await frame.locator('#quantity-value').waitFor();
  assert.equal(await frame.locator('body').evaluate(()=>innerWidth),1024);
  assert.deepEqual(errors,[]);
  console.log(`PASS: weighed quantities, partial/repeated returns, original prices, kept/cash split, rounding, drafts; ${layouts} layouts and seven captures.`);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
