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
    const p=await b.newPage({viewport:{width:390,height:844}});
    const url=pathToFileURL(path.join(__dirname,'-cdx-counter.html')).href;
    const act=a=>p.locator(`[data-action="${a}"]:visible`).first().click();
    await p.goto(url+'?fresh=1&seed=1');
    await act('pay');await p.locator('#received').fill('5.001');
    assert(await p.locator('[data-action="complete"]').isDisabled());
    await p.locator('#received').fill('3.00');
    assert.match(await p.locator('#payment-error').innerText(),/USD 0.50/);
    await act('sell');await act('profile');
    assert(await p.locator('dialog').evaluate(el=>el.contains(document.activeElement)));
    await p.keyboard.press('Escape');assert(!(await p.locator('dialog').isVisible()));
    await act('profile');await act('lock');
    assert.equal(await p.locator('h1').innerText(),'Your till is locked.');
    await p.locator('#unlock-pin').fill('111111');await act('unlock');
    assert.match(await p.locator('#pin-error').innerText(),/didn’t match/);
    await p.locator('#unlock-pin').fill('123456');await act('unlock');
    assert.equal(await p.locator('.total').innerText(),'USD 3.50');
    await p.goto(url);
    assert.equal(await p.locator('.total').innerText(),'USD 3.50');
    await p.goto(url+'?fresh=1&seed=1&screen=mixed');
    await p.locator('#mixed-usd').fill('1.00');await p.locator('#mixed-zwg').fill('67.50');
    await act('save-mixed');await act('receipt');
    assert.match(await p.locator('#screen').innerText(),/ZWG 67.50/);
    assert.match(await p.locator('#screen').innerText(),/ZWG 27.00/);
    await act('money');assert.match(await p.locator('#screen').innerText(),/USD 71.50/);
    await p.goto(url+'?fresh=1&seed=1&screen=credit');
    await p.locator('#credit-customer').selectOption('tariro');await act('save-credit');
    await act('next');await act('money');assert.match(await p.locator('#screen').innerText(),/USD 70.50/);
    await p.goto(url+'?fresh=1&screen=customer');
    await p.locator('#customer-amount').fill('5.00');await act('review-collection');
    await act('save-collection');assert.match(await p.locator('#screen').innerText(),/USD 9.50/);
    await p.goto(url+'?fresh=1&screen=refund');
    await p.locator('#return-reason').selectOption('wrong');
    await act('review-refund');await p.locator('#approval-pin').fill('123456');await act('save-refund');
    await act('history');await act('open-receipt');
    assert.equal(await p.locator('[data-action="refund"]').count(),0);
    await act('money');assert.match(await p.locator('#screen').innerText(),/USD 67.00/);
    await p.goto(url+'?fresh=1&screen=stock-count');
    await p.locator('#count-bread').fill('0');await act('review-stock-count');
    assert(await p.locator('[data-action="save-stock-count"]').isDisabled());
    await p.locator('#count-reason').fill('Damaged loaves removed');await act('save-stock-count');
    await act('stock');assert.match(await p.locator('#screen').innerText(),/0 loaves/);
    await p.goto(url+'?fresh=1&seed=1&screen=pending');
    await act('sell');assert.equal(await p.locator('.total').innerText(),'USD 0.00');
    assert.match(await p.locator('#screen').innerText(),/1 unconfirmed payment/);
    await p.locator('[data-action="add"][data-id="bread"]').click();
    await act('pending');await act('check-payment');
    assert.match(await p.locator('h1').innerText(),/Waiting for payment/);
    await act('sell');assert.equal(await p.locator('.total').innerText(),'USD 1.00');
    await p.goto(url+'?fresh=1&screen=setup');
    await p.locator('#setup-name').fill('Mbare produce');
    await p.locator('#pricing-currency').selectOption('ZWG');await act('setup-save');
    await p.locator('#first-name').fill('Tomatoes');await p.locator('#first-unit').fill('1 bag');
    await p.locator('#first-price').fill('20.00');await act('first-save');await act('open-shift');
    assert.match(await p.locator('#screen').innerText(),/ZWG 20.00/);
    assert.doesNotMatch(await p.locator('#screen').innerText(),/USD/);
    console.log('PASS: cash validation, lock/recovery, exact split and retained rate, account sale, '+
      'collection, approved linked return, zero stock count, pending isolation and ZWG onboarding.');
  }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
