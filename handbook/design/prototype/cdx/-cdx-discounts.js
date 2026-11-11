// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// Design-only manual line discounts. Never changes the product's shelf price.
const discountScope=()=>JSON.stringify([s.shop,s.currency]);
const discountKey=p=>JSON.stringify([discountScope(),p.id,s.basket[p.id],p.cents,p.scale||1]);
function activeLineDiscount(p){
  const d=s.lineDiscounts?.[p.id];return d?.key===discountKey(p)?d:null;
}
function discountedLineAmount(p,qty,raw){
  if(products().find(i=>i.id===p.id)!==p||s.basket[p.id]!==qty)return raw;
  return raw-(activeLineDiscount(p)?.amount||0);
}
function clearStaleDiscounts(){
  if(!s.lineDiscounts)return;
  for(const [id,d] of Object.entries(s.lineDiscounts)){
    const p=products().find(p=>p.id===id);
    if(!p||!s.basket[id]||d.key!==discountKey(p))delete s.lineDiscounts[id];
  }
}
const discountBasketSignature=()=>JSON.stringify(basketRows().map(p=>[p.id,activeLineDiscount(p)?.amount||0]));
const basketDiscountTotal=()=>basketRows().reduce((n,p)=>n+(activeLineDiscount(p)?.amount||0),0);
const basketBeforeDiscount=()=>total()+basketDiscountTotal();
function saleDiscountSummary(){return basketDiscountTotal()?{subtotal:basketBeforeDiscount(),discountTotal:basketDiscountTotal()}:{};}
function lineDiscountSnapshot(p){
  const d=activeLineDiscount(p);return d?{originalLineTotal:lineAmount(p,s.basket[p.id])+d.amount,
    discountAmount:d.amount,discountType:d.type,discountValue:d.value,discountReason:d.reason,
    discountApprovedBy:d.approvedBy}:{};
}
function discountDraft(){
  const p=products().find(p=>p.id===(s.discountDraft?.id||selectedId)),scope=JSON.stringify([discountScope(),s.role,s.name]);
  if(!p||!s.basket[p.id])return null;
  if(s.discountDraft?.key!==discountKey(p)||s.discountDraft.scope!==scope){
    const previous=activeLineDiscount(p);
    s.discountDraft={id:p.id,key:discountKey(p),scope,type:previous?.type||'percent',
      value:previous?.value||'',reason:previous?.reason||''};
  }
  return s.discountDraft;
}
function discountPlan(){
  const d=discountDraft();if(!d)return null;
  const p=products().find(p=>p.id===d.id),raw=roundRatio(BigInt(p.cents)*BigInt(s.basket[p.id]),p.scale||1);
  const value=parseCents(d.value),amount=value===null?null:d.type==='percent'?
    roundRatio(BigInt(raw)*BigInt(value),10000):value;
  const error=value===null?'Enter an amount with up to two decimal places.':
    value<=0?'Enter a discount above zero.':d.type==='percent'&&value>=10000||amount>=raw?
      'Discount must be less than the original line total.':
      d.reason.trim().length<3?'Add a short reason for the discount.':'';
  return {d,p,raw,amount,net:amount===null?null:raw-amount,error};
}
actions['discount-open']=b=>{
  if(s.discountDraft?.id!==b.dataset.id)s.discountDraft=null;
  selectedId=b.dataset.id;navigate('discount');
};
screens.discount=()=>{
  const plan=discountPlan();if(!plan){navigate('sell');return;}const {d,p,raw}=plan;
  screen.innerHTML=heading('Discount this product.','This sale only · '+esc(p.name),'sell')+
    line('Original line total',money(raw),esc(quantityText(p,s.basket[p.id])))+
    select('discount-type','Discount type',option('percent','Percentage',d.type==='percent')+
      option('amount','Amount off this line · '+s.currency,d.type==='amount'))+
    field('discount-value',d.type==='percent'?'Percentage off':`Amount off · ${s.currency}`,d.value,
      'inputmode="decimal" placeholder="0.00" maxlength="12"')+
    field('discount-reason','Reason',d.reason,'maxlength="120" placeholder="e.g. Damaged outer pack"')+
    '<p class="error" id="discount-error" role="alert"></p><div id="discount-preview"></div>'+
    note('The shelf price stays unchanged. Changing quantity or price clears this discount.')+
    (activeLineDiscount(p)?btn('discount-remove','Remove this discount','text-button full'):'');
  primary('discount-review','Review discount',true);drawDiscountPlan();
};
function drawDiscountPlan(){
  const p=discountPlan();if(!p)return;
  document.querySelector('#discount-error').textContent=p.error;
  document.querySelector('#discount-preview').innerHTML=line('After discount',
    !p.error?money(p.net):'Check the entries');enable('discount-review',!p.error);
}
inputActions.discount=el=>{
  const d=discountDraft();d.type=val('discount-type');d.value=val('discount-value');d.reason=val('discount-reason');save();
  if(el?.id==='discount-type')render();else drawDiscountPlan();
};
actions['discount-review']=()=>{if(!discountPlan()?.error)navigate('discount-review');};
screens['discount-review']=()=>{
  const p=discountPlan();if(!p||p.error){navigate('discount');return;}
  screen.innerHTML=heading('Check the discount.','This sale only · '+esc(p.p.name),'discount')+
    line('Original line total',money(p.raw))+line('Discount',money(p.amount))+
    '<div class="change">'+line('After discount',money(p.net))+'</div>'+line('Reason',esc(p.d.reason))+
    (s.role==='worker'?approvalField()+note('A cashier needs owner approval for a manual discount.'):
      note('You are signed in as Owner. Your approval is recorded with this line.'));
  primary('discount-apply',s.role==='worker'?'Approve & apply discount':'Apply discount',s.role==='worker');
};
inputActions['discount-review']=()=>enable('discount-apply',s.role==='owner'||val('approval-pin')==='123456');
actions['discount-apply']=()=>{
  const p=discountPlan();if(!p||p.error||s.role==='worker'&&val('approval-pin')!=='123456')return;
  s.lineDiscounts||={};s.lineDiscounts[p.p.id]={key:p.d.key,type:p.d.type,value:p.d.value,
    amount:p.amount,reason:p.d.reason,approvedBy:s.role==='owner'?s.name:'Chipo'};
  s.discountDraft=null;s.keptCheckout=null;received='';delete s.cashDraft;save();navigate('sell');
};
actions['discount-remove']=()=>{
  const d=discountDraft();if(d)delete s.lineDiscounts?.[d.id];s.discountDraft=null;
  s.keptCheckout=null;received='';delete s.cashDraft;save();navigate('sell');
};
const originalDiscountBasket=actions.basket;
actions.basket=()=>{
  originalDiscountBasket();const rows=[...sheet.querySelectorAll('.ledger-row')];
  basketRows().forEach((p,i)=>{
    rows[i]?.classList.add('discount-basket-line');
    rows[i]?.insertAdjacentHTML('beforeend',btn('discount-open',
      activeLineDiscount(p)?'Edit discount':'Discount','text-button',
      `data-id="${p.id}" aria-label="Discount ${esc(p.name)}"`));
  });
  if(basketDiscountTotal())sheet.querySelector('header').insertAdjacentHTML('afterend',
    '<div class="discount-summary">'+line('Before discounts',money(basketBeforeDiscount()))+
    line('Discounts','− '+money(basketDiscountTotal()))+'</div>');
};
const originalDiscountHold=actions.hold;
actions.hold=()=>{
  const count=s.held.length,discounts=structuredClone(s.lineDiscounts||{});originalDiscountHold();
  if(s.held.length>count){s.held.at(-1).lineDiscounts=discounts;save();}
};
const originalDiscountResume=actions['resume-held'];
actions['resume-held']=b=>{
  if(count()){originalDiscountResume(b);return;}
  const discounts=structuredClone(s.held[Number(b.dataset.index)]?.lineDiscounts||{});
  originalDiscountResume(b);s.lineDiscounts=discounts;clearStaleDiscounts();save();render();
};
const originalDiscountPay=screens.pay;
screens.pay=()=>{
  originalDiscountPay();if(page==='pay'&&basketDiscountTotal())screen.querySelector('.amount-due').insertAdjacentHTML('afterend',
    '<div class="discount-summary">'+line('Before discounts',money(basketBeforeDiscount()))+
    line('Discounts','− '+money(basketDiscountTotal()))+'</div>');
};
