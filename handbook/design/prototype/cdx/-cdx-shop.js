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
screens.connect=()=>{
  screen.innerHTML=heading('Your Google account.','Your records stay in an account you control.','records')+
    `<ol class="steps"><li><strong>Choose the shop’s account</strong><p>The owner signs in.</p></li>
    <li><strong>Review access</strong><p>Dura’s Shop Hub uses the files it creates for this shop.</p></li>
    <li><strong>Check your records</strong><p>The app confirms that uploads and readable Sheets are ready.</p></li></ol>`+
    note('No sign-in runs in this design. You can keep selling before connecting.');
  primary('sell','Set up later · Keep selling');
};
screens.restore=()=>{
  screen.innerHTML=heading('Restore a phone.','Check the shop before bringing records back.','records')+
    field('restore-shop','Shop name','','placeholder="Name in your backup" maxlength="60"')+
    select('restore-source','Restore from',option('drive','Your Google Drive')+option('archive','Complete shop archive'))+
    `<p class="warning">Records not yet uploaded from a lost phone may be missing. Never erase a working phone to try a restore.</p>`+
    note('Production checks identity, mode, schema and upload history. A replacement phone gets its own device identity.');
  primary('restore-check','Review restore checks',true);
};
inputActions.restore=()=>enable('restore-check',val('restore-shop').length>1);
actions['restore-check']=()=>showSheet('Before restoring',line('Shop',esc(val('restore-shop')))+
  line('Backup access','Not connected')+note('No backup has been opened or imported in this prototype. In the app, review backup date and missing records before confirming.'));
screens.people=()=>{
  screen.innerHTML=heading('People & phones.','A person sells. A phone holds a drawer.','shop')+
    '<h2 class="section-title">People</h2>'+line('Chipo','Owner','All shop settings and records')+
    menu('staff',esc(s.rudo?.name||'Rudo'),'Seller · Front counter only','people')+
    (s.staff||[]).map(p=>line(esc(p.name),esc(p.role),'Front counter')).join('')+
    btn('add-staff','Add a person','text-button full')+
    '<h2 class="section-title">Phones</h2>'+line('Phone 1','This till','Front counter · '+esc(s.name))+
    line('Phone 2','Last seen 08:12','Later activity is unknown')+
    menu('pair','Pair another phone','Owner pairs; the seller does not need an email','phone');
};
actions['add-staff']=()=>{draft.newStaff=true;navigate('staff');};
screens.staff=()=>{
  screen.innerHTML=heading(draft.newStaff?'Add a person.':'Seller access.','Keep access close to the work.','people')+
    field('staff-name','Name',draft.newStaff?'':s.rudo?.name||'Rudo','maxlength="40"')+
    line('Role','Seller')+
    line('Allowed phone','Front counter')+
    `<ul class="plain-list"><li>Sell and find own receipts</li><li>View own shift and count the drawer</li>
    <li>See stock at this location</li><li>Ask for owner approval for a refund</li></ul>`+
    note('They set a PIN on their phone. Never share the owner’s PIN. This form previews access; it does not invite anyone.');
  primary('save-staff','Save practice access',!!draft.newStaff);
};
inputActions.staff=()=>enable('save-staff',val('staff-name').length>=2);
actions['save-staff']=()=>{
  if(draft.newStaff){s.staff=s.staff||[];if(s.staff.length>=8){toast('Practice staff limit reached.');return;}
    s.staff.push({name:val('staff-name'),role:'Seller'});}
  else s.rudo={name:val('staff-name'),role:'Seller'};
  record('Practice access reviewed for '+val('staff-name'));draft.newStaff=false;navigate('people');
};
screens.pair=()=>{
  screen.innerHTML=heading('Pair a shop phone.','Keep both phones with you.','people')+
    `<div class="scan-frame">${icon('phone')}${icon('scan')}</div>`+
    '<h2 class="center">Scan from the new phone</h2><p class="sub center">In Dura, choose “Join an existing shop”.</p>'+
    line('Location','Front counter')+line('Code status','Preview only')+
    note('Production uses a short-lived pairing QR, not the owner’s Google password. This illustration is not a pairing code.');
  primary('people','Back to people & phones');
};
screens.settings=()=>{
  const toggle=(id,title,sub,on)=>`<label class="toggle-row"><span><strong>${title}</strong>
    <small>${sub}</small></span><input type="checkbox" id="${id}" ${on?'checked':''}></label>`;
  screen.innerHTML=heading('Set up when needed.','Cash selling always stays available.','shop')+
    toggle('feature-credit','Customer accounts','Keep balances for trusted regulars',s.features.credit)+
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
  enable('save-settings',!multi||validAmount('shop-rate'));
};
actions['save-settings']=()=>{
  s.features={credit:document.querySelector('#feature-credit').checked,
    mobile:document.querySelector('#feature-mobile').checked,
    multi:s.currency==='USD'&&document.querySelector('#feature-multi').checked};
  if(s.currency==='USD')s.rateMinor=parseCents(val('shop-rate'));
  record('Optional features updated');navigate('shop');toast('Preferences saved');
};
screens.fiscal=()=>{
  screen.innerHTML=heading('Fiscal receipts.','Optional · Separate from saving a sale.','settings')+
    line('Status','Not configured')+line('Device','One fiscal device per phone')+
    note('The business uses its own ZIMRA credentials and completes ZIMRA’s onboarding. No certification or acceptance is implied here.')+
    '<p class="sub">Production setup needs separate test and live environments, fiscal-day status, rejected-receipt recovery and device replacement screens. This optional integration is deferred.</p>';
  primary('settings','Back to preferences');
};
screens.help=()=>{
  screen.innerHTML=heading('A little help.','The everyday basics.','shop')+
    line('Make a sale','Tap → Pay → Save')+line('Correct a quantity','Open the basket')+
    line('Serve someone else','Hold the current sale')+line('Finish your shift','My till → Cash up')+
    line('No internet?','Cash still works')+line('Need a refund?','Find receipt → Return')+
    note('English copy is shown for review. Shona and Ndebele need reviewed translations in the app.');
  primary('sell','Back to selling');
};
