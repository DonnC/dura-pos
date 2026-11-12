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
  const p=await b.newPage();p.setDefaultTimeout(15000);p.setDefaultNavigationTimeout(30000);
  const errors=[];p.on('pageerror',e=>errors.push(e.message));let layouts=0;
  const act=a=>p.locator(`[data-action="${a}"]:visible`).first().click();
  const forbidden=/Sale saved|Saved on (this )?device|Not fiscal|No fiscal|Not uploaded|Change to give|Return selected|Return whole/i;
  for(const [width,height] of [[320,740],[390,844],[768,1024],[1024,768]]){
   await p.setViewportSize({width,height});
   for(const mode of ['','&theme=dark','&text=large'])for(const scene of ['done','receipt'])for(const role of ['owner','worker']){
    await p.goto(`${url}?fresh=1&seed=1&screen=${scene}&role=${role}&catalog=base-${scene}${mode}`,{waitUntil:'domcontentloaded'});
    assert(await p.locator('.receipt-check').isVisible(),'One small success indicator');
    assert.equal(await p.locator('.receipt-check').count(),1);
    assert.equal(await p.locator('.checkout-banner,.status-line,.task-identity').count(),0);
    assert.equal(await p.locator('[data-action="return-items"],[data-action="refund"]').count(),0);
    assert(!forbidden.test(await p.locator('main').innerText()),scene+' verbose receipt copy');
    assert.equal(await p.locator('.receipt-paper').getByText('Change given',{exact:true}).count(),1);
    assert(!(await p.evaluate(()=>[...document.querySelectorAll('main,#dock,.app')].some(el=>el.scrollWidth>el.clientWidth+1))),`${width} ${mode} ${scene}`);
    layouts++;
   }
  }
  for(const [device,width,height] of [['mobile',390,844],['tablet',1024,768]]){
   await p.setViewportSize({width,height});
   await p.goto(url+'?fresh=1&shelf=full',{waitUntil:'domcontentloaded'});
   for(const id of ['bread','bread','milk','water'])await p.locator(`[data-action="add"][data-id="${id}"]`).click();
   await act('pay');await p.locator('#received').fill('5.00');await act('complete');
   assert(!(await p.locator('#toast').isVisible()),'Old basket feedback must not linger on the receipt');
   assert(await p.locator('.receipt-paper').isVisible());
   assert.match(await p.locator('.receipt-paper').innerText(),/Change given\s+USD 1.00/);
   await p.evaluate(()=>document.fonts.ready);
   await p.screenshot({path:path.join(__dirname,`-cdx-receipt-clean-${device}.png`)});
   await act('share-receipt');assert(await p.locator('dialog').isVisible());await p.keyboard.press('Escape');
   await act('next');await act('money');await act('history');
   await p.locator('[data-action="return-from-history"]').first().click();
   assert.match(await p.locator('h1').innerText(),/What came back/);
  }
  await p.goto(url+'?fresh=1&seed=1&screen=pay',{waitUntil:'domcontentloaded'});
  await p.locator('#received').fill('5.00');
  await p.evaluate(()=>{window.receiptRealSave=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('test');};});
  await act('complete');assert.equal(await p.locator('.receipt-check').count(),0);
  assert(await p.locator('.receipt-save-error').isVisible());assert(await p.locator('[data-action="share-receipt"]').isDisabled());
  const id=await p.evaluate(()=>lastSale.id);
  await p.evaluate(()=>{Storage.prototype.setItem=window.receiptRealSave;});await act('retry-sale-save');
  assert(await p.locator('.receipt-check').isVisible());assert.equal(await p.evaluate(()=>lastSale.id),id);
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${layouts} minimal receipt layouts; direct sale, single data values, no return/status clutter, history return, share and honest retry; two captures.`);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
