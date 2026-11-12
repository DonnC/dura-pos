// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

function render(){
  page=accessPageFor(page);
  const app=document.querySelector('#app');app.dataset.page=page;
  app.classList.remove('has-workspace');
  const blocked=s.role==='worker'&&ownerScreens.has(page);
  const onboarding=['welcome','setup','first-product','join','join-review','join-status'].includes(page);
  const full=['pay','opening','cashup','count-review','handover','locked','welcome','join','money-in','money-in-review',
    'setup','first-product','pending','refund','refund-review','receive-review',
    'count-stock-review','expense-review','invoice-items','invoice-payment','invoice-review','export',
    'kept-checkout','kept-keep','kept-refund','kept-refund-review',
    'quantity','discount','discount-review','return-items','return-review','access-review','access-remove',
    'access-expired','access-removed','access-recovery','staff','connection-review',
    'connection-status','pair-code','join-review','join-status','restore-review','restore-status','lost-phone','fiscal-setup','fiscal-check','fiscal-owner-review','fiscal-close'].includes(page)||page==='done'&&saleSaveError;
  document.querySelector('.identity strong').textContent=s.shop;
  document.querySelector('.identity small').textContent=`${s.name} · ${
    s.role==='owner'?'Owner':'Cashier'}`;
  const avatar=document.querySelector('.avatar');avatar.textContent=s.name[0];
  avatar.dataset.action='profile';avatar.setAttribute('aria-label',
    `Signed in as ${s.name}, ${s.role==='owner'?'Owner':'Cashier'}. Open profile`);
  const connection=document.querySelector('#connection');
  const taskView=!mainDestinations.has(page)&&!onboarding;
  app.classList.toggle('task-view',taskView);
  document.querySelector('.appbar').hidden=onboarding||taskView;connection.hidden=onboarding||!offline;
  const appearance=s.previewAppearance||'account';
  s.previewAppearance=appearance;
  document.querySelector('#mode-marker').textContent=appearance==='practice'?'Practice':'Preview';
  connection.classList.toggle('offline',offline);
  connection.innerHTML=`<span class="dot"></span>${offline?
    'Offline · Sales saved on this device':'Saved on this device'}${icon('chevron')}`;
  const groups={stock:['stock','product','product-edit','receive','receive-review','stock-count','count-stock-review','take-history','take-history-detail'],
    money:['money','history','receipt','print','refund','refund-review','expense','expense-review','money-in','money-in-review',
      'customers','customer','suppliers','supplier-statement','reports','report-sales','report-cash','report-coverage',
      'report-trend','report-products','report-cashiers','report-discounts',
      'invoice-items','invoice-payment','invoice-review','invoice-detail',
      'kept-customers','kept-account','kept-refund','kept-refund-review','return-items','return-review'],
    shop:['shop','people','staff','pair','settings','records','export','restore','connect','sync','help','fiscal','my-access','access-review','access-status','access-remove',
      'access-expired','access-removed','access-recovery','access-limited','connection-review',
      'connection-status','pair-code','join-review','join-status','restore-review','restore-status','lost-phone','fiscal-setup','fiscal-queue','fiscal-receipt','fiscal-check',
      'fiscal-owner-review','fiscal-day','fiscal-close','fiscal-device']};
  const current=Object.keys(groups).find(k=>groups[k].includes(page))||'sell';
  nav.innerHTML=['sell','stock','money','shop'].map((p,i)=>
    `<button data-action="${p}" ${current===p?'aria-current="page"':''}>${icon(p)}
    ${['Sell','Stock',s.role==='worker'?'My till':'Money',s.role==='worker'?'Me':'My shop'][i]}</button>`).join('');
  nav.hidden=full;dock.innerHTML='';screen.setAttribute('tabindex','-1');
  app.classList.toggle('flow',full);app.classList.toggle('onboarding',onboarding);
  if(blocked){
    screen.innerHTML=heading('Owner access.','Ask the owner to open this part of the shop.')+
      note('Your sale is still safe. You can keep selling with your own access.');
    primary('sell','Back to selling');renderContext(true);return;
  }
  (screens[page]||screens.sell)();
  if(!screen.querySelector('.page-content')&&page!=='sell'){
    const content=document.createElement('div');content.className='page-content';
    while(screen.firstChild)content.appendChild(screen.firstChild);screen.appendChild(content);
  }
  if(supervisedAccess&&s.role==='worker'&&['cashup','count-review','handover','switch-person'].includes(page)){
    screen.querySelector('.page-content').insertAdjacentHTML('afterbegin',
      '<p class="access-supervision">Owner-supervised handover · '+esc(s.name)+'’s drawer. Selling access stays removed.</p>');
  }
  for(const amount of screen.querySelectorAll('.amount-due')){
    amount.classList.toggle('long-amount',amount.textContent.replace(/\D/g,'').length>8);
  }
  applyScreenLayout();
  renderContext();
}
actions.close=()=>sheet.close();
actions.undo=()=>{if(undoBasket){s.basket={...undoBasket};save();render();
  if(sheet.open){sheet.close();actions.basket();}}document.querySelector('#toast').classList.remove('visible');};
actions.connection=()=>navigate('sync');
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-action]');if(!b||b.disabled)return;
  const a=b.dataset.action;
  if(!accessCanAction(a)){toast('Ask the owner. Your work is kept.');render();return;}
  if(page==='locked'&&a!=='unlock')return;
  if(actions[a])actions[a](b);
  else if(screens[a])navigate(a);
  if(supervisedAccess&&s.role==='worker'&&['cashup','count-review','handover','switch-person'].includes(page)){
    screen.querySelector('.page-content').insertAdjacentHTML('afterbegin',
      '<p class="access-supervision">Owner-supervised handover · '+esc(s.name)+'’s drawer. Selling access stays removed.</p>');
  }
  renderContext();
});
document.addEventListener('input',e=>{if(inputActions[page])inputActions[page](e.target);});
document.addEventListener('change',e=>{
  if(e.target.matches('select,input[type=checkbox],input[type=radio]')&&inputActions[page]){
    inputActions[page](e.target);
  }
});
sheet.addEventListener('click',e=>{if(e.target===sheet){const r=sheet.getBoundingClientRect();
  if(e.clientY<r.top||e.clientY>r.bottom)sheet.close();}});
if(q.get('theme')==='dark')document.documentElement.classList.add('dark');
if(q.get('text')==='large')document.documentElement.classList.add('large');
if(demoState==='empty'&&!page.startsWith('fiscal')&&!['reports','report-sales','report-cash','report-coverage',
  'connect','connection-review','connection-status','pair','pair-code','join','join-review','join-status',
  'restore','restore-review','restore-status','lost-phone','fiscal-setup','fiscal-check','fiscal-owner-review','fiscal-close'].includes(page)){
  s.basket={};s.products=[];
}
if(page==='opening')s.active=false;
render();
