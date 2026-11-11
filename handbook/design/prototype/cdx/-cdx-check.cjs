// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// All checks and deliberate design captures. Requires Playwright and Edge.
const {chromium}=require('playwright');
const {execFileSync}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const assert=require('node:assert/strict');
const addedChecks=process.argv.includes('--existing-only')?[]:
  ['-cdx-sell-density-check.cjs','-cdx-language-ui-check.cjs','-cdx-discounts-check.cjs',
   '-cdx-owner-reports-check.cjs','-cdx-walkthrough-check.cjs',
   '-cdx-review-drafts-check.cjs','-cdx-coverage-check.cjs'];
const checks=[...addedChecks,'-cdx-audit-check.cjs','-cdx-workflows-check.cjs','-cdx-journeys-check.cjs',
  '-cdx-responsive-check.cjs','-cdx-invoice-check.cjs','-cdx-kept-check.cjs',
  '-cdx-quantity-returns-check.cjs','-cdx-access-check.cjs','-cdx-reports-check.cjs',
  '-cdx-connection-check.cjs','-cdx-fiscal-check.cjs'];
const from=process.argv.find(arg=>arg.startsWith('--from='))?.slice(7);
const start=from?checks.indexOf(`-cdx-${from}-check.cjs`):0;
if(start<0)throw Error('Unknown check to resume: '+from);
for(const file of checks.slice(start))
  execFileSync(process.execPath,[path.join(__dirname,file)],{stdio:'inherit'});
(async()=>{
  const b=await chromium.launch({channel:'msedge',headless:true});
  try{
    const p=await b.newPage({viewport:{width:390,height:844}});
    const errors=[],failed=[];p.on('pageerror',e=>errors.push(e.message));
    p.on('requestfailed',r=>failed.push(r.url()));
    const url=pathToFileURL(path.join(__dirname,'-cdx-counter.html')).href;
    const scenes=['sell','pay','opening','cashup','money','shop','stock','product',
      'receive','stock-count','product-edit','expense','customers','customer','suppliers',
      'supplier-statement','reports','people','staff','settings','records','export','restore','connect','pair',
      'history','receipt','refund','quick','mobile','pending','credit','mixed','welcome',
      'setup','join','locked','switch-person','sync','help','fiscal','print',
      'receive-review','count-review','handover','count-stock-review','expense-review',
      'refund-review','first-product','done'];
    const reviews=['receive-review','count-review','handover','count-stock-review','expense-review',
      'refund-review','first-product','done'];
    let layouts=0;
    for(const [width,height] of [[320,844],[390,844],[768,1024],[1024,768]]){
      await p.setViewportSize({width,height});
      for(const mode of ['', '&theme=dark','&text=large']){
        for(const scene of scenes){
          await p.goto(`${url}?fresh=1&seed=1&screen=${reviews.includes(scene)?'sell':scene}${mode}`);
          if(reviews.includes(scene))await p.evaluate(target=>{
            draft.receive={id:'bread',qty:6,ref:'SAMPLE-1'};
            draft.counted=7000;draft.countedZwg=0;draft.kept=1000;draft.keptZwg=0;
            draft.stockCount=[{id:'bread',before:18,count:16}];
            draft.expense={kind:'expense',amount:200,note:'Sample bus fare'};
            draft.refund={reason:'wrong',restock:true};
            draft.setupCurrency='USD';draft.setupName='Practice shop';
            lastSale=receiptList()[0];page=target;render();
          },scene);
          assert(await p.locator('h1').count(),`No screen: ${scene}`);
          const overflow=await p.evaluate(()=>[...document.querySelectorAll('main,#dock,nav,.app')]
            .some(el=>el.scrollWidth>el.clientWidth+1));
          assert(!overflow,`Horizontal overflow: ${width} ${scene} ${mode}`);
          const unlabelled=await p.evaluate(()=>{
            const visible=el=>el.getBoundingClientRect().width>0&&el.getBoundingClientRect().height>0;
            return [...document.querySelectorAll('input,select')].filter(visible).some(el=>
              !el.labels?.length&&!el.getAttribute('aria-label'))||
              [...document.querySelectorAll('button')].filter(visible).some(el=>
                !el.textContent.trim()&&!el.getAttribute('aria-label'));
          });
          assert(!unlabelled,`Unlabelled control: ${scene}`);
          const dock=await p.locator('#dock').boundingBox();
          assert(!dock||dock.y+dock.height<=height+1,`Unreachable action: ${width} ${scene} ${mode}`);
          layouts++;
        }
        for(const scene of ['sell','money','shop','stock','cashup','opening','expense','records']){
          await p.goto(`${url}?fresh=1&seed=1&role=worker&screen=${scene}${mode}`);
          const overflow=await p.locator('main').evaluate(el=>el.scrollWidth>el.clientWidth+1);
          assert(!overflow,`Worker overflow: ${width} ${scene} ${mode}`);layouts++;
        }
      }
    }
    for(const state of ['loading','empty','error','interrupted']){
      await p.goto(`${url}?fresh=1&state=${state}`);
      assert(await p.locator('#catalog .empty').isVisible());
    }
    await p.goto(`${url}?fresh=1&offline=1&seed=1`);
    assert(!(await p.locator('[data-action="pay"]').isDisabled()));
    for(const state of ['confirmed','failed']){
      await p.goto(`${url}?fresh=1&seed=1&screen=pending&state=${state}`);
      assert.match(await p.locator('h1').innerText(),state==='confirmed'?/confirmed/:/failed/);
    }
    await p.setViewportSize({width:390,height:844});
    for(const [name,params] of [['sell','seed=1'],['payment','seed=1&screen=pay&cash=500'],
      ['money','screen=money'],['worker','role=worker&screen=money'],['stock','screen=stock'],
      ['opening','role=worker&screen=opening'],['cashup','role=worker&screen=cashup']]){
      await p.goto(`${url}?fresh=1&${params}`);await p.evaluate(()=>document.fonts.ready);
      await p.screenshot({path:path.join(__dirname,`-cdx-${name}.png`)});
    }
    for(const [name,width,height,params] of [
      ['tablet-sell-landscape',1024,768,'seed=1'],
      ['tablet-sell-portrait',768,1024,'seed=1'],
      ['tablet-payment',1024,768,'seed=1&screen=pay&cash=500'],
      ['tablet-stock',1024,768,'screen=stock'],
      ['tablet-receipts',1024,768,'screen=history'],
      ['tablet-customer',1024,768,'screen=customer']]){
      await p.setViewportSize({width,height});await p.goto(`${url}?fresh=1&${params}`);
      if(name==='tablet-customer'){
        await p.locator('#customer-amount').fill('5.00');
        await p.locator('[data-action="review-collection"]').click();
        await p.locator('[data-action="save-collection"]').click();
        await p.locator('[data-action="customer"]:visible').first().click();
      }
      await p.evaluate(()=>document.fonts.ready);
      await p.screenshot({path:path.join(__dirname,`-cdx-${name}.png`)});
    }
    console.log(`PASS: ${layouts} layout combinations; capturing design boards.`);
    execFileSync(process.execPath,[path.join(__dirname,'-cdx-capture-boards.cjs')],{stdio:'inherit'});
    assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
    console.log(`PASS: ${layouts} owner/worker device/tablet layouts, light/dark/200% text; `+
      'shelf states, offline cash, pending outcomes, local fonts/assets, device/tablet captures.');
  }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
