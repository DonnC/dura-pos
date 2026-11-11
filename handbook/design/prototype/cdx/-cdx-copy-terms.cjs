// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// Explicit migration of display copy. Routes, properties, IDs and icons stay stable.
const fs=require('node:fs'),path=require('node:path');
const bundle=path.join(path.dirname(require.resolve('playwright/package.json')),'lib/transform/babelBundle.js');
const {babelParse}=require(bundle);
function words(text){
 return text.replace(/phone number/gi,'mobile number').replace(/name or phone\b/gi,'name or mobile number')
  .replace(/People & phones/g,'Cashiers & devices').replace(/People and phones/g,'Cashiers and devices')
  .replace(/\bStock count\b/g,'Stock take').replace(/\bstock count\b/g,'stock take')
  .replace(/\bCount stock\b/g,'Stock take').replace(/\bCount the shelf\b/g,'Stock take')
  .replace(/\bReview the count\b/g,'Review stock take')
  .replace(/\bSellers\b/g,'Cashiers').replace(/\bSeller\b/g,'Cashier')
  .replace(/\bsellers\b/g,'cashiers').replace(/\bseller\b/g,'cashier')
  .replace(/\bStaff access\b/g,'Cashier access').replace(/\bStaff permissions\b/g,'Cashier permissions')
  .replace(/\bstaff\b/g,'cashier').replace(/\bStaff\b/g,'Cashiers')
  .replace(/\bPhones\b/g,'Devices').replace(/\bPhone\b/g,'Device')
  .replace(/\bphones\b/g,'devices').replace(/\bphone\b/g,'device');
}
function copy(text){
 if(text.startsWith('?')||/^[^<>\s]*[?&][\w-]+=/.test(text))return text;
 if(/^[a-z0-9_#.[\]:=*>+\s-]+$/.test(text)&&!text.includes(' '))return text;
 if(text.startsWith('-cdx-')||text.startsWith('file:'))return text;
 const held=[];
 const protectedText=text.replace(/\b(?:id|class|data-[\w-]+|href|src|for|name|value|aria-controls|aria-describedby|aria-labelledby|type)\s*=\s*("[^"]*"|'[^']*')/g,
  value=>{held.push(value);return '@@ATTR'+(held.length-1)+'@@';});
 return words(protectedText).replace(/@@ATTR(\d+)@@/g,(_,n)=>held[n]);
}
function migrateJS(source,file){
 const ast=babelParse(source,file,false),edits=[];
 function visit(node){
  if(!node||typeof node!=='object')return;
  if(node.type==='StringLiteral'){
   const raw=source.slice(node.start+1,node.end-1),next=copy(raw);
   if(next!==raw)edits.push([node.start+1,node.end-1,next]);return;
  }
  if(node.type==='TemplateElement'){
   const raw=source.slice(node.start,node.end),next=copy(raw);
   if(next!==raw)edits.push([node.start,node.end,next]);return;
  }
  if(node.type==='RegExpLiteral'){
   const raw=source.slice(node.start,node.end);if(raw.includes('-cdx-')||file.endsWith('-check.cjs'))return;const next=copy(raw);
   if(next!==raw)edits.push([node.start,node.end,next]);return;
  }
  for(const [key,value] of Object.entries(node)){
   if(['loc','extra','tokens','comments'].includes(key))continue;
   if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);
  }
 }
 visit(ast);for(const [start,end,next] of edits.sort((a,b)=>b[0]-a[0]))source=source.slice(0,start)+next+source.slice(end);
 babelParse(source,file,false);return source;
}
module.exports={words};
if(require.main===module)for(const file of fs.readdirSync(__dirname).filter(f=>/^[-]cdx-.*\.(js|cjs|html)$/.test(f)&&
 !['-cdx-copy-terms.cjs','-cdx-language-ui-check.cjs','-cdx-coverage.html'].includes(f))){
 const target=path.join(__dirname,file),source=fs.readFileSync(target,'utf8');let next;
 if(file.endsWith('.html')){
  const blocks=[];next=source.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g,block=>{
   const value=block.startsWith('<script')?block.replace(/(<script[^>]*>)([\s\S]*?)(<\/script>)/,
    (_,a,js,z)=>a+migrateJS(js,file)+z):block;
   blocks.push(value);return '@@BLOCK'+(blocks.length-1)+'@@';
  });next=next.replace(/>([^<>]+)</g,(_,text)=>'>'+copy(text)+'<')
    .replace(/\b(aria-label|title|placeholder|alt)="([^"]*)"/g,(_,attr,text)=>attr+'="'+words(text)+'"')
    .replace(/@@BLOCK(\d+)@@/g,(_,n)=>blocks[n]);
 }else next=migrateJS(source,file);
 if(next!==source){console.log(file);if(process.argv.includes('--write'))fs.writeFileSync(target,next);}
}
