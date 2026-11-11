// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// Design state, not authentication or remote-device enforcement.
let supervisedAccess=false;
function staffAccess(){
  return s.staffAccess||(s.staffAccess={selected:'rudo',expired:false,offlineGrant:false,people:[
    {id:'rudo',name:s.rudo?.name||'Rudo',enabled:true,credit:true,kept:true,phones:['1'],pending:false},
    ...(s.staff||[]).map((p,n)=>({id:'staff'+n,name:p.name,enabled:true,credit:true,kept:true,phones:['1'],pending:false}))]});
}
function selectedStaff(){const a=staffAccess();return a.people.find(p=>p.id===a.selected)||a.people[0];}
function currentStaff(){
  const a=s.staffAccess;if(!a)return null;
  return a.people.find(p=>p.id===s.staffActor)||a.people.find(p=>p.name===s.name)||a.people[0];
}
function staffPermission(kind){return s.role==='owner'||currentStaff()?.[kind]!==false;}
function currentAccessState(){
  if(s.role!=='worker'||!s.staffAccess)return 'active';
  const p=currentStaff();if(!p?.enabled||!p.phones.includes('1'))return 'removed';
  return s.staffAccess.expired&&!s.active&&!s.staffAccess.offlineGrant?'expired':'active';
}
function accessPageFor(target){
  if(s.role!=='worker')return target;
  const state=currentAccessState();
  const recovery=['my-access','access-recovery',state==='removed'?'access-removed':'access-expired'];
  if(state==='expired')recovery.push('handover','switch-person');
  if(supervisedAccess&&['cashup','count-review','handover','switch-person'].includes(target))return target;
  if(state!=='active'&&!recovery.includes(target))return state==='removed'?'access-removed':'access-expired';
  if(target==='credit'&&!staffPermission('credit')||
    ['kept-checkout','kept-keep'].includes(target)&&!staffPermission('kept'))return 'access-limited';
  return target;
}
function accessCanAction(action){
  if(s.role!=='worker')return true;
  const state=currentAccessState();
  if(state!=='active'){
    const allowed=['my-access','access-check','access-recovery','access-removed','access-expired','close',
      'access-authorise-shift','access-supervise'];
    if(state==='expired')allowed.push('handover','switch-person','start-person');
    if(supervisedAccess)allowed.push('cashup','review-count','count-review','close-shift','handover','switch-person','start-person');
    if(!allowed.includes(action))return false;
  }
  if(!staffPermission('credit')&&['credit','save-credit'].includes(action))return false;
  if(!staffPermission('kept')&&['kept-checkout','kept-keep','kept-save-sale','kept-save-keep'].includes(action))return false;
  return true;
}
function staffDraft(){
  if(!s.staffAccessDraft){const p=selectedStaff();s.staffAccessDraft=structuredClone(p);}
  return s.staffAccessDraft;
}
function accessDelivery(p){
  return line('This device · Device 1','Saved here',p.enabled&&p.phones.includes('1')?'Cashier access applied here':'No selling access here')+
    (p.pending?line('Waiting for Device 2','Not confirmed','Last seen today at 08:12. It may still use its previous access.'):
      p.exampleReceived?line('Device 2','Example: received','A preview outcome, not a real device acknowledgement.'):
      line('Device 2','No change waiting','No real device is connected to this preview.'));
}
if(q.get('access')){
  const a=staffAccess();a.people[0].phones=['1','2'];
  if(q.get('access')==='expired'){a.expired=true;s.active=false;offline=true;}
  if(q.get('access')==='removed')a.people[0].enabled=false;
  if(q.get('access')==='pending'){a.people[0].pending=true;a.people[0].enabled=false;}
  if(page==='access-review')s.staffAccessDraft={...structuredClone(a.people[0]),credit:false};
}
const originalCloseStaffShift=actions['close-shift'];
actions['close-shift']=()=>{
  originalCloseStaffShift();
  if(s.role==='worker'&&!s.active&&s.staffAccess){
    s.staffAccess.expired=offline||s.staffAccess.offlineGrant;s.staffAccess.offlineGrant=false;save();
  }
};
const originalStartStaff=actions['start-person'];
actions['start-person']=()=>{
  if(supervisedAccess&&val('next-person')!=='owner'){
    toast('The owner must take this handover. Cashier access stays removed.');return;
  }
  if(val('next-pin')!=='123456')return;
  if(currentAccessState()==='expired'&&val('next-person')==='worker'){
    navigate('access-expired');return;
  }
  supervisedAccess=false;originalStartStaff();
};
