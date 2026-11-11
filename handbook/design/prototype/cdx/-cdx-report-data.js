// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

const reportToday='2026-11-10';
const reportExample=q.get('reports')==='sample';
function reportFilter(){
  s.reportFilter=s.reportFilter||{period:'today',place:reportExample?'front':'phone1',start:'2026-11-01',end:reportToday};
  if(!reportExample&&s.reportFilter.place!=='phone1')s.reportFilter.place='phone1';
  return s.reportFilter;
}
function reportDate(value){return new Intl.DateTimeFormat('en-GB',{
  day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z'));}
function reportRange(){
  const f=reportFilter();let start=reportToday,end=reportToday;
  if(f.period==='yesterday')start=end='2026-11-09';
  if(f.period==='week')start='2026-11-09';
  if(f.period==='custom'){start=f.start;end=f.end;}
  const valid=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&
    new Date(Date.parse(v)).toISOString().slice(0,10)===v;
  if(!valid(start)||!valid(end))return {error:'Choose a start and end date.'};
  if(end<start)return {error:'End date must be on or after the start date.'};
  if(end>reportToday)return {error:'Choose dates up to 10 Nov 2026, the practice day.'};
  const days=Math.round((Date.parse(end)-Date.parse(start))/86400000)+1;
  if(days>31)return {error:'Choose up to 31 days for this preview.'};
  return {start,end,dates:Array.from({length:days},(_,n)=>
    new Date(Date.parse(start)+n*86400000).toISOString().slice(0,10))};
}
function reportDataset(){
  const phones=[{id:'phone1',place:'front',name:'Phone 1 · This phone',seen:reportExample?'10 Nov, 09:41':'Current practice session'},
    ...(reportExample?[{id:'phone2',place:'front',name:'Phone 2 · Counter spare',seen:'10 Nov, 08:12'},
      {id:'phone3',place:'market',name:'Phone 3 · Market stall',seen:'9 Nov, 18:30'}]:[])];
  const row=(day,phone,gross,returns,count,costs,state='current')=>
    ({day,phone,gross,returns,net:gross-returns,count,costs,state});
  const rows=reportExample?[
    row(reportToday,'phone1',9500,850,24,null),row(reportToday,'phone2',1800,0,6,null,'stale'),
    row('2026-11-09','phone1',11000,1000,28,6500),
    row('2026-11-09','phone2',5200,200,12,3000),row('2026-11-09','phone3',7300,300,20,4200)]:
    [{day:reportToday,phone:'phone1',gross:null,returns:null,net:s.sales,count:s.saleCount,costs:null,state:'local'}];
  return {phones,rows:demoState==='empty'?[]:rows};
}
function reportSelection(){
  const f=reportFilter(),range=reportRange(),data=reportDataset();
  const phones=data.phones.filter(p=>f.place==='all'||f.place===p.id||f.place===p.place);
  if(range.error)return {error:range.error,phones,rows:[]};
  const rows=data.rows.filter(r=>phones.some(p=>p.id===r.phone)&&range.dates.includes(r.day));
  const expected=phones.length*range.dates.length;
  const complete=rows.length===expected&&rows.every(r=>r.state==='current')&&expected>0;
  const sum=key=>rows.length&&rows.every(r=>r[key]!==null)?rows.reduce((n,r)=>n+r[key],0):null;
  const net=sum('net'),gross=sum('gross'),returns=sum('returns'),costs=sum('costs');
  return {phones,rows,range,expected,complete,net,gross,returns,count:sum('count'),costs,
    profit:complete&&net!==null&&costs!==null?net-costs:null};
}
function reportPlace(){return {all:'All example locations',front:'Front counter',market:'Market stall',phone1:'This phone'}[reportFilter().place];}
function reportPeriod(){const r=reportRange();return r.error?'Choose a period':
  r.start===r.end?reportDate(r.start):reportDate(r.start)+' – '+reportDate(r.end);}
const reportMoney=value=>value===null?'Not available':money(value);
function reportCoverageText(r){
  if(r.error)return r.error;if(!r.rows.length)return 'No figures loaded for this view.';
  if(r.rows.every(row=>row.state==='local'))return 'Incomplete period · Current till only. Earlier shifts are not included.';
  if(!r.complete){
    const missing=r.expected-r.rows.length,older=new Set(r.rows.filter(row=>row.state==='stale').map(row=>row.phone)).size;
    const reasons=[];if(missing)reasons.push(`${missing} daily update${missing===1?'':'s'} missing`);
    if(older)reasons.push(`${older} phone${older===1?' has':'s have'} older figures`);
    return 'Incomplete · '+reasons.join('; ')+'.';
  }
  return r.range.end===reportToday?'Figures so far · Selected phones current through 09:41.':
    'All selected phones included for this period.';
}
function reportDrawers(){
  // Drawer figures are latest snapshots, independent of the sales period.
  return {phone1:{asof:reportExample?'10 Nov, 09:41':'Current practice session',state:'This phone',balances:[
    {currency:s.currency,amount:reportExample?7050:s.cash},
    ...(s.currency==='USD'&&(reportExample||s.zwg)?[{currency:'ZWG',amount:reportExample?13500:s.zwg}]:[])]},
    phone2:{asof:'10 Nov, 08:12',state:'Needs a new count',balances:null},
    phone3:{asof:'9 Nov, 18:30',state:'No current drawer figure',balances:null}};
}
