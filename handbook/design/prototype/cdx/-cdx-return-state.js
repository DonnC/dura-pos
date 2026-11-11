// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

const hasReturns=r=>(s.refunds||[]).includes(r.id)||!!s.returnTotals?.[r.id];
function returnTally(r){
  const full=(s.refunds||[]).includes(r.id)&&!s.returnTotals?.[r.id];
  return s.returnTotals?.[r.id]||{qty:r.items.map(i=>full?i.qty:0),amount:full?r.amount:0,kept:0};
}
function canReturn(r){return r&&r.currency===s.currency&&
  (s.role==='owner'||r.who===s.name)&&['Cash','Cash · change kept','Kept change','Kept change + cash'].includes(r.method);}
function returnDraft(r){
  if(s.returnDraft?.sale!==r.id)s.returnDraft={sale:r.id,qty:r.items.map(()=>''),
    restock:r.items.map(()=>false),reason:''};return s.returnDraft;
}
function originalKeptCustomer(r){
  if(!r.keptUsed)return null;
  if(r.keptCustomerId)return s.kept?.contacts.find(c=>c.id===r.keptCustomerId);
  const matches=(s.kept?.contacts||[]).filter(c=>c.name===r.customer);
  return matches.length===1?matches[0]:null;
}
function returnPlan(r){
  const d=returnDraft(r),prior=returnTally(r);let error='';
  const lines=r.items.map((item,n)=>{
    const qty=parseQuantity(d.qty[n],item.scale||1),left=item.qty-(prior.qty[n]||0);
    if(qty===null)error=`${item.name}: ${item.scale?'use kg with at most 3 decimal places.':'use whole selling packs.'}`;
    else if(qty>left)error=`${item.name}: return no more than ${quantityText(item,left)}.`;
    const safe=qty!==null&&qty<=left?qty:0;
    const original=item.lineTotal??lineAmount(item,item.qty);
    const after=roundRatio(BigInt(original)*BigInt((prior.qty[n]||0)+safe),item.qty);
    const before=roundRatio(BigInt(original)*BigInt(prior.qty[n]||0),item.qty);
    return {item,index:n,qty:safe,amount:after-before,restock:!!d.restock[n]};
  }).filter(l=>l.qty>0);
  const amount=lines.reduce((sum,l)=>sum+l.amount,0);
  const kept=r.keptUsed?roundRatio(BigInt(r.keptUsed)*BigInt(prior.amount+amount),r.amount)-prior.kept:0;
  const cash=amount-kept,c=originalKeptCustomer(r);
  if(!canReturn(r))error='This payment type, currency or seller’s receipt cannot be returned here.';
  else if(!s.active)error='Open this till before saving a return.';
  else if(r.keptUsed&&(!c||!s.kept?.verified||s.kept.currency!==r.currency)){
    error='The original kept-change balance is unavailable here. Keep the receipt and ask the owner.';
  }else if(cash>s.cash)error=`Only ${money(s.cash)} is expected in this till. Keep this draft and return when cash is available.`;
  if(!lines.length&&!error)error='Enter the quantities that came back. Leave other items at zero.';
  return {d,prior,lines,amount,cash,kept,customer:c,error};
}
function returnPaymentRows(plan){return (plan.kept?line('Refund total',money(plan.amount)):'')+
  line('Cash to give back',money(plan.cash))+
  (plan.kept?line('Restore kept change',money(plan.kept),'For '+esc(plan.customer?.name)):'');}
function returnHistory(r){
  if(!hasReturns(r))return '';
  const t=returnTally(r);
  return '<h2 class="section-title">Linked returns</h2>'+line('Returned so far',money(t.amount,r.currency))+
    line('Original sale less returns',money(r.amount-t.amount,r.currency))+
    (s.partialReturns||[]).filter(e=>e.sale===r.id).map(e=>line(esc(e.reference),money(e.amount,r.currency),
      e.lines.map(l=>`${esc(l.name)} · ${esc(l.quantity)}`).join(' / ')+
      ` · Cash ${money(e.cash,r.currency)}${e.kept?' · Kept change restored '+money(e.kept,r.currency):''}`)).join('');
}
if(q.get('returns')==='sample'){
  const rice=products().find(p=>p.id==='rice');
  if(rice){
    lastSale={id:'T-P1-S261110-0030',items:[{...initialProducts[0],qty:2,lineTotal:200},
      {...rice,qty:750,lineTotal:180}],amount:380,received:500,change:120,method:'Cash',
      who:s.name,currency:s.currency,status:'Saved on phone'};
    s.history=[lastSale,...s.history.filter(r=>r.id!==lastSale.id)].slice(0,30);s.last=lastSale;
    if(page==='return-review'){
      s.returnDraft={sale:lastSale.id,qty:['1','0.250'],restock:[false,true],reason:'wrong'};
    }
  }
}
