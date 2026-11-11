// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// Isolated UI examples. No account, device registration or restore is performed.
function recoveryDemo(){return s.recoveryDemo||(s.recoveryDemo={condition:'ready',account:false,
  phoneName:'Counter spare',codeUsed:false,codeExpired:false,source:'drive',backup:'latest'});}
if(q.get('recovery')){
  const d=recoveryDemo();d.condition=q.get('recovery');
  d.codeExpired=d.condition==='expired';d.codeUsed=d.condition==='used';
  if(d.condition==='missing')d.backup='missing';
  if(d.condition==='offline')offline=true;
}
function connectionCondition(){return offline?'offline':recoveryDemo().condition;}
function restoreProblem(){
  const d=recoveryDemo();
  if(d.backup==='missing')return 'No backup selected. Ask the owner to locate the shop’s records.';
  if(offline&&d.source==='drive')return 'Connect to check a Drive backup, or choose the example local archive.';
  if(d.backup==='previous')return 'This older snapshot needs newer journal records checked before recovery.';
  return { 'wrong-shop':'This backup belongs to Moyo Market, not this shop.',
    'wrong-mode':'This is a live-shop backup. This preview is a practice shop.',
    'wrong-currency':'The backup’s pricing currency does not match this shop. Choose the matching backup.',
    unknown:'The snapshot check has not finished. Check it before recovery.',
    partial:'Newer journal records still need checking before recovery.',
    denied:'The owner must approve access to this account before its backup can be checked.',
    newer:'This backup needs a newer app version.',damaged:'This backup could not be checked. Choose another copy.',
    gap:'Some accepted records are missing. The record check must finish before recovery.'}[d.source==='archive'?'ready':d.condition]||'';
}
function restoreShop(){const d=recoveryDemo();return d.condition==='wrong-shop'&&d.source==='drive'?'Moyo Market':s.shop;}
function recoveryCurrency(forRestore=true){const d=recoveryDemo();return d.condition==='wrong-currency'&&(!forRestore||d.source==='drive')?
  s.currency==='USD'?'ZWG':'USD':s.currency;}
function restoreDate(){return recoveryDemo().backup==='previous'?'9 Nov 2026, 18:30':'10 Nov 2026, 08:12';}
function setupNote(){return note('Design example only. No Google sign-in, real code, file import or remote request runs here.');}
function newPhoneMark(){return '<div class="recovery-brand"><img class="brand-logo" '+
  'src="../../../../client/apps/dura/assets/branding/shop-sign-wordmark.svg" alt="Dura"></div>';}
function recoveryWork(){return line('Saved in this session',s.history.length+' practice sales')+
  line('Unfinished basket',count()+' items kept')+
  line('Unconfirmed payments',String(s.pending.length),'Keep their original references; do not request payment again.');}
