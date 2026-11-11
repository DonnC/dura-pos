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
  const act=a=>p.locator(`[data-action="${a}"]:visible`).first().click();
  await p.goto(url+'?fresh=1&screen=supplier-statement');await act('new-invoice');
  assert.match(await p.locator('h1').innerText(),/Items received/);
  await p.locator('#invoice-ref').fill('MW-1042');
  await act('invoice-add');await p.locator('#item-qty').fill('6');
  await p.locator('#item-cost').fill('0.70');await act('invoice-add-line');
  assert.match(await p.locator('#invoice-lines').innerText(),/USD 4.20/);
  await act('invoice-edit');assert.equal(await p.locator('#item-cost').inputValue(),'0.70');
  await act('invoice-add-line');
  await act('invoice-payment');await act('invoice-part');
  await p.locator('#invoice-paid').fill('5.00');
  assert(await p.locator('[data-action="invoice-review"]').isDisabled());
  await p.locator('#invoice-paid').fill('2.00');
  await p.locator('#invoice-due').fill('2026-11-17');
  await act('invoice-evidence');await act('invoice-evidence-sample');
  assert.match(await p.locator('#invoice-evidence').innerText(),/Practice example/);
  await p.goto(url+'?screen=invoice-payment');
  assert.equal(await p.locator('#invoice-paid').inputValue(),'2.00');
  assert.equal(await p.locator('#invoice-due').inputValue(),'2026-11-17');
  await p.setViewportSize({width:1024,height:768});
  assert.equal(await p.locator('#invoice-paid').inputValue(),'2.00');
  await act('invoice-review');assert.match(await p.locator('#screen').innerText(),/USD 2.20/);
  await p.locator('#approval-pin').fill('123456');await act('invoice-save');
  assert.match(await p.locator('h1').innerText(),/Invoice saved/);
  const state=await p.evaluate(()=>({cash:s.cash,supplier:s.supplier,stock:s.products[0].stock}));
  assert.deepEqual(state,{cash:6850,supplier:2220,stock:24});
  await act('invoice-detail');assert.match(await p.locator('#screen').innerText(),/MW-1042/);
  await p.goto(url+'?screen=invoice-detail');
  assert.match(await p.locator('#screen').innerText(),/MW-1042/);
  await p.goto(url+'?fresh=1&role=worker&screen=invoice-items');
  assert.match(await p.locator('h1').innerText(),/Owner access/);
  await p.goto(url+'?fresh=1&screen=invoice-payment&invoice=sample');
  await p.evaluate(()=>{s.cash=100;});await act('invoice-full');
  assert.match(await p.locator('#invoice-error').innerText(),/Only USD 1.00/);
  assert(await p.locator('[data-action="invoice-review"]').isDisabled());
  await act('invoice-later');await act('invoice-review');await act('invoice-save');
  assert.equal(await p.evaluate(()=>s.supplier),3080);
  assert.equal(await p.evaluate(()=>s.cash),100);
  await act('invoice-detail');await act('supplier-statement');
  await act('new-invoice');await p.locator('#invoice-ref').fill('MW-1042');
  await act('invoice-add');await p.locator('#item-qty').fill('1');
  await p.locator('#item-cost').fill('0.70');await act('invoice-add-line');
  await act('invoice-payment');await act('invoice-review');await act('invoice-save');
  assert.match(await p.locator('#toast').innerText(),/already saved/);
  assert.equal(await p.evaluate(()=>s.products[0].stock),24);
  let layouts=0;const errors=[];p.on('pageerror',e=>errors.push(e.message));
  for(const [width,height] of [[320,740],[390,844],[768,1024],[1024,768]]){
   await p.setViewportSize({width,height});
   for(const mode of ['','&theme=dark','&text=large']){
    for(const scene of ['invoice-items','invoice-payment','invoice-review','invoice-detail']){
     await p.goto(`${url}?fresh=1&screen=${scene}&invoice=sample${mode}`);
     if(scene==='invoice-detail')await p.evaluate(()=>{
      s.invoices=[{...invoiceDraft(),total:1080,paid:500,who:s.name}];render();
     });
     assert(await p.locator('h1').count());
     assert(!(await p.evaluate(()=>[...document.querySelectorAll('main,#dock,.app')]
       .some(el=>el.scrollWidth>el.clientWidth+1))),`${width} ${scene} ${mode}: overflow`);
     assert(!(await p.evaluate(()=>[...document.querySelectorAll('input,select')]
       .some(el=>!el.labels?.length&&!el.getAttribute('aria-label')))),'Unlabelled input');
     const dock=await p.locator('#dock').boundingBox();
     assert(dock.y+dock.height<=height+1,'Dock below viewport');layouts++;
    }
   }
  }
  for(const [device,width,height] of [['phone',390,844],['tablet',1024,768]]){
   await p.setViewportSize({width,height});
   for(const scene of ['items','payment','review']){
    await p.goto(`${url}?fresh=1&screen=invoice-${scene}&invoice=sample`);
    await p.evaluate(()=>document.fonts.ready);
    await p.screenshot({path:path.join(__dirname,`-cdx-invoice-${device}-${scene}.png`)});
   }
  }
  assert.deepEqual(errors,[]);
  console.log(`PASS: invoice entry/edit, evidence preview, draft recovery, validation, resize, `+
    `stock/cash/debt, duplicate prevention, roles; ${layouts} invoice layouts and six captures.`);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
