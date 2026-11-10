// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const assert=require('node:assert/strict');
const url=pathToFileURL(path.join(__dirname,'-cdx-counter.html')).href;
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const p=await browser.newPage({viewport:{width:390,height:844}});
    const errors=[];p.on('pageerror',e=>errors.push(e.message));
    const act=a=>p.locator(`[data-action="${a}"]:visible`).first().click();
    await p.goto(url+'?role=worker&screen=opening&fresh=1');
    assert.equal(await p.locator('h1').innerText(),'Open your till.');
    await p.locator('#float-usd').fill('10.00');await act('open-shift');
    assert.match(await p.locator('.identity').innerText(),/Rudo/);
    await p.locator('[data-id="bread"][data-action="add"]').click();
    await act('sale-options');await act('hold');assert.match(await p.locator('#screen').innerText(),/Let’s sell/);
    await act('held');await act('resume-held');
    assert.equal(await p.locator('.total').innerText(),'USD 1.00');
    await act('pay');await p.locator('#received').fill('5.00');await act('complete');
    assert.match(await p.locator('#screen').innerText(),/USD 4.00/);
    await act('next');await act('money');
    assert.match(await p.locator('h1').innerText(),/My till/);
    assert.equal(await p.locator('[data-action="records"]').count(),0);
    await act('cashup');await p.locator('#counted-usd').fill('10.50');
    await act('review-count');assert.match(await p.locator('#screen').innerText(),/USD 0.50 short/);
    assert(await p.locator('[data-action="close-shift"]').isDisabled());
    await p.locator('#variance-note').fill('Counted twice. Missing a coin.');await act('close-shift');
    assert.match(await p.locator('#screen').innerText(),/Shift closed/);
    await p.goto(url+'?role=worker&screen=records');
    assert.match(await p.locator('h1').innerText(),/Owner access/);
    await p.goto(url+'?role=owner&screen=receive&fresh=1');
    await p.locator('#receive-qty').fill('6');await p.locator('#receive-supplier').selectOption('other');
    await act('review-receive');
    assert.match(await p.locator('#screen').innerText(),/24 loaves/);
    assert.match(await p.locator('#screen').innerText(),/Other \/ not named/);
    await act('receive');assert.equal(await p.locator('#receive-qty').inputValue(),'6');
    assert.equal(await p.locator('#receive-supplier').inputValue(),'other');await act('review-receive');
    await act('save-receive');await act('stock');
    assert.match(await p.locator('#screen').innerText(),/24 loaves/);
    await p.goto(url+'?screen=expense&fresh=1');
    await p.locator('#expense-amount').fill('2.00');
    await p.locator('#expense-note').fill('Bus fare');await act('review-expense');
    await p.locator('#approval-pin').fill('123456');await act('save-expense');await act('money');
    assert.match(await p.locator('#screen').innerText(),/USD 68.50/);
    await p.goto(url+'?screen=setup&fresh=1');
    assert.equal(await p.locator('#pricing-currency').inputValue(),'');
    assert(await p.locator('[data-action="setup-save"]').isDisabled());
    assert(!(await p.locator('.appbar').isVisible()));
    await p.goto(url+'?screen=settings&fresh=1');
    assert(!(await p.locator('#shop-rate').isVisible()));
    await p.locator('#feature-multi').check();assert(await p.locator('#shop-rate').isVisible());
    await p.goto(url+'?screen=receive&fresh=1');
    assert.equal(await p.locator('nav [aria-current="page"]').innerText(),'Stock');
    assert.deepEqual(errors,[]);
    console.log('PASS: worker opening, held sale, cash/change, scoped till, explained shortage, '+
      'handover, owner boundary, retained delivery review, expense, setup currency and progressive settings.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
