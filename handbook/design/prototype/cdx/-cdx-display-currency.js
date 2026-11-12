// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

const sellCurrency=()=>s.currency==='USD'&&s.displayCurrency==='ZWG'?'ZWG':s.currency;
const sellDisplayMoney=n=>sellCurrency()===s.currency?money(n):money(roundRatio(BigInt(n)*BigInt(s.rateMinor),100),'ZWG');
function currencyControl(){return btn('display-currency',sellCurrency()+' ▾','currency-control','aria-label="Display and payment currency"');}
function currencyRateNote(){return sellCurrency()===s.currency?'':
  '<p class="display-rate">Converted display · USD 1.00 = '+money(s.rateMinor,'ZWG')+
  ' · Example rate. Original USD prices are kept.</p>';}
actions['display-currency']=()=>showSheet('Display and payment currency',
  menu('display-set',s.currency+' · Shop prices','Keep original product prices','money',`data-currency="${s.currency}"`)+
  (s.currency==='USD'?menu('display-set','ZWG · Converted prices','Use the example rate; check the payment split before saving',
    'money','data-currency="ZWG"'):'')+
  note('Changing this display does not change the shop’s pricing currency or old receipts. Only configured rates can be used.'));
actions['display-set']=b=>{
  if(![s.currency,...(s.currency==='USD'?['ZWG']:[])].includes(b.dataset.currency))return;
  s.displayCurrency=b.dataset.currency;received='';delete s.cashDraft;s.keptCheckout=null;
  delete s.mixedDraft;save();navigate('sell');
};
actions.pay=()=>{
  if(page==='sell'&&sellCurrency()==='ZWG'&&s.currency==='USD'){
    const d=mixedDraft();if(!d.usd&&!d.zwg){d.usd='0.00';
      d.zwg=(roundRatio(BigInt(total())*BigInt(d.rateMinor),100)/100).toFixed(2);save();}
    navigate('mixed');
  }else navigate('pay');
};
