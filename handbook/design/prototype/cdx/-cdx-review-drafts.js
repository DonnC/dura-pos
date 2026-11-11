// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// Four bounded practice drafts. PINs and restored-review consent stay in memory.
const reviewFlows={
  receive:{entry:'receive',review:'receive-review',next:'review-receive',commit:'save-receive',
    fields:['receive-product','receive-qty','receive-supplier','delivery-ref'],keys:['receive']},
  stock:{entry:'stock-count',review:'count-stock-review',next:'review-stock-count',commit:'save-stock-count',
    fields:products().filter(p=>p.stock!==null&&!p.scale).map(p=>'count-'+p.id),keys:['stockCount']},
  expense:{entry:'expense',review:'expense-review',next:'review-expense',commit:'save-expense',
    fields:['expense-kind','expense-amount','expense-note'],keys:['expense']},
  cashup:{entry:'cashup',review:'count-review',next:'review-count',commit:'close-shift',
    fields:['counted-usd','counted-zwg'],keys:['counted','countedZwg','countUsd','countZwg','kept','keptZwg','reason']}
};
const reviewScope=()=>JSON.stringify([s.shop,s.role,s.name,s.currency]);
function reviewBaseline(kind){
  return JSON.stringify(kind==='receive'||kind==='stock'?
    products().map(p=>[p.id,p.stock,p.unit,p.scale||1]):
    kind==='expense'?[s.active,s.cash,s.supplier]:
    [s.active,s.cash,s.zwg,s.sales,s.saleCount,s.basket,s.held]);
}
const storedReview=kind=>s.reviewDrafts?.[kind]?.scope===reviewScope()?s.reviewDrafts[kind]:null;
const recoveredReviews=new Set(Object.keys(reviewFlows).filter(kind=>storedReview(kind)));
const reviewAcknowledged=new Set();
let reviewRenderDepth=0;
function clearReviewMemory(kind){for(const key of reviewFlows[kind].keys)delete draft[key];}
function reviewFieldIds(kind){return [...(kind==='stock'?
  products().filter(p=>p.stock!==null&&!p.scale).map(p=>'count-'+p.id):reviewFlows[kind].fields),
  ...(kind==='stock'?['count-reason']:kind==='cashup'?['variance-note','keep-float','keep-float-zwg']:[])];}
function rememberReview(kind,stage){
  const previous=storedReview(kind);
  const r=previous||{scope:reviewScope(),baseline:reviewBaseline(kind),fields:{}};
  for(const id of reviewFieldIds(kind)){
    const el=document.getElementById(id);if(el)r.fields[id]=el.value.slice(0,160);
  }
  r.stage=stage;s.reviewDrafts||={};s.reviewDrafts[kind]=r;save();
}
function restoreReviewFields(kind){
  const r=storedReview(kind);if(!r)return;
  for(const id of reviewFieldIds(kind)){
    const el=document.getElementById(id);if(el&&Object.hasOwn(r.fields,id))el.value=r.fields[id];
  }
}
function materializeReview(kind){
  const r=storedReview(kind);if(!r)return false;const f=id=>(r.fields[id]||'').trim();
  if(kind==='receive'){
    const p=products().find(p=>p.id===f('receive-product')&&p.stock!==null&&!p.scale);
    if(!p||!/^\d{1,3}$/.test(f('receive-qty'))||Number(f('receive-qty'))<1)return false;
    draft.receive={id:p.id,qty:Number(f('receive-qty')),ref:f('delivery-ref'),
      supplierId:f('receive-supplier'),supplier:f('receive-supplier')==='mambo'?'Mambo Wholesale':'Other / not named'};
  }else if(kind==='stock'){
    const rows=products().filter(p=>p.stock!==null&&!p.scale&&f('count-'+p.id)!=='');
    if(!rows.length||rows.some(p=>!/^\d{1,3}$/.test(f('count-'+p.id))))return false;
    draft.stockCount=rows.map(p=>({id:p.id,before:p.stock,count:Number(f('count-'+p.id))}));
  }else if(kind==='expense'){
    const amount=parseCents(f('expense-amount')),type=f('expense-kind');
    if(amount===null||amount<=0||amount>s.cash||f('expense-note').length<3||
      !['expense',...(s.role==='owner'?['drawing','supplier']:[])].includes(type)||
      type==='supplier'&&amount>s.supplier)return false;
    draft.expense={amount,kind:type,note:f('expense-note')};
  }else{
    const usd=parseCents(f('counted-usd')),zwg=s.zwg>0?parseCents(f('counted-zwg')):0;
    if(!s.active||usd===null||zwg===null)return false;
    draft.counted=usd;draft.countedZwg=zwg;draft.countUsd=f('counted-usd');draft.countZwg=f('counted-zwg');
  }
  return true;
}
function reviewNotice(kind,onReview=false){
  const r=storedReview(kind),flow=reviewFlows[kind];
  if(!r){
    if(!onReview&&q.get('screen')===flow.review)screen.querySelector('.heading')?.insertAdjacentHTML('afterend',
      '<p class="warning" id="review-restart-note">This review is no longer open. Check saved records before entering it again.</p>');
    return;
  }
  if(!recoveredReviews.has(kind)&&r.baseline===reviewBaseline(kind))return;
  const stale=r.baseline!==reviewBaseline(kind);
  screen.querySelector('.heading')?.insertAdjacentHTML('afterend',
    `<p class="${stale?'warning':'note'}" id="review-draft-note">${stale?
      'Records changed while you were away. Your entries are kept; check them against the current figures.':
      onReview?'Draft restored. Review the entries and check the box below before saving.':
      'Unfinished draft restored on this phone. Check the entries before continuing.'}</p>`);
  screen.insertAdjacentHTML('beforeend',
    (onReview?'<label class="toggle-row"><span><strong>I checked the restored entries</strong>'+
      '<small>Nothing is saved until the final action below.</small></span><input id="review-checked" type="checkbox"></label>':'')+
    btn('review-start-again','Start this draft again','text-button',`data-kind="${kind}"`));
}
function gateRestoredReview(kind){
  if(!recoveredReviews.has(kind))return;
  const button=document.querySelector(`[data-action="${reviewFlows[kind].commit}"]`);
  if(!button)return;
  const label=button.querySelector('span');button.dataset.reviewLabel||=label.textContent;
  label.textContent=reviewAcknowledged.has(kind)?button.dataset.reviewLabel:'Check restored entries below';
  if(!reviewAcknowledged.has(kind))button.disabled=true;
}
actions['review-start-again']=b=>{
  const kind=b.dataset.kind;if(!reviewFlows[kind])return;
  delete s.reviewDrafts?.[kind];clearReviewMemory(kind);
  recoveredReviews.delete(kind);reviewAcknowledged.delete(kind);save();navigate(reviewFlows[kind].entry);
};
for(const [kind,flow] of Object.entries(reviewFlows)){
  const entryScreen=screens[flow.entry],reviewScreen=screens[flow.review];
  const entryInput=inputActions[flow.entry],reviewInput=inputActions[flow.review];
  const next=actions[flow.next],commit=actions[flow.commit];
  screens[flow.entry]=()=>{
    reviewRenderDepth++;
    try{entryScreen();restoreReviewFields(kind);entryInput?.();reviewNotice(kind);}
    finally{reviewRenderDepth--;}
    if(kind==='cashup'&&!s.active){
      screen.innerHTML+=note('This shift is already closed. Review its saved handover instead of closing it again.');
      const ownHandover=s.lastHandover?.scope===reviewScope();
      primary(ownHandover?'handover':'money',ownHandover?'View saved handover':'Back to till');
    }
  };
  inputActions[flow.entry]=el=>{entryInput?.(el);if(!reviewRenderDepth)rememberReview(kind,'entry');};
  actions[flow.next]=()=>{
    if(document.querySelector(`[data-action="${flow.next}"]`)?.disabled)return;
    rememberReview(kind,'review');storedReview(kind).baseline=reviewBaseline(kind);
    reviewAcknowledged.delete(kind);save();next();
  };
  screens[flow.review]=()=>{
    const r=storedReview(kind);
    if(r&&(r.baseline!==reviewBaseline(kind)||!materializeReview(kind))){
      clearReviewMemory(kind);navigate(flow.entry);return;
    }
    reviewRenderDepth++;
    try{
      reviewScreen();if(page!==flow.review)return;
      restoreReviewFields(kind);
      if(kind!=='stock'||draft.stockCount?.some(r=>r.count!==r.before))reviewInput?.();
      reviewNotice(kind,true);gateRestoredReview(kind);
    }finally{reviewRenderDepth--;}
  };
  inputActions[flow.review]=el=>{
    if(el?.id==='review-checked'){
      if(el.checked)reviewAcknowledged.add(kind);else reviewAcknowledged.delete(kind);
    }
    if(kind==='receive'||kind==='stock'&&!draft.stockCount?.some(r=>r.count!==r.before))enable(flow.commit,true);
    else reviewInput?.(el);
    if(!reviewRenderDepth)rememberReview(kind,'review');gateRestoredReview(kind);
  };
  actions[flow.commit]=()=>{
    const r=storedReview(kind);
    if(recoveredReviews.has(kind)&&!reviewAcknowledged.has(kind))return;
    if(r&&r.baseline!==reviewBaseline(kind)){
      recoveredReviews.add(kind);clearReviewMemory(kind);navigate(flow.entry);return;
    }
    if(document.querySelector(`[data-action="${flow.commit}"]`)?.disabled)return;
    if(kind==='cashup'&&count()&&s.held.length===3){commit();return;}
    if(kind==='cashup')s.lastHandover={scope:reviewScope(),counted:draft.counted,
      countedZwg:draft.countedZwg,kept:parseCents(val('keep-float')),keptZwg:s.zwg>0?parseCents(val('keep-float-zwg')):0,
      reason:val('variance-note'),expected:s.cash};
    delete s.reviewDrafts?.[kind];recoveredReviews.delete(kind);reviewAcknowledged.delete(kind);
    commit();save();
  };
}
const originalHandover=screens.handover;
screens.handover=()=>{
  const h=s.lastHandover;
  if(h?.scope===reviewScope()&&!s.active){
    result('Shift closed.',`<p class="sub">${esc(s.name)} · Front counter</p>`+
      line('Hand to the owner',money(h.counted-h.kept))+line('Leave for the next shift',money(h.kept))+
      (h.countedZwg?line('Hand over in ZWG',money(h.countedZwg-h.keptZwg,'ZWG'))+
        line('ZWG staying',money(h.keptZwg,'ZWG')):'')+
      line('Count difference',varianceText(h.counted-h.expected))+(h.reason?note(esc(h.reason)):'')+
      note('Saved on this phone. Waiting to upload. Held baskets remain on this till.'),
      'switch-person','Hand over this till');return;
  }
  if(s.active&&draft.counted===undefined){
    screen.innerHTML=heading('This shift is still open.','Count the drawer before handing it over.','money');
    primary('cashup','Count and close this shift');return;
  }
  originalHandover();
};
const originalOpenReviewShift=actions['open-shift'];
actions['open-shift']=()=>{
  originalOpenReviewShift();if(page!=='sell')return;
  delete s.lastHandover;delete s.reviewDrafts?.cashup;clearReviewMemory('cashup');save();
};
