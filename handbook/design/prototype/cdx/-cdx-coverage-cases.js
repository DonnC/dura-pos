// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// Explicit designed examples, not an enumeration of every possible data value.
(()=>{
const states=[];
const add=(family,screen,key,values,extra='')=>{
 for(const value of values)states.push({id:`${family}-${value}`,family,screen,query:`${key}=${value}${extra}`});
};
add('shelf','sell','state',['populated','empty','loading','error','interrupted']);
add('payment','pending','state',['populated','confirmed','failed']);
add('kept','kept-checkout','kept',['sample','stale']);
add('access','my-access','access',['sample','expired','removed'],'&role=worker');
add('delivery','access-status','access',['pending']);
add('connection','connection-status','recovery',['ready','offline','denied','unknown','partial']);
add('pair','pair-code','recovery',['ready','expired','used']);
add('join','join-review','recovery',['ready','offline','wrong-shop','wrong-mode','wrong-currency']);
add('restore','restore-review','recovery',['ready','offline','unknown','partial','denied','wrong-shop',
 'wrong-mode','wrong-currency','newer','damaged','gap']);
states.push({id:'restore-missing',family:'restore',screen:'restore',query:'recovery=missing'});
add('report-read','reports','state',['loading','error']);
add('fiscal','fiscal-receipt','fiscal',['off','waiting','unknown','refused','flagged','accepted']);
add('day','fiscal-close','fiscal',['clear','closing','close-failed','closed','ending']);
add('device','fiscal-device','fiscal',['certificate','integrity']);
for(const screen of ['sell','pay','mobile','invoice-payment','return-items','report-coverage','sync'])
 states.push({id:'offline-'+screen,family:'offline',screen,query:'offline=1'});
for(const screen of ['credit','kept-checkout'])
 states.push({id:'permission-'+screen,family:'permission',screen,query:'role=worker&access=sample',setup:'limited'});
for(const [screen,input,value] of [['pay','received','5.001'],['pay','received','1.00'],
 ['expense','expense-amount','9999999.00'],['cashup','counted-usd','bad']])
 states.push({id:'invalid-'+screen+'-'+value,family:'validation',screen,query:'',input,value});
states.push({id:'stock-no-match',family:'empty',screen:'stock',input:'stock-search',value:'No such item',query:''},
 {id:'history-no-match',family:'empty',screen:'history',input:'receipt-search',value:'No such receipt',query:''},
 {id:'mobile-offline',family:'disabled',screen:'mobile',query:'offline=1'},
 {id:'kept-off',family:'disabled',screen:'kept-checkout',query:'',setup:'kept-off'},
 {id:'fiscal-filter-empty',family:'empty',screen:'fiscal-queue',query:'fiscal=clear',action:'fiscal-filter',data:{filter:'waiting'}});
for(const [kind,screen] of [['receive','receive'],['stock','stock-count'],['expense','expense'],['cashup','cashup']]){
 for(const variant of ['restored','stale'])states.push({id:`${variant}-${kind}`,family:'review-recovery',
  screen,reviewKind:kind,variant,query:''});
}
for(const screen of ['receive-review','count-stock-review','expense-review','count-review'])
 states.push({id:'missing-'+screen,family:'review-recovery',screen,query:''});
for(const [id,screen,setup] of [['stock-empty','stock','empty-products'],
 ['receive-empty','receive','empty-products'],['count-empty','stock-count','empty-products'],
 ['invoice-empty','invoice-items','invoice-empty'],['invoice-saved','invoice-detail','invoice-saved'],
 ['receipt-empty','history','receipt-empty'],['kept-other-currency','kept-checkout','kept-other-currency'],
 ['kept-no-balance','kept-refund','kept-no-balance'],['kept-cash-short','kept-refund','kept-cash-short']])
 states.push({id,family:'data-boundary',screen,setup,query:''});
for(const mode of ['full','later','part'])states.push({id:'invoice-'+mode,family:'invoice-payment',
 screen:'invoice-payment',setup:'invoice-mode',value:mode,query:''});
for(const period of ['yesterday','week','custom'])states.push({id:'report-'+period,family:'report-filters',
 screen:'reports',setup:'report-period',value:period,query:''});
for(const currency of ['USD','ZWG','ZAR'])states.push({id:'pricing-'+currency,family:'currency',
 screen:'pay',setup:'currency',value:currency,query:''});
states.push({id:'setup-unselected',family:'disabled',screen:'setup',query:''});
for(const screen of ['sell','pay'])states.push({id:'long-data-'+screen,family:'long-data',screen,setup:'long-data',query:''});
for(const [id,screen,outcome] of [['saved-delivery','receive','receive'],['saved-count','stock-count','stock'],
 ['saved-money-out','expense','expense'],['saved-close','cashup','cashup'],
 ['saved-collection','customer','collection'],['saved-invoice','invoice-review','invoice'],
 ['saved-kept-refund','kept-refund','kept-refund'],['saved-partial-return','return-items','partial-return'],
 ['saved-full-return','refund','full-return'],['removed-access','access-remove','access'],
 ['blocked-phone-preview','lost-phone','lost-phone']])states.push({id,family:'completion',screen,outcome,query:''});
for(const method of ['Cash','Mobile money','On account'])states.push({id:'sale-done-'+method.replaceAll(' ','-'),
 family:'completion',screen:'done',setup:'sale-done',value:method,query:''});
for(const [id,screen,setup,value] of [['opening-multi','opening','multi',''],['cashup-multi','cashup','multi',''],
 ['cashup-balanced','count-review','count-review','70.50'],['cashup-over','count-review','count-review','71.00'],
 ['count-matched','count-stock-review','count-matched','']])states.push({id,family:'review-variants',screen,setup,value,query:''});
states.push({id:'owner-access-records',family:'permission',screen:'records',query:'role=worker'});

// Each source callsite has at least one actual rendered dialog fixture.
const dialogs=[
 ['collection','accounts','customer','review-collection','Payment from Tariro','collection'],
 ['day-answer','fiscal-day','fiscal-close','fiscal-day-answer','Example close answer','closing'],
 ['ask-owner','fiscal-receipts','fiscal-receipt','fiscal-ask-owner','Ask the owner to review','refused'],
 ['fiscal-support','fiscal-receipts','fiscal-owner-review','fiscal-support','Support details','refused'],
 ['invoice-add','invoices','invoice-items','invoice-add','Add an item','invoice'],
 ['invoice-edit','invoices','invoice-items','invoice-edit','Edit item','invoice'],
 ['invoice-evidence','invoices','invoice-payment','invoice-evidence','Keep the invoice','invoice'],
 ['new-kept-customer','kept','kept-account','kept-add-customer','Whose change','kept'],
 ['share','receipts','receipt','share-receipt','Share receipt','receipt'],
 ['printer','receipts','print','find-printer','Available printers','receipt'],
 ['report-refresh','reports','report-coverage','report-refresh','No new figures','reports'],
 ['access-check','seller-access','my-access','access-check','No access update','worker'],
 ['sale-options','selling','sell','sale-options','This sale','basket'],
 ['basket','selling','sell','basket','Your basket','basket'],
 ['basket-empty','selling','sell','basket','Your basket','empty'],
 ['basket-measured','selling','sell','basket','Your basket','measured'],
 ['held-empty','selling','sell','held','Held sales','empty'],
 ['held-populated','selling','sell','held','Held sales','held'],
 ['scan','selling','sell','scan','Scan a product','basket'],
 ['profile-owner','shift','sell','profile','Owner','basket'],
 ['profile-worker','shift','sell','profile','Seller','worker'],
 ['shop-account','shop-connection','connect','connection-account','Choose the shop account','connection'],
 ['export','shop','export','export-preview','Export contents','export'],
 ['access-received','staff-access','access-status','access-preview-receipt','Preview a reconnecting phone','pending-access']
].map(([id,file,screen,action,title,fixture])=>({id,file:`-cdx-${file}.js`,screen,action,title,fixture}));
dialogs.push({...dialogs.find(c=>c.id==='invoice-add'),id:'invoice-item-error',variant:'invalid'},
 {...dialogs.find(c=>c.id==='new-kept-customer'),id:'kept-name-error',variant:'invalid'});

const familyRoutes={
 selling:['sell','pay','quick','quantity','mobile','pending','credit','mixed','done'],
 receipts:['history','receipt','print','refund','refund-review','return-items','return-review'],
 till:['opening','money','cashup','count-review','handover','locked','switch-person','expense','expense-review'],
 stock:['stock','product','receive','receive-review','stock-count','count-stock-review','product-edit'],
 accounts:['customers','customer','suppliers','supplier-statement'],
 invoices:['invoice-items','invoice-payment','invoice-review','invoice-detail'],
 kept:['kept-customers','kept-account','kept-checkout','kept-keep','kept-refund','kept-refund-review'],
 reports:['reports','report-sales','report-cash','report-coverage'],
 access:['people','staff','access-review','access-status','access-remove','my-access','access-limited',
  'access-expired','access-removed','access-recovery'],
 connection:['connect','connection-review','connection-status','pair','pair-code','join','join-review','join-status',
  'restore','restore-review','restore-status','lost-phone'],
 fiscal:['fiscal','fiscal-setup','fiscal-queue','fiscal-receipt','fiscal-check','fiscal-owner-review','fiscal-day','fiscal-close','fiscal-device'],
 shop:['shop','settings','records','export','sync','help','welcome','setup','first-product']
};
const catalog={states,dialogs,familyRoutes};
if(typeof module!=='undefined')module.exports=catalog;else globalThis.designCoverage=catalog;
})();
