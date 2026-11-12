// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

const mixedKey=()=>JSON.stringify([s.shop,s.role,s.name,s.currency,
  basketRows().map(p=>[p.id,s.basket[p.id],p.cents,activeLineDiscount(p)||null])]);
function mixedDraft(){
  if(s.mixedDraft?.key!==mixedKey())s.mixedDraft={key:mixedKey(),usd:'',zwg:'',changeCurrency:'',usdPart:'',rateMinor:s.rateMinor};
  return s.mixedDraft;
}
function changePlan(){
  const d=mixedDraft(),usd=parseCents(d.usd||'0'),zwg=parseCents(d.zwg||'0'),rate=d.rateMinor;
  const plan={d,usd,zwg,rate,changes:[],over:false,short:false,error:'',credit:0n};
  if(s.currency!=='USD'||!Number.isSafeInteger(rate)||rate<=0){plan.error='This preview needs a configured USD / ZWG rate.';return plan;}
  if(usd===null||zwg===null){plan.error='Use amounts with up to two decimal places.';return plan;}
  if(!count()||!s.active){plan.error='Open the till and add a product first.';return plan;}
  if(rate!==s.rateMinor){plan.error='The shop rate changed. Check the current rate before saving.';return plan;}
  const need=usd<=total()?roundRatio(BigInt(total()-usd)*BigInt(rate),100):0;
  plan.short=usd<=total()&&zwg<need;
  plan.over=usd>total()||zwg>need;
  plan.credit=BigInt(usd)*BigInt(rate)+BigInt(zwg)*100n-BigInt(total())*BigInt(rate);
  if(plan.short){plan.error=money(need-zwg,'ZWG')+' still needed.';return plan;}
  if(!d.usd&&!d.zwg){plan.error='Enter the cash received.';return plan;}
  if(plan.over){
    if(!['USD','ZWG','split'].includes(d.changeCurrency)){plan.error='Choose the change currency.';return plan;}
    let cu=0,cz=0;
    if(d.changeCurrency==='USD')cu=roundRatio(plan.credit,rate);
    if(d.changeCurrency==='ZWG')cz=roundRatio(plan.credit,100);
    if(d.changeCurrency==='split'){
      cu=parseCents(d.usdPart);
      if(cu===null){plan.error='Enter the USD part of the change, or 0.';return plan;}
      const remainder=plan.credit-BigInt(cu)*BigInt(rate);
      if(remainder<0n){plan.error='The USD part is more than the change owed.';return plan;}
      cz=roundRatio(remainder,100);
    }
    if(!Number.isSafeInteger(cu)||!Number.isSafeInteger(cz)){plan.error='Amount too large for this preview.';return plan;}
    if(cu===0&&cz===0){plan.error='Below one USD cent. Choose ZWG for this change.';return plan;}
    plan.changes=[{currency:'USD',amount:cu},{currency:'ZWG',amount:cz}].filter(p=>p.amount>0);
    if(cu>s.cash+usd)plan.error='Only '+money(s.cash+usd)+' is available, including this payment.';
    else if(cz>s.zwg+zwg)plan.error='Only '+money(s.zwg+zwg,'ZWG')+' is available. Choose USD or split the change.';
  }
  plan.usdChange=plan.changes.find(p=>p.currency==='USD')?.amount||0;
  plan.zwgChange=plan.changes.find(p=>p.currency==='ZWG')?.amount||0;
  plan.rounding=(usd-plan.usdChange)*rate+(zwg-plan.zwgChange)*100-total()*rate;
  return plan;
}
screens.mixed=()=>{
  const d=mixedDraft();
  screen.innerHTML=heading('Cash received.','Sale total · '+money(total()),'pay')+
    '<p class="mixed-rate">USD 1.00 = '+money(d.rateMinor,'ZWG')+' · Example rate</p>'+
    (d.rateMinor!==s.rateMinor?'<p class="warning">Current rate: USD 1.00 = '+money(s.rateMinor,'ZWG')+
      '</p>'+btn('mixed-update-rate','Use current rate','secondary'):'')+
    '<div class="mixed-layout"><section><div class="mixed-tender">'+field('mixed-usd','Received · USD',d.usd,'maxlength="16" inputmode="decimal" placeholder="0.00"')+
    field('mixed-zwg','Received · ZWG',d.zwg,'maxlength="16" inputmode="decimal" placeholder="0.00"')+
    '</div><div class="suggestions">'+btn('mixed-exact-usd','Exact USD')+btn('mixed-exact-zwg','Exact ZWG')+'</div>'+
    '<details class="mixed-items"><summary>Items in this sale</summary>'+summaryRows(saleSnapshot())+'</details></section>'+
    '<section class="mixed-change"><div id="mixed-due" aria-live="polite"></div>'+
    '<div id="mixed-choice">'+select('change-currency','Give change in',option('','Choose currency',!d.changeCurrency)+
      option('USD','USD',d.changeCurrency==='USD')+option('ZWG','ZWG',d.changeCurrency==='ZWG')+
      option('split','USD + ZWG',d.changeCurrency==='split'))+
    '<div id="mixed-split">'+field('change-usd-part','USD part of the change',d.usdPart,
      'maxlength="16" inputmode="decimal" placeholder="0.00"')+'</div></div>'+
    '<div id="mixed-change-summary" aria-live="polite"></div><p class="error" id="mixed-error" role="alert"></p>'+
    '<p class="micro" id="mixed-drawer"></p></section></div>';
  primary('save-mixed','Save sale',true);drawChangePlan();
};
function drawChangePlan(){
  const p=changePlan();
  document.querySelector('#mixed-choice').hidden=!p.over;
  document.querySelector('#mixed-split').hidden=p.d.changeCurrency!=='split';
  document.querySelector('#mixed-due').innerHTML=p.short?line('Still needed',p.error):
    p.over?line('Overpayment',money(roundRatio(p.credit,100),'ZWG')):
      (!p.error?'<p class="change">Exact payment. No change to give.</p>':'');
  document.querySelector('#mixed-change-summary').innerHTML=p.changes.map(c=>
    '<div class="change">'+line('Change to give',money(c.amount,c.currency))+'</div>').join('');
  document.querySelector('#mixed-error').textContent=p.short?'':p.error;
  document.querySelector('#mixed-drawer').textContent=p.over&&p.usd!==null&&p.zwg!==null?
    'Available with this payment: '+money(s.cash+p.usd)+' · '+money(s.zwg+p.zwg,'ZWG')+
      (p.rounding?' · Change rounded to the chosen currency’s cents.':''):'';
  enable('save-mixed',!p.error);
}
inputActions.mixed=()=>{
  Object.assign(mixedDraft(),{usd:val('mixed-usd').slice(0,16),zwg:val('mixed-zwg').slice(0,16),
    changeCurrency:val('change-currency'),usdPart:val('change-usd-part').slice(0,16)});
  save();drawChangePlan();
};
actions['mixed-update-rate']=()=>{
  Object.assign(mixedDraft(),{rateMinor:s.rateMinor,changeCurrency:'',usdPart:''});save();render();
};
for(const c of ['usd','zwg'])actions['mixed-exact-'+c]=()=>{
  const d=mixedDraft();Object.assign(d,{usd:c==='usd'?(total()/100).toFixed(2):'0.00',
    zwg:c==='zwg'?(roundRatio(BigInt(total())*BigInt(d.rateMinor),100)/100).toFixed(2):'0.00',changeCurrency:'',usdPart:''});
  save();render();
};
actions['save-mixed']=()=>{
  if(page!=='mixed'||!count())return;
  const p=changePlan();drawChangePlan();if(p.error)return;
  const extra={rateMinor:p.rate,payments:[{currency:'USD',amount:p.usd},{currency:'ZWG',amount:p.zwg}],
    changePayments:p.changes,roundingZwgSubcent:p.rounding};
  s.zwg+=p.zwg-p.zwgChange;delete s.mixedDraft;
  completeSale(p.usd===0?'ZWG cash':p.zwg===0?'USD cash':'Split cash',total(),p.usd-p.usdChange,extra);
};
const originalChangeUpdate=updateChange;
updateChange=()=>{
  originalChangeUpdate();const n=parseCents(received),existing=document.querySelector('#choose-change-link');
  if(existing)existing.remove();
  if(s.currency==='USD'&&n!==null&&n>total())document.querySelector('#change-copy')?.insertAdjacentHTML('afterend',
    '<div id="choose-change-link">'+btn('mixed-from-cash','Choose another change currency','text-button full')+'</div>');
};
actions['mixed-from-cash']=()=>{
  Object.assign(mixedDraft(),{usd:received,zwg:'0.00',changeCurrency:'',usdPart:''});save();navigate('mixed');
};
