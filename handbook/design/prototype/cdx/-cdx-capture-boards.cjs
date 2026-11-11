// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const {writeFileSync}=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await b.newPage({viewport:{width:1440,height:1560}}),errors=[],failed=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>failed.push(r.url()));
  await p.goto(pathToFileURL(path.join(__dirname,'-cdx-preview.html')).href);
  for(const [journey,name] of [['sell','overview'],['shift','shift-board'],
    ['stock','stock-board'],['owner','owner-board'],['start','setup-board']]){
   const ready=p.frames().filter(f=>f!==p.mainFrame()).map(f=>f.waitForNavigation({waitUntil:'load'}));
   await p.locator(`[data-journey="${journey}"]`).click();await Promise.all(ready);
   await Promise.all(p.frames().map(f=>f.evaluate(()=>document.fonts.ready)));
   const png=await p.screenshot({fullPage:true});let filename=`-cdx-${name}.png`;
   try{writeFileSync(path.join(__dirname,filename),png);}catch(error){
    if(!['EPERM','EBUSY','EACCES','UNKNOWN'].includes(error.code))throw error;
    // Windows previewers can hold an older PNG open. Preserve it and save a fresh copy.
    filename=`-cdx-${name}-latest.png`;writeFileSync(path.join(__dirname,filename),png);
    console.log('Existing capture unavailable for overwrite; saved '+filename);
   }
   assert(png.length>10000,'Empty design board capture');
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  console.log('PASS: five design boards, local assets and browser errors.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
