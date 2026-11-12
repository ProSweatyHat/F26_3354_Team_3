const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'..','team03-portal.html'),'utf8');
let source=html.match(/<script>([\s\S]*?)<\/script>/i)[1];
let tests=fs.readFileSync(require('path').join(__dirname,'logic-tests-source.js'),'utf8')
.replaceAll("tag: 'Event'","tag: 'Relief update'").replaceAll("tag: 'Update'","tag: 'Relief update'")
.replaceAll('count === 3','count === 6').replaceAll('list.length === 2','list.length === 5')
.replaceAll('count stays 3','count stays 6').replaceAll('3 to 4','6 to 7').replaceAll('3 to 2','6 to 5')
.replaceAll('Demo day','Sample relief update').replaceAll('Recording starts at 3 pm.','Sample supply information.')
.replaceAll('type Event','type Relief update').replaceAll('Report due Thursday','Updated relief bulletin');
const nodes={};const node=()=>({addEventListener(){},setAttribute(){},innerHTML:'',textContent:'',value:'',reset(){}});
let saved='[null]';const ctx={console,URL,TextEncoder,crypto:require('crypto').webcrypto,document:{getElementById(id){return nodes[id]??=node();},querySelectorAll(){return []}},window:{addEventListener(){}},location:{hash:''},localStorage:{getItem(){return saved}},navigator:{}};
vm.createContext(ctx);
source=source.replace(/  start\(\)\.catch[^\n]+/,tests+'\n  globalThis.testing={TESTS,freshSetup,signedInSetup,loadSaved,validateContent,filteredItems,SEED};');
vm.runInContext(source,ctx);
(async()=>{const rows=[];for(const t of ctx.testing.TESTS){const o=await t.run();rows.push([t.id,t.name,t.input,t.expected,o.actual,o.pass?'Pass':'Fail']);}
const t=ctx.testing;const fields={title:'Sample notice',body:'Sample information',tag:'Relief update',region:'Nepal',org:'Demo source',source:''};
const extra=[
 ['TC-R1','Unsafe source URLs rejected',()=>t.validateContent({...fields,source:'javascript:alert(1)'}).code==='INVALID'],
 ['TC-R2','Donation links require an identified source and URL',()=>t.validateContent({...fields,tag:'Donation link'}).code==='INVALID'],
 ['TC-R3','Public notices require an identified source and URL',()=>t.validateContent({...fields,tag:'Public notice'}).code==='INVALID'],
 ['TC-R4','HTTPS source is accepted',()=>t.validateContent({...fields,tag:'Public notice',source:'https://example.org/notice'}).ok],
 ['TC-R5','Search matches the recovery bulletin',()=>t.filteredItems(t.SEED,'recovery','','').length===1],
 ['TC-R6','Region/category filters combine',()=>t.filteredItems(t.SEED,'','Tibet','Relief update').length===1],
 ['TC-R7','Unknown categories rejected',()=>t.validateContent({...fields,tag:'Other'}).code==='INVALID'],
 ['TC-R8','Malformed saved content falls back',()=>t.loadSaved()===null],
 ['TC-R9','All six sample records survive storage validation',()=>{saved=JSON.stringify(t.SEED);return t.loadSaved().length===6;}],
 ['TC-R10','Unknown prototype-like username rejected safely',async()=>{const s=await t.freshSetup();return (await s.auth.login('__proto__','wrong')).code==='BAD_CREDENTIALS';}],
 ['TC-R11','New metadata survives add/edit',async()=>{const s=await t.signedInSetup();const r=s.store.add(fields);s.store.edit(r.item.id,{...fields,region:'Tibet',org:'Changed source',source:'https://example.org/'});const i=s.store.list()[0];return i.region==='Tibet'&&i.org==='Changed source'&&i.source==='https://example.org/';}],
 ['TC-R12','Empty message rejected',()=>t.validateContent({...fields,body:'   '}).code==='INVALID'],
 ['TC-R13','Overlength message rejected',()=>t.validateContent({...fields,body:'a'.repeat(401)}).code==='INVALID']
];
for(const [id,name,run] of extra){const ok=await run();rows.push([id,name,'Targeted regression input','Check succeeds',ok?'As expected':'Unexpected result',ok?'Pass':'Fail']);}
if(rows.some(r=>r[5]!=='Pass'))throw Error(JSON.stringify(rows.filter(r=>r[5]!=='Pass')));
fs.writeFileSync(require('path').join(__dirname,'..','test-results.csv'),[['ID','Test case','Input','Expected','Actual','Result'],...rows].map(r=>r.map(v=>'"'+v.replaceAll('"','""')+'"').join(',')).join('\r\n'));
console.log(`${rows.length}/${rows.length} tests pass.`);
})().catch(e=>{console.error(e);process.exit(1)});
