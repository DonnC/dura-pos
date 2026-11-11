// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

screens.people=()=>{
  const a=staffAccess();
  screen.innerHTML=heading('Cashiers & devices.','A person has access. A device holds a drawer.','shop')+
    '<div class="access-layout"><section><h2 class="section-title">People</h2>'+line('Chipo','Owner')+
    a.people.map(p=>menu('staff-open',esc(p.name),
      (p.enabled?'Cashier · '+p.phones.length+' allowed device'+(p.phones.length===1?'':'s'):'Selling access removed')+
      (p.pending?' · Update waiting':''),'people',`data-id="${p.id}"`)).join('')+
    btn('add-staff','Add a person','secondary full')+'</section><section><h2 class="section-title">Shop devices</h2>'+
    line('Device 1','This device','Front counter · '+esc(s.name))+
    line('Device 2','Last seen 08:12','Counter spare · Later activity is unknown')+
    menu('pair','Pair another device','Owner pairs; cashiers need no email','phone')+
    note('A change saved here cannot immediately reach a disconnected device.')+'</section></div>';
};
actions['staff-open']=b=>{
  staffAccess().selected=b.dataset.id;s.staffAccessDraft=null;draft.newStaff=false;save();navigate('staff');
};
actions['add-staff']=()=>{
  draft.newStaff=true;s.staffAccessDraft={id:'',name:'',enabled:true,credit:false,kept:false,phones:['1']};navigate('staff');
};
screens.staff=()=>{
  const d=staffDraft(),newPerson=!d.id;
  screen.innerHTML=heading(newPerson?'Add a cashier.':esc(d.name)+'’s access.',
    'Cashier role · Owner controls','people')+
    (!newPerson&&!selectedStaff().enabled?'<p class="warning">Selling access is removed. Reviewing and saving this form will restore it.</p>':'')+
    '<div class="access-layout"><section>'+
    (newPerson?field('staff-name','Name',d.name,'maxlength="40" placeholder="Name at the till"'):'')+
    '<h2 class="section-title">Allowed devices</h2>'+accessToggle('staff-phone-1','Device 1 · Front counter','This device',d.phones.includes('1'))+
    accessToggle('staff-phone-2','Device 2 · Counter spare','Last seen 08:12',d.phones.includes('2'))+
    '</section><section><h2 class="section-title">May do without approval</h2>'+
    '<p class="sub">Sell, see own receipts, view stock and count their own drawer.</p>'+
    accessToggle('staff-credit','Put sales on account','Only when customer accounts are enabled for the shop',d.credit)+
    accessToggle('staff-kept','Keep / use customer change','Only when kept change is enabled for the shop',d.kept)+
    '<p class="micro">Refunds, cash payouts, money out and manual discounts need owner approval. Shop settings and owner records stay private.</p>'+
    '<p class="error" id="access-edit-error" role="alert"></p>'+
    (!newPerson?btn('access-remove','Remove selling access','text-button full'):'')+
    note('The cashier sets their own PIN on an allowed device. No PIN or invitation is created here.')+'</section></div>';
  primary('save-staff',!newPerson&&!selectedStaff().enabled?'Review restored access':'Review access',newPerson);
  inputActions.staff();
};
function accessToggle(id,title,sub,on){return `<label class="toggle-row"><span><strong>${title}</strong>
  <small>${sub}</small></span><input type="checkbox" id="${id}" ${on?'checked':''}></label>`;}
inputActions.staff=()=>{
  const d=staffDraft();if(!d.id)d.name=val('staff-name');
  d.phones=['1','2'].filter(id=>document.querySelector('#staff-phone-'+id).checked);
  d.credit=document.querySelector('#staff-credit').checked;d.kept=document.querySelector('#staff-kept').checked;
  const error=d.name.trim().length<2?'Enter the cashier’s name.':
    !d.id&&staffAccess().people.some(p=>p.name.toLowerCase()===d.name.toLowerCase())?
      'That name is already listed. Use a name you can distinguish.':!d.phones.length?'Choose at least one allowed device.':'';
  document.querySelector('#access-edit-error').textContent=error;enable('save-staff',!error);save();
};
actions['save-staff']=()=>{inputActions.staff();if(!document.querySelector('[data-action="save-staff"]').disabled)navigate('access-review');};
screens['access-review']=()=>{
  const d=staffDraft();if(!d.name||!d.phones.length){navigate('staff');return;}
  screen.innerHTML=heading('Check cashier access.',esc(d.name)+' · Cashier','staff')+
    '<div class="access-layout"><section>'+
    (d.id&&!selectedStaff().enabled?line('Change','Restore selling access'):'')+
    line('Allowed devices',d.phones.map(id=>'Device '+id).join(', '))+
    line('Sales on account',d.credit?'Allowed when enabled':'Not allowed')+
    line('Keep / use change',d.kept?'Allowed when enabled':'Not allowed')+
    line('Refunds / payouts','Owner approval required')+'</section><section><h2 class="section-title">When it takes effect</h2>'+
    line('This device','Apply on save')+line('Other devices','After they receive it')+
    note('Offline devices may still use their last saved permissions. The next screen shows what is and is not confirmed.')+'</section></div>';
  primary('access-save','Save practice access');
};
actions['access-save']=()=>{
  const a=staffAccess(),d=s.staffAccessDraft;if(!d||!d.name||!d.phones.length)return;
  if(!d.id&&a.people.length>=9){toast('Practice cashier limit reached.');return;}
  const old=d.id?a.people.find(p=>p.id===d.id):null;
  const person={...structuredClone(d),id:d.id||'staff'+a.people.length,enabled:true,
    affectedPhones:[...new Set([...d.phones,...(old?.phones||[]),...(old?.affectedPhones||[])])],
    pending:d.phones.includes('2')||!!old?.phones.includes('2')||!!old?.pending,exampleReceived:false};
  if(old)a.people[a.people.indexOf(old)]=person;else a.people.push(person);
  a.selected=person.id;s.staffAccessDraft=null;draft.newStaff=false;
  record('Practice access saved for '+person.name);navigate('access-status');
};
screens['access-status']=()=>{
  const p=selectedStaff();screen.innerHTML=heading('Access update.',esc(p.name)+' · Saved in this browser','staff')+
    '<div class="access-layout"><section>'+accessDelivery(p)+'</section><section><h2 class="section-title">What this means</h2>'+
    note('No Shop Hub or remote device is connected. “Saved here” is not a shop-wide confirmation. Existing receipts and queued sales are kept.')+
    (p.pending?btn('access-preview-receipt','Preview Device 2 receiving it','secondary full'):'')+'</section></div>';
  primary('people','Back to people & devices');
};
actions['access-preview-receipt']=()=>showSheet('Preview a reconnecting device',
  '<p class="sub">This demonstrates the received state. It does not contact Device 2 or confirm a real access change.</p>',
  btn('access-example-received','Show example outcome','primary'));
actions['access-example-received']=()=>{
  const p=selectedStaff();p.pending=false;p.exampleReceived=true;save();sheet.close();render();
};
screens['access-remove']=()=>{
  const p=selectedStaff();
  screen.innerHTML=heading('Remove selling access?',esc(p.name)+' · All their allowed devices','staff')+
    '<div class="access-layout"><section>'+line('On this device','No more selling after save')+
    (p.phones.includes('2')||p.pending?line('Device 2','Waiting until it receives the change','It may continue offline with its old access'):
      note('Device 1 is the only device currently allowed for this cashier.'))+
    '</section><section><h2 class="section-title">Keep the shop’s records</h2>'+
    '<p class="sub">Saved sales, an open drawer and unfinished work stay on the device.</p>'+
    note('If you have the device, lock Dura and arrange an owner-supervised cash-up. Removing Dura access does not lock Android or erase the device.')+
    btn('staff','Keep access for now','secondary full')+'</section></div>';
  primary('access-confirm-remove','Remove practice selling access');
};
actions['access-confirm-remove']=()=>{
  const p=selectedStaff();p.enabled=false;
  p.pending=p.phones.includes('2')||p.pending||!!p.affectedPhones?.includes('2');p.exampleReceived=false;
  s.staffAccessDraft=null;record('Practice selling access removed for '+p.name);
  result('Removed on this device.',accessDelivery(p)+
    note('Other devices are not confirmed. No cash, receipts or unfinished work were erased.'),'access-status','View delivery status');
};
