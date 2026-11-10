// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

screens.stock=()=>{
  const low=products().filter(p=>p.stock!==null&&p.stock<=4);
  screen.innerHTML=heading('Your stock.','Front counter · Latest on this phone')+
    (low.length?`<p class="warning">${low.length} running low · ${low.map(p=>esc(p.name)).join(', ')}</p>`:'')+
    `<div class="tabs">${btn('stock','All products','chip','aria-pressed="true"')}
    ${s.role==='owner'?btn('stock-count','Count stock','chip')+btn('new-product','Add product','chip'):''}</div>`+
    products().filter(p=>!p.oneOff).map(p=>menu('product',esc(p.name),
      `${p.stock===null?'Stock not tracked':p.stock+' '+esc(p.stockUnit)} · ${esc(p.unit)} · ${money(p.cents)}`,
      'stock',`data-id="${p.id}"`)).join('');
  if(s.role==='owner')primary('receive','Receive stock');
  else dock.innerHTML=note('Need more stock? Let the owner know what’s running low.');
};
actions.product=b=>{selectedId=b.dataset.id;navigate('product');};
screens.product=()=>{
  const p=products().find(p=>p.id===selectedId)||products()[0];
  if(!p){navigate('stock');return;}selectedId=p.id;
  screen.innerHTML=heading(esc(p.name),esc(p.unit),'stock')+
    `<div class="detail-art">${art(p.id)}</div>`+
    line('Selling price',money(p.cents))+line('On this phone',p.stock===null?'Not tracked':
      `${p.stock} ${esc(p.stockUnit)}`)+line('Category',esc(p.cat))+
    note('Stock reflects this phone’s latest records. Other tills may have newer sales.')+
    (s.role==='owner'?menu('product-edit','Edit product','Price, selling unit and stock tracking','settings'):'');
  if(s.role==='owner')primary('receive','Receive this product');
};
screens.receive=()=>{
  screen.innerHTML=heading('Receive stock.','Count what actually arrived.','stock')+
    select('receive-product','Product',products().filter(p=>p.stock!==null).map(p=>
      option(p.id,`${p.name} · ${p.unit}`,p.id===selectedId)).join(''))+
    field('receive-qty','How many selling packs arrived?',draft.receive?.qty??'',
      'type="number" min="1" max="999" placeholder="0"')+
    select('receive-supplier','Supplier (optional)',option('mambo','Mambo Wholesale')+
      option('other','Other / not named'))+
    field('delivery-ref','Delivery reference (optional)',draft.receive?.ref||'',
      'maxlength="40" placeholder="Invoice or delivery number"')+
    note('Enter selling packs, not cartons containing several packs. Record a supplier payment separately in Money.');
  if(draft.receive){document.querySelector('#receive-product').value=draft.receive.id;
    document.querySelector('#receive-supplier').value=draft.receive.supplierId||'mambo';}
  primary('review-receive','Review stock received',true);inputActions.receive();
};
inputActions.receive=()=>enable('review-receive',/^\d+$/.test(val('receive-qty'))&&
  Number(val('receive-qty'))>0&&Number(val('receive-qty'))<=999);
actions['review-receive']=()=>{
  draft.receive={id:val('receive-product'),qty:Number(val('receive-qty')),ref:val('delivery-ref'),
    supplierId:val('receive-supplier'),
    supplier:document.querySelector('#receive-supplier').selectedOptions[0].textContent};
  navigate('receive-review');
};
screens['receive-review']=()=>{
  if(!draft.receive){navigate('receive');return;}
  const r=draft.receive,p=products().find(p=>p.id===r.id);
  screen.innerHTML=heading('Check the delivery.','Nothing is added until you save.','receive')+
    `<div class="detail-art">${art(p.id)}</div>`+line(esc(p.name),`${r.qty} × ${esc(p.unit)}`)+
    line('Before',`${p.stock} ${esc(p.stockUnit)}`)+line('After saving',`${p.stock+r.qty} ${esc(p.stockUnit)}`)+
    (r.supplier?line('Supplier',esc(r.supplier)):'')+
    (r.ref?line('Delivery reference',esc(r.ref)):'')+note('This records quantity received. It does not change the cash drawer.');
  primary('save-receive','Save stock received');
};
actions['save-receive']=()=>{
  const r=draft.receive;if(!r)return;
  const p=products().find(p=>p.id===r.id);p.stock+=r.qty;
  record(`Received ${r.qty} × ${p.name}; ${r.supplier||'supplier not named'}; ${r.ref||'no reference'}`);
  result('Stock received.',line(esc(p.name),`${p.stock} ${esc(p.stockUnit)} now`),'stock','Back to stock');
  draft.receive=null;
};
screens['stock-count']=()=>{
  screen.innerHTML=heading('Count the shelf.','Front counter · Enter what you can see.','stock')+
    products().filter(p=>p.stock!==null).map(p=>field(`count-${p.id}`,
      `${esc(p.name)} · Count ${esc(p.stockUnit)} (${esc(p.unit)} each)`,
      draft.stockCount?.find(r=>r.id===p.id)?.count??'',
      'type="number" min="0" max="999" placeholder="Not counted"')).join('')+
    note('Leave anything you haven’t counted blank. Zero means none left.');
  primary('review-stock-count','Review count',true);inputActions['stock-count']();
};
inputActions['stock-count']=()=>{
  const values=products().filter(p=>p.stock!==null).map(p=>val(`count-${p.id}`));
  enable('review-stock-count',values.some(v=>v!=='')&&values.every(v=>v===''||/^\d{1,3}$/.test(v)));
};
actions['review-stock-count']=()=>{
  draft.stockCount=products().filter(p=>p.stock!==null&&val(`count-${p.id}`)!=='')
    .map(p=>({id:p.id,count:Number(val(`count-${p.id}`)),before:p.stock}));navigate('count-stock-review');
};
screens['count-stock-review']=()=>{
  if(!draft.stockCount){navigate('stock-count');return;}
  const changed=draft.stockCount.some(r=>r.count!==r.before);
  screen.innerHTML=heading('Review the count.','Differences need a reason.','stock-count')+
    draft.stockCount.map(r=>{const p=products().find(p=>p.id===r.id);return line(esc(p.name),
      `${r.count} ${esc(p.stockUnit)}`,`Recorded ${r.before}; difference ${r.count-r.before}`);}).join('')+
    (changed?field('count-reason','Reason for the difference','','maxlength="120" '+
      'placeholder="e.g. Damaged packs removed"'):'<p class="change">All counted products match.</p>');
  primary('save-stock-count','Save stock count',changed);
};
inputActions['count-stock-review']=()=>enable('save-stock-count',val('count-reason').length>=5);
actions['save-stock-count']=()=>{
  for(const r of draft.stockCount)products().find(p=>p.id===r.id).stock=r.count;
  record('Stock count saved: '+(val('count-reason')||'Counts matched'));
  result('Count saved.',note('The correction is a new stock movement. Earlier sales stay unchanged.'),
    'stock','Back to stock');draft.stockCount=null;
};
actions['new-product']=()=>{selectedId='';navigate('product-edit');};
screens['product-edit']=()=>{
  const p=products().find(p=>p.id===selectedId);
  screen.innerHTML=heading(p?'Edit product.':'Add a product.','A name, selling unit and price.','stock')+
    field('product-name','Product name',p?.name||'','maxlength="60" placeholder="e.g. Tomatoes"')+
    field('product-unit','Selling unit',p?.unit||'','maxlength="30" placeholder="e.g. 1 kg"')+
    field('product-price',`Selling price · ${s.currency}`,p?(p.cents/100).toFixed(2):'',
      'inputmode="decimal" placeholder="0.00"')+
    select('product-track','Track stock?',option('yes','Yes, count selling packs',p?.stock!==null)+
      option('no','No, service or untracked item',p?.stock===null))+
    note('Price changes apply to future sales. Existing receipts keep their original price.');
  primary('save-product','Save product',!p);
};
inputActions['product-edit']=()=>enable('save-product',val('product-name')&&val('product-unit')&&
  validAmount('product-price'));
actions['save-product']=()=>{
  let p=products().find(p=>p.id===selectedId);
  if(!p){if(products().length>=40){toast('Practice catalogue limit reached.');return;}
    p={id:`item${products().length}`,cat:'Food',stock:0,stockUnit:'packs'};products().push(p);}
  p.name=val('product-name');p.unit=val('product-unit');p.cents=parseCents(val('product-price'));
  p.stock=val('product-track')==='no'?null:(p.stock??0);record('Product saved: '+p.name);navigate('stock');
};
