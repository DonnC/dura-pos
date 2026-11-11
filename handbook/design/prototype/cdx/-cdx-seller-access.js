// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

screens['my-access']=()=>{
  staffAccess();
  const p=currentStaff(),state=currentAccessState();
  screen.innerHTML=heading('My access.',esc(s.name)+' · '+(s.role==='owner'?'Owner':'Cashier'),'shop')+
    '<div class="access-layout"><section>'+line('This device','Device 1 · Front counter')+
    line('Access',state==='removed'?'Selling removed':state==='expired'?'Owner check needed':'Current shift allowed')+
    line('Last checked','Today, 08:12','Fictional example, not a live refresh time')+
    (s.role==='worker'?line('Sales on account',p?.credit===false?'Not allowed':'Allowed when enabled')+
      line('Keep / use change',p?.kept===false?'Not allowed':'Allowed when enabled'):'')+
    '</section><section><h2 class="section-title">If the device is offline</h2>'+
    '<p class="sub">An already authorised open shift can keep taking cash. Before another offline shift, ask the owner to check access on this device.</p>'+
    note('A change made elsewhere may not have reached this device. Checking does not erase saved sales or your basket.')+
    btn('access-check','Check for an access update','secondary full')+'</section></div>';
  primary(state==='removed'?'access-removed':state==='expired'?'access-expired':'sell',
    state==='active'?'Back to selling':'View next step');
};
actions['access-check']=()=>showSheet('No access update received',
  '<p class="sub">No Shop Hub is connected in this design. The last saved permissions stay as shown.</p>'+
  note('This example does not refresh, extend or remove anyone’s access.'),btn('close','Back to my access','primary'));
screens['access-limited']=()=>{
  screen.innerHTML=heading('Ask the owner.','This action is not in your cashier access.','pay')+
    note('Your basket is still here. You can take cash, or ask the owner to review your access.');
  primary(count()?'pay':'sell',count()?'Pay with cash instead':'Back to selling');
};
screens['access-expired']=()=>{
  screen.innerHTML=heading('Owner check needed.','Before starting another offline shift.')+
    '<div class="access-layout"><section><h2 class="section-title">Your work is still here</h2>'+
    line('Saved on this device',s.history.length+' practice sales')+
    line('Basket',count()+' items kept')+
    note('Your saved sales and basket stay on this device. The owner can check access here without internet.')+
    '</section><section><h2 class="section-title">One check for this shift</h2>'+
    '<p class="sub">Ask the owner to check your access locally. Their approval allows one offline shift on this device.</p>'+
    '<p class="micro">The owner uses their own PIN. Do not share it with the cashier.</p></section></div>';
  primary('access-recovery','Owner checks this device');
};
screens['access-removed']=()=>{
  screen.innerHTML=heading('Selling access removed.','This device has received the removal.')+
    '<div class="access-layout"><section>'+line('Signed-in cashier',esc(s.name))+
    line('Unfinished basket',count()+' items kept')+line('Saved sales',s.history.length+' on this device')+
    line('Current drawer',s.active?'Still needs cash-up':'No open shift')+
    '</section><section><h2 class="section-title">Ask the owner to take over</h2>'+
    '<p class="sub">You cannot start or save another sale with this access. The owner can supervise cash-up and take responsibility for the next shift.</p>'+
    note('Saved records remain attributed to their original cashier. Access removal is not a remote wipe or an Android lock.')+'</section></div>';
  primary('access-recovery','Owner takes over');
};
screens['access-recovery']=()=>{
  const removed=currentAccessState()==='removed';
  screen.innerHTML=heading('Owner check.',removed?'Supervised handover · '+esc(s.name):'One offline shift · '+esc(s.name),
    removed?'access-removed':'access-expired')+
    '<div class="access-layout"><section>'+line('This device','Device 1 · Front counter')+
    line('Cashier',esc(s.name))+line('After approval',removed?'Count and close the existing drawer':'Cashier can start one offline shift')+
    note(removed?'This does not restore cashier access. Count the drawer before switching to the owner.':
      'Only the existing cashier and this device are authorised. No new role or remote device access is granted.')+
    '</section><section>'+field('access-owner-pin','Owner’s practice PIN','','type="password" inputmode="numeric" maxlength="6"')+
    '<p class="error" id="access-pin-error" role="alert"></p>'+
    note('Practice PIN: 123456. This design does not verify real credentials.')+'</section></div>';
  primary(removed?'access-supervise':'access-authorise-shift',removed?'Approve supervised handover':'Approve one offline shift',true);
};
inputActions['access-recovery']=()=>{
  const action=currentAccessState()==='removed'?'access-supervise':'access-authorise-shift';
  const pin=val('access-owner-pin');document.querySelector('#access-pin-error').textContent=
    pin.length===6&&pin!=='123456'?'That practice PIN did not match. Try again.':'';
  enable(action,pin==='123456');
};
actions['access-authorise-shift']=()=>{
  if(val('access-owner-pin')!=='123456'||currentAccessState()==='removed')return;
  const a=staffAccess();a.offlineGrant=true;a.expired=false;
  record('Practice owner Chipo approved one offline shift for '+s.name);navigate('opening');
};
actions['access-supervise']=()=>{
  if(val('access-owner-pin')!=='123456'||currentAccessState()!=='removed')return;
  supervisedAccess=true;record('Practice owner Chipo supervised handover for '+s.name);
  navigate(s.active?'cashup':'switch-person');
};
