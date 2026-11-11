// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

screens.opening=()=>{
  screen.innerHTML=heading('Open your till.',`${esc(s.name)} · Front counter`)+
    `<div class="hero"><p class="eyebrow">Before the first customer</p><h2>Count your starting cash.</h2>
    <p class="sub hero-sub">This is your float, not a sale.</p></div>`+
    field('float-usd',`Starting cash · ${s.currency}`,'0.00','inputmode="decimal"')+
    (s.features.multi?field('float-zwg','Starting cash · ZWG','0.00','inputmode="decimal"'):'')+
    note('No float? Leave it at zero and start selling. Count each currency separately.');
  primary('open-shift','Open till');
};
inputActions.opening=()=>enable('open-shift',parseCents(val('float-usd'))!==null&&
  (!s.features.multi||parseCents(val('float-zwg'))!==null));
actions['open-shift']=()=>{
  s.cash=parseCents(val('float-usd'));s.zwg=s.features.multi?parseCents(val('float-zwg')):0;
  if(s.cash===null||s.zwg===null)return;
  s.sales=0;s.saleCount=0;s.active=true;s.seedDay=false;record('Till opened');navigate('sell');
};
screens.cashup=()=>{
  screen.innerHTML=heading('Count your cash.',`${esc(s.name)} · Front counter · End of shift`,'money')+
    `<p class="sub">Count the notes and coins in the drawer. We’ll compare after you enter your count.</p>`+
    field('counted-usd',`Cash counted · ${s.currency}`,draft.countUsd||'',
      'inputmode="decimal" placeholder="0.00"')+
    (s.zwg>0?field('counted-zwg','Cash counted · ZWG',draft.countZwg||'',
      'inputmode="decimal" placeholder="0.00"'):'')+
    note('Count again if you’re unsure. Nothing closes until you review and save.')+
    (count()?'<p class="warning">An unfinished basket will be held on this till when you close.</p>':'');
  primary('review-count','Review cash-up',true);inputActions.cashup();
};
inputActions.cashup=()=>enable('review-count',parseCents(val('counted-usd'))!==null&&
  (s.zwg===0||parseCents(val('counted-zwg'))!==null));
actions['review-count']=()=>{
  draft.countUsd=val('counted-usd');draft.countZwg=val('counted-zwg');
  draft.counted=parseCents(draft.countUsd);draft.countedZwg=s.zwg>0?parseCents(draft.countZwg):0;
  navigate('count-review');
};
const varianceText=(n,currency=s.currency)=>n===0?'Balanced':
  `${money(Math.abs(n),currency)} ${n<0?'short':'over'}`;
screens['count-review']=()=>{
  if(draft.counted===undefined){navigate('cashup');return;}
  const diff=draft.counted-s.cash,zwgDiff=draft.countedZwg-s.zwg;
  screen.innerHTML=heading('Check your cash-up.','One last check before handover.','cashup')+
    line('Expected cash',money(s.cash))+line('Cash counted',money(draft.counted))+keptOwedRow()+
    `<p class="${diff?'warning':'change'}">${varianceText(diff)}</p>`+
    (s.zwg>0?line('Expected ZWG',money(s.zwg,'ZWG'))+
      line('Counted ZWG',money(draft.countedZwg,'ZWG'))+
      `<p class="warning">${varianceText(zwgDiff,'ZWG')}</p>`:'')+
    (diff||zwgDiff?field('variance-note','Tell the owner what happened','','maxlength="160" '+
      'placeholder="e.g. Counted twice; missing a coin"'):'')+
    field('keep-float',`Cash staying for the next shift · ${s.currency}`,'0.00','inputmode="decimal"')+
    (s.zwg>0?field('keep-float-zwg','Cash staying for the next shift · ZWG','0.00',
      'inputmode="decimal"'):'')+
    `<p class="error" id="close-error" role="alert"></p>`+
    note('Closing saves this count. A difference stays visible; it does not rewrite sales.');
  primary('close-shift','Close my shift',!!(diff||zwgDiff));
};
inputActions['count-review']=()=>{
  const keep=parseCents(val('keep-float'));
  const keepZwg=s.zwg>0?parseCents(val('keep-float-zwg')):0;
  const hasDiff=draft.counted!==s.cash||draft.countedZwg!==s.zwg;
  const validKeep=keep!==null&&keep<=draft.counted&&keepZwg!==null&&keepZwg<=draft.countedZwg;
  enable('close-shift',validKeep&&(!hasDiff||val('variance-note').length>=5));
  document.querySelector('#close-error').textContent=validKeep?'':'Keep no more than the cash counted.';
};
actions['close-shift']=()=>{
  draft.kept=parseCents(val('keep-float'));draft.keptZwg=s.zwg>0?parseCents(val('keep-float-zwg')):0;
  draft.reason=val('variance-note');
  if(count()){
    if(s.held.length===3){toast('Resolve a held sale before closing. Your basket is safe.');return;}
    s.held.push({basket:{...s.basket},name:`${s.name}’s unfinished sale`,amount:total()});s.basket={};
  }
  s.active=false;record(`Shift closed: ${varianceText(draft.counted-s.cash)}`);navigate('handover');
};
screens.handover=()=>{
  if(draft.counted===undefined){navigate('cashup');return;}
  result('Shift closed.',heading('',`${esc(s.name)} · Front counter`)+
    line('Hand to the owner',money(draft.counted-draft.kept))+
    line('Leave for the next shift',money(draft.kept))+
    (draft.countedZwg?line('Hand over in ZWG',money(draft.countedZwg-draft.keptZwg,'ZWG'))+
      line('ZWG staying',money(draft.keptZwg,'ZWG')):'')+
    line('Count difference',varianceText(draft.counted-s.cash))+
    (draft.reason?note(esc(draft.reason)):'')+
    note('Saved on this phone. Waiting to upload. Held baskets remain on this till.'),
    'switch-person','Hand over this till');
};
actions.profile=()=>showSheet(`${esc(s.name)} · ${s.role==='owner'?'Owner':'Seller'}`,
  menu('lock','Lock Dura','Keep your basket and shift open','shield')+
  menu('switch-person','Switch person',s.active?'Cash up before another person takes the drawer':
    'Start the next person’s shift','people')+
  menu('money',s.role==='owner'?'My money':'My till','Sales and cash for this shift','money'));
actions.lock=()=>{save();navigate('locked');};
screens.locked=()=>{
  screen.innerHTML=heading('Your till is locked.',`${esc(s.name)} · Basket and shift kept safe`)+
    `<div class="empty">${icon('shield')}</div>`+
    field('unlock-pin','Your PIN','','type="password" inputmode="numeric" maxlength="6"')+
    `<p class="error" id="pin-error" role="alert"></p>`+
    note('Practice PIN: 123456. This preview is not a phone lock.');
  primary('unlock','Unlock Dura',true);
};
inputActions.locked=()=>enable('unlock',val('unlock-pin').length===6);
actions.unlock=()=>{
  if(val('unlock-pin')!=='123456'){
    document.querySelector('#pin-error').textContent='That PIN didn’t match. Try again.';return;
  }navigate('sell');
};
screens['switch-person']=()=>{
  screen.innerHTML=heading('Pass the till on.',s.active?
    'Cash belongs to the current shift until it is counted.':'Choose who is taking responsibility.','shop');
  if(s.active){
    screen.innerHTML+=note('Locking the app keeps the same cashier responsible. A new cashier needs a cash-up first.');
    primary('cashup','Count and close this shift');return;
  }
  screen.innerHTML+=select('next-person','Next person',
    (supervisedAccess?'':option('worker','Rudo · Seller'))+option('owner','Chipo · Owner',supervisedAccess))+
    field('next-pin','Their PIN','','type="password" inputmode="numeric" maxlength="6"')+
    note('Practice PIN: 123456. The next person counts the retained float before opening.');
  primary('start-person','Continue to opening count',true);
};
inputActions['switch-person']=()=>enable('start-person',val('next-pin')==='123456');
actions['start-person']=()=>{
  s.role=val('next-person');s.name=s.role==='worker'?'Rudo':'Chipo';save();navigate('opening');
};
