// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// Practice-only invoice workflow. No files, payments or records leave the browser.
function invoiceDraft(){
  return s.invoiceDraft||(s.invoiceDraft={ref:'',items:[],mode:'later',paid:'',due:'',evidence:false});
}
if(q.get('invoice')==='sample'&&page.startsWith('invoice-')){
  s.invoiceDraft={ref:'MW-1042',items:[
    {id:'bread',name:'Bread',unit:'1 loaf',qty:6,cost:70},
    {id:'milk',name:'Fresh milk',unit:'1 litre',qty:6,cost:110}],
    mode:'part',paid:'5.00',due:'2026-11-17',evidence:true};
}
const invoiceTotal=d=>d.items.reduce((sum,i)=>sum+i.qty*i.cost,0);
const invoicePaid=d=>d.mode==='full'?invoiceTotal(d):d.mode==='later'?0:parseCents(d.paid);
const invoiceDate=value=>value?new Intl.DateTimeFormat('en-GB',{
  day:'numeric',month:'short',year:'numeric',timeZone:'UTC'
}).format(new Date(value+'T00:00:00Z')):'Not recorded';
function invoiceRows(d,editable=false){
  return d.items.map((i,n)=>line(esc(i.name),money(i.qty*i.cost),
    `${i.qty} × ${esc(i.unit)} · ${money(i.cost)} per pack`)+
    (editable?btn('invoice-edit','Edit '+esc(i.name),'text-button',`data-index="${n}"`)+
    btn('invoice-remove','Remove '+esc(i.name),'text-button',`data-index="${n}"`):'')).join('');
}
function invoiceSummary(d,includeTotal=true){
  const total=invoiceTotal(d),paid=invoicePaid(d);
  return (includeTotal?line('Invoice total',money(total)):'')+line('Cash from this till',money(paid??0))+
    line('Left to pay',paid===null||paid>total?'Check payment amount':money(total-paid));
}
function invoiceRemember(){save();}
actions['new-invoice']=()=>navigate('invoice-items');
screens['invoice-items']=()=>{
  const d=invoiceDraft();
  screen.innerHTML=heading('Items received.','1 of 3 · New delivery from Mambo Wholesale','supplier-statement')+
    field('invoice-ref','Invoice number / your reference',d.ref,
      'maxlength="40" placeholder="e.g. MW-1042"')+
    '<h2 class="section-title">What arrived?</h2><div id="invoice-lines">'+
    (d.items.length?invoiceRows(d,true):'<p class="sub">Add each product, the packs received and your buying cost.</p>')+
    '</div>'+btn('invoice-add',icon('plus')+' Add an item','secondary full',
      d.items.length>=12?'disabled':'')+line('Invoice total',money(invoiceTotal(d)))+
    '<p class="micro">Draft kept on this browser. You can leave and return.</p>'+
    note('New stock only. Do not add a delivery already recorded in Receive stock. Costs are buying costs, not selling prices.');
  primary('invoice-payment','Continue to payment',!d.items.length||!d.ref);
};
inputActions['invoice-items']=()=>{
  const d=invoiceDraft();d.ref=val('invoice-ref');invoiceRemember();
  enable('invoice-payment',!!d.ref&&d.items.length>0);
};
actions['invoice-edit']=b=>{draft.invoiceEdit=Number(b.dataset.index);openInvoiceItem();};
actions['invoice-add']=()=>{draft.invoiceEdit=null;openInvoiceItem();};
function openInvoiceItem(){
  const existing=Number.isInteger(draft.invoiceEdit)?invoiceDraft().items[draft.invoiceEdit]:null;
  const available=products().filter(p=>p.stock!==null&&!p.scale&&(!invoiceDraft().items.some(i=>i.id===p.id)||p.id===existing?.id));
  if(!available.length){toast('All tracked products are already added.');return;}
  showSheet(existing?'Edit item':'Add an item',select('item-product','Product',available.map(p=>
    option(p.id,`${p.name} · ${p.unit}`,p.id===existing?.id)).join(''))+
    field('item-qty','Selling packs received',existing?.qty??'','type="number" min="1" max="999" placeholder="0"')+
    field('item-cost',`Buying cost per selling pack · ${s.currency}`,existing?(existing.cost/100).toFixed(2):'',
      'inputmode="decimal" placeholder="0.00"')+
    '<p class="error" id="item-error" role="alert"></p>'+
    note('Use the same pack you sell. For a carton, count the selling packs inside.'),
    btn('invoice-add-line',existing?'Save item':'Add to invoice','primary'));
};
actions['invoice-add-line']=()=>{
  const qty=Number(val('item-qty')),cost=parseCents(val('item-cost'));
  if(!Number.isInteger(qty)||qty<1||qty>999||cost===null||cost<=0){
    document.querySelector('#item-error').textContent='Enter 1–999 whole packs and a buying cost above zero.';return;
  }
  const p=products().find(p=>p.id===val('item-product')),d=invoiceDraft();
  if(!p||d.items.some((i,n)=>i.id===p.id&&n!==draft.invoiceEdit))return;
  const item={id:p.id,name:p.name,unit:p.unit,qty,cost};
  if(Number.isInteger(draft.invoiceEdit))d.items[draft.invoiceEdit]=item;
  else if(d.items.length<12)d.items.push(item);else return;
  draft.invoiceEdit=null;invoiceRemember();sheet.close();render();
};
actions['invoice-remove']=b=>{
  const d=invoiceDraft();d.items.splice(Number(b.dataset.index),1);invoiceRemember();render();
};
screens['invoice-payment']=()=>{
  const d=invoiceDraft();if(!d.items.length){navigate('invoice-items');return;}
  screen.innerHTML=heading('How is it paid?','2 of 3 · Mambo Wholesale','invoice-items')+
    line('Invoice total',money(invoiceTotal(d)))+
    '<div class="invoice-layout"><section><h2 class="section-title">Pay from this till</h2><div class="invoice-choices">'+
    [['later','Pay later'],['full','Pay in full'],['part','Pay part']].map(([mode,label])=>
      btn('invoice-'+mode,label,'chip',`aria-pressed="${d.mode===mode}"`)).join('')+'</div>'+
    (d.mode==='part'?field('invoice-paid',`Cash paid now · ${s.currency}`,d.paid,
      'inputmode="decimal" placeholder="0.00"'):'')+
    '<p class="error" id="invoice-error" role="alert"></p></section>'+
    '<section class="invoice-overview"><h2 class="section-title">After this payment</h2>'+
    '<div id="invoice-totals" aria-live="polite"></div>'+
    note('Only cash taken from this drawer is supported in this practice flow. No payment is sent to the supplier.')+
    '</section><section class="invoice-extra">'+
    (d.mode!=='full'?field('invoice-due','Payment due (optional)',d.due,'type="date"'):'')+
    '<h2 class="section-title">Invoice evidence <span class="micro">Optional</span></h2>'+
    '<div id="invoice-evidence"></div></section></div>';
  primary('invoice-review','Review invoice');drawInvoicePayment();
};
function drawInvoicePayment(){
  const d=invoiceDraft(),total=invoiceTotal(d),paid=invoicePaid(d);
  const error=paid===null?'Enter an amount with up to two decimal places.':
    d.mode==='part'&&(paid<=0||paid>=total)?'Enter less than the invoice total, or choose Pay later / Pay in full.':
    paid>s.cash?`Only ${money(s.cash)} is expected in this till. Choose Pay later or pay a smaller amount.`:'';
  document.querySelector('#invoice-totals').innerHTML=invoiceSummary(d,false);
  document.querySelector('#invoice-error').textContent=error;
  document.querySelector('#invoice-evidence').innerHTML=d.evidence?
    line('Sample invoice','Practice example','No real attachment stored')+
      btn('invoice-evidence-remove','Remove example','text-button'):
    btn('invoice-evidence','Add photo or PDF','secondary full');
  enable('invoice-review',!error);
}
for(const mode of ['later','full','part'])actions['invoice-'+mode]=()=>{
  invoiceDraft().mode=mode;invoiceRemember();render();
};
inputActions['invoice-payment']=()=>{
  const d=invoiceDraft();if(d.mode==='part')d.paid=val('invoice-paid');
  if(document.querySelector('#invoice-due'))d.due=val('invoice-due');
  invoiceRemember();drawInvoicePayment();renderContext();
};
actions['invoice-evidence']=()=>showSheet('Keep the invoice with it.',
  '<p class="sub">In the app, take a photo or choose a photo / PDF. You can save the invoice without one.</p>'+
  note('Design preview only: this example does not open a camera, read your files or upload anything.'),
  btn('invoice-evidence-sample','Use practice example','primary')+btn('close','Skip for now','secondary full'));
actions['invoice-evidence-sample']=()=>{
  invoiceDraft().evidence=true;invoiceRemember();sheet.close();drawInvoicePayment();
};
actions['invoice-evidence-remove']=()=>{
  invoiceDraft().evidence=false;invoiceRemember();drawInvoicePayment();
};
actions['invoice-review']=()=>navigate('invoice-review');
screens['invoice-review']=()=>{
  const d=invoiceDraft();if(!d.items.length){navigate('invoice-items');return;}
  screen.innerHTML=heading('Check the delivery.','3 of 3 · Nothing changes until you save','invoice-payment')+
    '<div class="invoice-layout"><section>'+line('Supplier','Mambo Wholesale')+
    line('Invoice number',esc(d.ref))+'<h2 class="section-title">Stock to add</h2>'+invoiceRows(d)+
    '</section><section>'+invoiceSummary(d)+line('Payment due',d.mode==='full'?'Paid with invoice':invoiceDate(d.due))+
    line('Evidence',d.evidence?'Practice example':'Not added')+
    line('Supplier balance after saving',money(s.supplier+invoiceTotal(d)-(invoicePaid(d)||0)))+
    line('Cash left in this till',money(s.cash-(invoicePaid(d)||0)))+
    (invoicePaid(d)>0?approvalField():note('No cash leaves the till. The full invoice is added to what you owe.'))+
    '</section></div>';
  primary('invoice-save','Save practice invoice',invoicePaid(d)>0);
};
inputActions['invoice-review']=()=>enable('invoice-save',val('approval-pin')==='123456');
actions['invoice-save']=()=>{
  const d=s.invoiceDraft;if(!d||!d.items.length||!d.ref)return;
  const total=invoiceTotal(d),paid=invoicePaid(d);
  if(paid===null||paid<0||paid>total||paid>s.cash||paid>0&&val('approval-pin')!=='123456')return;
  for(const i of d.items){const p=products().find(p=>p.id===i.id);
    if(!p||p.stock===null)return;}
  if((s.invoices||[]).some(i=>i.ref.toLowerCase()===d.ref.toLowerCase())){
    toast('That invoice number is already saved. Check the supplier’s invoice.');return;
  }
  for(const i of d.items){const p=products().find(p=>p.id===i.id);p.stock+=i.qty;
    stockMove(p.id,'Purchase '+d.ref,i.qty,p.stock);}
  accountMove('supplier','Purchase invoice',total,d.ref);
  if(paid)accountMove('supplier','Cash payment',-paid,d.ref);
  s.cash-=paid;s.supplier+=total-paid;
  const invoice={...structuredClone(d),total,paid,who:s.name};
  s.invoices=[invoice,...(s.invoices||[])].slice(0,20);s.invoiceDraft=null;
  record('Purchase invoice '+d.ref+' · '+money(total));
  result('Invoice saved.',line('Stock added',d.items.length+' products')+
    line('Cash paid',money(paid))+line('Left on this invoice',money(total-paid))+
    note('Practice record saved on this device. No supplier payment was sent.'),
    'invoice-detail','View saved invoice');
};
screens['invoice-detail']=()=>{
  const i=(s.invoices||[]).find(i=>i.ref===draft.invoiceRef)||(s.invoices||[])[0];
  if(!i){screen.innerHTML=heading('No invoices yet.','Record a new delivery with its buying costs.','suppliers');
    primary('new-invoice','Add purchase invoice');return;}
  screen.innerHTML=heading(esc(i.ref),'Mambo Wholesale · Saved practice invoice','supplier-statement')+
    '<div class="invoice-layout"><section>'+invoiceRows(i)+'</section><section>'+invoiceSummary({...i,mode:'part',paid:(i.paid/100).toFixed(2)})+
    line('Payment due',i.total===i.paid?'Paid with invoice':invoiceDate(i.due))+line('Recorded by',esc(i.who))+
    line('Evidence',i.evidence?'Practice example · no real file':'Not added')+
    note('Payment figures are as recorded with this invoice. Later payments appear on the supplier statement.')+
    '</section></div>';
  primary('supplier-statement','View supplier statement');
};
actions['open-invoice']=b=>{draft.invoiceRef=b.dataset.ref;navigate('invoice-detail');};
