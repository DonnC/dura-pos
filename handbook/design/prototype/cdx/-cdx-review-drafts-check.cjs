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
  const work=()=>p.evaluate(()=>({cash:s.cash,products:s.products,active:s.active,events:s.events,supplier:s.supplier}));
  const reload=async screen=>{
   await p.evaluate(screen=>{const url=new URL(location.href);url.searchParams.delete('fresh');
    url.searchParams.delete('seed');url.searchParams.set('screen',screen);history.replaceState(null,'',url);},screen);
   await p.reload();
  };
  await p.goto(url+'?fresh=1&screen=receive');
  const before=await work();
  await p.locator('#receive-qty').fill('6');await p.locator('#delivery-ref').fill('DEL-012');
  await reload('receive');assert.equal(await p.locator('#receive-qty').inputValue(),'6');
  await act('review-receive');await reload('receive-review');
  assert.equal(await p.evaluate(()=>page),'receive-review');
  assert.match(await p.locator('#screen').innerText(),/DEL-012/);
  assert.deepEqual(await work(),before,'Restoring delivery does not add stock');
  assert(await p.locator('[data-action="save-receive"]').isDisabled());
  await p.locator('#review-checked').check();
  await act('save-receive');const committed=await work();await reload('receive-review');
  assert.deepEqual(await work(),committed,'Completed delivery cannot be replayed');
  assert.equal(await p.locator('[data-action="save-receive"]').count(),0);
  await p.goto(url+'?fresh=1&screen=stock-count');
  await p.locator('#count-bread').fill('0');await act('review-stock-count');
  await p.locator('#count-reason').fill('Damaged loaves removed');await reload('count-stock-review');
  assert.equal(await p.locator('#count-reason').inputValue(),'Damaged loaves removed');
  await p.locator('#review-checked').check();await act('save-stock-count');
  assert.equal(await p.evaluate(()=>products()[0].stock),0,'Zero count is preserved, not blank');
  await p.goto(url+'?fresh=1&screen=expense');
  await p.locator('#expense-amount').fill('2.00');await p.locator('#expense-note').fill('Bus fare');
  await act('review-expense');await p.locator('#approval-pin').fill('123456');await reload('expense-review');
  assert.equal(await p.locator('#approval-pin').inputValue(),'','Never restore approval PIN');
  await p.locator('#review-checked').check();assert(await p.locator('[data-action="save-expense"]').isDisabled());
  await p.locator('#approval-pin').fill('123456');await act('save-expense');
  const paid=await work();await reload('expense-review');assert.deepEqual(await work(),paid);
  await p.goto(url+'?fresh=1&screen=cashup');
  await p.locator('#counted-usd').fill('70.00');await act('review-count');
  await p.locator('#variance-note').fill('Counted twice, missing coins');await p.locator('#keep-float').fill('10.00');
  await reload('count-review');assert.equal(await p.locator('#keep-float').inputValue(),'10.00');
  assert.equal(await p.locator('#variance-note').inputValue(),'Counted twice, missing coins');
  await p.locator('#review-checked').check();await act('close-shift');const closed=await work();
  await reload('handover');assert.match(await p.locator('#screen').innerText(),/USD 60.00/);
  assert.deepEqual(await work(),closed);await reload('count-review');
  assert.equal(await p.locator('[data-action="close-shift"]').count(),0,'No second close');
  for(const kind of ['receive','expense','cashup']){
   await p.goto(`${url}?fresh=1&screen=${kind}`);
   await p.locator(kind==='receive'?'#receive-qty':kind==='expense'?'#expense-amount':'#counted-usd').fill('6');
   if(kind==='expense')await p.locator('#expense-note').fill('Bus fare');
   await p.evaluate(kind=>{if(kind==='receive')products()[0].stock++;else s.cash++;save();},kind);
   await reload(kind);
   assert.match(await p.locator('#review-draft-note').innerText(),/Records changed/);
  }
  await p.goto(url+'?fresh=1&screen=receive');await p.locator('#receive-qty').fill('6');
  await p.evaluate(()=>{s.currency='ZWG';save();});await reload('receive');
  assert.equal(await p.locator('#receive-qty').inputValue(),'','No cross-currency draft');
  await p.goto(url+'?fresh=1&screen=expense');await p.locator('#expense-amount').fill('5.001');
  await reload('expense');assert.equal(await p.locator('#expense-amount').inputValue(),'5.001');
  assert(await p.locator('[data-action="review-expense"]').isDisabled());
  await act('review-start-again');assert.equal(await p.locator('#expense-amount').inputValue(),'');
  if(process.argv.includes('--interactions-only')){
   console.log('PASS: four review drafts, partial/invalid/zero entries, fresh approval, stale/scope guards, handover and no replay.');return;
  }
  let layouts=0;
  for(const [device,width,height] of [['phone',390,844],['tablet',1024,768]]){
   await p.setViewportSize({width,height});
   for(const [scene,input,value,action] of [['receive','receive-qty','6','review-receive'],
    ['stock-count','count-bread','16','review-stock-count'],['expense','expense-amount','2.00','review-expense'],
    ['cashup','counted-usd','70.00','review-count']]){
    await p.goto(`${url}?fresh=1&screen=${scene}`);await p.locator('#'+input).fill(value);
    if(scene==='expense')await p.locator('#expense-note').fill('Bus fare');
    await act(action);const review=await p.evaluate(()=>page);await reload(review);
    await p.evaluate(()=>document.fonts.ready);
    await p.screenshot({path:path.join(__dirname,`-cdx-${device}-${scene}-draft.png`)});layouts++;
   }
  }
  if(process.argv.includes('--captures-only')){console.log('PASS: interactions and eight refreshed recovery captures.');return;}
  let checks=0;
  for(const [width,height] of [[320,740],[390,844],[768,1024],[1024,768]]){
   await p.setViewportSize({width,height});
   for(const mode of ['','&theme=dark','&text=large']){
    for(const [scene,input,value,action] of [['receive','receive-qty','6','review-receive'],
     ['stock-count','count-bread','16','review-stock-count'],['expense','expense-amount','2.00','review-expense'],
     ['cashup','counted-usd','70.00','review-count']]){
     await p.goto(`${url}?fresh=1&screen=${scene}${mode}`);await p.locator('#'+input).fill(value);
     if(scene==='expense')await p.locator('#expense-note').fill('Bus fare');
     await act(action);await reload(await p.evaluate(()=>page));
     assert(await p.locator('#review-checked').count());
     assert(!(await p.evaluate(()=>[...document.querySelectorAll('main,#dock,.app')]
       .some(el=>el.scrollWidth>el.clientWidth+1))),`${scene} restored ${width} ${mode}`);
     const dock=await p.locator('#dock').boundingBox();assert(dock.y+dock.height<=height+1);checks++;
    }
   }
  }
  console.log(`PASS: four review drafts, approval/stale/replay guards; ${checks} restored layouts, ${layouts} captures.`);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
