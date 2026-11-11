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
 const captures=[['mobile',390,844],['tablet-portrait',768,1024],
  ['tablet-landscape',1024,768],['wide',1440,900],['full-width',1913,915]];
 try{
  const p=await b.newPage();p.setDefaultTimeout(15000);p.setDefaultNavigationTimeout(30000);
  const errors=[];p.on('pageerror',e=>errors.push(e.message));let layouts=0;
  for(const [name,width,height] of [...captures,['small-mobile',320,740]]){
   await p.setViewportSize({width,height});
   for(const mode of ['','&theme=dark','&text=large']){
    await p.goto(url+'?fresh=1&shelf=full&seed=1'+mode,{waitUntil:'domcontentloaded'});
    assert.equal(await p.locator('.product').count(),24);
    assert(!(await p.locator('.tabs .chip').evaluateAll(chips=>chips.some(el=>el.scrollWidth>el.clientWidth+1))),
      'Category names and counts must fit their own buttons');
    const stats=await p.evaluate(()=>{
     const main=document.querySelector('main').getBoundingClientRect();
     const cards=[...document.querySelectorAll('.product')].map(el=>el.getBoundingClientRect());
     return {columns:cards.filter(r=>Math.abs(r.top-cards[0].top)<2).length,
      visible:cards.filter(r=>r.top>=main.top&&r.bottom<=main.bottom).length,
      overflow:[...document.querySelectorAll('main,#dock,.app')].some(el=>el.scrollWidth>el.clientWidth+1)};
    });
    assert(!stats.overflow,`${width} ${mode} overflow`);
    if(!mode){
     if(width===1024)assert(stats.columns>=3&&stats.visible>=9,'Landscape tablet should show at least nine full cards');
     if(width>=1440)assert(stats.columns>=5&&stats.visible>=20,'Wide counter should show twenty or more full cards');
     if(width<700)assert.equal(stats.columns,2);
     if(width>=700)assert((await p.locator('#context').boundingBox()).width<=380);
     console.log(name+': '+stats.columns+' columns, '+stats.visible+' fully visible products');
    }
    layouts++;
   }
  }
  await p.setViewportSize({width:1440,height:900});
  await p.goto(url+'?fresh=1&shelf=full&seed=1',{waitUntil:'domcontentloaded'});
  await p.locator('[data-category="Favourites"]').click();assert.equal(await p.locator('.product').count(),12);
  await p.locator('[data-category="Household"]').click();assert.equal(await p.locator('.product').count(),6);
  await p.locator('#search').fill('rice');assert.equal(await p.locator('.product').count(),1);
  await p.setViewportSize({width:390,height:844});assert.equal(await p.locator('#search').inputValue(),'rice');
  assert.equal(await p.evaluate(()=>total()),350,'Resizing/filtering preserves the basket');
  for(const [name,width,height] of captures){
   await p.setViewportSize({width,height});
   await p.goto(url+'?fresh=1&shelf=full&seed=1',{waitUntil:'domcontentloaded'});
   await p.evaluate(()=>document.fonts.ready);
   await p.screenshot({path:path.join(__dirname,`-cdx-sell-density-${name}.png`)});
  }
  await p.setViewportSize({width:1440,height:900});
  await p.goto(url+'?fresh=1&shelf=full',{waitUntil:'domcontentloaded'});
  await p.screenshot({path:path.join(__dirname,'-cdx-sell-density-empty-basket.png')});
  for(const [name,screen,query] of [['payment','pay','seed=1&cash=500&role=worker'],
   ['reports','report-trend','reports=sample&period=last7']]){
   await p.setViewportSize({width:1024,height:768});
   await p.goto(`${url}?fresh=1&screen=${screen}&${query}`,{waitUntil:'domcontentloaded'});
   await p.evaluate(()=>document.fonts.ready);
   await p.screenshot({path:path.join(__dirname,`-cdx-preview-updated-${name}.png`)});
  }
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${layouts} density layouts, category/search/resize preservation and eight updated captures.`);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
