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
  const p=await b.newPage({viewport:{width:390,height:844}});p.setDefaultTimeout(8000);
  const url=pathToFileURL(path.join(__dirname,'-cdx-counter.html')).href;
  const act=a=>p.locator(`[data-action="${a}"]:visible`).first().click();
  await p.goto(url+'?fresh=1&seed=1&screen=discount');
  assert.match(await p.locator('h1').innerText(),/Discount/);
  await p.locator('#discount-value').fill('10');await p.locator('#discount-reason').fill('Damaged outer pack');
  await act('discount-review');await act('discount-apply');
  assert.equal(await p.evaluate(()=>total()),330);
  assert.equal(await p.evaluate(()=>products()[0].cents),100,'Discount never edits the product price');
  await p.evaluate(()=>navigate('pay'));await p.locator('#received').fill('5.00');await act('complete');
  assert.equal(await p.evaluate(()=>s.last.amount),330);assert.equal(await p.evaluate(()=>s.last.discountTotal),20);
  await act('receipt');assert.match(await p.locator('#screen').innerText(),/Discount/);
  await act('return-items');await p.locator('#return-qty-0').fill('1');
  await p.locator('#partial-reason').selectOption('wrong');await act('return-review');
  await p.locator('#approval-pin').fill('123456');const cash=await p.evaluate(()=>s.cash);
  await act('return-save');assert.equal(await p.evaluate(()=>s.cash),cash-90,'Return uses original discounted price');
  await p.goto(url+'?fresh=1&seed=1&role=worker&screen=discount');
  await p.locator('#discount-type').selectOption('amount');await p.locator('#discount-value').fill('0.50');
  await p.locator('#discount-reason').fill('Damaged outer pack');await act('discount-review');
  assert(await p.locator('[data-action="discount-apply"]').isDisabled());
  await p.locator('#approval-pin').fill('111111');assert(await p.locator('[data-action="discount-apply"]').isDisabled());
  await p.evaluate(()=>history.replaceState(null,'',location.pathname+'?role=worker&screen=discount-review'));await p.reload();
  assert.equal(await p.locator('#approval-pin').inputValue(),'');
  await p.locator('#approval-pin').fill('123456');await act('discount-apply');
  assert.equal(await p.evaluate(()=>total()),300);
  await p.evaluate(()=>actions.hold());await p.evaluate(()=>actions['resume-held']({dataset:{index:'0'}}));
  assert.equal(await p.evaluate(()=>total()),300,'Held sale retains its approved discount');
  await p.evaluate(()=>actions.add({dataset:{id:'bread'}}));
  assert.equal(await p.evaluate(()=>total()),450,'Changed quantity clears stale discount');
  await p.goto(url+'?fresh=1&seed=1&role=worker');
  await p.evaluate(()=>actions['discount-open']({dataset:{id:'milk'}}));
  await p.locator('#discount-value').fill('10');await p.locator('#discount-reason').fill('Promotion');await act('discount-review');
  await p.evaluate(()=>history.replaceState(null,'',location.pathname+'?role=worker&screen=discount-review'));await p.reload();
  assert.match(await p.locator('#screen').innerText(),/Fresh milk/);assert.equal(await p.locator('#approval-pin').inputValue(),'');
  await p.goto(url+'?fresh=1&measure=sample');
  await p.evaluate(()=>{s.basket={rice:750};selectedId='rice';navigate('discount');});
  await p.locator('#discount-value').fill('10');await p.locator('#discount-reason').fill('Promotion');
  // Fixture rice is USD 2.40/kg: 750 g is 180 cents, less 18 cents discount.
  await act('discount-review');await act('discount-apply');assert.equal(await p.evaluate(()=>total()),162);
  await act('pay');await p.locator('#received').fill('2.00');await act('complete');await act('receipt');
  await act('return-items');await p.locator('#return-qty-0').fill('0.250');
  await p.locator('#partial-reason').selectOption('wrong');await act('return-review');
  await p.locator('#approval-pin').fill('123456');const weighedCash=await p.evaluate(()=>s.cash);
  await act('return-save');assert.equal(await p.evaluate(()=>s.cash),weighedCash-54,'Measured return uses the saved net line');
  await p.goto(url+'?fresh=1&seed=1&screen=discount');
  await p.locator('#discount-value').fill('100');await p.locator('#discount-reason').fill('Promotion');
  assert(await p.locator('[data-action="discount-review"]').isDisabled());
  await p.locator('#discount-value').fill('10.001');assert(await p.locator('[data-action="discount-review"]').isDisabled());
  if(process.argv.includes('--interactions-only')){
   console.log('PASS: line discounts, fresh owner approval, held/changed quantity, net-price returns and validation.');return;
  }
  let layouts=0;
  for(const [width,height] of [[320,740],[390,844],[768,1024],[1024,768]]){
   await p.setViewportSize({width,height});
   for(const mode of ['','&theme=dark','&text=large'])for(const role of ['owner','worker']){
    await p.goto(`${url}?fresh=1&seed=1&role=${role}&screen=discount${mode}`);
    await p.locator('#discount-value').fill('10');await p.locator('#discount-reason').fill('Promotion');
    await act('discount-review');
    assert(!(await p.evaluate(()=>[...document.querySelectorAll('main,#dock,.app')]
      .some(el=>el.scrollWidth>el.clientWidth+1))),`${role} discount ${width} ${mode}`);layouts++;
   }
  }
  for(const [device,width,height] of [['phone',390,844],['tablet',1024,768]]){
   await p.setViewportSize({width,height});
   await p.goto(url+'?fresh=1&seed=1&role=worker&screen=discount');
   await p.locator('#discount-value').fill('10');await p.locator('#discount-reason').fill('Promotion');
   await act('discount-review');await p.evaluate(()=>document.fonts.ready);
   await p.screenshot({path:path.join(__dirname,`-cdx-${device}-discount-approval.png`)});
   await p.locator('#approval-pin').fill('123456');await act('discount-apply');
   await act('pay');await p.locator('#received').fill('5.00');
   await p.screenshot({path:path.join(__dirname,`-cdx-${device}-discount-payment.png`)});
   await act('complete');await act('receipt');
   await p.screenshot({path:path.join(__dirname,`-cdx-${device}-discount-receipt.png`)});
  }
  console.log(`PASS: discount approval, held state, net-price returns and ${layouts} review layouts; six captures.`);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
