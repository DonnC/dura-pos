// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

function receiptList(){
  const sample={id:'T-P1-S261110-0008',items:[{...initialProducts[0],qty:2},
    {...initialProducts[1],qty:1}],amount:350,received:500,change:150,method:'Cash',
    who:s.name,currency:s.currency,status:'Saved on device'};
  return [...s.history,...(s.seedDay?[sample]:[])].filter((r,i,a)=>a.findIndex(x=>x.id===r.id)===i);
}
let receiptSearch='',receiptFilter='all';
screens.history=()=>{
  screen.innerHTML=heading('Recent sales.',s.role==='worker'?'Your sales on this till':'Front counter · This device','money')+
    `<div class="search feature-search"><div class="searchbox">${icon('search')}
    <input id="receipt-search" aria-label="Find a receipt" placeholder="Receipt, product or cashier"
      value="${esc(receiptSearch)}"></div></div><div class="tabs">${[
      ['all','All receipts'],['cash','Cash'],['account','On account'],['returns','With returns']]
      .concat(s.features.mobile||receiptList().some(r=>r.method==='Mobile money')?[['mobile','Mobile money']]:[])
      .map(([k,l])=>btn('receipt-filter',l,'chip',`data-filter="${k}" aria-pressed="${receiptFilter===k}"`)).join('')}</div>`+
    '<div id="receipt-list"></div>'+
    note('Latest practice receipts, not the complete seeded day. Returns create a linked record; the original receipt stays.');
  drawReceipts();
};
function drawReceipts(){
  const matches=receiptList().filter(r=>(s.role==='owner'||r.who===s.name)&&
    (receiptFilter==='all'||receiptFilter==='cash'&&/cash/i.test(r.method)||
      receiptFilter==='account'&&r.method==='On account'||receiptFilter==='mobile'&&r.method==='Mobile money'||
      receiptFilter==='returns'&&hasReturns(r))&&
    [r.id,r.who,r.customer||'',...r.items.map(p=>p.name)].join(' ').toLowerCase().includes(receiptSearch.toLowerCase()));
  document.querySelector('#receipt-list').innerHTML=matches.map(r=>'<div class="receipt-list-row">'+menu('open-receipt',money(r.amount,r.currency),
    `${esc(r.who)} · ${esc(r.method)}${hasReturns(r)?' · Return linked':''} · ${esc(r.id)}`,
    'receipt',`data-id="${r.id}"`)+
    (canReturn(r)&&!(s.refunds||[]).includes(r.id)?btn('return-from-history','Return','text-button',`data-id="${r.id}"`):'')+
    '</div>').join('')||`<div class="empty compact"><h2>No matching receipts.</h2>
    <p class="sub">Try a shorter search or include all payment types. Unconfirmed payments are not completed sales.</p>
    ${btn('clear-receipt-search','Show all receipts')}</div>`;
}
inputActions.history=el=>{if(el.id==='receipt-search'){receiptSearch=el.value;drawReceipts();}};
actions['receipt-filter']=b=>{receiptFilter=b.dataset.filter;screens.history();};
actions['clear-receipt-search']=()=>{receiptSearch='';receiptFilter='all';screens.history();};
actions['open-receipt']=b=>{lastSale=receiptList().find(r=>r.id===b.dataset.id);navigate('receipt');};
actions['return-from-history']=b=>{
  const r=receiptList().find(r=>r.id===b.dataset.id);
  if(!r||!canReturn(r)||(s.refunds||[]).includes(r.id))return;
  lastSale=r;navigate('return-items');
};
screens.receipt=()=>renderReceipt(false);
function renderReceipt(checkout=false){
  clearTimeout(toastTimer);document.querySelector('#toast').classList.remove('visible');
  if(!lastSale)lastSale=receiptList()[0];
  if(s.role==='worker'&&lastSale?.who!==s.name)lastSale=receiptList().find(r=>r.who===s.name);
  if(!lastSale){screen.innerHTML=heading('No receipt yet.','Your first saved sale will appear here.','sell');return;}
  const r=lastSale;
  const failed=checkout&&saleSaveError;
  screen.innerHTML=(checkout?'':btn('history',icon('back')+' Back','back'))+
    '<h1 class="receipt-sr-only">'+(failed?'Sale not saved':'Receipt')+'</h1>'+
    (failed?'<p class="receipt-save-error" role="alert">Couldn’t save. Retry this sale; don’t take payment again.</p>':'')+
    `<div class="receipt-paper"><div class="receipt-header"><h2>${esc(s.shop)}</h2>`+
    (failed?'':'<span class="receipt-check" role="img" aria-label="Sale completed">'+icon('check')+'</span>')+
    `</div><p class="micro">${esc(r.id)}<br>
    ${esc(r.who)} · Front counter</p><div class="receipt-details">${summaryRows(r.items)}</div>
    ${r.discountTotal?line('Subtotal',money(r.subtotal,r.currency))+
      line('Discounts','− '+money(r.discountTotal,r.currency)):''}
    ${line('Total',money(r.amount,r.currency))}${line('Payment',esc(r.method))}
    ${r.method==='Cash'?line('Cash received',money(r.received,r.currency))+
      line('Change given',money(r.change,r.currency)):''}
    ${keptReceiptRows(r)}
    ${r.payments?r.payments.filter(p=>p.amount>0).map(p=>line('Cash received',money(p.amount,p.currency))).join('')+
      (r.changePayments||[]).map(p=>line('Change given',money(p.amount,p.currency))).join('')+
      (r.changePayments&&Math.round((r.roundingZwgSubcent||0)/100)?line('Rounding',money(Math.round(r.roundingZwgSubcent/100),'ZWG')):'')+
      line('Rate kept with sale',`USD 1.00 = ${money(r.rateMinor,'ZWG')}`):''}</div>
    <div class="split">${btn('share-receipt','Share receipt','secondary',saleSaveError&&checkout?'disabled':'')}${btn('print','Print receipt','secondary',saleSaveError&&checkout?'disabled':'')}</div>
    ${checkout?'':returnHistory(r)}`;
  if(checkout)primary(saleSaveError?'retry-sale-save':'next',saleSaveError?'Retry saving this sale':
    count()?'Return to current sale':'Next customer');
}
actions['share-receipt']=()=>showSheet('Share receipt',
  `<div class="receipt-paper"><h3>${esc(s.shop)}</h3>${line('Sale',money(lastSale.amount))}
  <p class="micro">${esc(lastSale.id)} · Practice copy</p></div>
  <p class="note">The Android share sheet opens here in the app. Nothing is sent from this preview.</p>`);
screens.print=()=>{
  screen.innerHTML=heading('Print receipt.','Print another copy without making another sale.','receipt')+
    `<div class="empty">${icon('receipt')}<h2>No printer connected.</h2>
    <p class="sub">Turn on your Bluetooth receipt printer and pair it in Android settings.</p></div>`+
    note('The receipt is already saved. A print problem never repeats the sale.');
  primary('find-printer','Find a printer');
};
actions['find-printer']=()=>showSheet('Available printers',
  '<p class="sub">No Bluetooth devices are available in this browser preview.</p>',
  btn('receipt','Back to saved receipt','primary'));
screens.refund=()=>{
  if(!lastSale)lastSale=receiptList()[0];
  if(!lastSale){navigate('history');return;}
  if(s.returnTotals?.[lastSale.id]){navigate('return-items');return;}
  screen.innerHTML=heading('Return this sale.',esc(lastSale.id),'receipt')+
    summaryRows(lastSale.items)+line('Cash to refund',money(lastSale.amount,lastSale.currency))+
    select('return-reason','Reason',option('','Choose a reason')+option('wrong','Wrong item')+
      option('damaged','Damaged product')+option('other','Other'))+
    '<div id="return-other-wrap">'+field('return-other','Explain the other reason',draft.refund?.other||'',
      'maxlength="120"')+'</div>'+
    select('return-stock','Put the items back on the shelf?',option('no','No, keep out of stock')+
      option('yes','Yes, all returned items are sellable'))+
    note('This flow returns the whole sale. Owner approval is required before cash leaves the drawer.');
  if(draft.refund){document.querySelector('#return-reason').value=draft.refund.reason;
    document.querySelector('#return-stock').value=draft.refund.restock?'yes':'no';}
  primary('review-refund','Review return',true);inputActions.refund();
};
inputActions.refund=()=>{
  document.querySelector('#return-other-wrap').hidden=val('return-reason')!=='other';
  enable('review-refund',!!val('return-reason')&&(val('return-reason')!=='other'||val('return-other').length>=3)&&
    lastSale.currency===s.currency&&lastSale.amount<=s.cash);
};
actions['review-refund']=()=>{
  if(val('return-reason')==='other'&&val('return-other').length<3)return;
  draft.refund={reason:val('return-reason'),other:val('return-other'),restock:val('return-stock')==='yes'};navigate('refund-review');
};
screens['refund-review']=()=>{
  if(!draft.refund||!lastSale){navigate('refund');return;}
  screen.innerHTML=heading('Approve the return.',`Requested by ${esc(s.name)} · Cash refund`,'refund')+
    line('Original sale',esc(lastSale.id))+line('Cash leaving the drawer',money(lastSale.amount))+
    line('Reason',esc(draft.refund.reason==='other'?draft.refund.other:
      draft.refund.reason==='damaged'?'Damaged product':'Wrong item'))+
    line('Stock',draft.refund.restock?'Return to shelf':'Keep out of stock')+approvalField();
  primary('save-refund','Approve & save return',true);
};
inputActions['refund-review']=()=>enable('save-refund',val('approval-pin')==='123456');
actions['save-refund']=()=>{
  if(val('approval-pin')!=='123456'||!draft.refund||!lastSale)return;
  s.refunds=s.refunds||[];if(s.refunds.includes(lastSale.id))return;
  if(s.returnTotals?.[lastSale.id]){navigate('return-items');return;}
  s.cash-=lastSale.amount;s.sales-=lastSale.amount;s.refunds.push(lastSale.id);
  if(draft.refund.restock)for(const item of lastSale.items){
    const p=products().find(p=>p.id===item.id);if(p&&p.stock!==null){p.stock+=item.qty;
      stockMove(p.id,'Returned to shelf',item.qty,p.stock);}
  }
  record(`Return linked to ${lastSale.id}; approved by Chipo; ${draft.refund.reason==='other'?draft.refund.other:draft.refund.reason}`);draft.refund=null;
  result('Return saved.',line('Give the customer',money(lastSale.amount))+
    line('Linked sale',esc(lastSale.id))+note('The original receipt remains unchanged.'),
    'history','Back to recent sales');
};
