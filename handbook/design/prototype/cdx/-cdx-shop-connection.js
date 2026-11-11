// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

screens.connect=()=>{
  screen.innerHTML=heading('Keep your records together.','The owner connects the shop’s own Google account.','records')+
    '<div class="recovery-layout"><section><ol class="steps"><li><strong>Choose the shop’s account</strong>'+
    '<p>Use an account the owner controls.</p></li><li><strong>Review the shop and access</strong>'+
    '<p>Dura prepares its own files in that account.</p></li><li><strong>Check what is ready</strong>'+
    '<p>Phone pairing and uploaded records have separate results.</p></li></ol></section>'+
    '<section><h2 class="section-title">You can keep selling</h2>'+recoveryWork()+
    note('Cash sales stay on this phone while connection setup waits. Sellers do not need Google accounts.')+
    (offline?'<p class="warning">You are offline. Connect when internet is available; keep serving for now.</p>':'')+
    setupNote()+btn('sell','Set up later · Keep selling','secondary full')+'</section></div>';
  primary(offline?'sell':'connection-account',offline?'Keep selling':'Choose the shop’s account');
};
actions['connection-account']=()=>showSheet('Choose the shop account',
  '<p class="sub">The app opens Google’s account chooser here. This preview uses an example account and asks for no credentials.</p>',
  btn('connection-example-account','Use example shop account','primary')+btn('close','Cancel','secondary full'));
actions['connection-example-account']=()=>{
  const d=recoveryDemo();d.account=true;if(d.condition==='denied')d.condition='ready';
  save();sheet.close();navigate('connection-review');
};
screens['connection-review']=()=>{
  screen.innerHTML=heading('Check the shop account.','Before preparing the shop’s shared records.','connect')+
    '<div class="recovery-layout"><section>'+line('Shop',esc(s.shop))+
    line('Account','Example shop account')+line('Prices in',s.currency)+
    line('Mode','Practice')+'</section><section><h2 class="section-title">What the owner is allowing</h2>'+
    '<p class="sub">Prepare Dura’s shop files and Shop Hub in this account. Phones then connect to that shop, with their own access.</p>'+
    note('The owner’s Google password and account sign-in are not shared with sellers.')+
    setupNote()+'</section></div>';
  primary('connection-preview-check','Preview connection checks');
};
actions['connection-preview-check']=()=>navigate('connection-status');
screens['connection-status']=()=>{
  const condition=connectionCondition(),ready=!['offline','denied','unknown','partial'].includes(condition);
  const title=ready?'Example connection ready.':{
    offline:'Connect when you are online.',denied:'Account access not approved.',
    unknown:'Check the existing setup.',partial:'Some setup is still preparing.'}[condition];
  screen.innerHTML=heading(title,'Connection example · '+esc(s.shop),'connection-review')+
    '<div class="recovery-layout"><section>'+line('Shop account',condition==='denied'?'Not approved':'Example selected')+
    line('Shop Hub',ready?'Example ready':condition==='partial'?'Example created':'Not confirmed')+
    line('Shared records',ready?'Example ready':condition==='partial'?'Still preparing':'Not confirmed')+
    line('This phone',ready||condition==='partial'?'Example paired':'Not confirmed')+
    line('Journal upload','Not sent from this preview')+'</section><section><h2 class="section-title">Next step</h2>'+
    '<p class="sub">'+(ready?'In the app, uploads start after pairing. Check their receipts separately from connection setup.':
      condition==='unknown'?'We have not confirmed whether setup finished. Check this account before trying setup again.':
      condition==='partial'?'Keep selling while the records prepare. Pairing alone does not mean records were uploaded.':
      condition==='denied'?'Choose the owner’s account again and review access. Your local work remains here.':
      'Your local cash selling can continue. Return to this step when internet is available.')+'</p>'+setupNote()+
    (!ready&&condition!=='offline'?btn(condition==='denied'?'connection-account':'connection-preview-existing',
      condition==='denied'?'Choose an account again':'Preview checking existing setup','secondary full'):'')+'</section></div>';
  primary(ready?'pair':'sell',ready?'Preview adding another phone':'Keep selling');
};
actions['connection-preview-existing']=()=>{recoveryDemo().condition='ready';save();render();};
