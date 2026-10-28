/*!
 * Homeray v1.0.2 - an X-ray of your home in Home Assistant
 * homeray-issues-card (issues dashboard) and homeray-gauge-card (ring gauge)
 * https://github.com/DarkBeccio/homeray-cards - MIT License - (c) 2026 DarkBeccio
 * Want the home network map? Homeray Pro: https://homeray.app
 */
(()=>{
const OK='#2e9d48',WARN='#f29d0b',BAD='#d93025',MUTE='#9aa0a6';
/* icon and counter tints: [light theme, dark theme] */
const TONE={ok:['#2E7D4F','#7FD49B'],warn:['#94690A','#F2C55C'],bad:['#B3352C','#F2918A']};
const SOLID={ok:'#2E7D4F',warn:'#A9641C',bad:'#C24A30'};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pretty=d=>String(d).replace(/_/g,' ').replace(/^./,m=>m.toUpperCase());

/* ---------- languages: English by default, Italian when Home Assistant is set to Italian ---------- */
const pl=(n,a,b)=>n===1?a:b;
const I18N={
 en:{device:'Device',na:'not available',noRoom:'No area',otherRooms:n=>pl(n,' other area',' other areas'),less:'Show less',all:n=>'Show all ('+n+')',
  why:{setup_error:'setup failed',setup_retry:'unreachable, retrying',setup_in_progress:'unreachable, retrying',not_loaded:'not loaded',failed_unload:'stuck',migration_error:'migration error'},
  stDev:n=>pl(n,'device not responding','devices not responding'),stInt:n=>pl(n,'integration stopped','integrations stopped'),stUpd:n=>pl(n,'update pending','updates pending'),stBat:n=>pl(n,'low battery','low batteries'),
  pDev:'Devices not responding',pInt:'Stopped integrations',pUpd:'Pending updates',pBat:x=>'Low batteries',
  eDev:'All devices are responding',iLoad:'Checking integrations…',iErr:'Could not read the integrations',iStale:'Last check failed: showing the previous result',partial:'Check incomplete',iSub:' Integrations could not be checked.',staleSub:m=>'The last integration check failed; the result shown is from '+(m<1?'less than a minute':m+pl(m,' minute',' minutes'))+' ago.',low:'low',eInt:'All integrations are running',eUpd:'No pending updates',eBat:'No low batteries',
  title:t=>t?t+pl(t,' thing to check',' things to check'):'All good',
  sub:d=>{const p=[];if(d.dev.length)p.push(d.dev.length+pl(d.dev.length,' device is not responding',' devices are not responding'));if(d.integ.length)p.push(d.integ.length+pl(d.integ.length,' integration is stopped',' integrations are stopped'));if(d.upd.length)p.push(d.upd.length+pl(d.upd.length,' update pending',' updates pending'));if(d.bat.length)p.push(d.bat.length+pl(d.bat.length,' low battery',' low batteries'));
   if(!p.length)return'Devices, integrations, updates and batteries are all fine.';const ok=[];if(!d.upd.length)ok.push('updates');if(!d.bat.length)ok.push('batteries');
   return p.join(', ')+'.'+(ok.length?' '+ok.join(' and ').replace(/^./,m=>m.toUpperCase())+(ok.length>1?' are fine.':' are fine.'):'')}},
 it:{device:'Dispositivo',na:'non disponibile',noRoom:'Senza stanza',otherRooms:n=>pl(n,' altra stanza',' altre stanze'),less:'Mostra meno',all:n=>'Mostra tutti ('+n+')',
  why:{setup_error:'configurazione non riuscita',setup_retry:'non raggiungibile, riprova da sola',setup_in_progress:'non raggiungibile, riprova da sola',not_loaded:'non caricata',failed_unload:'bloccata',migration_error:'errore di aggiornamento'},
  stDev:n=>pl(n,'dispositivo non risponde','dispositivi non rispondono'),stInt:n=>pl(n,'integrazione ferma','integrazioni ferme'),stUpd:n=>pl(n,'aggiornamento in attesa','aggiornamenti in attesa'),stBat:n=>pl(n,'batteria scarica','batterie scariche'),
  pDev:'Dispositivi che non rispondono',pInt:'Integrazioni ferme',pUpd:'Aggiornamenti in attesa',pBat:x=>'Batterie scariche',
  eDev:'Tutti i dispositivi rispondono',iLoad:'Verifica delle integrazioni in corso…',iErr:'Stato delle integrazioni non disponibile',iStale:'Ultima verifica non riuscita: risultato precedente',partial:'Verifica incompleta',iSub:' Non è stato possibile verificare le integrazioni.',staleSub:m=>'L\'ultima verifica delle integrazioni non è riuscita; il risultato mostrato è di '+(m<1?'meno di un minuto':m+pl(m,' minuto',' minuti'))+' fa.',low:'scarica',eInt:'Tutte le integrazioni sono attive',eUpd:'Nessun aggiornamento in attesa',eBat:'Nessuna batteria scarica',
  title:t=>t?t+pl(t,' cosa da controllare',' cose da controllare'):'Tutto a posto',
  sub:d=>{const p=[];if(d.dev.length)p.push(d.dev.length+pl(d.dev.length,' dispositivo non risponde',' dispositivi non rispondono'));if(d.integ.length)p.push(d.integ.length===1?"un'integrazione è ferma":d.integ.length+' integrazioni sono ferme');if(d.upd.length)p.push(d.upd.length+pl(d.upd.length,' aggiornamento in attesa',' aggiornamenti in attesa'));if(d.bat.length)p.push(d.bat.length+pl(d.bat.length,' batteria scarica',' batterie scariche'));
   if(!p.length)return'Dispositivi, integrazioni, aggiornamenti e batterie sono a posto.';const ok=[];if(!d.upd.length)ok.push('aggiornamenti');if(!d.bat.length)ok.push('batterie');
   return p.join(', ')+'.'+(ok.length?' '+ok.join(' e ').replace(/^./,m=>m.toUpperCase())+(ok.length>1?' sono a posto.':' a posto.'):'')}}
};
const langOf=h=>{const l=String((h&&((h.locale&&h.locale.language)||h.language))||'en').slice(0,2).toLowerCase();return I18N[l]?l:'en'};

const go=p=>{history.pushState(null,'',p);window.dispatchEvent(new CustomEvent('location-changed',{detail:{replace:false}}))};

/* ---------- ring gauge ---------- */
const ACSS=`
:host{display:block;height:100%}
ha-card:focus-visible{outline:3px solid var(--primary-color);outline-offset:2px}
ha-card{height:100%;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 8px 12px;cursor:pointer}
svg{width:100%;max-width:138px;height:auto;display:block}
.bg{fill:none;stroke:var(--divider-color,#ddd);stroke-width:9;stroke-linecap:round}
.fg{fill:none;stroke-width:9;stroke-linecap:round;transition:stroke-dasharray .8s ease,stroke .4s ease}
.v{font-size:23px;font-weight:800;fill:var(--primary-text-color)}
.u{font-size:10.5px;font-weight:600;fill:var(--secondary-text-color)}
.n{font-size:.98rem;font-weight:700;text-align:center;color:var(--primary-text-color);margin-top:-8px;line-height:1.2}
`;
const R=42,CIRC=2*Math.PI*R,ARC=CIRC*0.75;
class CasaAnelloCard extends HTMLElement{
  setConfig(c){
    if(!c||!c.entity)throw new Error('homeray-gauge-card: "entity" is required');
    const num=(k,d)=>{if(c[k]==null||c[k]==='')return d;const n=Number(c[k]);if(!Number.isFinite(n))throw new Error('homeray-gauge-card: "'+k+'" must be a number');return n};
    const min=num('min',0),max=num('max',100);
    if(!(max>min))throw new Error('homeray-gauge-card: "max" must be greater than "min"');
    const dec=num('decimals',null);
    if(dec!=null&&!(Number.isInteger(dec)&&dec>=0&&dec<=6))throw new Error('homeray-gauge-card: "decimals" must be a whole number from 0 to 6');
    this._c=Object.assign({},c,{min,max,warn:num('warn',null),bad:num('bad',null),decimals:dec});
    if(!this.shadowRoot)this.attachShadow({mode:'open'});
    this.shadowRoot.innerHTML='<style>'+ACSS+'</style><ha-card role="button" tabindex="0"><svg viewBox="0 0 100 92" aria-hidden="true"><circle class="bg" cx="50" cy="50" r="'+R+'" stroke-dasharray="'+ARC+' '+CIRC+'" transform="rotate(135 50 50)"/><circle class="fg" cx="50" cy="50" r="'+R+'" stroke="'+MUTE+'" stroke-dasharray="0 '+CIRC+'" transform="rotate(135 50 50)"/><text class="v" x="50" y="56" text-anchor="middle"></text><text class="u" x="50" y="72" text-anchor="middle"></text></svg><div class="n"></div></ha-card>';
    const card=this.shadowRoot.querySelector('ha-card'),open=()=>this.dispatchEvent(new CustomEvent('hass-more-info',{bubbles:true,composed:true,detail:{entityId:this._c.entity}}));
    card.addEventListener('click',open);
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});
    this._upd();
  }
  set hass(h){this._h=h;this._upd()}
  getCardSize(){return 3}
  getGridOptions(){return{columns:3,rows:3,min_columns:3,min_rows:2}}
  _upd(){
    const c=this._c,sr=this.shadowRoot;if(!c||!sr)return;
    const L=langOf(this._h),T=I18N[L];
    const st=this._h&&this._h.states[c.entity];
    const raw=st?String(st.state).trim():'',v=raw===''?NaN:Number(raw),ok=Number.isFinite(v);
    const min=c.min,max=c.max;
    const f=ok?Math.max(0,Math.min(1,(v-min)/(max-min))):0;
    /* invert: high values are good (e.g. days left): red below "bad", orange below "warn" */
    const k=!ok?MUTE:(c.invert?(c.bad!=null&&v<=c.bad?BAD:(c.warn!=null&&v<=c.warn?WARN:OK)):(c.bad!=null&&v>=c.bad?BAD:(c.warn!=null&&v>=c.warn?WARN:OK)));
    const fg=sr.querySelector('.fg');
    fg.setAttribute('stroke',k);fg.setAttribute('stroke-dasharray',(ARC*f)+' '+CIRC);
    const dec=c.decimals!=null?c.decimals:(ok&&Math.abs(v)<10?1:0);
    sr.querySelector('.v').textContent=ok?v.toLocaleString(L,{maximumFractionDigits:dec,minimumFractionDigits:0}):'—';
    sr.querySelector('.u').textContent=c.unit!=null?c.unit:(st&&st.attributes.unit_of_measurement||'');
    const name=c.name||(st&&st.attributes.friendly_name)||c.entity,unit=sr.querySelector('.u').textContent;
    sr.querySelector('.n').textContent=name;
    sr.querySelector('ha-card').setAttribute('aria-label',name+': '+(ok?sr.querySelector('.v').textContent+(unit?' '+unit:''):T.na));
  }
}
if(!customElements.get('homeray-gauge-card'))customElements.define('homeray-gauge-card',CasaAnelloCard);

/* ---------- issues dashboard ---------- */
const PCSS=`
:host{display:block;container-type:inline-size}
.gl{background:var(--g);border:1px solid var(--bd);-webkit-backdrop-filter:var(--ha-card-backdrop-filter,none);backdrop-filter:var(--ha-card-backdrop-filter,none);box-shadow:var(--frosted-glass-card-depth-shadow,0 2px 8px rgba(0,0,0,.14))}
.hero{display:flex;gap:22px;align-items:center;flex-wrap:wrap;border-radius:24px;padding:22px 24px;margin-bottom:14px;color:var(--primary-text-color)}
.hero.bad{background:var(--hb);border:1px solid var(--hbd)}
.hero.good{background:var(--gb);border:1px solid var(--gbd)}
.dial{flex:none;position:relative;width:92px;height:92px}
.dial svg{width:92px;height:92px;transform:rotate(-90deg)}
.dial .vv{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:800}
.hero .ht{flex:1 1 260px;min-width:0}
.hero .bg{font-size:2.1rem;font-weight:800;line-height:1.08;letter-spacing:-.02em}
.hero .hs{color:var(--secondary-text-color);font-size:1rem;margin:6px 0 10px}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{display:inline-flex;align-items:center;gap:6px;min-height:32px;padding:0 12px;border-radius:999px;background:var(--cb);border:1px solid var(--bd);font-size:.9rem;color:var(--secondary-text-color)}
.chip b{color:var(--primary-text-color)}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}
.st{border-radius:18px;padding:14px 12px;color:var(--primary-text-color);display:flex;align-items:center;gap:12px;min-width:0}
.st .ic{flex:none;width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.st ha-icon{--mdc-icon-size:26px;display:flex}
.st .tx{min-width:0}
.st .num{font-size:2.5rem;font-weight:800;line-height:1}
.st .lab{font-size:.95rem;font-weight:700;line-height:1.2;margin-top:4px;overflow-wrap:anywhere}
.st.alert{border-width:2px}
.cols{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;align-items:start}
.stack{display:grid;gap:14px}
.p{border-radius:16px;overflow:hidden}
.ph{display:flex;align-items:center;gap:10px;padding:13px 16px;font-size:1.1rem;font-weight:700;color:var(--primary-text-color);border-bottom:1px solid var(--divider-color,#ddd)}
.ph ha-icon{--mdc-icon-size:22px;color:var(--secondary-text-color)}
.ph .c{margin-left:auto;min-width:26px;text-align:center;padding:2px 9px;border-radius:999px;font-size:.95rem;font-weight:800;color:#fff}
.r{display:flex;align-items:center;gap:12px;padding:9px 16px;cursor:pointer;color:var(--primary-text-color)}
.r:hover{background:rgba(127,127,127,.09)}
.r:focus-visible{outline:3px solid var(--primary-color);outline-offset:-3px}
.r .d{width:34px;height:34px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center}
.r .d ha-icon{--mdc-icon-size:20px;display:flex}
.r .nm{font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.r .sb{margin-left:auto;padding-left:10px;font-size:.92rem;color:var(--secondary-text-color);text-align:right;flex:none;max-width:55%}
.note{padding:8px 16px;font-size:.88rem;color:var(--secondary-text-color);background:rgba(127,127,127,.08)}
.ok{display:flex;align-items:center;gap:10px;padding:14px 16px;color:var(--secondary-text-color);font-weight:600}
.more{all:unset;display:block;box-sizing:border-box;width:100%;padding:10px 16px;text-align:center;font-weight:700;color:var(--primary-color);cursor:pointer;border-top:1px solid var(--divider-color,#ddd)}
.more:hover{background:rgba(127,127,127,.09)}
.more:focus-visible{outline:3px solid var(--primary-color);outline-offset:-3px}
@container (max-width:900px){.stats{grid-template-columns:repeat(2,1fr)}.cols{grid-template-columns:1fr}}
@container (max-width:520px){.hero{padding:18px}.hero .bg{font-size:1.6rem}.dial,.dial svg{width:76px;height:76px}.st .num{font-size:2rem}.st .ic{width:40px;height:40px}}
`;
class CasaProblemiCard extends HTMLElement{
  setConfig(c){
    c=c||{};
    const bat=c.battery==null||c.battery===''?20:Number(c.battery);
    if(!Number.isFinite(bat)||bat<0||bat>100)throw new Error('homeray-issues-card: "battery" must be a number from 0 to 100');
    const rows=c.rows==null||c.rows===''?7:Number(c.rows);
    if(!Number.isInteger(rows)||rows<1)throw new Error('homeray-issues-card: "rows" must be a whole number of 1 or more');
    this._c=c;this._bat=bat;this._rows=rows;this._open={};this._sig=null;
    /* integration results survive config edits: null = not loaded yet */
    if(this._entries===undefined){this._entries=null;this._entErr=false}
    if(!this.shadowRoot){
      this.attachShadow({mode:'open'});
      this.shadowRoot.addEventListener('click',e=>this._act(e.target));
      this.shadowRoot.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest&&e.target.closest('.r')){e.preventDefault();this._act(e.target)}});
    }
    if(this._h)this._draw();
  }
  connectedCallback(){clearInterval(this._iv);this._iv=setInterval(()=>this._tick(),60000);this._tick()}
  disconnectedCallback(){clearInterval(this._iv);this._iv=null;clearTimeout(this._tm);this._tm=null;this._seq=(this._seq||0)+1}
  set hass(h){const first=!this._h;this._h=h;if(first)this._tick();if(!this._tm)this._tm=setTimeout(()=>{this._tm=null;this._draw()},first?0:2000)}
  getCardSize(){return 10}
  getGridOptions(){return{columns:'full',rows:'auto'}}
  async _tick(){
    if(!this._h)return;
    /* only the newest request may update the card: an older answer arriving late is ignored */
    const seq=this._seq=(this._seq||0)+1;
    let r,ok=true;try{r=await this._h.callWS({type:'config_entries/get'})}catch(e){ok=false}
    if(seq!==this._seq)return;
    if(ok){this._entries=Array.isArray(r)?r:[];this._entErr=false;this._entAt=Date.now()}else this._entErr=true;
    if(this.isConnected)this._draw();
  }
  _act(el){
    if(!el||!el.closest)return;
    const m=el.closest('[data-more]');
    if(m){const k=m.getAttribute('data-more');this._open[k]=!this._open[k];this._draw();return}
    const r=el.closest('.r');if(!r)return;
    const ent=r.getAttribute('data-ent'),nav=r.getAttribute('data-nav');
    if(ent)this.dispatchEvent(new CustomEvent('hass-more-info',{bubbles:true,composed:true,detail:{entityId:ent}}));else if(nav)go(nav);
  }
  _data(){
    const T=this._t,h=this._h,lab=this._c.exclude_label||'fuori_monitoraggio',lim=this._bat;
    const ents=h.entities||{},devs=h.devices||{},skip=new Set();
    for(const d in devs)if((devs[d].labels||[]).includes(lab))skip.add(d);
    const byDev={};
    for(const id in (h.entities||{})){const e=h.entities[id];if(e.device_id)(byDev[e.device_id]=byDev[e.device_id]||[]).push(id)}
    const dev=[];
    for(const d in byDev){
      const dv=(h.devices||{})[d];if(!dv||dv.disabled_by)continue;
      if(skip.has(d))continue;
      let un=0,alive=0,dom='';
      for(const id of byDev[d]){const s=h.states[id];if(!s)continue;if(s.state==='unavailable'){un++;if(!dom||id.startsWith('light.')||id.startsWith('camera.'))dom=id.split('.')[0]}else if(s.state!=='unknown')alive++}
      if(un>0&&alive===0){
        const ar=dv.area_id&&h.areas&&h.areas[dv.area_id]?h.areas[dv.area_id].name:'';
        dev.push({nav:'/config/devices/device/'+d,name:dv.name_by_user||dv.name||T.device,sub:ar,icon:dom==='light'?'mdi:lightbulb-off-outline':(dom==='camera'?'mdi:cctv-off':'mdi:lan-disconnect')});
      }
    }
    dev.sort((a,b)=>(a.sub||'~').localeCompare(b.sub||'~')||a.name.localeCompare(b.name,this._lc,{numeric:true}));
    const ist=this._entries===null?(this._entErr?'err':'load'):(this._entErr?'stale':'ok');
    const age=ist==='stale'&&this._entAt?Math.floor((Date.now()-this._entAt)/60000):0;
    const integ=(this._entries||[]).filter(e=>e.state!=='loaded'&&!e.disabled_by&&e.source!=='ignore').map(e=>({nav:'/config/integrations/integration/'+e.domain,name:pretty(e.domain)+(e.title&&e.title.indexOf('@')<0&&e.title.toLowerCase()!==e.domain?' · '+e.title:''),sub:T.why[e.state]||e.state,icon:'mdi:puzzle-remove'}));
    const upd=[],bat=[],low=[],batDev=new Set();
    for(const id in h.states){
      const s=h.states[id],dv=ents[id]&&ents[id].device_id;
      if(dv&&skip.has(dv))continue;
      if(id.startsWith('update.')){if(s.state==='on')upd.push({ent:id,name:s.attributes.friendly_name||id,sub:(s.attributes.installed_version||'?')+' → '+(s.attributes.latest_version||'?'),icon:'mdi:package-up'})}
      else if(id.startsWith('sensor.')&&s.attributes.device_class==='battery'){const v=String(s.state).trim()===''?NaN:Number(s.state);if(Number.isFinite(v)&&v<lim){bat.push({ent:id,name:s.attributes.friendly_name||id,sub:Math.round(v)+'%',icon:'mdi:battery-alert-variant-outline'});if(dv)batDev.add(dv)}}
      /* binary battery sensors: "on" means low */
      else if(id.startsWith('binary_sensor.')&&s.attributes.device_class==='battery'&&s.state==='on')low.push({ent:id,dv,name:s.attributes.friendly_name||id,sub:T.low,icon:'mdi:battery-alert-variant-outline'});
    }
    /* a device already listed with its percentage is not counted twice */
    for(const x of low)if(!x.dv||!batDev.has(x.dv)){bat.push({ent:x.ent,name:x.name,sub:x.sub,icon:x.icon});if(x.dv)batDev.add(x.dv)}
    return{dev,integ,upd,bat,ist,age};
  }
  /* summary tile: neutral glass; colour lives in the icon circle, solid when there is something to look at */
  _stat(n,lab,icon,level){
    if(n==null){const t=MUTE;return'<div class="st gl"><span class="ic" style="background:'+t+'33;color:'+t+'"><ha-icon icon="mdi:help-circle-outline"></ha-icon></span><div class="tx"><div class="num">–</div><div class="lab">'+lab+'</div></div></div>'}
    const lv=n===0?'ok':level,t=TONE[lv][this._k];
    const chip=n===0?'background:'+t+(this._k?'33':'24')+';color:'+t:'background:'+SOLID[lv]+';color:#fff';
    return'<div class="st gl'+(n===0?'':' alert')+'"'+(n===0?'':' style="border-color:'+t+'"')+'><span class="ic" style="'+chip+'"><ha-icon icon="'+(n===0?'mdi:check-circle-outline':icon)+'"></ha-icon></span><div class="tx"><div class="num">'+n+'</div><div class="lab">'+lab+'</div></div></div>';
  }
  /* top summary (riepilogo): how many things to check, red/green ring and count per area */
  _hero(d){
    const bad=d.dev.length+d.integ.length,warn=d.upd.length+d.bat.length,tot=bad+warn;
    const all=Math.max(tot,1),pb=tot?Math.round(bad/all*100):0,pw=tot?Math.round(warn/all*100):0;
    const ring='<div class="dial"><svg viewBox="0 0 96 96" aria-hidden="true"><circle cx="48" cy="48" r="40" fill="none" stroke="var(--divider-color,#2a2a2a)" stroke-width="9"/>'+(tot?'<circle cx="48" cy="48" r="40" fill="none" stroke="#FF6B7A" stroke-width="9" stroke-linecap="round" pathLength="100" stroke-dasharray="'+Math.max(pb-2,0)+' 100"/>'+(pw?'<circle cx="48" cy="48" r="40" fill="none" stroke="#FFB547" stroke-width="9" stroke-linecap="round" pathLength="100" stroke-dasharray="'+Math.max(pw-2,0)+' 100" stroke-dashoffset="-'+pb+'"/>':''):'<circle cx="48" cy="48" r="40" fill="none" stroke="#3EE08F" stroke-width="9" pathLength="100" stroke-dasharray="100 100"/>')+'</svg><div class="vv">'+(tot||'✓')+'</div></div>';
    const T=this._t,part=d.ist!=='ok',sub=d.ist==='stale'?(tot?T.sub(d)+' ':'')+T.staleSub(d.age):(part?(tot?T.sub(d)+T.iSub:(d.ist==='load'?T.iLoad:T.iErr)):T.sub(d));
    if(part&&!tot)return'<div class="hero">'+ring.replace('#3EE08F',MUTE).replace('✓','?')+'<div class="ht"><div class="bg">'+esc(T.partial)+'</div><div class="hs">'+esc(sub)+'</div></div></div>';
    const by={};for(const x of d.dev){const k=x.sub||T.noRoom;by[k]=(by[k]||0)+1}
    const keys=Object.keys(by).sort((a,b)=>by[b]-by[a]),top=keys.slice(0,3),rest=keys.length-top.length;
    let chips='';for(const k of top)chips+='<span class="chip"><b>'+by[k]+'</b> '+esc(k)+'</span>';
    if(rest)chips+='<span class="chip"><b>+'+rest+'</b>'+esc(T.otherRooms(rest))+'</span>';
    return'<div class="hero '+(tot?'bad':'good')+'">'+ring+'<div class="ht"><div class="bg">'+esc(T.title(tot))+'</div><div class="hs">'+esc(sub)+'</div>'+(chips?'<div class="chips">'+chips+'</div>':'')+'</div></div>';
  }
  _panel(key,title,icon,items,level,empty,note,unknown){
    const open=!!this._open[key],max=this._rows,show=open?items:items.slice(0,max),t=TONE[level][this._k];
    let rows='';
    for(const it of show)rows+='<div class="r" role="button" tabindex="0" data-nav="'+esc(it.nav||'')+'" data-ent="'+esc(it.ent||'')+'"><span class="d" style="background:'+t+(this._k?'33':'24')+';color:'+t+'"><ha-icon icon="'+it.icon+'"></ha-icon></span><span class="nm">'+esc(it.name)+'</span><span class="sb">'+esc(it.sub||'')+'</span></div>';
    if(!items.length)rows=unknown?'<div class="ok"><ha-icon icon="mdi:help-circle-outline" style="color:'+MUTE+'"></ha-icon>'+esc(empty)+'</div>':'<div class="ok"><ha-icon icon="mdi:check-circle" style="color:'+TONE.ok[this._k]+'"></ha-icon>'+empty+'</div>';
    if(note)rows='<div class="note">'+esc(note)+'</div>'+rows;
    const more=items.length>max?'<button class="more" type="button" data-more="'+key+'">'+(open?this._t.less:this._t.all(items.length))+'</button>':'';
    return'<div class="p gl"><div class="ph"><ha-icon icon="'+icon+'"></ha-icon>'+title+'<span class="c" style="background:'+(unknown?MUTE:(items.length?SOLID[level]:SOLID.ok))+'">'+(unknown?'–':items.length)+'</span></div>'+rows+more+'</div>';
  }
  _draw(){
    if(!this._h||!this.shadowRoot)return;
    const L=langOf(this._h);this._lc=L;const T=this._t=I18N[L];
    const flat=!!this._c.dark;
    const dk=flat||!!(this._h.themes&&this._h.themes.darkMode);this._k=dk?1:0;
    const d=this._data();
    const sig=JSON.stringify([d,this._open,dk,flat,!!(this._c.summary||this._c.riepilogo),L]);
    if(sig===this._sig)return;this._sig=sig;
    const v=flat?{'--g':'var(--ha-card-background,#111A2C)','--bd':'var(--ha-card-border-color,#1F2A40)','--cb':'rgba(255,255,255,.04)','--hb':'#161526','--hbd':'#3A2236','--gb':'#0F1F1B','--gbd':'#1D3B31'}:{'--g':dk?'rgba(255,255,255,.07)':'rgba(255,255,255,.46)','--bd':dk?'rgba(234,235,238,.22)':'rgba(255,255,255,.6)','--cb':dk?'rgba(255,255,255,.06)':'rgba(255,255,255,.5)','--hb':dk?'rgba(255,107,122,.08)':'rgba(255,255,255,.5)','--hbd':dk?'rgba(255,107,122,.3)':'rgba(194,74,48,.35)','--gb':dk?'rgba(62,224,143,.08)':'rgba(255,255,255,.5)','--gbd':dk?'rgba(62,224,143,.3)':'rgba(46,125,79,.35)'};
    for(const k in v)this.style.setProperty(k,v[k]);
    const stats=this._stat(d.dev.length,T.stDev(d.dev.length),'mdi:lan-disconnect','bad')+this._stat(d.ist==='load'||d.ist==='err'?null:d.integ.length,T.stInt(d.ist==='load'||d.ist==='err'?2:d.integ.length),'mdi:puzzle-remove','bad')+this._stat(d.upd.length,T.stUpd(d.upd.length),'mdi:package-up','warn')+this._stat(d.bat.length,T.stBat(d.bat.length),'mdi:battery-alert-variant-outline','warn');
    const cols=this._panel('dev',T.pDev,'mdi:lan-disconnect',d.dev,'bad',T.eDev)+'<div class="stack">'+this._panel('integ',T.pInt,'mdi:puzzle-remove',d.integ,'bad',d.ist==='load'?T.iLoad:(d.ist==='err'?T.iErr:T.eInt),d.ist==='stale'?T.iStale:'',d.ist==='load'||d.ist==='err')+this._panel('upd',T.pUpd,'mdi:package-up',d.upd,'warn',T.eUpd)+this._panel('bat',T.pBat(this._bat),'mdi:battery-alert-variant-outline',d.bat,'warn',T.eBat)+'</div>';
    this.shadowRoot.innerHTML='<style>'+PCSS+'</style>'+((this._c.summary||this._c.riepilogo)?this._hero(d):'')+'<div class="stats">'+stats+'</div><div class="cols">'+cols+'</div>';
  }
}
if(!customElements.get('homeray-issues-card'))customElements.define('homeray-issues-card',CasaProblemiCard);
window.customCards=window.customCards||[];
window.customCards.push({type:'homeray-issues-card',name:'Homeray Issues Card',description:'Issues dashboard: devices, integrations, updates, batteries'},{type:'homeray-gauge-card',name:'Homeray Gauge Card',description:'Ring gauge with colour thresholds'});

})();
console.info("%c HOMERAY %c 1.0.2 ","background:#3DD9F5;color:#0A0F1C;font-weight:700","background:#111A2C;color:#E8EEF8");
