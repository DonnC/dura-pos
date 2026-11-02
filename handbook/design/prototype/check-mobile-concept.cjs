// Run with the bundled Node runtime and Playwright on NODE_PATH.
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  const page = await browser.newPage({viewport:{width:736,height:1600}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(__dirname,'dura-mobile-preview.html')).href);
  const frame=page.frameLocator('iframe');
  await frame.locator('#dura-screen h2').filter({hasText:'New sale'}).waitFor();
  await frame.getByRole('button',{name:'Add Bread loaf, USD 1.00',exact:true}).click();
  await frame.getByRole('button',{name:'Add Bread loaf, USD 1.00',exact:true}).click();
  await frame.getByRole('button',{name:'Charge USD 2.00'}).click();
  await frame.getByRole('button',{name:'Complete cash sale'}).click();
  await frame.getByRole('alert').filter({hasText:'Enter cash received'}).waitFor();
  await frame.locator('#dura-received').fill('5.00');
  if(await frame.locator('#dura-change').textContent()!=='USD 3.00')throw Error('Incorrect change');
  await frame.getByRole('button',{name:'Complete cash sale'}).click();
  await frame.getByRole('heading',{name:'Sale saved',exact:true}).waitFor();
  await frame.getByRole('button',{name:'Start next sale'}).click();
  await frame.locator('nav button[data-go="stock"]').click();
  await frame.getByText('16 loaves',{exact:true}).waitFor();
  await frame.locator('nav button[data-go="money"]').click();
  await frame.locator('#dura-counted').fill('49.00');
  if(await frame.locator('#dura-difference').textContent()!=='USD 0.00')throw Error('Incorrect cash-up');
  await frame.getByRole('button',{name:'Save cash-up'}).click();
  await frame.getByRole('button',{name:'Cash-up saved in preview'}).waitFor();
  await frame.locator('#dura-scene').selectOption('shop');
  await frame.getByRole('button',{name:'October records'}).click();
  await frame.getByRole('cell',{name:'P1-S000031',exact:true}).waitFor();
  await frame.getByRole('button',{name:'Preview an export'}).click();
  await frame.getByRole('heading',{name:'Export records',exact:true}).waitFor();
  await frame.locator('#dura-scene').selectOption('setup');
  await frame.getByRole('button',{name:'Continue to practice selling'}).click();
  await frame.getByRole('alert').filter({hasText:'choose a pricing currency'}).waitFor();
  await frame.locator('#dura-currency').selectOption('USD');
  await frame.getByRole('button',{name:'Continue to practice selling'}).click();
  for(const width of [320,390,736]){
    await page.setViewportSize({width,height:1100});
    for(const scene of ['sell','welcome','setup','stock','money','shop']){
      await frame.locator('#dura-scene').selectOption(scene);
      const overflow=await frame.locator('#dura-concept').evaluate(el=>el.scrollWidth>el.clientWidth+1);
      if(overflow)throw Error(`Overflow at ${width}px: ${scene}`);
    }
  }
  await page.setViewportSize({width:736,height:1600});
  await frame.locator('#dura-scene').selectOption('sell');
  await frame.locator('#dura-concept').screenshot({path:path.join(__dirname,'dura-mobile-sell.png'),fullPage:true});
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS: cash sale, validation, change, stock, cash-up, data preview, onboarding and 320/390/736px layouts.');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
