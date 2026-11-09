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
 let res=[];c=card({});c._h=hass({callWS:m=>m.type==='homeray/status'?Promise.reject(1):new Promise(r=>res.push(r))});const a=c._tick(),bb=c._tick();
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
 // 1.1.0: duration, grace, standby, duplicates, ignore/restore, chips
 const T0=Date.now(),iso=m=>new Date(T0-m*60000).toISOString();
 const s3={'light.old':{state:'unavailable',last_changed:iso(3*1440),attributes:{}},'light.new':{state:'unavailable',last_changed:iso(2),attributes:{}},
  'media_player.tv':{state:'unavailable',last_changed:iso(60),attributes:{}},'remote.tv':{state:'unavailable',last_changed:iso(60),attributes:{}},
  'light.a':{state:'unavailable',last_changed:iso(30),attributes:{}},'light.b':{state:'unavailable',last_changed:iso(40),attributes:{}},'light.ig':{state:'unavailable',last_changed:iso(40),attributes:{}}};
 const e3={'light.old':{device_id:'old'},'light.new':{device_id:'new'},'media_player.tv':{device_id:'tv'},'remote.tv':{device_id:'tv'},'light.a':{device_id:'a'},'light.b':{device_id:'b'},'light.ig':{device_id:'ig'}};
 const d3={old:{name:'Porch',area_id:'g'},new:{name:'Hall'},tv:{name:'TV'},a:{name:'Lamp',model:'X1'},b:{name:'Lamp',model:'X1'},ig:{name:'Ignored lamp',labels:['fuori_monitoraggio']}};
 const calls=[];const ws=async m=>{calls.push(m);if(m.type==='config/label_registry/list')return[];return m.type==='config_entries/get'?[{entry_id:'e1',domain:'reolink',state:'setup_retry',title:'Cam'}]:{}};
 c=card({summary:true});c.hass=hass({states:s3,entities:e3,devices:d3,areas:{g:{name:'Garden'}},callWS:ws,user:{is_admin:true}});await wait(30);
 let dd=c._data();
 ok('duration shown in days',/Garden · for 3 days/.test(txt(c)));
 ok('grace hides a device down for 2 minutes',!dd.dev.some(x=>x.name==='Hall'));
 c.setConfig({summary:true,grace:0});dd=c._data();ok('grace: 0 shows it',dd.dev.some(x=>x.name==='Hall'));
 ok('media player goes to standby, not to the red list',dd.stb.length===1&&!dd.dev.some(x=>x.name==='TV')&&/1 in standby/.test(txt(c)));
 ok('oldest outage first',dd.dev[0].name==='Porch');
 ok('hero names the longest outage',/Longest: Porch \(Garden\), not responding for 3 days/.test(txt(c)));
 ok('same names get model and number',dd.dev.filter(x=>/^Lamp · X1 #[12]$/.test(x.name)).length===2);
 ok('no area is written out',/No area/.test(txt(c)));
 ok('integration chip in hero',/1 integration/.test(txt(c)));
 ok('ignored panel lists labelled devices',dd.ign.length===1&&/Ignored \(1\)/.test(txt(c)));
 c.hass=hass({states:s3,entities:e3,devices:Object.assign({grp:{name:'Group',labels:['fuori_monitoraggio']}},d3),areas:{g:{name:'Garden'}},callWS:ws,user:{is_admin:true}});c._sig=null;c._draw();ok('labelled device without entities is listed',c._data().ign.length===2);c.hass=hass({states:s3,entities:e3,devices:d3,areas:{g:{name:'Garden'}},callWS:ws,user:{is_admin:true}});c._sig=null;c._draw();
 c.setConfig({summary:true,standby_domains:[]});ok('standby_domains: [] keeps TVs in the red list',c._data().dev.some(x=>x.name==='TV'));
 c.setConfig({summary:true});
 const ib=c.shadowRoot.querySelector('.act[data-panel="dev"]');ok('admin sees the ignore button',!!ib);
 ib.click();ok('ignore asks first',!!c.shadowRoot.querySelector('.ask')&&calls.every(m=>m.type!=='config/device_registry/update'));
 c.shadowRoot.querySelector('.ask .yes').click();await wait(30);
 const up=calls.find(m=>m.type==='config/device_registry/update');
 ok('ignore creates the label and sets it',calls.some(m=>m.type==='config/label_registry/create'&&m.name==='fuori_monitoraggio')&&up&&up.device_id==='old'&&up.labels.includes('fuori_monitoraggio'));
 c.shadowRoot.querySelector('[data-more="fign"]').click();const rb=c.shadowRoot.querySelector('.act[data-panel="ign"]');rb.click();c.shadowRoot.querySelector('.ask .yes').click();await wait(30);
 const up2=calls.filter(m=>m.type==='config/device_registry/update').pop();ok('restore removes the label',up2.device_id==='ig'&&!up2.labels.includes('fuori_monitoraggio'));
 const bad2=card({});bad2.hass=hass({states:s3,entities:e3,devices:d3,callWS:async m=>{if(m.type==='config_entries/get')return[];throw new Error('no')},user:{is_admin:true}});await wait(30);
 bad2.shadowRoot.querySelector('.act[data-panel="dev"]').click();bad2.shadowRoot.querySelector('.ask .yes').click();await wait(30);ok('failed change shows an error',/could not be saved/.test(txt(bad2)));
 c=card({});c.hass=hass({states:s3,entities:e3,devices:d3,user:{is_admin:false}});await wait(30);
 ok('non-admin sees no buttons and no ignored list',!c.shadowRoot.querySelector('.act')&&!/Ignored/.test(txt(c)));
 let thrown=false;try{document.createElement('homeray-issues-card').setConfig({grace:-1})}catch(e){thrown=true}ok('grace -1 rejected',thrown);
 thrown=false;try{document.createElement('homeray-issues-card').setConfig({standby_domains:'media_player'})}catch(e){thrown=true}ok('standby_domains must be a list',thrown);
 c=card({summary:true});c.hass=hass({language:'it',states:s3,entities:e3,devices:d3,areas:{g:{name:'Giardino'}}});await wait(30);
 ok('Italian duration and longest',/Giardino · da 3 giorni/.test(txt(c))&&/Da più tempo: Porch/.test(txt(c)));
 c=card({summary:true});c.hass=hass({language:'it',callWS:async()=>[{entry_id:'x',domain:'reolink',state:'setup_retry',title:'Cam'}]});await wait(30);ok('summary starts with a capital letter',/Un'integrazione è ferma/.test(txt(c)));
 // 1.2.0: Homeray integration
 const T1=Date.now(),hrSt={silent:{ready:true,ready_in_hours:0,hours:24,devices:[{device_id:'dz',name:'Door',model:'Z1',last_reported:new Date(T1-30*3600e3).toISOString(),hours:30},{device_id:'ig',name:'Ign',model:'',last_reported:new Date(T1-30*3600e3).toISOString(),hours:30}]},
  batteries:[{entity_id:'sensor.scale',device_id:'sc',name:'Scale battery',kind:'low',level:null},{entity_id:'sensor.lock',device_id:'lk',name:'Lock battery',kind:'level',level:9},{entity_id:'sensor.th',device_id:'th',name:'Thermo battery',kind:'unavailable',level:null}]};
 const hrWs=async m=>m.type==='homeray/status'?hrSt:[];
 c=card({summary:true});c.hass=hass({states:{'sensor.d_pct':{state:'5',attributes:{device_class:'battery',friendly_name:'Old way'}}},devices:{dz:{name:'Door',area_id:'g'},ig:{name:'Ign',labels:['fuori_monitoraggio']}},areas:{g:{name:'Garden'}},callWS:hrWs});await wait(30);
 dd=c._data();
 ok('integration: silent panel lists the device',dd.sil&&dd.sil.length===1&&/Silent devices/.test(txt(c))&&/Garden · nothing for 30 h/.test(txt(c)));
 ok('integration: excluded device not silent',!dd.sil.some(x=>x.name==='Ign'));
 ok('integration: its batteries replace the old list',dd.bat.length===3&&!dd.bat.some(x=>x.name==='Old way')&&/not reporting/.test(txt(c))&&/9%/.test(txt(c)));
 ok('integration: silent counts in the summary',/4 things to check/.test(txt(c))&&/1 silent/.test(txt(c)));
 const wait1={silent:{ready:false,ready_in_hours:20.2,hours:24,devices:[]},batteries:[]};
 c=card({});c.hass=hass({callWS:async m=>m.type==='homeray/status'?wait1:[]});await wait(30);ok('integration: explains the wait after a restart',/Starts 21 h after a restart/.test(txt(c)));
 let asked=0;c=card({});c.hass=hass({callWS:async m=>{if(m.type==='homeray/status'){asked++;const e=new Error('x');e.code='unknown_command';throw e}return[]}});await wait(30);await c._tick();
 ok('no integration: no silent panel, asked once',!/Silent devices/.test(txt(c))&&asked===1);
 c=card({});c.hass=hass({language:'it',callWS:hrWs,devices:{dz:{name:'Porta'}}});await wait(30);ok('integration: Italian texts',/Dispositivi muti/.test(txt(c))&&/muto da 30 ore/.test(txt(c)));
 return R});
let fail=0;for(const [n,o] of res){console.log((o?'ok   ':'FAIL ')+n);if(!o)fail++}
if(errs.length){console.log('page errors:',errs);fail++}
console.log(res.length+' tests, '+fail+' failed');await b.close();process.exit(fail?1:0)})();
