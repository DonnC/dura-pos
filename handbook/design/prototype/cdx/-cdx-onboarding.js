// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

screens.welcome=()=>{
  screen.innerHTML=`<div class="welcome-mark"><img
    src="../../../../client/apps/dura/assets/branding/shop-sign-wordmark.svg" alt="Dura"></div>
    <p class="eyebrow">Your everyday shop companion</p><h1>Your shop.<br>Your own way.</h1>
    <p class="sub">Sell with or without internet. Keep your records in your own account.</p>
    <div class="welcome-points">${line('Free to trade','No subscription')}
    ${line('Your records','Yours to keep')}${line('Start small','Add more when needed')}</div>
    ${btn('join','Join an existing shop','text-button full')}
    ${btn('start-practice','Try practice mode','text-button full')}`;
  primary('setup','Set up my shop');
};
actions['start-practice']=()=>{s.previewAppearance='practice';save();navigate('sell');};
screens.setup=()=>{
  screen.innerHTML=heading('Make it your shop.','Step 1 of 2 · The essentials','welcome')+
    field('setup-name','Shop name',draft.setupName||'','maxlength="60" placeholder="e.g. Chipo’s corner shop"')+
    select('pricing-currency','What currency are your prices in?',option('','Choose a currency')+
      ['USD','ZWG','ZAR'].map(c=>option(c,c,draft.setupCurrency===c)).join(''))+
    note('Choose the currency you write your prices in. Other payment currencies can be added later.')+
    '<p class="micro">No Google connection or payment account is needed to try your first cash sale.</p>';
  primary('setup-save','Add my first product',true);inputActions.setup();
};
inputActions.setup=()=>enable('setup-save',val('setup-name').length>=2&&!!val('pricing-currency'));
actions['setup-save']=()=>{
  draft.setupName=val('setup-name');draft.setupCurrency=val('pricing-currency');navigate('first-product');
};
screens['first-product']=()=>{
  if(!draft.setupCurrency){navigate('setup');return;}
  screen.innerHTML=heading('What do you sell?','Step 2 of 2 · One product is enough','setup')+
    field('first-name','Product or service name','','maxlength="60" placeholder="e.g. Tomatoes"')+
    field('first-unit','Selling unit','','maxlength="30" placeholder="e.g. 1 kg or 1 bag"')+
    field('first-price',`Selling price · ${draft.setupCurrency}`,'','inputmode="decimal" placeholder="0.00"')+
    note('You can add products and turn on stock tracking later. This creates a separate fictional practice shop.');
  primary('first-save',s.previewAppearance==='practice'?'Start practice shop':'Start my shop',true);
};
inputActions['first-product']=()=>enable('first-save',val('first-name')&&val('first-unit')&&validAmount('first-price'));
actions['first-save']=()=>{
  s.shop=draft.setupName;s.currency=draft.setupCurrency;s.role='owner';s.name='Chipo';
  s.products=[{id:'first',name:val('first-name'),unit:val('first-unit'),cents:parseCents(val('first-price')),
    stock:null,stockUnit:'packs',cat:'Food'}];
  s.active=false;s.cash=0;s.zwg=0;s.sales=0;s.saleCount=0;s.saleSeq=0;s.owed=0;s.supplier=0;s.pending=[];
  s.history=[];s.basket={};s.held=[];s.events=[];s.seedDay=false;
  s.movements=[];s.accounts={customer:{opening:0,moves:[]},supplier:{opening:0,moves:[]}};
  s.invoiceDraft=null;s.invoices=[];
  delete s.kept;delete s.keptCheckout;delete s.keptRefund;delete s.keptSelected;
  delete s.fiscalDemo;
  delete s.lineDiscounts;delete s.discountDraft;
  delete s.reviewDrafts;delete s.lastHandover;
  delete s.reportFilter;delete s.recoveryDemo;
  delete s.staffAccess;delete s.staffAccessDraft;delete s.staffActor;
  delete s.quantityDraft;delete s.returnDraft;delete s.returnTotals;delete s.partialReturns;delete s.returnSeq;
  s.features={credit:false,mobile:false,multi:false};s.last=null;s.refunds=[];
  save();navigate('opening');
};
