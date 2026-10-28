/* Homeray cards – regression tests. Run: node tests/cards.test.js (needs Playwright with Chromium) */
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{
const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.setContent('<body></body>');await p.addScriptTag({content:fs.readFileSync(path.join(__dirname,'..','homeray-cards.js'),'utf8')});
const res=await p.evaluate(async()=>{
 const R=[];const ok=(name,cond)=>R.push([name,!!cond]);const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const hass=(o={})=>Object.assign({language:'en',states:{},entities:{},devices:{},areas:{},themes:{},callWS:async()=>[]},o);
 const txt=el=>el.shadowRoot.textContent.replace(/\s+/g,' ');
 const card=(cfg={})=>{const c=document.createElement('homeray-issues-card');c.setConfig(cfg);document.body.appendChild(c);return c};
 // integrations: first failure, loading, stale
 let c=card({summary:true});c.hass=hass({callWS:()=>Promise.reject(1)});await wait(30);
 ok('first failure is not "All good"',/Check incomplete/.test(txt(c))&&!/All good/.test(txt(c)));
 let mode='ok';c=card({summary:true});c.hass=hass({callWS:()=>mode==='ok'?Promise.resolve([]):Promise.reject(1)});await wait(30);
 ok('clean result shows All good',/All good/.test(txt(c)));
 mode='fail';await c._tick();
 ok('stale result is not "All good"',/Check incomplete/.test(txt(c))&&/last integration check failed/i.test(txt(c)));
 mode='ok';await c._tick();ok('new success clears the warning',/All good/.test(txt(c))&&!/failed/i.test(txt(c)));
 // stale with problems keeps the list
 mode='ok';const ent=[{domain:'mqtt',state:'setup_error',title:'MQTT'}];c=card({summary:true});c.hass=hass({callWS:()=>mode==='ok'?Promise.resolve(ent):Promise.reject(1)});await wait(30);
 mode='fail';await c._tick();ok('stale keeps previous problems with a note',/Mqtt/.test(txt(c))&&/Last check failed/.test(txt(c)));
 // setConfig keeps entries
 c.setConfig({rows:3});ok('setConfig keeps integration errors',/Mqtt/.test(txt(c)));
 // out-of-order answers
 let res=[];c=card({});c._h=hass({callWS:()=>new Promise(r=>res.push(r))});const a=c._tick(),bb=c._tick();
 res[1]([{domain:'mqtt',state:'setup_error',title:'MQTT'}]);await bb;res[0]([]);await a;c._draw();
 ok('late older answer is ignored',/Mqtt/.test(txt(c)));
 // batteries
 const st={'binary_sensor.a1':{state:'on',attributes:{device_class:'battery',friendly_name:'Remote low'}},'binary_sensor.a2':{state:'on',attributes:{device_class:'battery',friendly_name:'Remote alarm'}},
  'sensor.d_pct':{state:'5',attributes:{device_class:'battery',friendly_name:'Door'}},'binary_sensor.d_low':{state:'on',attributes:{device_class:'battery',friendly_name:'Door low'}},
  'sensor.x':{state:'5',attributes:{device_class:'battery',friendly_name:'Excluded'}},'sensor.zero':{state:'10',attributes:{device_class:'battery',friendly_name:'Ten'}}};
 const ents={'binary_sensor.a1':{device_id:'r'},'binary_sensor.a2':{device_id:'r'},'sensor.d_pct':{device_id:'d'},'binary_sensor.d_low':{device_id:'d'},'sensor.x':{device_id:'e'}};
 const devs={r:{name:'Remote'},d:{name:'Door'},e:{name:'E',labels:['fuori_monitoraggio']}};
 c=card({});c.hass=hass({states:st,entities:ents,devices:devs});await wait(30);let n=c._data().bat.map(x=>x.name);
 ok('two binary alarms of one device count once',n.filter(x=>/Remote/.test(x)).length===1);
 ok('percentage + binary of one device count once',n.filter(x=>/Door/.test(x)).length===1);
 ok('exclude_label hides batteries',!n.includes('Excluded'));
 c.setConfig({battery:0});ok('battery: 0 is kept',!c._data().bat.some(x=>x.name==='Ten'));
 ok('battery panel title has no threshold',/Low batteries/.test(txt(c))&&!/below 20/.test(txt(c)));
 // other areas chip counts areas
 const s2={},e2={},d2={},ar={};for(let i=0;i<5;i++){ar['a'+i]={name:'Room'+i};for(let j=0;j<3;j++){const id='light.r'+i+'_'+j;s2[id]={state:'unavailable',attributes:{}};e2[id]={device_id:'dv'+i+j};d2['dv'+i+j]={name:'L'+i+j,area_id:'a'+i}}}
 c=card({summary:true});c.hass=hass({states:s2,entities:e2,devices:d2,areas:ar});await wait(30);
 ok('"other areas" counts areas, not devices',/\+2 other areas/.test(txt(c)));
 // options validation
 const bad=[[{},'homeray-issues-card',{battery:101}],[{},'homeray-issues-card',{rows:0}],[{},'homeray-gauge-card',{entity:'sensor.x',min:5,max:5}],[{},'homeray-gauge-card',{entity:'sensor.x',decimals:-1}],[{},'homeray-gauge-card',{}]];
 for(const [,t,cfg] of bad){let thrown=false;try{document.createElement(t).setConfig(cfg)}catch(e){thrown=true}ok(t+' rejects '+JSON.stringify(cfg),thrown)}
 // gauge
 const g=document.createElement('homeray-gauge-card');g.setConfig({entity:'sensor.t',unit:'°C'});document.body.appendChild(g);
 g.hass=hass({states:{'sensor.t':{state:'12abc',attributes:{}}}});ok('gauge ignores "12abc"',g.shadowRoot.querySelector('.v').textContent==='—');
 g.hass=hass({states:{'sensor.t':{state:'42.5',attributes:{}}}});ok('gauge aria label has unit',/°C/.test(g.shadowRoot.querySelector('ha-card').getAttribute('aria-label')));
 let opened=0;g.addEventListener('hass-more-info',()=>opened++);g.shadowRoot.querySelector('ha-card').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));ok('gauge opens with Enter',opened===1);
 // Italian
 c=card({summary:true});c.hass=hass({language:'it',callWS:()=>Promise.reject(1)});await wait(30);ok('Italian texts',/Verifica incompleta/.test(txt(c)));
 return R});
let fail=0;for(const [n,o] of res){console.log((o?'ok   ':'FAIL ')+n);if(!o)fail++}
if(errs.length){console.log('page errors:',errs);fail++}
console.log(res.length+' tests, '+fail+' failed');await b.close();process.exit(fail?1:0)})();
