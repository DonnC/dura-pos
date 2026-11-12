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
 const url=pathToFileURL(path.join(__dirname,'-cdx-counter.html')).href;
 try{
  const p=await b.newPage({viewport:{width:390,height:844}});p.setDefaultTimeout(15000);p.setDefaultNavigationTimeout(30000);
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  const act=a=>p.locator(`[data-action="${a}"]:visible`).first().click();
  await p.goto(url+'?fresh=1&take=large&screen=stock-count',{waitUntil:'domcontentloaded'});
  assert.equal(await p.evaluate(()=>products().length),500);
  assert.equal(await p.locator('[data-take-id]').count(),20,'Only one bounded page of count inputs is rendered');
  await p.evaluate(()=>{products()[0].stock--;stockMove('bread','Sale before counting',-1,products()[0].stock);save();});
  await p.locator('#count-bread').fill('0');assert.equal(await p.evaluate(()=>takeStatus().stale.length),0);
  await act('take-next');
  await p.locator('#take-search').fill('SKU-0025');assert.equal(await p.locator('[data-take-id]').count(),1);
  await p.locator('#count-sample-25').fill('7');
  await p.evaluate(()=>history.replaceState(null,'',location.pathname+'?screen=stock-count'));await p.reload({waitUntil:'domcontentloaded'});
  assert.equal(await p.evaluate(()=>products().length),500);assert.equal(await p.locator('#count-bread').inputValue(),'0');
  assert.match(await p.locator('#take-progress').innerText(),/2 of 500/);
  await p.evaluate(()=>{const a=products()[0];a.stock--;stockMove(a.id,'Sale',-1,a.stock);save();render();});
  assert(await p.locator('[data-action="review-stock-count"]').isDisabled());
  await p.locator('[data-action="take-recount"][data-id="bread"]').click();await p.locator('#count-bread').fill('0');
  await act('review-stock-count');assert(await p.locator('[data-action="save-stock-count"]').isDisabled());
  await p.locator('#count-reason-type').selectOption('other');await p.locator('#count-reason').fill('Damaged goods removed');
  if(await p.locator('#review-checked').count())await p.locator('#review-checked').check();
  const untouched=await p.evaluate(()=>products().find(p=>p.id==='milk').stock);
  await act('save-stock-count');assert.equal(await p.evaluate(()=>products()[0].stock),0);
  assert.equal(await p.evaluate(()=>products().find(p=>p.id==='milk').stock),untouched);
  await p.goto(url+'?fresh=1&seed=1&screen=pay',{waitUntil:'domcontentloaded'});
  await p.locator('#received').fill('5.00');await act('complete');
  assert(await p.locator('.receipt-check').isVisible());assert(await p.locator('.receipt-paper').isVisible());
  assert.equal(await p.locator('[data-action="receipt"]').count(),0,'Receipt preview is already open');
  assert.match(await p.locator('.receipt-paper').innerText(),/Change given\s+USD 1.50/);
  await p.goto(url+'?fresh=1&seed=1&screen=pay',{waitUntil:'domcontentloaded'});
  await p.locator('#received').fill('5.00');
  await p.evaluate(()=>{window.realSave=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('test storage failure');};});
  await act('complete');assert.match(await p.locator('h1').innerText(),/not saved/i);
  const failedId=await p.evaluate(()=>lastSale.id);assert(await p.locator('[data-action="share-receipt"]').isDisabled());
  await p.evaluate(()=>{Storage.prototype.setItem=window.realSave;});await act('retry-sale-save');
  assert(await p.locator('.receipt-check').isVisible());
  assert.equal(await p.evaluate(()=>s.history.filter(r=>r.id===lastSale.id).length),1);
  assert.equal(await p.evaluate(()=>lastSale.id),failedId);
  await p.goto(url+'?fresh=1&screen=money-in',{waitUntil:'domcontentloaded'});
  const sales=await p.evaluate(()=>s.sales);await p.locator('#cash-in-amount').fill('10.00');
  assert(await p.locator('[data-action="cash-in-review"]').isDisabled());
  await p.locator('#cash-in-note').fill('Owner supplied change');await act('cash-in-review');await act('cash-in-save');
  assert.equal(await p.evaluate(()=>s.cash),8050);assert.equal(await p.evaluate(()=>s.sales),sales);
  await p.goto(url+'?fresh=1&screen=expense',{waitUntil:'domcontentloaded'});
  await p.locator('#expense-kind').selectOption('rent');await p.locator('#expense-amount').fill('2.00');
  assert(!(await p.locator('#expense-note').isVisible()));assert(!(await p.locator('[data-action="review-expense"]').isDisabled()));
  await p.locator('#expense-kind').selectOption('expense');assert(await p.locator('[data-action="review-expense"]').isDisabled());
  await p.locator('#expense-note').fill('Market stall repair');await act('review-expense');assert.match(await p.locator('main').innerText(),/Market stall repair/);
  await p.goto(url+'?fresh=1&seed=1',{waitUntil:'domcontentloaded'});
  await act('display-currency');await p.locator('[data-currency="ZWG"]').click();
  assert.match(await p.locator('.total').innerText(),/ZWG 94.50/);
  assert.equal(await p.evaluate(()=>total()),350);assert.equal(await p.evaluate(()=>products()[0].cents),100);
  await act('pay');assert.equal(await p.locator('#mixed-zwg').inputValue(),'94.50');await act('save-mixed');
  assert.equal(await p.evaluate(()=>s.last.currency),'USD');assert.equal(await p.evaluate(()=>s.last.payments[1].amount),9450);
  await act('next');await act('profile');assert.equal(await p.locator('dialog [data-action="money"]').count(),0);
  await p.keyboard.press('Escape');
  await p.goto(url+'?fresh=1&screen=refund',{waitUntil:'domcontentloaded'});
  await p.locator('#return-reason').selectOption('other');assert(await p.locator('#return-other').isVisible());
  assert(await p.locator('[data-action="review-refund"]').isDisabled());
  await p.locator('#return-other').fill('Customer changed their mind');await act('review-refund');
  assert.match(await p.locator('main').innerText(),/Customer changed their mind/);
  await p.goto(url+'?fresh=1&measure=sample&returns=sample&screen=return-items',{waitUntil:'domcontentloaded'});
  await p.locator('#return-qty-0').fill('1');await p.locator('#partial-reason').selectOption('other');
  assert(await p.locator('[data-action="return-review"]').isDisabled());
  await p.locator('#partial-other').fill('Package was leaking');await act('return-review');
  assert.match(await p.locator('main').innerText(),/Package was leaking/);
  await p.goto(url+'?fresh=1&role=worker&screen=money-in',{waitUntil:'domcontentloaded'});
  await p.locator('#cash-in-kind').selectOption('float');await p.locator('#cash-in-amount').fill('5.00');
  await act('cash-in-review');assert(await p.locator('[data-action="cash-in-save"]').isDisabled());
  await p.locator('#approval-pin').fill('123456');await act('cash-in-save');assert.equal(await p.evaluate(()=>s.cash),2550);
  await p.goto(url+'?fresh=1&seed=1',{waitUntil:'domcontentloaded'});
  await p.evaluate(()=>{s.rateMinor=2701;s.basket={bread:3};products()[0].cents=111;s.displayCurrency='ZWG';save();render();});
  await act('pay');assert.equal(await p.locator('#mixed-zwg').inputValue(),'89.94');await act('save-mixed');
  assert.equal(await p.evaluate(()=>s.last.amount),333);assert.equal(await p.evaluate(()=>s.last.roundingZwgSubcent),-33);
  await p.goto(url+'?fresh=1&take=large&screen=stock-count',{waitUntil:'domcontentloaded'});
  const lastInput=p.locator('[data-take-id]').last();await lastInput.fill('1');await lastInput.press('Enter');
  assert.equal(await p.evaluate(()=>takePage),1,'Enter at the end of a count page advances to the next 20');
  const captures=[['stock-count','take=large'],['count-stock-review','take=large&catalog=take-review-differences'],
   ['stock','shelf=full'],['sell','shelf=full&catalog=sell-converted-prices'],['expense',''],['money-in',''],
   ['done','catalog=base-done'],['done-failed','catalog=checkout-save-failure']];let layouts=0;
  for(const [width,height] of [[320,740],[390,844],[768,1024],[1024,768]]){
   await p.setViewportSize({width,height});
   for(const mode of ['','&theme=dark','&text=large'])for(const [name,query] of captures){
    const scene=name==='done-failed'?'done':name;
    await p.goto(`${url}?fresh=1&seed=1&screen=${scene}&${query}${mode}`,{waitUntil:'domcontentloaded'});
    assert(!(await p.evaluate(()=>[...document.querySelectorAll('main,#dock,.app')].some(e=>e.scrollWidth>e.clientWidth+1))),name+' '+width+' '+mode);
    layouts++;
   }
  }
  for(const [device,width,height] of [['mobile',390,844],['tablet',1024,768]]){
   await p.setViewportSize({width,height});
   for(const [name,query] of captures){
    await p.goto(`${url}?fresh=1&seed=1&screen=${name==='done-failed'?'done':name}&${query}`,{waitUntil:'domcontentloaded'});
    await p.evaluate(()=>document.fonts.ready);
    await p.screenshot({path:path.join(__dirname,`-cdx-operations-${device}-${name}.png`)});
   }
  }
  assert.deepEqual(errors,[]);console.log(`PASS: 500-item bounded count/reload/recount, direct receipt and failed-save retry, cash movements, Other reasons, conversion; ${layouts} layouts and 16 captures.`);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
