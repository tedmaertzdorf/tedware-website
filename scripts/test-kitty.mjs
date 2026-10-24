import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root = process.cwd();
const sandbox = {window:{}};
vm.runInNewContext(fs.readFileSync('js/translations.js','utf8'),sandbox);
vm.runInNewContext(fs.readFileSync('kitty-catwalk/translations.js','utf8'),sandbox);
const dictionaries=sandbox.window.TEDWARE_TRANSLATIONS;
const pages=['kitty-catwalk/privacy/index.html','kitty-catwalk/support/index.html'];
let count=0;
for(const file of pages){
 const html=fs.readFileSync(file,'utf8');
 assert.match(html,/<html lang="en">/);assert.match(html,/name="viewport"/);
 assert.equal((html.match(/<h1 /g)||[]).length,1);
 assert.ok(!html.includes('noindex,nofollow'));
 assert.ok(!html.includes('data-i18n="draft"'));
 assert.match(html,/rel="canonical" href="https:\/\/tedware\.nl\/kitty-catwalk\//);
 assert.ok(!html.includes('CONTACT_EMAIL_HERE'));
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const m of html.matchAll(/data-i18n="([^"]+)"/g)){
  assert.ok(dictionaries.en[m[1]],m[1]);assert.ok(dictionaries.nl[m[1]],m[1]);count++;
 }
 for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  const link=m[1];
  if(link.startsWith('#'))assert.ok(ids.includes(link.slice(1)),link);
  else if(link.startsWith('mailto:'))assert.equal(link.split('?')[0],'mailto:support.tedware@gmail.com');
  else if(/^https:/.test(link))assert.doesNotThrow(()=>new URL(link));
  else {
   const target=path.resolve(link.startsWith('/')?root:path.dirname(path.resolve(file)),link.replace(/^\//,''));
   assert.ok(fs.existsSync(target),file+' -> '+link);
  }
 }
}
for(const lang of ['en','nl']){
 const values=Object.entries(dictionaries[lang]).filter(([k])=>k.startsWith('privacy.')||k.startsWith('support.')).map(([,v])=>v).join('\n');
 assert.ok(values.includes('support.tedware@gmail.com'));
}
console.log(`PASS two direct static routes, ${count} translated elements, local resources/anchors, exact mailto addresses, confirmed publication content and semantic headings.`);
