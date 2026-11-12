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
 const p=await b.newPage({viewport:{width:390,height:844}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(10000);
 const act=a=>p.locator(`[data-action="${a}"]:visible`).first().click();
 await p.goto(url+'?fresh=1&take=large&screen=stock-count',{waitUntil:'domcontentloaded'});
 await p.locator('#count-bread').fill('16');
 assert.match(await p.locator('#take-feedback-bread').innerText(),/-2/);
 await p.locator('[data-action="take-item-reason"][data-id="bread"]').click();
 await p.locator('#take-item-kind').selectOption('other');await p.locator('#take-item-note').fill('Damaged loaves removed');
 await act('take-reason-done');await p.locator('#count-milk').fill('12');
 await act('review-stock-count');
 if(await p.locator('#review-checked').count())await p.locator('#review-checked').check();
 assert(!(await p.locator('[data-action="save-stock-count"]').isDisabled()),'Individual reason covers the difference');
 await act('save-stock-count');assert.equal(await p.evaluate(()=>s.takeHistory.length),1);
 assert.equal(await p.evaluate(()=>s.takeHistory[0].lines[0].reason),'Damaged loaves removed');
 assert.equal(await p.evaluate(()=>s.takeHistory[0].untouched),498);
 await p.evaluate(()=>{products()[0].stock=99;save();navigate('take-history');});
 await act('take-history-open');assert.match(await p.locator('#take-history-lines').innerText(),/16 loaves/);
 assert.match(await p.locator('#take-history-lines').innerText(),/18 loaves/);
 await p.evaluate(()=>history.replaceState(null,'',location.pathname+'?screen=take-history-detail'));
 await p.reload({waitUntil:'domcontentloaded'});assert.match(await p.locator('#take-history-lines').innerText(),/Damaged loaves removed/);
 let layouts=0;
 for(const width of [320,390,768,1024])for(const appearance of ['light','dark','large']){
  await p.setViewportSize({width,height:width>=768?1024:844});
  for(const id of ['change-ZWG','change-split','change-receipt','take-item-reason','take-history-saved','take-history-detail']){
   await p.goto(url+'?fresh=1&seed=1&screen=mixed&catalog='+id+'&take=large&theme='+appearance+(appearance==='large'?'&text=large':''),{waitUntil:'domcontentloaded'});
   if(appearance==='large')await p.evaluate(()=>document.documentElement.classList.add('large'));
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+' overflow at '+width);
   layouts++;
  }
 }
 for(const [device,width,height] of [['phone',390,844],['tablet',1024,768]]){
  await p.setViewportSize({width,height});
  for(const id of ['change-ZWG','change-split','change-receipt','take-item-reason','take-history-detail']){
   await p.goto(url+'?fresh=1&seed=1&take=large&catalog='+id,{waitUntil:'domcontentloaded'});
   await p.evaluate(()=>document.fonts.ready);
   await p.screenshot({path:path.join(__dirname,'-cdx-'+id+'-'+device+'.png')});
  }
 }
 assert.deepEqual(errors,[]);console.log('PASS: count feedback, per-item reasons, immutable history, reload, '+layouts+' layouts and 10 captures.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
