// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const url=pathToFileURL(path.join(__dirname,'-cdx-counter.html')).href;
const inspect=process.argv.includes('--inspect');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await b.newPage({viewport:{width:390,height:844}});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  if(!inspect){
   await p.goto(url+'?fresh=1&seed=1&role=worker&screen=pay');
   await p.evaluate(()=>save());
   const work=await p.evaluate(()=>({cash:s.cash,sales:s.sales,history:s.history,products:s.products,pending:s.pending}));
   await p.locator('#received').fill('5.00');
   assert(await p.locator('.field').evaluate(el=>getComputedStyle(el).outlineStyle!=='none'),
    'Cash entry needs a visible focus ring');
   await p.evaluate(()=>history.replaceState(null,'',location.pathname+'?role=worker&screen=pay'));
   await p.reload();
   assert.equal(await p.locator('#received').inputValue(),'5.00','Cash draft survives interruption');
   assert(await p.locator('#cash-draft-note').isVisible());
   assert.deepEqual(await p.evaluate(()=>({cash:s.cash,sales:s.sales,history:s.history,products:s.products,pending:s.pending})),work);
   await p.locator('#received').fill('5.001');
   assert.equal(await p.locator('#received').getAttribute('aria-invalid'),'true');
   await p.locator('#received').fill('5.00');
   assert.equal(await p.locator('#received').getAttribute('aria-invalid'),'false');
   await p.locator('[data-action="complete"]').click();
   const paid=await p.evaluate(()=>({cash:s.cash,sales:s.sales,history:s.history,products:s.products}));
   await p.reload();
   assert.deepEqual(await p.evaluate(()=>({cash:s.cash,sales:s.sales,history:s.history,products:s.products})),paid,
    'Reload after completion must not repeat the sale');
   await p.evaluate(()=>{s.basket={bread:1};save();navigate('pay');});
   assert.equal(await p.locator('#cash-draft-note').count(),0,'Next customer must not inherit the recovery note');
   for(const change of ['basket','price','currency','seller']){
    await p.goto(url+'?fresh=1&seed=1&screen=pay');await p.locator('#received').fill('5.00');
    await p.evaluate(change=>{
     if(change==='basket')s.basket.bread++;
     if(change==='price')s.products[0].cents++;
     if(change==='currency')s.currency='ZWG';
     if(change==='seller')s.name='Rudo';
     save();navigate('pay');
    },change);
    assert.equal(await p.locator('#received').inputValue(),'','Discard cash entry after '+change+' changes');
   }
   await p.goto(url+'?fresh=1&seed=1&role=worker&screen=pending');
   const reference=await p.evaluate(()=>s.pending[0].ref);
   await p.evaluate(()=>history.replaceState(null,'',location.pathname+'?role=worker&screen=pending'));await p.reload();
   assert.equal(await p.evaluate(()=>s.pending[0].ref),reference);
   assert.equal(await p.evaluate(()=>s.pending.length),1);
   assert.match(await p.locator('h1').innerText(),/Waiting for payment/);
   for(const [review,entry] of [['receive-review','receive'],['count-stock-review','stock-count'],
    ['expense-review','expense'],['count-review','cashup']]){
    await p.goto(url+'?fresh=1');await p.evaluate(review=>{
     draft.receive={id:'bread',qty:6};draft.stockCount=[{id:'bread',before:18,count:16}];
     draft.expense={kind:'expense',amount:200,note:'Sample fare'};
     draft.counted=s.cash;draft.countedZwg=0;save();navigate(review);
     history.replaceState(null,'',location.pathname+'?screen='+review);
    },review);
    const saved=await p.evaluate(()=>({cash:s.cash,products:s.products,active:s.active,events:s.events}));
    await p.reload();assert.equal(await p.evaluate(()=>page),entry,'Interrupted review returns to safe entry');
    assert(await p.locator('#review-restart-note').isVisible());
    assert.deepEqual(await p.evaluate(()=>({cash:s.cash,products:s.products,active:s.active,events:s.events})),saved);
   }
   await p.setViewportSize({width:390,height:844});
   await p.screenshot({path:path.join(__dirname,'-cdx-phone-review-restart.png')});
   await p.goto(url+'?fresh=1&seed=1');
   const avatar=p.locator('.avatar');await avatar.click();
   assert(await p.locator('#sheet').evaluate(el=>el.contains(document.activeElement)));
   await p.keyboard.press('Escape');assert(await avatar.evaluate(el=>el===document.activeElement));
   await p.locator('#search').focus();
   assert(await p.locator('.searchbox').evaluate(el=>getComputedStyle(el).outlineStyle!=='none'));
   await p.emulateMedia({reducedMotion:'reduce'});
   assert.equal(await p.locator('#toast').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
   if(process.argv.includes('--interactions-only')){
    console.log('PASS: cash recovery, stale/duplicate guards, pending identity, keyboard focus and reduced motion.');return;
   }
  }
  await p.goto(url+'?fresh=1');
  const routes=await p.evaluate(()=>Object.keys(screens).sort());
  const rows=[];
  for(const route of routes){
   await p.goto(`${url}?fresh=1&seed=1&screen=${route}&invoice=sample&kept=sample`+
    '&measure=sample&returns=sample&access=sample&reports=sample&recovery=ready&fiscal=unknown');
   await p.evaluate(target=>{
    draft.receive={id:'bread',qty:6,ref:'SAMPLE-1'};
    draft.counted=7000;draft.countedZwg=0;draft.kept=1000;draft.keptZwg=0;
    draft.stockCount=[{id:'bread',before:18,count:16}];
    draft.expense={kind:'expense',amount:200,note:'Sample bus fare'};
    draft.refund={reason:'wrong',restock:true};
    draft.setupCurrency='USD';draft.setupName='Practice shop';lastSale=receiptList()[0];
    page=target;render();
   },route);
   rows.push(await p.evaluate(route=>{
    const visible=el=>!!el.getClientRects().length;
    const controls=[...document.querySelectorAll('button,input,select')].filter(visible);
    return {route,title:document.querySelector('h1')?.textContent,
     small:controls.filter(el=>{const target=el.matches('input[type=checkbox]')?el.closest('label'):el;
       const r=target.getBoundingClientRect();return r.width<47.5||r.height<47.5;})
      .map(el=>({action:el.dataset.action||el.id,w:Math.round(el.getBoundingClientRect().width),h:Math.round(el.getBoundingClientRect().height)})),
     unlabelled:controls.filter(el=>el.tagName==='BUTTON'?!el.textContent.trim()&&!el.getAttribute('aria-label'):
      !el.labels?.length&&!el.getAttribute('aria-label')).map(el=>el.dataset.action||el.id),
     overflow:[...document.querySelectorAll('main,#dock,.app')].some(el=>el.scrollWidth>el.clientWidth+1),
     primary:[...document.querySelectorAll('#dock .primary')].map(el=>el.textContent.trim())};
   },route));
  }
  fs.writeFileSync(path.join(__dirname,'-cdx-audit-inventory.json'),JSON.stringify({
   date:'2026-11-11',scope:'HTML design sandbox; base-route inventory, not all state variants',screens:rows},null,2)+'\n');
  const findings=rows.filter(r=>!r.title||r.small.length||r.unlabelled.length||r.overflow||r.primary.length>1);
  console.log(JSON.stringify({screens:rows.length,findings,errors},null,2));
  if(!inspect){assert.deepEqual(errors,[]);assert.deepEqual(findings,[]);}
  if(inspect)return;
  let layouts=0;
  for(const [width,height,mode] of [[320,740,''],[320,740,'&text=large'],[768,1024,'&theme=dark'],[1024,768,'']]){
   await p.setViewportSize({width,height});
   for(const route of ['sell','pay','cashup','settings','stock','history','invoice-payment',
    'kept-checkout','return-items','staff','report-sales','fiscal-close']){
    await p.goto(`${url}?fresh=1&seed=1&screen=${route}&invoice=sample&kept=sample`+
     '&measure=sample&returns=sample&access=sample&reports=sample&fiscal=clear'+mode);
    assert(!(await p.evaluate(()=>[...document.querySelectorAll('main,#dock,.app')]
      .some(el=>el.scrollWidth>el.clientWidth+1))),`${route}: ${width} overflow`);
    assert(await p.locator('#screen').evaluate(el=>el.clientHeight>0));layouts++;
   }
  }
  for(const [device,width,height] of [['phone',390,844],['tablet',1024,768]]){
   await p.setViewportSize({width,height});
   await p.goto(url+'?fresh=1&seed=1&role=worker&screen=pay');await p.locator('#received').fill('5.00');
   await p.evaluate(()=>history.replaceState(null,'',location.pathname+'?role=worker&screen=pay'));await p.reload();
   await p.locator('#received').focus();await p.evaluate(()=>document.fonts.ready);
   await p.screenshot({path:path.join(__dirname,`-cdx-${device}-cash-recovery.png`)});
  }
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${rows.length} base-screen control checks, ${layouts} focused responsive layouts and two recovery captures.`);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
