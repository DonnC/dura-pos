// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

const tabletViewport=window.matchMedia('(min-width:700px)');
function contextItems(items,editable=false){
  return items.map(p=>`<div class="context-product"><div class="row"><strong>${esc(p.name)}</strong>
    <strong>${money(p.lineTotal??lineAmount(p,p.qty))}</strong></div><p class="micro">${esc(p.unit)} · ${money(p.cents)} each</p>
      ${p.discountAmount?'<p class="micro">Original '+money(p.originalLineTotal)+' · Discount '+money(p.discountAmount)+'</p>':''}
      ${editable&&p.scale?btn('quantity-edit',esc(quantityText(p,p.qty))+' · Edit','secondary',`data-id="${p.id}"`):editable?`<div class="stepper">${btn('context-minus','−','',
      `data-id="${p.id}" aria-label="Remove one ${esc(p.name)}"`)}<span>${p.qty}</span>
      ${btn('context-plus','+','',`data-id="${p.id}" aria-label="Add one ${esc(p.name)}"`)}</div>`:
      `<p class="micro">Quantity: ${esc(quantityText(p,p.qty))}</p>`}</div>`).join('');
}
function renderContext(blocked=false){
  const aside=document.querySelector('#context'),app=document.querySelector('#app');
  let content='';
  const canShow=tabletViewport.matches&&!document.documentElement.classList.contains('large')&&
    !blocked&&!(s.role==='worker'&&ownerScreens.has(page));
  if(canShow){
    if(page==='sell'){
      content=`<div class="eyebrow">Front counter · ${esc(s.name)}</div><h2>Current sale</h2>
        <p class="sub">Walk-in customer · ${count()} items</p>`+
        (count()?contextItems(saleSnapshot(),true)+line('Total',money(total()))+
          btn('hold','Hold this sale','secondary full'):
          '<div class="empty"><h3>Ready for a customer.</h3><p class="sub">Tap a product on the shelf.</p></div>');
    }else if(['pay','mobile','credit'].includes(page)){
      content=`<p class="eyebrow">You’re taking payment for</p><h2>Order summary</h2>`+
        contextItems(saleSnapshot())+line('Total',money(total()))+
        note('Check the items before saving. Back returns to the same basket.');
    }else if(page==='history'){
      const receipt=lastSale&&(s.role==='owner'||lastSale.who===s.name)?lastSale:
        receiptList().find(r=>s.role==='owner'||r.who===s.name);
      if(receipt)content=`<p class="eyebrow">Saved practice receipt</p><h2>${money(receipt.amount,receipt.currency)}</h2>
        <p class="sub">${esc(receipt.id)} · ${esc(receipt.who)}</p>`+
        contextItems(receipt.items)+line('Payment',esc(receipt.method))+
        note('Saved on this device. Not uploaded. No fiscal receipt issued.');
    }else if(page==='stock'){
      const p=products().find(p=>p.id===selectedId)||products()[0];
      if(p&&(page!=='stock'||document.querySelector('#stock-list .menu-row')))content=
        `<p class="eyebrow">Product at this location</p><h2>${esc(p.name)}</h2>
        <div class="detail-art">${art(p.id)}</div>`+
        line('Selling unit',esc(p.unit))+line('Price',money(p.cents))+
        line('On hand',p.stock===null?'Not tracked':esc(stockText(p)))+
        (s.role==='owner'?btn('product','View details & movements','secondary full',`data-id="${p.id}"`):
          note('Need a delivery or correction? Ask the owner.'));
    }
  }
  aside.hidden=!content;app.classList.toggle('has-context',!!content);
  if(content)aside.innerHTML=content;
}
for(const action of ['context-plus','context-minus'])actions[action]=b=>{
  const id=b.dataset.id;undoBasket={...s.basket};
  s.basket[id]=Math.max(0,Math.min(99,(s.basket[id]||0)+(action==='context-plus'?1:-1)));
  save();drawCatalog();drawBasket();renderContext();
  if(!s.basket[id])toast('Item removed',true);
};
// Resizing updates only the companion panel: typed forms and the basket stay put.
tabletViewport.addEventListener('change',()=>renderContext());
