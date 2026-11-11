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
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const url=pathToFileURL(path.join(__dirname,'-cdx-counter.html')).href;
 const failures=[];
 async function run(name,check){
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const p=await context.newPage();p.setDefaultTimeout(10000);p.setDefaultNavigationTimeout(30000);
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  const act=a=>p.locator(`[data-action="${a}"]:visible`).first().click();
  const discount=async(value='10')=>{
   await act('basket');await p.locator('[data-action="discount-open"][data-id="bread"]').click();
   await p.locator('#discount-value').fill(value);await p.locator('#discount-reason').fill('Damaged outer pack');
   await act('discount-review');await act('discount-apply');
  };
  try{await check(p,act,discount);assert.deepEqual(errors,[]);console.log('PASS: '+name);}
  catch(e){failures.push(name+': '+e.message);console.error('FAIL: '+name+': '+e.message);}
  finally{await context.close();}
 }
 try{
  await run('signed-in cashier survives reopening',async(p,act)=>{
   await p.goto(url+'?fresh=1');
   await act('profile');await act('switch-person');await act('cashup');
   await p.locator('#counted-usd').fill('70.50');await act('review-count');await act('close-shift');
   await act('switch-person');await p.locator('#next-person').selectOption('worker');
   await p.locator('#next-pin').fill('123456');await act('start-person');
   await p.locator('#float-usd').fill('10.00');await act('open-shift');
   await p.evaluate(()=>history.replaceState(null,'',location.pathname));await p.reload();
   assert.match(await p.locator('.identity').innerText(),/Rudo · Cashier/);
   assert.equal(await p.evaluate(()=>s.cash),1000);
   await act('shop');assert.equal(await p.locator('[data-action="settings"]').count(),0);
  });
  await run('discounted unfinished sale crosses cash-up and handover',async(p,act,discount)=>{
   await p.goto(url+'?fresh=1&seed=1');await discount();
   await act('money');await act('cashup');await p.locator('#counted-usd').fill('70.50');
   await act('review-count');await act('close-shift');
   assert.equal(await p.evaluate(()=>s.held[0].amount),330);
   await act('switch-person');await p.locator('#next-person').selectOption('worker');
   await p.locator('#next-pin').fill('123456');await act('start-person');await act('open-shift');
   await act('held');await act('resume-held');
   assert.equal(await p.evaluate(()=>total()),330,'Auto-held basket retains approved net price');
   await act('pay');assert.match(await p.locator('#screen').innerText(),/USD 0.20/);
  });
  await run('pending quote keeps original prices and next customer draft',async(p,act,discount)=>{
   await p.goto(url+'?fresh=1&seed=1&features=1');await discount();
   await act('pay');await act('mobile');await p.locator('#payment-phone').fill('0771234567');
   await act('request-payment');await act('sell');
   await p.evaluate(()=>{products()[0].cents=120;save();});
   await p.locator('[data-action="add"][data-id="bread"]').click();await discount('50');
   await act('pay');await p.locator('#received').fill('2.00');await act('sell');await act('pending');
   await p.evaluate(()=>history.replaceState(null,'',location.pathname+'?screen=pending'));await p.reload();
   await p.evaluate(()=>{demoState='confirmed';render();});await act('finish-mobile');
   assert.equal(await p.evaluate(()=>s.last.amount),330,'Confirmed amount must match requested amount');
   assert.equal(await p.evaluate(()=>s.last.items[0].lineTotal),180,'Receipt retains original net line');
   assert.equal(await p.evaluate(()=>s.last.discountTotal),20);
   assert.equal(await p.evaluate(()=>total()),60,'Next customer keeps their own discount');
   assert.match(await p.locator('#dock').innerText(),/Return to current sale/);
   await p.evaluate(()=>actions['finish-mobile']());
   assert.equal(await p.evaluate(()=>s.history.length),1,'Repeated completion cannot save twice');
   await act('next');await act('pay');
   assert.equal(await p.locator('#received').inputValue(),'2.00','Next customer cash entry survives');
  });
  for(const changed of [false,true])await run('failed payment recovery, changed prices '+changed,async(p,act,discount)=>{
   await p.goto(url+'?fresh=1&seed=1&features=1');await discount();
   await act('pay');await act('mobile');await p.locator('#payment-phone').fill('0771234567');
   await act('request-payment');
   await p.evaluate(changed=>{if(changed)products()[0].cents=120;demoState='failed';render();},changed);
   await act('retry-pending');assert.equal(await p.evaluate(()=>total()),changed?390:330);
   assert.equal(await p.locator('#payment-recovery').count(),changed?1:0);
   assert.equal(await p.evaluate(()=>s.history.length),0,'A failed payment is not a sale');
   if(changed){
    await p.evaluate(()=>history.replaceState(null,'',location.pathname+'?screen=pay'));await p.reload();
    assert.match(await p.locator('#payment-recovery').innerText(),/USD 3.30/);
   }
  });
  await run('older pending request never invents item prices',async(p,act)=>{
   await p.goto(url+'?fresh=1&seed=1&screen=pending');
   await p.evaluate(()=>{delete s.pending[0].quote;demoState='confirmed';render();});
   assert.equal(await p.locator('[data-action="finish-mobile"]').count(),0);
   await p.evaluate(()=>actions['finish-mobile']());assert.equal(await p.evaluate(()=>s.history.length),0);
   await act('sell');assert.equal(await p.evaluate(()=>s.pending.length),1);
  });
  if(!process.argv.includes('--interactions-only')){
   const cases=require('./-cdx-coverage-cases.js').states.filter(c=>c.family==='sale-continuity');
   await run('continuity layouts and captures',async p=>{
    let layouts=0;
    for(const [width,height] of [[320,740],[390,844],[768,1024],[1024,768]]){
     await p.setViewportSize({width,height});
     for(const mode of ['','&theme=dark','&text=large'])for(const c of cases){
      await p.goto(`${url}?fresh=1&seed=1&screen=${c.screen}&catalog=${c.id}${mode}`);
      assert.equal(await p.locator('body').getAttribute('data-catalog-ready'),c.id);
      const amount=await p.evaluate(value=>value==='handover'?s.held.at(-1).amount:
       value==='retry'?total():value==='saved'?s.last.amount:s.pending[0].amount,c.value);
      assert.equal(amount,c.value==='retry'?390:330,c.id+' must show the intended quote');
      assert(!(await p.evaluate(()=>[...document.querySelectorAll('main,#dock,.app')]
       .some(el=>el.scrollWidth>el.clientWidth+1))),c.id+' '+width+' '+mode);
      const dock=await p.locator('#dock').boundingBox();assert(dock.y+dock.height<=height+1);
      layouts++;
     }
    }
    for(const [device,width,height] of [['mobile',390,844],['tablet',1024,768]]){
     await p.setViewportSize({width,height});
     for(const c of cases){
      await p.goto(`${url}?fresh=1&seed=1&screen=${c.screen}&catalog=${c.id}`);
      await p.evaluate(()=>document.fonts.ready);
      await p.screenshot({path:path.join(__dirname,`-cdx-${device}-${c.id}.png`)});
     }
    }
    console.log(`PASS: ${layouts} continuity layouts and ${cases.length*2} mobile/tablet captures.`);
   });
  }
 }finally{await browser.close();}
 assert.deepEqual(failures,[]);
 console.log('PASS: complete owner/cashier continuity walkthrough.');
})().catch(e=>{console.error(e);process.exit(1);});
