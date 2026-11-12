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
  const p=await b.newPage({viewport:{width:390,height:844}});p.setDefaultTimeout(10000);
  const act=a=>p.locator(`[data-action="${a}"]:visible`).first().click();
  for(const currency of ['USD','ZWG','split']){
   await p.goto(url+'?fresh=1&seed=1&screen=mixed',{waitUntil:'domcontentloaded'});
   await p.evaluate(()=>{s.zwg=5400;});
   await p.locator('#mixed-usd').fill('5.00');await p.locator('#mixed-zwg').fill('0.00');
   assert(await p.locator('[data-action="save-mixed"]').isDisabled(),'Overpayment needs an explicit choice');
   await p.locator('#change-currency').selectOption(currency);
   if(currency==='split')await p.locator('#change-usd-part').fill('1.00');
   assert(!(await p.locator('[data-action="save-mixed"]').isDisabled()));
   await act('save-mixed');assert(await p.locator('.receipt-check').isVisible());
   const r=await p.evaluate(()=>({sale:s.last,cash:s.cash,zwg:s.zwg,stock:products()[0].stock}));
   assert.equal(r.sale.amount,350);assert.equal(r.stock,16);
   assert.deepEqual(r.sale.changePayments,currency==='USD'?[{currency:'USD',amount:150}]:
    currency==='ZWG'?[{currency:'ZWG',amount:4050}]:[{currency:'USD',amount:100},{currency:'ZWG',amount:1350}]);
   assert.equal(r.cash,currency==='USD'?7400:currency==='ZWG'?7550:7450);
   assert.equal(r.zwg,currency==='USD'?5400:currency==='ZWG'?1350:4050);
  }
  await p.goto(url+'?fresh=1&seed=1&screen=mixed',{waitUntil:'domcontentloaded'});
  await p.locator('#mixed-usd').fill('5.00');await p.locator('#change-currency').selectOption('ZWG');
  assert(await p.locator('[data-action="save-mixed"]').isDisabled());
  assert.match(await p.locator('#mixed-error').innerText(),/not enough|Only/i);
  await p.locator('#change-currency').selectOption('USD');
  await p.evaluate(()=>history.replaceState(null,'',location.pathname+'?screen=mixed'));await p.reload();
  assert.equal(await p.locator('#mixed-usd').inputValue(),'5.00');
  assert.equal(await p.locator('#change-currency').inputValue(),'USD');
  await p.evaluate(()=>{s.rateMinor=2800;render();});assert(await p.locator('[data-action="save-mixed"]').isDisabled());
  await act('mixed-update-rate');assert.equal(await p.locator('#mixed-usd').inputValue(),'5.00');
  assert.equal(await p.locator('#change-currency').inputValue(),'');
  console.log('PASS: explicit USD/ZWG/split change, exact drawer effects, quiet receipt, insufficient cash, draft reload and rate change.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
