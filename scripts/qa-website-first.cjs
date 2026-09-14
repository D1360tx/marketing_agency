/* eslint-disable @typescript-eslint/no-require-imports -- Standalone local-only QA with optional external Playwright installation. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const Module = require('node:module');
const ts = require('typescript');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3184';
assert.ok(['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname), 'QA is local only');
const out = path.resolve('artifacts/website-first');
fs.mkdirSync(out, { recursive: true });
const filename = path.resolve('src/lib/public-submission-security.ts');
const schemaModule = new Module(filename, module);
schemaModule.filename = filename;
schemaModule.paths = module.paths;
schemaModule._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { inboundLeadSchema } = schemaModule.exports;
const results = { viewports: [], forms: [], screenshots: [], errors: [], realSubmissions: 0 };
(async () => {
 const browser = await chromium.launch({ headless:true, ...(process.env.PW_EXECUTABLE_PATH ? {executablePath:process.env.PW_EXECUTABLE_PATH} : {}) });
 try {
  for (const width of [390,768,1280,1440,1920]) {
   const context = await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1,serviceWorkers:'block'});
   let captured=[]; let mode='error';
   // Route guard is installed BEFORE navigation. No real lead or other mutation can escape.
   await context.route('**/*', async route => {
    const req=route.request();
    if(new URL(req.url()).pathname === '/api/leads/inbound') {
     assert.equal(req.method(),'POST'); captured.push(req.postDataJSON());
     return route.fulfill({status:mode==='error'?503:200,contentType:'application/json',body:JSON.stringify(mode==='error'?{error:'INTERCEPTED QA'}:{success:true})});
    }
    if(!['GET','HEAD'].includes(req.method())) return route.abort('blockedbyclient');
    if(new URL(req.url()).origin !== new URL(base).origin) return route.abort('blockedbyclient');
    return route.continue();
   });
   // Deterministic widget substitute only in QA; no production bypass is added.
   await context.addInitScript(() => {window.turnstile={render:(_el,options)=>{queueMicrotask(()=>options.callback('qa-intercept-only'));return 'qa-widget';},remove:()=>{}};});
   const page=await context.newPage();
   page.on('pageerror', error=>results.errors.push(error.message));
   const response=await page.goto(base+'/website-first',{waitUntil:'networkidle'});
   assert.equal(response.status(),200);
   assert.match(response.headers()['x-robots-tag'],/noindex, nofollow/);
   for(const detail of await page.locator('details').all()) {
    await detail.locator('summary').click();
    assert.equal(await detail.getAttribute('open'),'');
    assert.ok(await detail.locator('p').isVisible());
    await detail.locator('summary').click();
   }
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.evaluate(()=>document.fonts.ready);
   const checks=await page.evaluate(()=>{
    const headings=[...document.querySelectorAll('h1,h2,h3')].map(el=>{
     const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT); const rows=new Map();
     while(walker.nextNode()) { const node=walker.currentNode; const text=node.textContent;
      for(const match of text.matchAll(/\S+/g)) { const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);const rect=range.getBoundingClientRect();const y=Math.round(rect.top);rows.set(y,[...(rows.get(y)||[]),match[0]]); }
     }
     return {text:el.textContent,lines:[...rows.values()].map(words=>words.join(' ')),orphan:[...rows.values()].some(words=>words.length===1)};
    });
    return {h1:document.querySelectorAll('h1').length,scrollWidth:document.documentElement.scrollWidth,robots:document.querySelector('meta[name="robots"]')?.content,bodyEmDash:document.body.innerText.includes('—'),missingAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash),smallTargets:[...document.querySelectorAll('a,button,summary,input:not([tabindex="-1"])')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.height<44;}).map(el=>el.textContent||el.name),headings};
   });
   assert.equal(checks.h1,1);assert.ok(checks.scrollWidth<=width,`overflow ${width}`);assert.match(checks.robots,/noindex/);assert.match(checks.robots,/nofollow/);assert.equal(checks.bodyEmDash,false);assert.deepEqual(checks.missingAnchors,[]);assert.deepEqual(checks.smallTargets,[]);
   assert.deepEqual(checks.headings.filter(h=>h.orphan),[],`heading orphans at ${width}`);
   for(const kind of ['hero','full']) {const file=path.join(out,`website-first-${width}-${kind}.png`);await page.screenshot({path:file,fullPage:kind==='full'});results.screenshots.push(file);}
   results.viewports.push({width,...checks});
   const form=page.locator('form'); const submit=form.getByRole('button');
   await page.getByRole('link',{name:'Request My Website Plan',exact:false}).first().click();assert.equal(new URL(page.url()).hash,'#website-plan');
   await submit.click();assert.equal(captured.length,0);assert.equal(await form.evaluate(f=>f.checkValidity()),false);
   await page.getByLabel('Business name',{exact:true}).fill('   ');await page.getByLabel('Work email').fill('qa@example.com');await submit.click();assert.equal(captured.length,0);
   await page.getByLabel('Business name',{exact:true}).fill('QA WEBSITE - INTERCEPT ONLY');await page.getByLabel('Work email').fill('invalid');await submit.click();assert.equal(captured.length,0);
   await page.getByLabel('Work email').fill('qa@example.com');await page.getByLabel('Website (optional)').fill('ftp://example.com');await submit.click();assert.equal(captured.length,0);
   await page.getByLabel('Website (optional)').fill('https://example.com');await submit.click();await form.getByRole('alert').waitFor();assert.equal(captured.length,1);
   assert.equal(await page.getByLabel('Business name',{exact:true}).inputValue(),'QA WEBSITE - INTERCEPT ONLY');assert.equal(await page.getByLabel('Work email').inputValue(),'qa@example.com');assert.equal(await page.getByLabel('Website (optional)').inputValue(),'https://example.com');
   mode='success';await submit.click();await form.getByText('Your request is received.',{exact:false}).waitFor();assert.equal(captured.length,2);assert.ok(await submit.isDisabled());assert.equal(await page.getByLabel('Work email').inputValue(),'');
   for(const payload of captured) {assert.equal(inboundLeadSchema.safeParse(payload).success,true);assert.equal(payload.source,'website-first/v1');assert.equal(payload.smsConsent,false);assert.equal(payload.contact_time,'');}
   results.forms.push({width,invalidBlocked:true,errorPreservedAllFields:true,interceptedSuccess:true,schemaValid:true,source:'website-first/v1',smsConsent:false,interceptedRequests:captured.length});
   await context.close();
  }
  assert.equal(results.viewports.length,5);assert.equal(results.screenshots.length,10);assert.deepEqual(results.errors,[]);
  fs.writeFileSync(path.join(out,'qa-results.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify({viewports:results.viewports.length,forms:results.forms.length,screenshots:results.screenshots.length,errors:results.errors,realSubmissions:results.realSubmissions},null,2));
 } finally { await browser.close(); }
})().catch(error=>{fs.writeFileSync(path.join(out,'qa-failure.json'),JSON.stringify({error:error.stack,results},null,2));console.error(error);process.exit(1);});
