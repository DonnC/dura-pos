// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// Fictional browser sandbox, never a production record or access-control layer.
const q=new URLSearchParams(location.search);
const storageKey='dura-cdx-day-v2';
const previewProductLimit=1000;
const worker=q.get('role')==='worker';
const initialProducts=[
  {id:'bread',name:'Bread',unit:'1 loaf',stockUnit:'loaves',cents:100,cat:'Food',stock:18},
  {id:'milk',name:'Fresh milk',unit:'1 litre',stockUnit:'cartons',cents:150,cat:'Drinks',stock:12},
  {id:'eggs',name:'Eggs',unit:'6 eggs',stockUnit:'packs',cents:150,cat:'Food',stock:8},
  {id:'oil',name:'Cooking oil',unit:'2 litres',stockUnit:'bottles',cents:450,cat:'Food',stock:6},
  {id:'meal',name:'Mealie meal',unit:'5 kg',stockUnit:'bags',cents:380,cat:'Food',stock:4},
  {id:'sugar',name:'Brown sugar',unit:'2 kg',stockUnit:'packs',cents:250,cat:'Food',stock:9}
];
let s={version:2,role:worker?'worker':'owner',name:worker?'Rudo':'Chipo',
  shop:'Chipo’s corner shop',currency:'USD',products:structuredClone(initialProducts),
  basket:{},held:[],pending:[],history:[],events:[],active:true,cash:worker?2050:7050,
  zwg:0,rateMinor:2700,seedDay:true,sales:worker?2550:8650,saleCount:worker?8:24,
  saleSeq:worker?8:24,owed:1450,
  supplier:2000,features:{credit:false,mobile:false,multi:false},last:null};
try{
  const saved=JSON.parse(localStorage.getItem(storageKey));
  if(q.get('fresh')!=='1'&&saved?.version===2&&['owner','worker'].includes(saved.role)&&
    (!q.has('role')||saved.role===s.role)&&
    Array.isArray(saved.products)&&saved.products.length<=previewProductLimit&&Array.isArray(saved.history)&&
    saved.history.length<=30&&Number.isSafeInteger(saved.cash))s={...s,...saved};
}catch{}
if(q.get('seed')==='1')s.basket={bread:2,milk:1};
if(q.get('features')==='1')s.features={credit:true,mobile:true,multi:true};
if(['account','practice'].includes(q.get('appearance')))s.previewAppearance=q.get('appearance');
const screens={},actions={},inputActions={};
const mainDestinations=new Set(['sell','stock','money','shop']);
const taskIdentity=()=>`<span class="task-identity">${esc(s.name)} · ${s.role==='owner'?'Owner':'Cashier'}</span>`;
const ownerScreens=new Set(['receive','receive-review','stock-count','count-stock-review','product-edit','customers',
  'invoice-items','invoice-payment','invoice-review','invoice-detail',
  'customer','suppliers','supplier-statement','records','export','people','staff','pair','settings','setup','reports',
  'connect','restore','fiscal','access-review','access-status','access-remove',
  'report-sales','report-cash','report-coverage','connection-review','connection-status',
  'pair-code','restore-review','restore-status','lost-phone','fiscal-setup',
  'fiscal-owner-review','fiscal-day','fiscal-close','fiscal-device']);
let page=q.get('screen')||'sell',demoState=q.get('state')||'populated';
let offline=q.get('offline')==='1',category='Favourites',search='',selectedId='bread';
if(q.get('shelf')==='full')category='All items';
let received=q.get('cash')==='500'?'5.00':'',undoBasket,toastTimer,draft={},lastSale=s.last;
const screen=document.querySelector('#screen'),dock=document.querySelector('#dock');
const nav=document.querySelector('#nav'),sheet=document.querySelector('#sheet');
const products=()=>s.products;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=(cents,currency=s.currency)=>`${currency} ${(cents/100).toFixed(2)}`;
const basketRows=()=>products().filter(p=>s.basket[p.id]>0);
const total=()=>basketRows().reduce((sum,p)=>sum+lineAmount(p,s.basket[p.id]),0);
const count=()=>basketRows().reduce((sum,p)=>sum+(p.scale?1:s.basket[p.id]),0);
const btn=(action,label,cls='secondary',extra='')=>
  `<button class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
const line=(title,value,sub='')=>`<div class="ledger-row"><div>${title}
  ${sub?`<small>${sub}</small>`:''}</div><strong>${value}</strong></div>`;
const heading=(title,sub='',back='')=>`${back?btn(back,icon('back')+' Back','back'):''}
  <div class="heading"><h1>${title}</h1>${sub?`<p class="sub">${sub}</p>`:''}
  ${title&&!mainDestinations.has(page)&&!['welcome','setup','first-product','join','join-review','join-status'].includes(page)?taskIdentity():''}</div>`;
const field=(id,label,value='',opts='')=>`<label class="form-label" for="${id}">${label}
  <input class="form-input" id="${id}" value="${esc(value)}" ${opts}></label>`;
const select=(id,label,options)=>`<label class="form-label" for="${id}">${label}
  <select class="form-input" id="${id}">${options}</select></label>`;
const option=(value,label,selected=false)=>`<option value="${esc(value)}"
  ${selected?'selected':''}>${esc(label)}</option>`;
const menu=(action,title,sub,i='chevron',extra='')=>btn(action,
  `<span class="ledger-icon">${icon(i)}</span><span class="grow"><strong>${title}</strong>
  <small>${sub}</small></span>${icon('chevron')}`,'menu-row',extra);
const note=text=>`<p class="note">${icon('shield')}${text}</p>`;
const val=id=>document.getElementById(id)?.value.trim()||'';
const parseCents=value=>{
  if(!/^\d{1,7}(\.\d{0,2})?$/.test(value))return null;
  const [a,b='']=value.split('.');return Number(a)*100+Number(b.padEnd(2,'0'));
};
const validAmount=id=>{const n=parseCents(val(id));return n!==null&&n>0;};
function save(){
  if(typeof clearStaleDiscounts==='function')clearStaleDiscounts();
  if(typeof clearStaleCashDraft==='function')clearStaleCashDraft();
  // A customer/payment draft must not follow a changed or held basket.
  if(s.keptCheckout&&s.keptCheckout.basket!==keptBasketKey())s.keptCheckout=null;
  s.history=s.history.slice(0,30);s.events=s.events.slice(0,50);s.held=s.held.slice(0,3);
  s.refunds=(s.refunds||[]).filter(id=>id==='T-P1-S261110-0008'||s.history.some(r=>r.id===id));
  const retained=new Set(['T-P1-S261110-0008',...s.history.map(r=>r.id)]);
  if(s.returnTotals)for(const id of Object.keys(s.returnTotals))if(!retained.has(id))delete s.returnTotals[id];
  if(s.partialReturns)s.partialReturns=s.partialReturns.filter(r=>retained.has(r.sale)).slice(0,30);
  try{localStorage.setItem(storageKey,JSON.stringify(s));return true;}catch{
    toast('Browser storage unavailable. Keep this practice session open.');
    return false;
  }
}
function record(text){s.events.unshift({text,who:s.name});save();}
function primary(action,label,disabled=false){
  dock.innerHTML=btn(action,`<span>${label}</span>${icon('arrow')}`,'primary',disabled?'disabled':'');
}
function navigate(destination){
  if(sheet.open)sheet.close();page=destination;demoState='populated';render();
  screen.scrollTop=0;screen.focus({preventScroll:true});
}
function toast(message,undo=false){
  const el=document.querySelector('#toast');
  el.innerHTML=esc(message)+(undo?btn('undo','Undo','text-button'):'');el.classList.add('visible');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),5000);
}
function showSheet(title,body,footer=''){
  if(sheet.open)sheet.close();sheet.innerHTML=`<header><h2 id="sheet-title">${title}</h2>
    ${btn('close',icon('close'),'','aria-label="Close panel"')}</header>${body}${footer}`;
  sheet.showModal();
}
function result(title,body,next,label){
  screen.innerHTML=`<div class="page-content"><div class="result-top"><div class="success-icon">${icon('check')}</div>
    <p class="eyebrow">Practice record saved on this device</p><h1>${title}</h1></div>${body}</div>`;
  primary(next,label);
  if(typeof applyScreenLayout==='function')applyScreenLayout();
}
function enable(action,yes){const el=document.querySelector(`[data-action="${action}"]`);
  if(el)el.disabled=!yes;}
function summaryRows(items){return items.map(p=>line(esc(p.name),money(p.lineTotal??lineAmount(p,p.qty)),
  `${esc(quantityText(p,p.qty))} · ${money(p.cents)} per ${esc(p.unit)}`)+
  (p.discountAmount?line('Discount included','− '+money(p.discountAmount),'Original line '+money(p.originalLineTotal)):'')).join('');}
function saleSnapshot(){return basketRows().map(p=>({...p,qty:s.basket[p.id],
  lineTotal:lineAmount(p,s.basket[p.id]),...(typeof lineDiscountSnapshot==='function'?lineDiscountSnapshot(p):{})}));}
function resetBasket(){undoBasket={...s.basket};s.basket={};save();}
function stockMove(id,label,delta,after){
  s.stockRevisions||={};s.stockRevisions[id]=(s.stockRevisions[id]||0)+1;
  s.movements=s.movements||[];s.movements.push({id,label,delta,after,who:s.name});
  s.movements=s.movements.slice(-60);
}
