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
for(const file of ['-cdx-workflows-check.cjs','-cdx-journeys-check.cjs'])
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
      'reports','people','staff','settings','records','export','restore','connect','pair',
      'history','receipt','refund','quick','mobile','pending','credit','mixed','welcome',
      'setup','join','locked','switch-person','sync','help','fiscal','print',
      'receive-review','count-review','handover','count-stock-review','expense-review',
      'refund-review','first-product','done'];
    const reviews=['receive-review','count-review','handover','count-stock-review','expense-review',
      'refund-review','first-product','done'];
    let layouts=0;
    for(const width of [320,390]){
      await p.setViewportSize({width,height:844});
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
          assert(!dock||dock.y+dock.height<=845,`Unreachable action: ${width} ${scene} ${mode}`);
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
    await p.setViewportSize({width:1440,height:1560});
    await p.goto(pathToFileURL(path.join(__dirname,'-cdx-preview.html')).href);
    console.log(`PASS: ${layouts} layout combinations; capturing design boards.`);
    for(const [journey,name] of [['sell','overview'],['shift','shift-board'],
      ['stock','stock-board'],['owner','owner-board'],['start','setup-board']]){
      const ready=p.frames().filter(f=>f!==p.mainFrame()).map(f=>f.waitForNavigation({waitUntil:'load'}));
      await p.locator(`[data-journey="${journey}"]`).click();
      await Promise.all(ready);
      await Promise.all(p.frames().map(f=>f.evaluate(()=>document.fonts.ready)));
      await p.screenshot({path:path.join(__dirname,`-cdx-${name}.png`),fullPage:true});
    }
    assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
    console.log(`PASS: ${layouts} owner/worker layouts at 320/390px, light/dark/200% text; `+
      'shelf states, offline cash, pending outcomes, local fonts/assets, 12 design captures.');
  }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
