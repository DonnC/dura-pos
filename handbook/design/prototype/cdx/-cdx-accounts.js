// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

function ensureAccounts(){
  s.accounts=s.accounts||{customer:{opening:s.owed,moves:[]},supplier:{opening:s.supplier,moves:[]}};
  return s.accounts;
}
ensureAccounts();
function accountMove(kind,label,delta,reference=''){
  const account=ensureAccounts()[kind];account.moves.push({label,delta,reference,who:s.name});
  while(account.moves.length>30)account.opening+=account.moves.shift().delta;
}
function statement(kind){
  const account=ensureAccounts()[kind];let balance=account.opening;
  const rows=account.moves.map(m=>{balance+=m.delta;return {...m,balance};});
  return `<section id="statement" aria-label="Account statement"><h2 class="section-title">Statement</h2>
    <p class="micro">${s.currency} only · Opening balance + practice movements = current balance</p>`+
    line('Opening balance',money(account.opening),'At the start of the retained practice history')+
    rows.slice().reverse().map(m=>line(esc(m.label),`${m.delta>0?'+ ': '− '}${money(Math.abs(m.delta))}`,
      `${esc(m.who)}${m.reference?' · '+esc(m.reference):''} · balance ${money(m.balance)}`)).join('')+
    (!rows.length?'<p class="sub">No new payments or account sales in this practice history.</p>':'')+
    line('Current balance',money(balance))+'</section>';
}
screens.customers=()=>{
  screen.innerHTML=heading('Customers.','Who owes the shop, and what has been paid.','money')+
    `<div class="hero"><p class="eyebrow">Money owed to you</p>
    <div class="amount-due"><span>${s.currency}</span>${(s.owed/100).toFixed(2)}</div></div>`+
    menu('customer','Tariro',s.owed?money(s.owed)+' still owed':'Paid up','people')+
    note('A customer balance is not cash. A payment clears debt; it is not another sale.');
};
screens.customer=()=>{
  screen.innerHTML=heading('Tariro.','Customer account · Practice contact','customers')+
    line('Still owed',money(s.owed))+'<div class="account-layout"><div>'+statement('customer')+
    '</div><div><h2 class="section-title">Record a payment</h2>'+
    field('customer-amount',`Cash received · ${s.currency}`,'','inputmode="decimal" placeholder="0.00"')+
    '<p class="error" id="collection-error" role="alert"></p>'+
    note('Count the cash before saving. Record only what this customer owes, in the same currency.')+'</div></div>';
  primary('review-collection','Review payment',true);
};
inputActions.customer=()=>{
  const amount=parseCents(val('customer-amount'));
  document.querySelector('#collection-error').textContent=amount>s.owed?`Only ${money(s.owed)} is owed.`:
    val('customer-amount')&&amount===null?'Use an amount with up to two decimal places.':'';
  enable('review-collection',validAmount('customer-amount')&&amount<=s.owed);
};
actions['review-collection']=()=>{
  draft.collection=parseCents(val('customer-amount'));
  showSheet('Payment from Tariro',line('Cash received',money(draft.collection))+
    line('Still owed after saving',money(s.owed-draft.collection))+
    note('This adds cash to this drawer and reduces Tariro’s balance. No new sale is recorded.'),
    btn('save-collection','Save payment','primary'));
};
actions['save-collection']=()=>{
  if(!draft.collection)return;const amount=draft.collection;
  s.owed-=amount;s.cash+=amount;accountMove('customer','Cash payment',-amount);
  record(`Tariro paid ${money(amount)}`);draft.collection=null;sheet.close();
  result('Payment saved.',line('Tariro still owes',money(s.owed))+line('Expected cash now',money(s.cash)),
    'customer','View Tariro’s statement');
};
screens.suppliers=()=>{
  screen.innerHTML=heading('Suppliers.','Deliveries, balances and payments in one place.','money')+
    `<div class="hero"><p class="eyebrow">Money the shop owes</p>
    <div class="amount-due"><span>${s.currency}</span>${(s.supplier/100).toFixed(2)}</div></div>`+
    menu('supplier-statement','Mambo Wholesale',s.supplier?money(s.supplier)+' to pay':'Paid up','stock')+
    menu('new-invoice','Add purchase invoice','New delivery, buying costs and what you owe','receipt')+
    menu('receive','Receive a delivery','Record the packs that actually arrived','stock')+
    note('Receiving stock and paying a supplier are different actions. A quantity-only delivery does not invent an invoice value.');
};
screens['supplier-statement']=()=>{
  screen.innerHTML=heading('Mambo Wholesale.','Supplier account · Practice contact','suppliers')+
    line('Still to pay',money(s.supplier))+line('Payment due date',      (s.invoices||[]).some(i=>i.due&&i.total>i.paid)?'See individual invoices':'Not recorded')+
    statement('supplier')+
    (s.invoices||[]).map(i=>menu('open-invoice',esc(i.ref),money(i.total)+' · Purchase invoice',
      'receipt',`data-ref="${esc(i.ref)}"`)).join('')+
    menu('new-invoice','Add purchase invoice','New stock with an invoice','receipt')+menu('receive','Receive stock','Count what arrived before reviewing','stock')+
    note('An opening balance stands for earlier invoices. Purchase invoices add stock and debt; payments reduce what you owe.');
  primary('supplier-pay',s.supplier?'Record a supplier payment':'Nothing due',!s.supplier);
};
actions['supplier-pay']=()=>{navigate('expense');document.querySelector('#expense-kind').value='supplier';};
