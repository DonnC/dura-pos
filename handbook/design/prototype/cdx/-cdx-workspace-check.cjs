// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {familyRoutes}=require('./-cdx-coverage-cases.js');
const examples=['money','shop','stock','pay','invoice-items','invoice-review','customer',
 'receipt','pending','discount-review','count-review','report-trend','report-products'];
const roots=['sell','stock','money','shop'];
const onboarding=['welcome','setup','first-product','join','join-review','join-status'];
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 const url=pathToFileURL(path.join(__dirname,'-cdx-counter.html')).href;
 const fixture=scene=>url+'?fresh=1&seed=1&invoice=sample&kept=sample&measure=sample&returns=sample'+
  '&access=sample&reports=sample&recovery=ready&fiscal=unknown&catalog=base-'+scene+'&screen='+scene+
  (scene==='stock'?'&shelf=full':'')+(scene.startsWith('report-')?'&period=last7':'');
 try{
  const p=await b.newPage({viewport:{width:1024,height:768}});
  p.setDefaultTimeout(15000);p.setDefaultNavigationTimeout(30000);
  const errors=[];p.on('pageerror',e=>errors.push(e.message));const audit=[];
  for(const scene of Object.values(familyRoutes).flat()){
   await p.goto(fixture(scene),{waitUntil:'domcontentloaded'});
   await p.locator(`body[data-catalog-ready="base-${scene}"]`).waitFor();
   const actual=await p.evaluate(()=>page);
   assert.equal(await p.locator('.appbar').isVisible(),roots.includes(actual),scene+' header policy');
   if(!roots.includes(actual)&&!onboarding.includes(actual)&&!['done','receipt'].includes(actual))
    assert(await p.locator('.task-identity').count(),scene+' signed-in role');
   const dimensions=await p.evaluate(()=>({
    overflow:[...document.querySelectorAll('main,#dock,.app')].some(el=>el.scrollWidth>el.clientWidth+1),
    mainTop:Math.round(document.querySelector('main').getBoundingClientRect().top),
    paired:!!document.querySelector('.task-workspace,.invoice-layout,.account-layout,.kept-layout,.return-layout,.report-detail-workspace')
   }));assert(!dimensions.overflow,scene+' overflows');
   audit.push({screen:scene,actual,header:roots.includes(actual)?'Shop identity':'Task identity',...dimensions});
  }
  fs.writeFileSync(path.join(__dirname,'-cdx-workspace-audit.json'),JSON.stringify({
   date:'2026-11-12',scope:'Browser design review at 1024 × 768; not physical-device verification',screens:audit
  },null,2)+'\n');
  let layouts=0;
  for(const [width,height] of [[320,740],[768,1024],[1024,768],[1440,900]]){
   await p.setViewportSize({width,height});
   for(const mode of ['','&theme=dark','&text=large'])for(const scene of examples){
    await p.goto(fixture(scene)+mode,{waitUntil:'domcontentloaded'});
    assert(!(await p.evaluate(()=>[...document.querySelectorAll('main,#dock,.app')]
     .some(el=>el.scrollWidth>el.clientWidth+1))),`${width} ${scene} ${mode}`);
    const dock=await p.locator('#dock').boundingBox();assert(!dock||dock.y+dock.height<=height+1);
    layouts++;
   }
  }
  await p.goto(url+'?fresh=1&seed=1&role=worker&screen=pay',{waitUntil:'domcontentloaded'});
  await p.locator('#received').fill('5.00');
  for(const [width,height] of [[390,844],[1024,768],[1440,900]]){
   await p.setViewportSize({width,height});assert(!(await p.locator('.appbar').isVisible()));
   assert.equal(await p.locator('#received').inputValue(),'5.00');
   assert.equal(await p.locator('#change').innerText(),'USD 1.50');
   assert.match(await p.locator('.task-identity').innerText(),/Rudo · Cashier/);
  }
  await p.locator('.back[data-action="sell"]').click();assert(await p.locator('.appbar').isVisible());
  assert.equal(await p.locator('.total').innerText(),'USD 3.50');
  await p.goto(url+'?fresh=1&role=worker&screen=cashup',{waitUntil:'domcontentloaded'});
  assert(!/Expected cash|USD 20.50/.test(await p.locator('main').innerText()),'Blind cash count stays blind');
  const captureScenes=['money','shop','stock','pay','invoice-items','invoice-review','receipt',
   'pending','discount-review','report-trend','report-products'];
  for(const [device,width,height] of [['mobile',390,844],['tablet',1024,768]]){
   await p.setViewportSize({width,height});
   for(const scene of captureScenes){
    await p.goto(fixture(scene),{waitUntil:'domcontentloaded'});
    if(scene==='pay'){await p.locator('#received').fill('5.00');}
    await p.evaluate(async()=>{await document.fonts.ready;document.querySelector('main').scrollTop=0;});
    await p.screenshot({path:path.join(__dirname,`-cdx-space-${device}-${scene}.png`)});
   }
  }
  await p.setViewportSize({width:1440,height:900});
  await p.goto(fixture('report-products'),{waitUntil:'domcontentloaded'});
  await p.evaluate(()=>document.fonts.ready);
  assert.equal(await p.locator('.report-detail-workspace').evaluate(el=>getComputedStyle(el).display),'grid');
  await p.screenshot({path:path.join(__dirname,'-cdx-space-wide-report-products.png')});
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${audit.length} screen audits, ${layouts} layouts, task/root headers, role/resize/basket/float checks; 23 captures.`);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
