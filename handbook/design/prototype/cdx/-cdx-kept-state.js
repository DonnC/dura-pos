// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// Fictional, till-local balances. Not a shared wallet or production journal.
function keptState(){
  return s.kept||(s.kept={currency:s.currency,cap:200,verified:true,contacts:[
    {id:'tariro',name:'Tariro',balance:0,opening:0,moves:[]},
    {id:'kuda',name:'Kuda',balance:0,opening:0,moves:[]}]});
}
if(['sample','stale'].includes(q.get('kept'))){
  s.features.kept=true;const k=keptState();k.verified=q.get('kept')!=='stale';
  k.contacts[0].balance=k.contacts[0].opening=150;
  k.contacts[1].balance=k.contacts[1].opening=50;
}
const keptMoney=amount=>money(amount,keptState().currency);
function keptContact(id=s.keptSelected){return keptState().contacts.find(c=>c.id===id)||keptState().contacts[0];}
function keptAllowed(){return s.features.kept&&keptState().verified&&keptState().currency===s.currency;}
function keptGate(){
  if(s.features.kept)return true;
  screen.innerHTML=heading('Kept change is off.','Cash selling is still available.','money')+
    note('The owner can turn on kept change in Set up when needed.');
  primary(s.role==='owner'?'settings':'sell',s.role==='owner'?'Open preferences':'Back to selling');return false;
}
function keptMove(c,delta,label,reference=''){
  c.balance+=delta;c.moves.push({delta,label,reference,who:s.name});
  while(c.moves.length>40)c.opening+=c.moves.shift().delta;
}
const keptBasketKey=()=>JSON.stringify(Object.entries(s.basket).sort());
function keptCheckout(){
  if(!s.keptCheckout||s.keptCheckout.basket!==keptBasketKey()){
    s.keptCheckout={basket:keptBasketKey(),customer:keptContact().id,
      use:(Math.min(keptContact().balance,total())/100).toFixed(2),cash:''};
  }return s.keptCheckout;
}
function keptPicker(id=keptContact().id){
  return select('kept-customer','Customer',keptState().contacts.map(c=>
    option(c.id,`${c.name} · ${keptMoney(c.balance)} kept here`,c.id===id)).join(''));
}
function keptContextNote(){
  return note(keptAllowed()?'Front counter · This phone only. Check the customer’s name before using or paying out their change.':
    'This balance needs checking, or is in another currency. Take cash for the sale; do not use or pay out this balance here.');
}
function keptReceiptRows(r){
  if(!r.keptUsed&&!r.keptAdded)return '';
  return line('Customer',esc(r.customer))+
    (r.keptUsed?line('Kept change used',money(r.keptUsed,r.currency)):'')+
    line('Cash received',money(r.received,r.currency))+
    line('Change given',money(r.change,r.currency))+
    (r.keptAdded?line('Change kept',money(r.keptAdded,r.currency)):'')+
    line('Kept here after this sale',money(r.keptBalance,r.currency));
}
function keptOwedRow(){
  if(!s.features.kept&&!s.kept)return '';
  return line('Kept change owed',keptMoney(keptState().contacts.reduce((sum,c)=>sum+c.balance,0)),
    'Customer money, not extra sales. Count the cash once.');
}
if(q.get('kept')==='sample'){
  if(page==='kept-checkout'&&count()){
    const d=keptCheckout();d.cash=((total()-parseCents(d.use))/100).toFixed(2);
  }
  if(['kept-refund','kept-refund-review'].includes(page)){
    s.keptRefund={customer:keptContact().id,amount:'0.50'};
  }
}
