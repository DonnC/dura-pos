// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

screens.shop=()=>{
  const own=s.role==='owner';
  screen.innerHTML=heading(own?'My shop.':'My work.',own?'Keep the shop running your way.':
    `${esc(s.name)} · Seller · Front counter`)+
    `<section class="hero"><p class="eyebrow">${own?'Your business. Your records.':'Your shift'}</p>
    <h2>${own?esc(s.shop):esc(s.name)}</h2><p class="sub hero-sub">${s.active?'Till open':'Till closed'} ·
    ${s.currency} prices · Practice shop</p></section>`+
    (own?menu('records','Records & exports','Your own files and backups','receipt')+
      menu('people','People & phones','Who can use each till','people')+
      menu('settings','Set up when you need it','Credit, payments and currencies','settings'):'')+
    (s.fiscalDemo?.enabled?menu('fiscal-queue','Fiscal receipt status','Test examples on this phone','receipt'):'')+
    menu('my-access','My access','What this person may do on this phone','shield')+
    menu('sync','Saved records','What’s on this phone and waiting to upload','upload')+
    menu('profile','Lock or hand over',s.active?'Cashier: '+esc(s.name):'Start the next shift','shield')+
    menu('help','Help','A short guide for the person using the till','shield');
};
screens.sync=()=>{
  screen.innerHTML=heading('Saved here. Shared later.','Your selling does not wait for the internet.','shop')+
    line('On this phone',`${s.history.length} practice sales`,'Saved in browser storage')+
    line('Uploaded','Not connected','No Google account is connected in this prototype')+
    line('Payment provider','No live connection','Cash receipts are not provider confirmations')+
    line('Fiscal receipts','Not configured','Practice receipts are not fiscal receipts')+
    (s.role==='owner'?menu('connect','Connect your own Google account','Set up shared records when ready','upload'):'')+
    note('No credentials or shop records leave this browser. A real app keeps uploaded and locally saved states separate.');
  primary('sell','Keep selling');
};
screens.records=()=>{
  screen.innerHTML=heading('Your records.','The shop’s own files, in the shop’s own account.','shop')+
    `<p class="warning">Google not connected. These are practice records on this phone.</p>`+
    menu('export','Export records','Preview Excel, CSV or a complete archive','receipt')+
    menu('restore','Restore a phone','Check the shop and latest backup first','phone')+
    menu('connect','Connect Google','Set up shared files without interrupting cash sales','upload')+
    '<h2 class="section-title">What’s in your files?</h2>'+
    line('My Shop','Products & settings')+line('2026-11 November','Sales, stock & cash-ups')+
    note('Your journal preserves history. Sheets give you readable views. An export never includes keys or PINs.');
};
screens.export=()=>{
  screen.innerHTML=heading('Export records.','Preview before you create or share a file.','records')+
    select('export-format','Format',option('xlsx','Excel workbook (.xlsx)')+
      option('csv','Sales table (.csv)')+option('archive','Complete shop archive'))+
    select('export-month','Period',option('november','November 2026'))+
    `<p class="warning">Incomplete: this phone only. Phone 2 last uploaded at 08:12.</p>
    <div class="receipt-paper"><p class="eyebrow">DATA PREVIEW · PRACTICE</p>
    ${line('Pricing currency',s.currency)}${line('Sales shown',`${s.history.length} saved this session`)}
    ${s.history.slice(0,3).map(r=>line(esc(r.id),money(r.amount,r.currency))).join('')}</div>`+
    note('No account is connected. Production creates a file after this review; the browser prototype creates no export.');
  primary('export-preview','Review export contents');
};
actions['export-preview']=()=>showSheet('Export contents',
  line('Format',esc(document.querySelector('#export-format').selectedOptions[0].textContent))+
  line('Period','November 2026')+line('Completeness','This phone only')+
  note('Readable records and field explanations belong in the export. No file is generated from this design.'),
  btn('records','Back to records','primary'));
screens.settings=()=>{
  const toggle=(id,title,sub,on)=>`<label class="toggle-row"><span><strong>${title}</strong>
    <small>${sub}</small></span><input type="checkbox" id="${id}" ${on?'checked':''}></label>`;
  screen.innerHTML=heading('Set up when needed.','Cash selling always stays available.','shop')+
    toggle('feature-credit','Customer accounts','Keep balances for trusted regulars',s.features.credit)+
    toggle('feature-kept','Kept change','Record small change owed to customers at this till',s.features.kept)+
    `<div id="kept-limit-setting" ${s.features.kept?'':'hidden'}>`+
    field('kept-limit',`Practice limit per customer · ${s.currency}`,
      ((s.kept?.cap??200)/100).toFixed(2),'inputmode="decimal"')+
    '<p class="micro">No expiry. Clear outstanding balances before switching this off.</p></div>'+
    '<p class="error" id="kept-setting-error" role="alert"></p>'+
    toggle('feature-mobile','Mobile money','Show practice provider checkout',s.features.mobile)+
    (s.currency==='USD'?toggle('feature-multi','USD + ZWG cash','Show a rate and exact split',s.features.multi):'')+
    (s.currency==='USD'?`<div id="rate-setting" ${s.features.multi?'':'hidden'}>`+
      field('shop-rate','Practice rate · ZWG for USD 1.00',
      ((s.rateMinor||2700)/100).toFixed(2),'inputmode="decimal"')+'</div>':'')+
    line('Pricing currency',s.currency,'Chosen during setup; changing it requires a migration.')+
    menu('fiscal','Fiscal receipts','Optional · Not configured','receipt')+
    note('These switches configure fictional training flows. Production payment setup must verify the owner’s own account.');
  primary('save-settings','Save preferences');
};
inputActions.settings=()=>{
  const multi=document.querySelector('#feature-multi')?.checked;
  if(document.querySelector('#rate-setting'))document.querySelector('#rate-setting').hidden=!multi;
  const kept=document.querySelector('#feature-kept').checked,cap=parseCents(val('kept-limit'));
  document.querySelector('#kept-limit-setting').hidden=!kept;
  const maxBalance=Math.max(0,...(s.kept?.contacts||[]).map(c=>c.balance));
  const error=!kept&&maxBalance>0?'Clear kept change balances before switching this off.':
    kept&&(cap===null||cap<=0||cap<maxBalance)?'Enter a limit above zero, at least as much as the largest balance.':'';
  document.querySelector('#kept-setting-error').textContent=error;
  enable('save-settings',(!multi||validAmount('shop-rate'))&&!error);
};
actions['save-settings']=()=>{
  inputActions.settings();if(document.querySelector('[data-action="save-settings"]').disabled)return;
  s.features={credit:document.querySelector('#feature-credit').checked,
    kept:document.querySelector('#feature-kept').checked,
    mobile:document.querySelector('#feature-mobile').checked,
    multi:s.currency==='USD'&&document.querySelector('#feature-multi').checked};
  if(s.currency==='USD')s.rateMinor=parseCents(val('shop-rate'));
  if(s.features.kept)keptState().cap=parseCents(val('kept-limit'));
  record('Optional features updated');navigate('shop');toast('Preferences saved');
};
screens.help=()=>{
  screen.innerHTML=heading('A little help.','The everyday basics.','shop')+
    line('Make a sale','Tap → Pay → Save')+line('Correct a quantity','Open the basket')+
    line('Serve someone else','Hold the current sale')+line('Finish your shift','My till → Cash up')+
    line('No internet?','Cash still works')+line('Need a refund?','Find receipt → Return')+
    note('English copy is shown for review. Shona and Ndebele need reviewed translations in the app.');
  primary('sell','Back to selling');
};
