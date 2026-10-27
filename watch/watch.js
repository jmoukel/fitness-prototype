'use strict';
/* Lift for Apple Watch — clickable prototype. Data model (fake data) shared with the iPhone prototype via ../core.js + localStorage. */
const scr=$('#screen'), stack=[], A={};
const PW=208;
let busyUntil=0, K=1;
const bgs=u=>`style="background-image:url('${u}')"`;
const exBgs=e=>`style="background-image:url('${exImg(e)}')${e.photo?';background-size:cover':e.img?';background-color:transparent;background-size:contain':';background-color:#28282a'}"`;
const nowT=()=>{const d=new Date();return (d.getHours()%12||12)+':'+String(d.getMinutes()).padStart(2,'0')};
const tm=()=>`<div class="tm" data-tm>${nowT()}</div>`;
const hd=(title,back=true)=>`<div class="hd">${back?'<div class="bk" data-a="back" aria-label="Back"></div>':''}<div class="ht">${esc(title||'')}</div>${tm()}</div>`;
const topV=()=>stack[stack.length-1];
const allDone=lv=>lv.ex.every(e=>e.sets.every(s=>s.done));
const elapsed=lv=>(lv.pausedAt||Date.now())-lv.start;
const buzz=ms=>{try{navigator.vibrate&&navigator.vibrate(ms||30)}catch(_){}};

/* ---------- view stack ---------- */
function render(V){
  if(!V||!V.el)return;
  const keep={};$$('[data-keep]',V.el).forEach(e=>keep[e.dataset.keep]=e.scrollTop);
  V.el.innerHTML=V.render(V);
  $$('[data-keep]',V.el).forEach(e=>{if(keep[e.dataset.keep])e.scrollTop=keep[e.dataset.keep]});
  V.after&&V.after(V);
}
function push(V,anim=true){
  const prev=topV(), el=document.createElement('div');
  el.className='sc'+(anim?(V.up?' up':' r'):'');V.el=el;scr.appendChild(el);stack.push(V);render(V);
  if(anim){busyUntil=Date.now()+360;el.offsetWidth;el.classList.remove('r','up');}
  if(prev)prev.el.classList.add('l');
}
function pop(){
  if(stack.length<2)return;const V=stack.pop(),prev=topV();
  busyUntil=Date.now()+360;V.el.classList.add('r');V.el.style.transform='';
  prev.el.classList.remove('l');render(prev);setTimeout(()=>V.el.remove(),360);
}
/* push V and drop everything above index keep-1 underneath it (so there is no "back" into it) */
function pushReplace(V,keep,anim=true){
  push(V,anim);const drop=stack.splice(keep,stack.length-1-keep);
  setTimeout(()=>drop.forEach(d=>d.el.remove()),anim?380:0);
}
function popToRoot(){while(stack.length>2){const d=stack.splice(1,1)[0];d.el.remove()}pop()}
function toastW(html){const t=document.createElement('div');t.className='toastw';t.innerHTML=html;topV().el.appendChild(t);
  setTimeout(()=>{t.style.opacity=0;setTimeout(()=>t.remove(),320)},1600)}

/* ---------- 1. workout list ---------- */
const doneWk=w=>{const d=lastDone(w.id);return !!(d&&isThisWeek(d))};
function listHTML(){
  const p=curPlan(), ws=p.workouts.map(id=>S.workouts[id]).filter(Boolean);
  const todo=ws.filter(w=>!doneWk(w)), done=ws.filter(doneWk);
  const row=w=>{const d=lastDone(w.id),dn=doneWk(w),live=S.live&&S.live.wid===w.id;
    return `<div class="wr ${dn?'dn':''}" data-a="openW" data-id="${w.id}"><div class="wi" ${bgs(iconImg(w.icon))}></div>
    <div class="wt"><div class="wn">${esc(w.name)}</div><div class="wm" ${live?'style="color:var(--acc)"':''}>${live?'In progress':d?ago(d,true):'Not done yet'}</div></div>${dn?'<div class="wc">✓</div>':''}</div>`};
  return `<div class="hd"><div class="ht pl" data-a="plans" role="button" aria-label="Plans"><span>${esc(p.name)}</span><i class="chv"></i></div>${tm()}</div><div class="bd" data-keep="l">${todo.map(row).join('')}${done.map(row).join('')}
  ${ws.length?'':'<div class="cap">No workouts in this plan yet.</div>'}
  </div>`;
}

/* ---------- 1b. plans ---------- */
function plansHTML(){
  const a=curPlan().id;
  return `${hd('Plans')}<div class="bd" data-keep="p">${S.plans.map(p=>`<div class="wr pr2 ${p.id===a?'on':''}" data-a="pickPlan" data-id="${p.id}"><div class="wt"><div class="wn">${esc(p.name)}</div><div class="wm">${p.workouts.length} workout${p.workouts.length===1?'':'s'}</div></div>${p.id===a?'<div class="wc">✓</div>':''}</div>`).join('')}</div>`;
}
A.plans=()=>{if(S.live&&S.workouts[S.live.wid]){toastW('Finish or end your workout to switch plans');return}push({render:plansHTML})};
A.pickPlan=d=>{S.activePlan=d.id;save();pop()};
A.openW=d=>push({render:startHTML,wid:d.id});

/* ---------- 2. workout start ---------- */
function startHTML(V){
  const w=S.workouts[V.wid];if(!w)return hd('')+'<div class="bd"><div class="cap">Workout not found.</div></div>';
  const d=lastDone(w.id), dw=doneWk(w), live=S.live&&S.live.wid===w.id;
  const rows=w.items.map(it=>{const ex=LIB(it.exId),t=target(it);
    const wl=t.wUp&&!t.fresh?`<b>${wLabel(t.w)}</b>`:wLabel(t.w);
    const rp=t.fresh?t.reps.join(' · '):t.wUp?`<b>${t.reps.join(' · ')}</b>`:t.reps.map((r,i)=>t.changed[i]?`<b>${r}</b>`:r).join(' · ');
    return `<div class="tr"><div class="n">${esc(ex.name)}</div><div class="v rd">${wl} × ${rp}</div></div>`}).join('');
  return `${hd('')}<div class="bd" data-keep="s">
    <div class="sh"><div class="shr"><div class="wi" ${bgs(iconImg(w.icon))}></div><div class="nm">${esc(w.name)}</div></div></div>
    ${w.items.length?`<div class="tgh">${dw?"Next Week's Target":'<span class="nw">TARGET</span>'}</div>${rows}`:'<div class="cap">No exercises yet. Add some on iPhone.</div>'}
    <div class="spc"></div></div>
  ${w.items.length?`<div class="botb"><div class="btn" data-a="start">${live?'Resume':'<span style="font-size:14px">▶</span> Start'}</div></div>`:''}`;
}
A.start=(d,V)=>{
  const w=S.workouts[V.wid];
  if(S.live&&S.live.wid===w.id)return openLive();
  if(S.live&&S.workouts[S.live.wid])return push({render:busyHTML,wid:w.id});
  beginLive(w);
};
function beginLive(w){
  S.live={wid:w.id,start:Date.now(),cur:0,rest:null,ex:w.items.map(it=>{const t=target(it),lp=lastPerf(it.exId);
    return {exId:it.exId,last:lp?`${wLabel(lp.sets[0].w)} × ${lp.sets.map(s=>s.r).join(' · ')}`:null,
      sets:t.reps.map((r,i)=>({w:t.w,r,tw:t.w,tr:r,wUp:t.wUp,dr:t.fresh||t.wUp?0:r-t.last[i],done:false}))}})};
  save();buzz(60);openLive();
}
function busyHTML(V){
  const o=S.workouts[S.live.wid];
  return `${hd('')}<div class="cf"><div class="q">Workout in progress</div><div class="s">${esc(o.name)} is still running.</div>
  <div class="btn sm" data-a="resumeOther">Resume It</div><div class="btn sm rd2" data-a="discardStart">Discard & Start</div></div>`;
}
A.resumeOther=()=>openLive();
A.discardStart=(d,V)=>{S.live=null;save();beginLive(S.workouts[V.wid])};
function openLive(anim=true){pushReplace({render:liveHTML,after:liveAfter,page:1,f:null,live:true},1,anim)}

/* ---------- 3. live workout ---------- */
function curSet(lv){const c=lv.ex[lv.cur];const i=c.sets.findIndex(s=>!s.done);return {c,i,s:c.sets[i]}}
function fixCur(lv){const c=lv.ex[lv.cur];if(c&&c.sets.some(s=>!s.done))return;
  const n=lv.ex.length;for(let k=1;k<=n;k++){const j=(lv.cur+k)%n;if(lv.ex[j].sets.some(s=>!s.done)){lv.cur=j;return}}}
function deltaTxt(s,bw){
  const dw=bw?0:s.w-s.tw, dr=s.r-s.tr, parts=[];
  if(dw)parts.push(`${dw>0?'↑':'↓'} ${Math.abs(dw)} lb`);
  if(dr)parts.push(`${dr>0?'↑':'↓'} ${Math.abs(dr)} rep${Math.abs(dr)===1?'':'s'}`);
  if(!parts.length)return {t:'Same as target',c:''};
  return {t:parts.join(', ')+' from target',c:(dw<0||dr<0)?'dn':'up'};
}
function mainPage(V,lv){
  if(allDone(lv)){const tot=lv.ex.reduce((a,e)=>a+e.sets.length,0);
    return `<div class="lvm"><div class="alld"><div class="big">✓</div><div class="t1">All sets done</div><div class="t2">${tot} sets · ${lv.ex.length} exercises</div></div>
    <div class="btn" data-a="finish">Finish</div></div>`}
  const {c,i,s}=curSet(lv), ex=LIB(c.exId), bw=ex.equip==='bodyweight';
  const f=bw?'r':(V.f||'w'); V.f=f;
  const wAcc=s.wUp&&s.w===s.tw&&!bw, rAcc=(s.wUp||s.dr>0)&&s.r===s.tr, dt=deltaTxt(s,bw);
  return `<div class="lvm" id="lvm">
    <div class="exh"><div class="xi" ${exBgs(ex)}></div><div class="t"><div class="exn">${esc(ex.name)}</div><div class="setn">Set <b>${i+1}</b> of ${c.sets.length}</div></div></div>
    <div class="vals" id="vals"><div class="stp" data-a="step" data-d="-1" aria-label="Minus">−</div>
      ${bw?`<div class="vf rd on ${rAcc?'acc':''}" data-a="focus" data-f="r"><b>${s.r}</b><span>REPS</span></div>`:
      `<div class="vf rd ${f==='w'?'on':''} ${wAcc?'acc':''}" data-a="focus" data-f="w"><b>${s.w}</b><span>LB</span></div><div class="vx">×</div>
       <div class="vf rd ${f==='r'?'on':''} ${rAcc?'acc':''}" data-a="focus" data-f="r"><b>${s.r}</b><span>REPS</span></div>`}
      <div class="stp" data-a="step" data-d="1" aria-label="Plus">+</div></div>
    <div class="dl ${dt.c}">${dt.t}</div>
    <div class="btn" data-a="log">✓ Log Set</div></div>`;
}
function ctlPage(V,lv){const w=S.workouts[lv.wid]||{name:'Workout'},pz=!!lv.pausedAt;
  return `<div class="ctl"><div class="cap" style="margin:0 0 4px;font-size:13px;color:#fff;font-weight:600">${esc(w.name)}</div>
  <div class="cap" style="margin:0 0 12px">${pz?'<span style="color:var(--acc)">Paused</span>':'Swipe left to return'}</div>
  <div class="cgrid"><div class="cb" data-a="end"><div class="o end"><div class="xg"></div></div><div class="l">End</div></div>
  <div class="cb" data-a="pause"><div class="o pz">${pz?'<div class="plg"></div>':'<div class="pzg"><i></i><i></i></div>'}</div><div class="l">${pz?'Resume':'Pause'}</div></div></div></div>`}
function exPage(V,lv){
  return `<div class="bd bdp" data-keep="x" style="padding-top:38px">${lv.ex.map((e,i)=>{const x=LIB(e.exId),dn=e.sets.every(s=>s.done),cnt=e.sets.filter(s=>s.done).length;
    return `<div class="xr ${i===lv.cur&&!allDone(lv)?'cur':''} ${dn?'fin':''}" data-a="sw" data-i="${i}"><div class="xi" ${exBgs(x)}></div>
    <div class="wt"><div class="n">${esc(x.name)}</div><div class="m">${dn?'Done':cnt+' of '+e.sets.length+' sets'}</div></div>${dn?'<div class="wc">✓</div>':''}</div>`}).join('')}
    <div style="height:10px"></div></div>`}
function restHTML(lv){
  let nx='';if(!allDone(lv)){const {c,i}=curSet(lv);nx=`Next · <b>${esc(LIB(c.exId).name)}</b> · Set ${i+1}`}
  return `<div class="rest ${lv.rest?'':'hide'}" id="rest"><div class="ring"><svg viewBox="0 0 138 138"><circle cx="69" cy="69" r="62" fill="none" stroke="rgba(255,214,10,.2)" stroke-width="11"/>
  <circle id="rring" cx="69" cy="69" r="62" fill="none" stroke="#ffd60a" stroke-width="11" stroke-linecap="round" stroke-dasharray="389.56" stroke-dashoffset="0"/></svg>
  <div class="c"><div class="l">REST</div><div class="t rd" id="rt">${lv.rest?fmtClock(lv.rest.end-Date.now()+999):'0:00'}</div></div></div>
  <div class="rnext">${nx}</div><div class="btn sm g" data-a="skip">Skip</div></div>`;
}
function liveHTML(V){
  const lv=S.live;if(!lv)return '';
  return `<div class="hd"><div class="el rd ${lv.pausedAt?'pz':''}" data-el>${fmtClock(elapsed(lv))}</div>${tm()}</div>
  <div class="pg" id="pg" style="transform:translateX(${-V.page*PW}px)"><div class="pp">${ctlPage(V,lv)}</div><div class="pp">${mainPage(V,lv)}</div><div class="pp">${exPage(V,lv)}</div></div>
  <div class="dots" id="dots">${[0,1,2].map(i=>`<i class="${i===V.page?'on':''}"></i>`).join('')}</div>${restHTML(lv)}`;
}
function liveAfter(V){tick()}
function setPage(V,p,anim=true){V.page=Math.max(0,Math.min(2,p));const pg=$('#pg',V.el);if(!pg)return;
  pg.classList.toggle('drag',!anim);pg.style.transform=`translateX(${-V.page*PW}px)`;
  $$('#dots i',V.el).forEach((d,i)=>d.classList.toggle('on',i===V.page))}
function stepVal(V,dir){
  const lv=S.live;if(!lv||allDone(lv)||lv.rest)return;const {c,s}=curSet(lv),ex=LIB(c.exId),bw=ex.equip==='bodyweight';
  const f=bw?'r':(V.f||'w');
  if(f==='w'){const st=ex.equip==='machine'?10:5;s.w=Math.max(0,s.w+dir*st)}else s.r=Math.max(1,Math.min(99,s.r+dir));
  save();render(V);buzz(8);
}
A.focus=(d,V)=>{V.f=d.f;render(V)};
A.step=(d,V)=>stepVal(V,+d.d);
A.log=(d,V)=>{
  const lv=S.live,{s}=curSet(lv),w=S.workouts[lv.wid];s.done=true;
  const all=allDone(lv);fixCur(lv);
  lv.rest=!all&&w&&w.rest>0?{end:Date.now()+w.rest*1000,total:w.rest*1000}:null;
  V.f=null;save();buzz(40);render(V);
};
A.skip=(d,V)=>{S.live.rest=null;save();render(V)};
A.sw=(d,V)=>{const lv=S.live;if(lv.ex[+d.i].sets.every(s=>s.done)){toastW('Already done');return}lv.cur=+d.i;V.f=null;save();render(V);setPage(V,1)};
A.pause=(d,V)=>{const lv=S.live;if(lv.pausedAt){lv.start+=Date.now()-lv.pausedAt;delete lv.pausedAt}else lv.pausedAt=Date.now();save();render(V);buzz(30)};
A.end=()=>push({render:endHTML,up:true});
function endHTML(){const lv=S.live;if(!lv)return '';const tot=lv.ex.reduce((a,e)=>a+e.sets.length,0),dn=lv.ex.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0);
  return `${hd('')}<div class="cf"><div class="q">End workout?</div><div class="s">${dn} of ${tot} sets · ${fmtClock(elapsed(lv))}</div>
  ${dn?'<div class="btn sm" data-a="finish">Finish & Save</div>':''}<div class="btn sm rd2" data-a="discard">Discard</div></div>`}
A.discard=()=>{S.live=null;save();rebuild();toastW('Workout discarded')};
A.finish=()=>{
  const lv=S.live;if(!lv)return;if(lv.pausedAt){lv.start+=Date.now()-lv.pausedAt;delete lv.pausedAt}
  const ses={id:uid(),wid:lv.wid,date:Date.now(),dur:Date.now()-lv.start,ex:lv.ex.map(e=>({exId:e.exId,sets:e.sets.filter(s=>s.done).map(s=>({w:s.w,r:s.r}))})).filter(e=>e.sets.length)};
  const bests=[];
  ses.ex.forEach(e=>{const ex=LIB(e.exId),bw=ex.equip==='bodyweight',sc=st=>bw?st.r:st.w*(1+st.r/30);
    let prior=-1;S.sessions.forEach(h=>h.ex.forEach(x=>{if(x.exId===e.exId)x.sets.forEach(st=>prior=Math.max(prior,sc(st)))}));
    if(prior<0)return;let b=null;e.sets.forEach(st=>{if(!b||sc(st)>sc(b))b=st});
    if(b&&sc(b)>prior)bests.push({name:ex.name,w:b.w,r:b.r,bw})});
  S.sessions.unshift(ses);S.live=null;
  const pi=S.plans.findIndex(p=>p.workouts.includes(lv.wid));if(pi>=0)S.activePlan=S.plans[pi].id;
  save();buzz(120);
  pushReplace({render:sumHTML,ses,bests,up:true},1);
};

/* ---------- 4. summary ---------- */
function sumHTML(V){
  const s=V.ses,w=S.workouts[s.wid]||{name:'Workout'},sets=s.ex.reduce((a,e)=>a+e.sets.length,0);
  const vol=s.ex.reduce((a,e)=>a+e.sets.reduce((b,x)=>b+x.w*x.r,0),0),reps=s.ex.reduce((a,e)=>a+e.sets.reduce((b,x)=>b+x.r,0),0);
  return `${hd('Summary',false)}<div class="bd" data-keep="m">
  <div class="sm1"><div class="ok">✓</div><div class="t1">${esc(w.name)}</div><div class="t2">Workout complete</div></div>
  <div class="mt"><div class="l">Duration</div><div class="v rd">${fmtClock(s.dur)}</div></div>
  <div class="mt"><div class="l">Sets</div><div class="v rd">${sets}</div></div>
  ${vol?`<div class="mt"><div class="l">Volume</div><div class="v rd">${vol.toLocaleString('en-US')}<small>lb</small></div></div>`:`<div class="mt"><div class="l">Total Reps</div><div class="v rd">${reps}</div></div>`}
  ${V.bests.length?`<div class="sect">New Bests</div>${V.bests.map(b=>`<div class="pr"><div class="st">★</div><div><div class="n">${esc(b.name)}</div><div class="v rd">${b.bw?b.r+' reps':b.w+' lb × '+b.r}</div></div></div>`).join('')}`:''}
  <div style="height:8px"></div><div class="btn" data-a="done">Done</div><div style="height:12px"></div></div>`;
}
A.done=()=>pop();
A.back=()=>pop();

/* ---------- tick ---------- */
function tick(){
  const t=nowT();$$('[data-tm]',scr).forEach(e=>{if(e.textContent!==t)e.textContent=t});
  const lv=S&&S.live,V=topV();if(!lv||!V||!V.live)return;
  const el=$('[data-el]',V.el);if(el)el.textContent=fmtClock(elapsed(lv));
  const r=$('#rest',V.el);if(!r)return;
  if(lv.rest&&Date.now()>=lv.rest.end){lv.rest=null;save();buzz([80,60,80]);render(V);return}
  if(lv.rest){const left=lv.rest.end-Date.now();$('#rt',V.el).textContent=fmtClock(left+999);
    $('#rring',V.el).setAttribute('stroke-dashoffset',(389.56*(1-left/lv.rest.total)).toFixed(1))}
}
setInterval(tick,250);

/* ---------- input: taps, swipes, crown ---------- */
let G=null, suppress=0;
scr.addEventListener('pointerdown',e=>{
  if(e.button)return;const r=scr.getBoundingClientRect();
  G={x:e.clientX,y:e.clientY,rx:(e.clientX-r.left)/K,id:e.pointerId,tg:e.target,mode:null,used:0,V:topV()};
});
scr.addEventListener('pointermove',e=>{
  if(!G||e.pointerId!==G.id)return;const dx=(e.clientX-G.x)/K,dy=(e.clientY-G.y)/K,V=G.V;
  if(!G.mode&&Math.hypot(dx,dy)>7){
    const ax=Math.abs(dx)>Math.abs(dy);
    if(!ax&&G.tg.closest('#vals')&&!S.live.rest)G.mode='val';
    else if(ax&&V.live&&G.tg.closest('#pg')&&!(S.live&&S.live.rest))G.mode='page';
    else if(ax&&dx>0&&G.rx<26&&stack.length>1&&$('.bk',V.el))G.mode='edge';
    else G.mode='none';
    if(G.mode!=='none'){try{scr.setPointerCapture(G.id)}catch(_){}}
  }
  if(G.mode==='val'){const want=Math.trunc(-dy/16);while(G.used<want){G.used++;stepVal(V,1)}while(G.used>want){G.used--;stepVal(V,-1)}}
  else if(G.mode==='page'){const pg=$('#pg',V.el);let off=-V.page*PW+dx;const mn=-2*PW;if(off>0)off/=3;if(off<mn)off=mn+(off-mn)/3;pg.classList.add('drag');pg.style.transform=`translateX(${off}px)`}
  else if(G.mode==='edge'){V.el.style.transition='none';V.el.style.transform=`translateX(${Math.max(0,dx)}px)`}
});
const endG=e=>{
  if(!G||e.pointerId!==G.id)return;const dx=(e.clientX-G.x)/K,V=G.V,m=G.mode;
  if(m==='page'){setPage(V,V.page+(dx<-36?1:dx>36?-1:0))}
  else if(m==='edge'){V.el.style.transition='';if(dx>70&&e.type==='pointerup')pop();else V.el.style.transform=''}
  if(m&&m!=='none')suppress=Date.now()+300;G=null;
};
scr.addEventListener('pointerup',endG);scr.addEventListener('pointercancel',endG);
scr.addEventListener('click',e=>{
  if(Date.now()<suppress){e.preventDefault();e.stopPropagation();return}
  const t=e.target.closest('[data-a]');if(!t)return;
  if(Date.now()<busyUntil&&!['step','focus'].includes(t.dataset.a))return;
  const V=topV();if(!V.el.contains(t))return;const fn=A[t.dataset.a];
  if(fn){e.preventDefault();fn(t.dataset,V,t,e)}else console.warn('no action',t.dataset.a);
});
/* Digital Crown: mouse wheel / trackpad on the screen value or the crown, or a vertical drag on the crown */
let wAcc=0;
function crown(dy,src){
  const V=topV();
  if(V.live&&V.page===1&&S.live&&!S.live.rest&&!allDone(S.live)){wAcc+=dy;while(wAcc<=-40){wAcc+=40;stepVal(V,1)}while(wAcc>=40){wAcc-=40;stepVal(V,-1)}return true}
  if(src==='crown'){const b=$$('.bd',V.el).find(x=>!V.live||x.closest('.pp')===$$('.pp',V.el)[V.page])||$('.bd',V.el);if(b)b.scrollTop+=dy;return true}
  return false;
}
scr.addEventListener('wheel',e=>{if(e.target.closest('#vals')&&crown(e.deltaY,'screen'))e.preventDefault()},{passive:false});
const cr=$('#crown');
cr.addEventListener('wheel',e=>{e.preventDefault();crown(e.deltaY,'crown')},{passive:false});
let CG=null;
cr.addEventListener('pointerdown',e=>{CG={y:e.clientY,id:e.pointerId};cr.setPointerCapture(e.pointerId)});
cr.addEventListener('pointermove',e=>{if(!CG)return;const dy=(e.clientY-CG.y)/K;CG.y=e.clientY;crown(dy*2.5,'crown')});
const ce=()=>{CG=null;wAcc=0};cr.addEventListener('pointerup',ce);cr.addEventListener('pointercancel',ce);
document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
document.addEventListener('gesturestart',e=>e.preventDefault());

/* ---------- page chrome: fit, frameless toggle, reset ---------- */
const FLK='fitproto.watch.frameless';
function fit(){
  const fl=document.body.classList.contains('fl'),vw=innerWidth,vh=innerHeight-34;
  K=fl?Math.min(vw/214,vh/254):Math.min((vw-20)/250,(vh-16)/300);
  K=Math.max(.6,Math.min(K,fl?4:2.4));document.documentElement.style.setProperty('--k',K.toFixed(3));
  $('#watch').style.width=fl?'238px':'';
}
function setFL(on){document.body.classList.toggle('fl',on);$('#tgl').textContent=on?'Watch frame':'Frameless';try{localStorage.setItem(FLK,on?'1':'0')}catch(_){}fit()}
$('#tgl').addEventListener('click',e=>{e.preventDefault();setFL(!document.body.classList.contains('fl'))});
$('#rst').addEventListener('click',e=>{e.preventDefault();if(confirm('Reset demo data? This also resets the iPhone prototype on this device.')){S=seed();save();rebuild()}});
addEventListener('resize',fit);
function rebuild(){stack.splice(0).forEach(V=>V.el.remove());push({render:listHTML},false);if(S.live)openLive(false)}
/* keep in step with the iPhone prototype when both are open on this device */
let lastRaw=localStorage.getItem(KEY);
function resync(){const raw=localStorage.getItem(KEY);if(raw===lastRaw)return;lastRaw=raw;const n=load();if(!n)return;
  const hadLive=!!S.live,sameLive=hadLive&&n.live&&n.live.wid===S.live.wid;S=n;
  if(!!S.live!==hadLive||(hadLive&&!sameLive))rebuild();else render(topV())}
addEventListener('storage',e=>{if(e.key===KEY)resync()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){resync();tick()}});
const _save=save;save=function(){_save();lastRaw=localStorage.getItem(KEY)};

/* ---------- boot ---------- */
S=load()||seed();save();
setFL(/[?&]frameless\b/.test(location.search)||(()=>{try{return localStorage.getItem(FLK)==='1'}catch(_){return false}})());
rebuild();
