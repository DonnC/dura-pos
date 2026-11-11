// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// Base-unit integers: 1000 grams per kg. Money rounds once per sale line.
function roundRatio(n,d){return Number((BigInt(n)*2n+BigInt(d))/(BigInt(d)*2n));}
const lineAmount=(p,qty)=>roundRatio(BigInt(p.cents)*BigInt(qty),p.scale||1);
function decimalQuantity(units,scale=1){
  if(scale===1)return String(units);
  const abs=Math.abs(units);
  return (units<0?'-':'')+`${Math.trunc(abs/scale)}.${String(abs%scale).padStart(3,'0')}`.replace(/\.?0+$/,'');
}
const quantityText=(p,units)=>p.scale?`${decimalQuantity(units,p.scale)} ${p.measure}`:
  `${units} × ${p.unit}`;
const stockText=(p,units=p.stock)=>p.scale?quantityText(p,units):`${units} ${p.stockUnit}`;
function parseQuantity(value,scale=1){
  if(!value)return 0;
  if(!(scale===1?/^\d{1,5}$/:/^\d{1,2}(\.\d{0,3})?$/).test(value))return null;
  const [a,b='']=value.split('.');return Number(a)*scale+(scale===1?0:Number(b.padEnd(3,'0')));
}
function measuredProduct(){return products().find(p=>p.id===selectedId&&p.scale)||products().find(p=>p.scale);}
if(q.get('measure')==='sample'&&!products().some(p=>p.id==='rice')){
  products().push({id:'rice',name:'Loose rice',unit:'1 kg',stockUnit:'kg',cents:240,
    cat:'Food',stock:25000,scale:1000,measure:'kg'});
}
screens.quantity=()=>{
  const p=measuredProduct();
  if(!p){screen.innerHTML=heading('No weighed products.','This catalogue uses whole selling packs.','sell');
    primary('sell','Back to selling');return;}
  selectedId=p.id;
  const d=s.quantityDraft?.id===p.id?s.quantityDraft:
    {id:p.id,unit:'kg',value:s.basket[p.id]?decimalQuantity(s.basket[p.id],p.scale):''};
  s.quantityDraft=d;
  screen.innerHTML=heading('How much rice?','Loose rice · '+money(p.cents)+' per kg','sell')+
    '<div class="quantity-layout"><section>'+select('quantity-unit','Enter weight in',
      option('kg','Kilograms (kg)',d.unit==='kg')+option('g','Grams (g)',d.unit==='g'))+
    field('quantity-value','Weight · '+d.unit,d.value,'inputmode="decimal" placeholder="0"')+
    '<div class="quantity-presets">'+[[250,'250 g'],[500,'500 g'],[1000,'1 kg']].map(([v,l])=>
      btn('quantity-preset',l,'chip',`data-quantity="${v}"`)).join('')+'</div>'+
    '<p class="error" id="quantity-error" role="alert"></p>'+
    '</section><section class="quantity-summary"><h2 class="section-title">This amount</h2>'+
    '<div id="quantity-total" aria-live="polite"></div>'+
    note('Read the weight from your scale. This preview is manual entry; no scale is connected.')+
    (s.basket[p.id]?btn('quantity-remove','Remove rice from basket','text-button full'):'')+'</section></div>';
  primary('quantity-save',s.basket[p.id]?'Update basket':'Add to basket',true);drawQuantity();
};
function quantityUnits(){
  const d=s.quantityDraft;if(!d)return null;
  return parseQuantity(d.value,d.unit==='kg'?1000:1);
}
function drawQuantity(){
  const p=measuredProduct(),units=quantityUnits(),d=s.quantityDraft;
  // Gram entry allows up to 99,999 g; whole-pack return entry remains bounded separately.
  const error=units===null||units<=0||units>99999?'Enter 1–99,999 g, or up to 3 decimal places in kg.':'';
  document.querySelector('#quantity-error').textContent=d.value?error:'';
  document.querySelector('#quantity-total').innerHTML=line('Weight',!error?quantityText(p,units):'Enter a weight')+
    line('Line total',!error?money(lineAmount(p,units)):money(0))+
    line('On this phone',stockText(p));enable('quantity-save',!error);
}
inputActions.quantity=el=>{
  const d=s.quantityDraft;
  if(el.id==='quantity-unit'){
    const units=quantityUnits();d.unit=val('quantity-unit');
    d.value=units===null?'':d.unit==='g'?String(units):decimalQuantity(units,1000);save();render();return;
  }
  d.value=val('quantity-value');save();drawQuantity();
};
actions['quantity-preset']=b=>{
  const d=s.quantityDraft,units=Number(b.dataset.quantity);
  d.value=d.unit==='g'?String(units):decimalQuantity(units,1000);
  document.querySelector('#quantity-value').value=d.value;save();drawQuantity();
};
actions['quantity-save']=()=>{
  const p=measuredProduct(),units=quantityUnits();if(!p||!units||units>99999)return;
  undoBasket={...s.basket};s.basket[p.id]=units;s.quantityDraft=null;save();navigate('sell');
  toast('Rice quantity saved',true);
};
actions['quantity-edit']=b=>{selectedId=b.dataset.id;s.quantityDraft=null;navigate('quantity');};
actions['quantity-remove']=()=>{undoBasket={...s.basket};delete s.basket[measuredProduct().id];
  s.quantityDraft=null;save();navigate('sell');toast('Rice removed',true);};

if(q.get('measure')==='sample'&&page==='quantity'&&!s.quantityDraft){
  s.quantityDraft={id:'rice',unit:'kg',value:'0.75'};
}
