// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

function receiptList(){
  const sample={id:'T-P1-S261110-0008',items:[{...initialProducts[0],qty:2},
    {...initialProducts[1],qty:1}],amount:350,received:500,change:150,method:'Cash',
    who:s.name,currency:s.currency,status:'Saved on phone'};
  return [...s.history,...(s.seedDay?[sample]:[])].filter((r,i,a)=>a.findIndex(x=>x.id===r.id)===i);
}
screens.history=()=>{
  screen.innerHTML=heading('Recent sales.',s.role==='worker'?'Your sales on this till':'Front counter · This phone','money')+
    receiptList().filter(r=>s.role==='owner'||r.who===s.name).map(r=>menu('open-receipt',money(r.amount,r.currency),
      `${esc(r.who)} · ${esc(r.method)} · ${esc(r.id)}`,'receipt',`data-id="${r.id}"`)).join('')+
    note('Latest practice receipts, not the complete seeded day. Returns create a linked record; the original receipt stays.');
};
actions['open-receipt']=b=>{lastSale=receiptList().find(r=>r.id===b.dataset.id);navigate('receipt');};
screens.receipt=()=>{
  if(!lastSale)lastSale=receiptList()[0];
  if(!lastSale){screen.innerHTML=heading('No receipt yet.','Your first saved sale will appear here.','sell');return;}
  const r=lastSale;
  screen.innerHTML=heading('Sale receipt.','Practice receipt · Not fiscal','history')+
    `<div class="receipt-paper"><h2>${esc(s.shop)}</h2><p class="micro">${esc(r.id)}<br>
    ${esc(r.who)} · Front counter</p><div class="receipt-details">${summaryRows(r.items)}</div>
    ${line('Total',money(r.amount,r.currency))}${line('Payment',esc(r.method))}
    ${r.method==='Cash'?line('Cash received',money(r.received,r.currency))+
      line('Change given',money(r.change,r.currency)):''}
    ${r.payments?r.payments.map(p=>line('Cash received',money(p.amount,p.currency))).join('')+
      line('Rate kept with sale',`USD 1.00 = ${money(r.rateMinor,'ZWG')}`):''}</div>
    <p class="status-line">${icon('check')}Saved on this phone</p>
    <p class="status-line wait">${icon('clock')}Not uploaded · No fiscal receipt issued</p>
    <div class="split">${btn('share-receipt','Share receipt')}${btn('print','Print receipt')}</div>
    ${(s.refunds||[]).includes(r.id)?'<p class="warning">A return is linked to this sale.</p>':
      r.method==='Cash'?btn('refund','Return this sale','text-button full'):''}`;
};
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
  screen.innerHTML=heading('Return this sale.',esc(lastSale.id),'receipt')+
    summaryRows(lastSale.items)+line('Cash to refund',money(lastSale.amount,lastSale.currency))+
    select('return-reason','Reason',option('','Choose a reason')+option('wrong','Wrong item')+
      option('damaged','Damaged product')+option('other','Other'))+
    select('return-stock','Put the items back on the shelf?',option('no','No, keep out of stock')+
      option('yes','Yes, all returned items are sellable'))+
    note('This flow returns the whole sale. Owner approval is required before cash leaves the drawer.');
  if(draft.refund){document.querySelector('#return-reason').value=draft.refund.reason;
    document.querySelector('#return-stock').value=draft.refund.restock?'yes':'no';}
  primary('review-refund','Review return',true);inputActions.refund();
};
inputActions.refund=()=>enable('review-refund',!!val('return-reason')&&
  lastSale.currency===s.currency&&lastSale.amount<=s.cash);
actions['review-refund']=()=>{
  draft.refund={reason:val('return-reason'),restock:val('return-stock')==='yes'};navigate('refund-review');
};
screens['refund-review']=()=>{
  if(!draft.refund||!lastSale){navigate('refund');return;}
  screen.innerHTML=heading('Approve the return.',`Requested by ${esc(s.name)} · Cash refund`,'refund')+
    line('Original sale',esc(lastSale.id))+line('Cash leaving the drawer',money(lastSale.amount))+
    line('Stock',draft.refund.restock?'Return to shelf':'Keep out of stock')+approvalField();
  primary('save-refund','Approve & save return',true);
};
inputActions['refund-review']=()=>enable('save-refund',val('approval-pin')==='123456');
actions['save-refund']=()=>{
  if(val('approval-pin')!=='123456'||!draft.refund||!lastSale)return;
  s.refunds=s.refunds||[];if(s.refunds.includes(lastSale.id))return;
  s.cash-=lastSale.amount;s.sales-=lastSale.amount;s.refunds.push(lastSale.id);
  if(draft.refund.restock)for(const item of lastSale.items){
    const p=products().find(p=>p.id===item.id);if(p&&p.stock!==null)p.stock+=item.qty;
  }
  record(`Return linked to ${lastSale.id}; approved by Chipo`);draft.refund=null;
  result('Return saved.',line('Give the customer',money(lastSale.amount))+
    line('Linked sale',esc(lastSale.id))+note('The original receipt remains unchanged.'),
    'history','Back to recent sales');
};
