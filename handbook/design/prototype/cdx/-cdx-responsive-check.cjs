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
  try{
    const p=await browser.newPage({viewport:{width:1024,height:768}});
    const url=pathToFileURL(path.join(__dirname,'-cdx-counter.html')).href;
    const act=a=>p.locator(`[data-action="${a}"]:visible`).first().click();
    await p.goto(url+'?fresh=1&seed=1');
    assert((await p.locator('.app').boundingBox()).width>=1000,'Tablet must use the viewport');
    assert(await p.locator('#context').isVisible(),'Tablet Sell must expose the basket');
    const main=await p.locator('main').boundingBox(),aside=await p.locator('#context').boundingBox();
    assert(aside.x>=main.x+main.width-1,'Catalogue and basket must be side by side');
    await p.locator('#context [data-action="context-plus"][data-id="bread"]').click();
    assert.match(await p.locator('#context').innerText(),/USD 4.50/);
    await p.setViewportSize({width:390,height:844});
    assert(!(await p.locator('#context').isVisible()));
    assert.equal(await p.locator('.total').innerText(),'USD 4.50');
    await act('pay');await p.locator('#received').fill('5.00');
    await p.setViewportSize({width:1024,height:768});
    assert.equal(await p.locator('#received').inputValue(),'5.00');
    assert.match(await p.locator('#context').innerText(),/Bread/);
    assert.equal(await p.locator('#change').innerText(),'USD 0.50');
    const change=await p.locator('#change-copy').boundingBox(),dock=await p.locator('#dock').boundingBox();
    assert(change.y+change.height<=dock.y+1,'Tablet checkout should show change above the action');
    await p.goto(url+'?fresh=1&screen=stock');
    await p.locator('#stock-search').fill('milk');
    assert.match(await p.locator('#stock-list').innerText(),/Fresh milk/);
    assert.doesNotMatch(await p.locator('#stock-list').innerText(),/Bread/);
    assert.match(await p.locator('#context').innerText(),/Fresh milk/);
    await p.locator('#stock-list [data-action="product"]').click();
    assert.match(await p.locator('h1').innerText(),/Your stock/);
    await p.locator('#stock-search').fill('');await act('stock-low');
    assert.match(await p.locator('#stock-list').innerText(),/Mealie meal/);
    await act('stock-out');assert.match(await p.locator('#stock-list').innerText(),/Nothing out of stock/);
    await p.goto(url+'?fresh=1&screen=history');
    await p.locator('#receipt-search').fill('NOT-A-SALE');
    assert.match(await p.locator('#receipt-list').innerText(),/No matching receipts/);
    await act('clear-receipt-search');await act('open-receipt');
    assert.match(await p.locator('#screen').innerText(),/T-P1-S261110-0008/);
    await p.goto(url+'?fresh=1&screen=customer');
    assert.match(await p.locator('#statement').innerText(),/Opening balance/);
    await p.locator('#customer-amount').fill('5.00');await act('review-collection');
    await act('save-collection');await act('customer');
    assert.match(await p.locator('#statement').innerText(),/Cash payment/);
    assert.match(await p.locator('#statement').innerText(),/USD 9.50/);
    await p.goto(url+'?fresh=1&screen=supplier-statement');await act('supplier-pay');
    await p.locator('#expense-amount').fill('5.00');await p.locator('#expense-note').fill('Part payment');
    await act('review-expense');await p.locator('#approval-pin').fill('123456');await act('save-expense');
    await act('money');await act('suppliers');await act('supplier-statement');
    assert.match(await p.locator('#statement').innerText(),/Cash payment/);
    assert.match(await p.locator('#statement').innerText(),/USD 15.00/);
    await p.goto(url+'?fresh=1&role=worker&screen=supplier-statement');
    assert.match(await p.locator('h1').innerText(),/Owner access/);
    await p.goto(pathToFileURL(path.join(__dirname,'-cdx-preview.html')).href);
    await p.locator('#device').selectOption('landscape');
    const frame=p.frameLocator('#primary');await frame.locator('#context').waitFor({state:'visible'});
    assert.equal(await frame.locator('body').evaluate(()=>innerWidth),1024);
    await frame.locator('[data-action="add"][data-id="bread"]').click();
    await p.locator('#device').selectOption('phone');
    await frame.locator('#context').waitFor({state:'hidden'});
    assert.equal(await frame.locator('.total').innerText(),'USD 4.50');
    console.log('PASS: tablet columns, live basket, resize/input preservation, stock filters, receipt search and account statement.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
