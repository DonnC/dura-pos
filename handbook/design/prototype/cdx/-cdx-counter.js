// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

function render(){
  const blocked=s.role==='worker'&&ownerScreens.has(page);
  const onboarding=['welcome','setup','first-product','join'].includes(page);
  const full=['pay','done','opening','cashup','count-review','handover','locked','welcome','join',
    'setup','first-product','pending','refund','refund-review','receive-review',
    'count-stock-review','expense-review','export'].includes(page);
  document.querySelector('.identity strong').textContent=s.shop;
  document.querySelector('.identity small').textContent=`Front counter · ${s.name} · ${
    s.role==='owner'?'Owner':'Seller'}`;
  const avatar=document.querySelector('.avatar');avatar.textContent=s.name[0];
  avatar.dataset.action='profile';avatar.setAttribute('aria-label',`Current seller: ${s.name}`);
  const connection=document.querySelector('#connection');
  document.querySelector('.appbar').hidden=onboarding;connection.hidden=onboarding;
  connection.classList.toggle('offline',offline);
  connection.innerHTML=`<span class="dot"></span>${offline?
    'Offline · Saved here, upload later':'Practice shop · Saved on this phone'}${icon('chevron')}`;
  const groups={stock:['stock','product','product-edit','receive','receive-review','stock-count','count-stock-review'],
    money:['money','history','receipt','print','refund','refund-review','expense','expense-review',
      'customers','customer','suppliers','reports'],
    shop:['shop','people','staff','pair','settings','records','export','restore','connect','sync','help','fiscal']};
  const current=Object.keys(groups).find(k=>groups[k].includes(page))||'sell';
  nav.innerHTML=['sell','stock','money','shop'].map((p,i)=>
    `<button data-action="${p}" ${current===p?'aria-current="page"':''}>${icon(p)}
    ${['Sell','Stock',s.role==='worker'?'My till':'Money',s.role==='worker'?'Me':'My shop'][i]}</button>`).join('');
  nav.hidden=full;dock.innerHTML='';screen.setAttribute('tabindex','-1');
  if(blocked){
    screen.innerHTML=heading('Owner access.','Ask the owner to open this part of the shop.')+
      note('Your sale is still safe. You can keep selling with your own access.');
    primary('sell','Back to selling');return;
  }
  (screens[page]||screens.sell)();
}
actions.close=()=>sheet.close();
actions.undo=()=>{if(undoBasket){s.basket={...undoBasket};save();render();
  if(sheet.open){sheet.close();actions.basket();}}document.querySelector('#toast').classList.remove('visible');};
actions.connection=()=>navigate('sync');
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-action]');if(!b||b.disabled)return;
  const a=b.dataset.action;
  if(page==='locked'&&a!=='unlock')return;
  if(actions[a])actions[a](b);
  else if(screens[a])navigate(a);
});
document.addEventListener('input',e=>{if(inputActions[page])inputActions[page](e.target);});
document.addEventListener('change',e=>{if(inputActions[page])inputActions[page](e.target);});
sheet.addEventListener('click',e=>{if(e.target===sheet){const r=sheet.getBoundingClientRect();
  if(e.clientY<r.top||e.clientY>r.bottom)sheet.close();}});
if(q.get('theme')==='dark')document.documentElement.classList.add('dark');
if(q.get('text')==='large')document.documentElement.classList.add('large');
if(demoState==='empty'){s.basket={};s.products=[];}
if(page==='opening')s.active=false;
render();
