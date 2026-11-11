// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

screens.pair=()=>{
  const d=recoveryDemo();
  screen.innerHTML=heading('Add a shop device.','Keep the owner’s device and new device together.','people')+
    '<div class="recovery-layout"><section>'+field('pair-phone-name','Name for the new device',d.phoneName,
      'maxlength="40" placeholder="e.g. Counter spare"')+line('Location','Front counter')+
    line('Cashier access','Assigned by the owner after pairing')+'</section><section><h2 class="section-title">On the new device</h2>'+
    '<ol class="steps"><li>Open Dura.</li><li>Choose “Join an existing shop”.</li><li>Scan and check the shop name.</li></ol>'+
    note('A real code needs a connected Shop Hub. This preview shows the steps without creating a code.')+setupNote()+'</section></div>';
  primary('pair-show-code','Show example pairing code',!d.phoneName);
};
inputActions.pair=()=>{recoveryDemo().phoneName=val('pair-phone-name');save();enable('pair-show-code',!!val('pair-phone-name'));};
actions['pair-show-code']=()=>{
  const d=recoveryDemo();if(!d.phoneName)return;d.codeUsed=false;d.codeExpired=false;
  if(['wrong-shop','wrong-mode','wrong-currency'].includes(d.condition))d.condition='ready';save();navigate('pair-code');
};
screens['pair-code']=()=>{
  const d=recoveryDemo(),unusable=d.codeUsed||d.codeExpired;
  screen.innerHTML=heading(unusable?'Get a fresh pairing code.':'Scan from the new device.',esc(d.phoneName),'pair')+
    '<div class="recovery-layout"><section><div class="pairing-example">'+icon('scan')+
    '<strong>PAIRING PREVIEW</strong><span>Non-working illustration</span></div>'+
    '<p class="status-line">'+(d.codeUsed?'This example code was already used.':d.codeExpired?
      'This example code has expired.':'One-use code · This is an example only.')+'</p></section>'+
    '<section>'+line('Shop',esc(s.shop))+line('Prices in',s.currency)+line('Mode','Practice')+
    note('Keep the real code with the owner. An expired or used code needs a new one.')+
    setupNote()+'</section></div>';
  primary(unusable?'pair-show-code':'pair-preview-scan',unusable?'Show a new example code':'Preview the new device scanning');
};
actions['pair-preview-scan']=()=>navigate('join-review');
screens.join=()=>{
  screen.innerHTML=newPhoneMark()+heading('Join your shop.','New device example · Ask the owner for a pairing code.','welcome')+
    '<div class="recovery-layout"><section><div class="pairing-example">'+icon('scan')+
    '<strong>Scan the owner’s code</strong><span>Camera preview only</span></div></section>'+
    '<section><h2 class="section-title">Check before joining</h2><p class="sub">The shop name, currency and mode must be right. You do not need your own Google account.</p>'+
    note('Use a separate empty device. This browser’s existing work stays untouched.')+setupNote()+'</section></div>';
  primary('pair-preview-scan','Preview an example scan');
};
screens['join-review']=()=>{
  const d=recoveryDemo(),wrong=['wrong-shop','wrong-mode','wrong-currency'].includes(d.condition),used=d.codeUsed||d.codeExpired;
  screen.innerHTML=newPhoneMark()+heading('Is this the right shop?','New device example · Before joining','join')+
    '<div class="recovery-layout"><section>'+line('Shop',d.condition==='wrong-shop'?'Moyo Market':esc(s.shop))+
    line('Prices in',recoveryCurrency(false))+line('Mode',d.condition==='wrong-mode'?'Live':'Practice')+line('Device name',esc(d.phoneName))+
    (wrong?'<p class="warning">This code does not match the expected shop, mode or pricing currency. Ask the owner for the right code.</p>':
      used?'<p class="warning">This example code is expired or used. Ask the owner for a new one.</p>':
      offline?'<p class="warning">Go online to pair this new device. Existing authorised tills can keep selling offline.</p>':'')+
    '</section><section><label class="toggle-row"><span><strong>This is the right shop</strong>'+
    '<small>I checked the shop with the owner.</small></span><input type="checkbox" id="join-confirm-shop" '+
    (wrong||used||offline?'disabled':'')+'></label>'+note('The new device gets its own identity. Pairing does not sign a cashier in or open a cash drawer.')+
    setupNote()+'</section></div>';
  primary('join-preview-save','Preview joining this shop',true);
};
inputActions['join-review']=()=>enable('join-preview-save',document.querySelector('#join-confirm-shop').checked);
actions['join-preview-save']=()=>{
  const d=recoveryDemo();if(!document.querySelector('#join-confirm-shop')?.checked||
    d.codeUsed||d.codeExpired||['wrong-shop','wrong-mode','wrong-currency'].includes(d.condition)||offline)return;
  d.codeUsed=true;save();navigate('join-status');
};
screens['join-status']=()=>{
  screen.innerHTML=newPhoneMark()+heading('Example device joined.','Pairing preview finished.')+
    '<div class="recovery-layout"><section>'+line('Shop',esc(s.shop))+line('New device',esc(recoveryDemo().phoneName))+
    line('Device identity','New identity in the app')+line('Records uploaded','None from this preview')+
    '</section><section><h2 class="section-title">Before the first sale</h2>'+
    '<ol class="steps"><li>The owner allows the cashier on this device.</li><li>The cashier sets their own PIN.</li>'+
    '<li>The cashier counts the starting drawer.</li></ol>'+setupNote()+'</section></div>';
  primary('sell','Finish preview · Back to selling');
};
