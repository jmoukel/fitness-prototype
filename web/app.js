'use strict';
/* Fitness app clickable prototype (iPhone UI). Data model lives in core.js. */
/* Web build: one page, two layouts. >=900px = desktop (sidebar + main pane, modals), narrower = the phone layout. */
const WMQ=matchMedia('(min-width:900px)'), WIDE=WMQ.matches;
document.documentElement.classList.toggle('wide',WIDE);
WMQ.addEventListener('change',()=>location.reload());
let SEL=null;

/* ---------- layer stack ---------- */
const app=$('#app'), stack=[];
let busyUntil=0;
const TYPECLS={screen:'',push:'push',full:'full',fade:'fadeL',sheet:'sheetL',menu:'menuL',act:'actL'};
const isPage=L=>L&&['screen','push','full','fade'].includes(L.type);
function render(L){
  if(!L.el) return;
  const keep=$$('.scroll,.sbody,.chips,.chips2',L.el).map(e=>e.scrollTop+','+e.scrollLeft);
  let html=L.render(L);
  if(L.type==='sheet') html=`<div class="dim" data-a="dismiss"></div><div class="sheet ${L.cls||''}"><div class="grab"></div>${html}</div>`;
  else if(L.type==='menu'||L.type==='act') html=`<div class="dim" data-a="dismiss" ${L.type==='menu'?'style="background:rgba(0,0,0,.4)"':''}></div>${html}`;
  else html+='<div class="shade"></div>';
  L.el.innerHTML=html;
  $$('.scroll,.sbody,.chips,.chips2',L.el).forEach((e,i)=>{if(keep[i]){const [t,l]=keep[i].split(',');e.scrollTop=+t;e.scrollLeft=+l}});
  if(L.type==='sheet') bindSheetDrag(L);
  L.after&&L.after(L);
}
function push(L,instant){
  const el=document.createElement('div');L.el=el;el.className='layer '+TYPECLS[L.type]+(L.lcls?' '+L.lcls:'');
  app.appendChild(el);stack.push(L);render(L);
  const below=stack[stack.length-2];
  busyUntil=Date.now()+380;
  const go=()=>{el.classList.add('in');if(L.type==='push'&&isPage(below))below.el.classList.add('under')};
  if(instant){el.style.transition='none';go();el.offsetWidth;el.style.transition=''}else{el.offsetWidth;requestAnimationFrame(go)}
  return L;
}
function pop(n=1,opts={}){
  for(let k=0;k<n&&stack.length>1;k++){
    const L=stack.pop(), below=stack[stack.length-1];
    L.el.classList.remove('in');
    if(L.type==='push'&&below)below.el.classList.remove('under');
    const el=L.el;L.el=null;
    setTimeout(()=>el.remove(),opts.instant?0:450);
    L.onPop&&L.onPop();
  }
  busyUntil=Date.now()+380;
  refreshAll();
}
function popTo(L){const i=stack.indexOf(L);if(i>=0)pop(stack.length-1-i)}
function refreshAll(){stack.forEach(L=>{if(!L.noRefresh)render(L)})}
const topL=()=>stack[stack.length-1];
const layerOf=el=>{for(let i=stack.length-1;i>=0;i--)if(stack[i].el&&stack[i].el.contains(el))return stack[i]};
function dismiss(L){if(L.cancel)L.cancel(L);else{const i=stack.indexOf(L);if(i>0)pop(stack.length-i)}} /* web: closes L itself (the phone build's popTo(L) leaves it open) */

function toast(html){const t=document.createElement('div');t.className='toast';t.innerHTML=html;app.appendChild(t);
  requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('on')));setTimeout(()=>{t.classList.remove('on');setTimeout(()=>t.remove(),500)},2200)}

function actionSheet(title,msg,options){
  push({type:'act',noRefresh:true,render:()=>`<div class="act"><div class="ag">${title||msg?`<div class="ah">${title?`<b>${esc(title)}</b>`:''}${esc(msg||'')}</div>`:''}
  ${options.map((o,i)=>`<div class="ab ${o.cls||''}" data-a="actPick" data-i="${i}">${esc(o.label)}</div>`).join('')}</div>
  <div class="ag"><div class="ab cancel" data-a="dismiss">Cancel</div></div></div>`,options});
}

/* sheet drag-to-dismiss */
function bindSheetDrag(L){
  const sh=$('.sheet',L.el);if(!sh||WIDE)return;
  const handle=e=>{
    if(e.target.closest('[data-a],input'))return;
    const y0=e.clientY;let dy=0;sh.classList.add('drag');
    const mv=ev=>{dy=Math.max(0,ev.clientY-y0);sh.style.transform=`translateY(${dy}px)`};
    const up=()=>{window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);sh.classList.remove('drag');sh.style.transform='';if(dy>110)dismiss(L)};
    window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);
  };
  $$('.grab,.sh',sh).forEach(h=>h.addEventListener('pointerdown',handle));
}
/* edge swipe back */
(function(){
  let sx=null,sy,L,B,dx=0,W=0,t0;
  app.addEventListener('touchstart',e=>{const t=topL();if(!t||t.type!=='push')return;const r=app.getBoundingClientRect();
    const x=e.touches[0].clientX-r.left;if(x>28)return;sx=e.touches[0].clientX;sy=e.touches[0].clientY;L=t;B=stack[stack.length-2];W=r.width;dx=0;t0=Date.now()},{passive:true});
  app.addEventListener('touchmove',e=>{if(sx==null)return;dx=Math.max(0,e.touches[0].clientX-sx);
    if(dx<6&&Math.abs(e.touches[0].clientY-sy)>10){sx=null;return}
    L.el.style.transition='none';L.el.style.transform=`translateX(${dx}px)`;
    if(B&&isPage(B)){B.el.style.transition='none';B.el.style.transform=`translateX(${-0.28*W+dx*0.28}px)`}},{passive:true});
  app.addEventListener('touchend',()=>{if(sx==null)return;sx=null;const fast=dx>60&&Date.now()-t0<250;
    L.el.style.transition='';B&&(B.el.style.transition='');
    if(dx>W*0.35||fast){L.el.style.transform='';B&&(B.el.style.transform='');pop()}else{L.el.style.transform='';B&&(B.el.style.transform='')}});
})();

/* wheel picker */
function wheelHTML(key,vals,label){return `<div class="col"><div class="lab">${label}</div><div class="wh" data-wheel="${key}"><div class="pad"></div>${vals.map(v=>`<div class="v">${v}</div>`).join('')}<div class="pad"></div></div></div>`}
function bindWheel(el,vals,get,set){
  const items=$$('.v',el);let cur=-1,tmr;
  const idx=()=>Math.max(0,Math.min(vals.length-1,Math.round(el.scrollTop/40)));
  const paint=()=>{const i=idx();if(i!==cur){items[cur]&&items[cur].classList.remove('s');items[i].classList.add('s');cur=i}return i};
  el.addEventListener('scroll',()=>{const i=paint();clearTimeout(tmr);tmr=setTimeout(()=>{if(vals[i]!==get())set(vals[i])},110)},{passive:true});
  el.addEventListener('click',e=>{const v=e.target.closest('.v');if(v)el.scrollTo({top:items.indexOf(v)*40,behavior:'smooth'})});
  el._to=v=>{el.scrollTo({top:Math.max(0,vals.indexOf(v))*40,behavior:'smooth'})};
  el.scrollTop=Math.max(0,vals.indexOf(get()))*40;paint();
}
/* drag reorder */
function bindReorder(list,sel,onDrop){
  if(!list)return;
  $$('[data-grip]',list).forEach(g=>g.addEventListener('pointerdown',e=>{
    e.preventDefault();e.stopPropagation();
    const row=g.closest(sel),rows=$$(sel,list),from=rows.indexOf(row);if(from<0)return;
    const rects=rows.map(r=>r.getBoundingClientRect()),h=rects[from].height,y0=e.clientY;let to=from;
    row.classList.add('dragging');rows.forEach(r=>{if(r!==row)r.classList.add('shift')});
    try{g.setPointerCapture(e.pointerId)}catch(_){}
    const mv=ev=>{const dy=Math.max(rects[0].top-rects[from].top,Math.min(rects[rows.length-1].top-rects[from].top,ev.clientY-y0));
      row.style.transform=`translateY(${dy}px) scale(1.02)`;const c=rects[from].top+h/2+dy;
      to=rects.filter((r,i)=>i!==from&&r.top+r.height/2<c).length;
      rows.forEach((r,i)=>{if(i===from)return;let s=0;if(from<to&&i>from&&i<=to)s=-h;if(to<from&&i>=to&&i<from)s=h;r.style.transform=s?`translateY(${s}px)`:''})};
    const up=()=>{g.removeEventListener('pointermove',mv);g.removeEventListener('pointerup',up);g.removeEventListener('pointercancel',up);
      rows.forEach(r=>{r.style.transform='';r.classList.remove('dragging','shift')});if(to!==from)onDrop(from,to)};
    g.addEventListener('pointermove',mv);g.addEventListener('pointerup',up);g.addEventListener('pointercancel',up);
  }));
}
const move=(arr,f,t)=>{const [x]=arr.splice(f,1);arr.splice(t,0,x)};

/* ---------- screens: plan ---------- */
const A={}; // actions
const bg=u=>`style="background-image:url('${u}')"`;
function planHTML(){
  if(WIDE)return shellHTML();
  const p=curPlan(), ws=p.workouts.map(id=>S.workouts[id]).filter(Boolean);
  const isDone=w=>{const d=lastDone(w.id);return d&&isThisWeek(d)};
  const todo=ws.filter(w=>!isDone(w)), done=ws.filter(isDone);
  const card=w=>{const d=lastDone(w.id);return `<div class="w" data-a="openW" data-id="${w.id}"><div class="ic" ${bg(iconImg(w.icon))}></div>
    <div class="t"><div class="n">${esc(w.name)}</div></div><div class="last">${d?ago(d):'New'}<b>›</b></div></div>`};
  const dcard=w=>`<div class="w done" data-a="openW" data-id="${w.id}"><div class="ic" ${bg(iconImg(w.icon))}></div>
    <div class="t"><div class="n">${esc(w.name)}</div><div class="m">${ago(lastDone(w.id),true)}</div></div><div class="chk">✓</div></div>`;
  return `<div class="scroll"><div class="wrap plan-top">
    
    <div class="dd" data-a="planMenu">${esc(p.name)}<span class="chev">▼</span></div>
    ${!ws.length?`<div class="empty">No workouts in this plan yet.</div>`:''}
    ${ws.length&&!todo.length?`<div class="alldone"><b>All done this week 🎉</b>Nice work. Everything resets Monday.</div>`:''}
    ${todo.map(card).join('')}
    ${done.length?`<h2>Done This Week</h2>${done.map(dcard).join('')}`:''}
    <div class="addw" data-a="newWorkout">+ Add Workout</div>
    <div class="spacer" style="height:calc(var(--sab) + 30px)"></div></div></div>`;
}
A.planMenu=(d,L,t)=>{
  const r=t.getBoundingClientRect(), ar=app.getBoundingClientRect();
  push({type:'menu',render:()=>`<div class="menu" style="top:${r.bottom-ar.top+8}px${WIDE?`;left:${Math.max(12,r.left-ar.left-6)}px`:''}">
    ${S.plans.map(p=>`<div class="mi" data-a="planSel" data-id="${p.id}">${esc(p.name)}${p.id===S.activePlan?'<span class="ck2">✓</span>':''}</div>`).join('')}
    <div class="mi acc" data-a="planNew">+ New Plan</div>
    <div class="mi sm" data-a="reset">Reset demo data</div></div>`});
};
A.planSel=d=>{S.activePlan=d.id;save();pop()};
A.reset=()=>{SEL=null;pop();setTimeout(()=>actionSheet('Reset demo data?','Puts back the sample plans and history. Anything you changed is lost.',[{label:'Reset Demo Data',cls:'red',fn:()=>{
  S=seed();save();while(stack.length>1){const L=stack.pop();L.el.remove()}refreshAll();toast('Demo data reset')}}]),250)};
A.openW=d=>{if(WIDE){SEL=d.id;refreshAll()}else push({type:'push',wid:d.id,render:detailHTML})};
A.newWorkout=()=>openEdit(mkWorkout('', 'chest', []),{isNew:true});

/* ---------- desktop shell: sidebar (plan + workouts) and main pane (selected workout) ---------- */
function selW(){const p=curPlan(),ids=p.workouts.filter(id=>S.workouts[id]);if(SEL&&ids.includes(SEL))return SEL;
  const todo=ids.find(id=>{const d=lastDone(id);return !(d&&isThisWeek(d))});return SEL=todo||ids[0]||null}
function shellHTML(){
  const p=curPlan(), ws=p.workouts.map(id=>S.workouts[id]).filter(Boolean), sel=selW();
  const isDone=w=>{const d=lastDone(w.id);return d&&isThisWeek(d)};
  const todo=ws.filter(w=>!isDone(w)), done=ws.filter(isDone);
  const card=w=>{const d=lastDone(w.id);return `<div class="w sw ${w.id===sel?'sel':''}" data-a="openW" data-id="${w.id}"><div class="ic" ${bg(iconImg(w.icon))}></div>
    <div class="t"><div class="n">${esc(w.name)}</div></div><div class="last">${d?ago(d):'New'}</div></div>`};
  const dcard=w=>`<div class="w sw done ${w.id===sel?'sel':''}" data-a="openW" data-id="${w.id}"><div class="ic" ${bg(iconImg(w.icon))}></div>
    <div class="t"><div class="n">${esc(w.name)}</div><div class="m">${ago(lastDone(w.id),true)}</div></div><div class="chk">✓</div></div>`;
  return `<div class="shell"><div class="side scroll">
    <div class="dd" data-a="planMenu">${esc(p.name)}<span class="chev">▼</span></div>
    ${!ws.length?`<div class="empty">No workouts in this plan yet.</div>`:''}
    ${ws.length&&!todo.length?`<div class="alldone"><b>All done this week 🎉</b>Nice work. Everything resets Monday.</div>`:''}
    <div class="swl">${todo.map(card).join('')}</div>
    ${done.length?`<h2>Done This Week</h2><div class="swl">${done.map(dcard).join('')}</div>`:''}
    <div class="addw" data-a="newWorkout">+ Add Workout</div></div>
    <div class="main">${sel?mainHTML(S.workouts[sel]):''}</div></div>`;
}
function mainHTML(w){
  const d=lastDone(w.id), doneWk=d&&isThisWeek(d), live=S.live&&S.live.wid===w.id;
  const rows=w.items.map(it=>{const ex=LIB(it.exId),t=target(it);
    return `<div class="ex" data-a="openEx" data-ex="${it.exId}"><div class="ic" ${exBg(ex)}></div>
    <div class="t"><div class="n">${esc(ex.name)}</div>${tvHTML(t)}</div>${t.chip?`<div class="chip">${t.chip}</div>`:''}</div>`}).join('');
  return `<div class="tbar"><div class="fade" data-a="edit" data-id="${w.id}">Edit</div>${w.items.length?`<div class="startw" data-a="start" data-id="${w.id}">${live?'Resume Workout':'▶&nbsp; Start Workout'}</div>`:''}</div>
  <div class="scroll"><div class="pane"><div class="hero"><div class="big" ${bg(iconImg(w.icon))}></div><div><div class="ttl">${esc(w.name)}</div>
</div></div>
  ${w.items.length&&doneWk?doneRow(w.id):''}
  ${w.items.length?`<div class="tg"><span class="nw">GOAL</span></div>
  <div class="list tgt">${rows}</div>`:`<div class="list"><div class="emptyl">No exercises yet.<br>Click <b style="color:var(--acc)">Edit</b> to add some.</div></div>`}</div></div>`;
}

/* ---------- workout detail ---------- */
const planOf=wid=>S.plans.find(p=>p.workouts.includes(wid))||curPlan();
function detailHTML(L){
  const w=S.workouts[L.wid];if(!w)return '';
  const d=lastDone(w.id), doneWk=d&&isThisWeek(d), live=S.live&&S.live.wid===w.id;
  const rows=w.items.map((it,i)=>{const ex=LIB(it.exId),t=target(it);
    return `<div class="ex" data-a="openEx" data-ex="${it.exId}"><div class="ic" ${exBg(ex)}></div>
    <div class="t"><div class="n">${esc(ex.name)}</div>${tvHTML(t)}</div>${t.chip?`<div class="chip">${t.chip}</div>`:''}</div>`}).join('');
  return `<div class="nav"><div class="b" data-a="back"><span>‹</span>${esc(planOf(w.id).name)}</div><div class="fade" data-a="edit">Edit</div></div>
  <div class="scroll"><div class="hero"><div class="big" ${bg(iconImg(w.icon))}></div><div class="ttl">${esc(w.name)}</div>
</div>
  ${w.items.length&&doneWk?doneRow(w.id):''}
  ${w.items.length?`<div class="tg"><span class="nw">GOAL</span></div>
  <div class="list tgt">${rows}</div>`:`<div class="list"><div class="emptyl">No exercises yet.<br>Tap <b style="color:var(--acc)">Edit</b> to add some.</div></div>`}
  <div class="spacer"></div></div>
  ${w.items.length?`<div class="bottombar"><div class="start" data-a="start">${live?'Resume Workout':'▶&nbsp; Start Workout'}</div></div>`:''}`;
}
A.back=()=>pop();
A.pop=()=>pop();
A.dismiss=(d,L)=>dismiss(L);
A.edit=(d,L)=>openEdit(clone(S.workouts[d.id||L.wid]),{});
A.openEx=d=>openProfile(d.ex,null,'Back');

/* ---------- edit workout ---------- */
function openEdit(draft,o){
  push({type:o.isNew?'push':'fade',lcls:'editp',draft,isNew:o.isNew,delIdx:-1,render:editHTML,
    after:L=>bindReorder($('#exlist',L.el),'.ex[data-idx]',(f,t)=>{move(L.draft.items,f,t);render(L)})});
}
function editHTML(L){
  const d=L.draft;
  const rows=d.items.map((it,i)=>{const ex=LIB(it.exId);return `<div class="ex ed" data-idx="${i}">
    <div class="minus ${L.delIdx===i?'rot':''}" data-a="exMinus" data-i="${i}">–</div><div class="ic" ${exBg(ex)}></div>
    <div class="t" data-a="ruleOpen" data-i="${i}"><div class="n">${esc(ex.name)}</div>${it.rule?'<div class="m">Custom progression</div>':''}</div>
    ${L.delIdx===i?`<div class="delb" data-a="exDel" data-i="${i}">Delete</div>`:`<div class="pill" data-a="setsOpen" data-i="${i}">${pillTxt(it)}</div>`}
    <div class="grip" data-grip>≡</div></div>`}).join('');
  return `<div class="nav"><div class="fade" data-a="editCancel">Cancel</div><div class="done fade" data-a="editDone">Done</div></div>
  <div class="scroll"><div class="hero"><div class="big badge" data-a="iconPick" ${bg(iconImg(d.icon))}></div>
  <input class="field" data-in="wname" value="${esc(d.name)}" placeholder="Workout Name" maxlength="32"></div>
  <div class="sect">Exercises</div>
  <div class="list"><div id="exlist">${rows}</div><div class="add" data-a="addEx"><span class="plus">+</span>Add Exercise</div></div>
  <div class="sect" style="margin-top:22px">Settings</div>
  <div class="list"><div class="rowv" data-a="restOpen"><span>Rest Between Sets</span><span class="v">${restTxt(d.rest)} ›</span></div></div>
  ${L.isNew?'':'<div class="del" data-a="wDelete">Delete Workout</div>'}
  <div class="spacer" style="height:calc(var(--sab) + 40px)"></div></div>`;
}
A.editCancel=()=>pop();
A.editDone=(x,L)=>{
  const d=L.draft;d.name=(d.name||'').trim()||'Untitled Workout';
  S.workouts[d.id]=d;
  if(L.isNew){curPlan().workouts.push(d.id);save();pop();setTimeout(()=>A.openW({id:d.id}),60);return}
  save();pop();
};
A.exMinus=(d,L)=>{L.delIdx=L.delIdx===+d.i?-1:+d.i;render(L)};
A.exDel=(d,L)=>{L.draft.items.splice(+d.i,1);L.delIdx=-1;render(L)};
A.wDelete=(x,L)=>actionSheet(null,`Delete “${L.draft.name}”? Its history stays in your exercise stats.`,[{label:'Delete Workout',cls:'red',fn:()=>{
  const id=L.draft.id;delete S.workouts[id];S.plans.forEach(p=>p.workouts=p.workouts.filter(x=>x!==id));save();
  popTo(stack[0]);toast('Workout deleted')}}]);
A.iconPick=(x,L)=>push({type:'sheet',cls:'tall',sel:L.draft.icon,edit:L,render:S2=>`<div class="sh"><div class="c" data-a="dismiss">Cancel</div><div class="tt">Workout Icon</div><div class="d" data-a="iconDone">Done</div></div>
  <div class="sbody"><div class="grid">${ICONS.map(([k,lb])=>`<div class="cell ${S2.sel===k?'on':''}" data-a="iconSel" data-ic="${k}"><div class="im" ${bg(iconImg(k))}></div><div class="lb">${lb}</div></div>`).join('')}</div></div>`});
A.iconSel=(d,L)=>{L.sel=d.ic;render(L)};
A.iconDone=(d,L)=>{L.edit.draft.icon=L.sel;pop()};
A.restOpen=(x,L)=>push({type:'sheet',sel:L.draft.rest,edit:L,render:S2=>`<div class="sh"><div class="c" data-a="dismiss">Cancel</div><div class="tt">Rest Between Sets</div><div class="d" data-a="restDone">Done</div></div>
  <div class="sbody"><div class="gl" style="margin-top:18px">Timer after each set</div><div class="grp">${[0,60,90,120,180,240,300].map(v=>`<div class="gr" data-a="restSel" data-v="${v}"><span>${restTxt(v)}${v===180?' <span style="color:var(--gray);font-size:14px">· default</span>':''}</span>${S2.sel===v?'<span class="tk">✓</span>':''}</div>`).join('')}</div>
  <div class="hint">One setting for every exercise in this workout. The timer starts when you check off a set, and you can always skip it.</div></div>`});
A.restSel=(d,L)=>{L.sel=+d.v;render(L)};
A.restDone=(d,L)=>{L.edit.draft.rest=L.sel;pop()};

/* sets & reps picker (works on a workout item or a custom-exercise draft) */
function openSets(obj,title,onDone){
  const tmp={sets:obj.perSet?obj.perSet.length:obj.sets,min:obj.min,max:obj.max,perSet:obj.perSet?obj.perSet.slice():null};
  push({type:'sheet',tmp,render:setsHTML,after:setsAfter,done:()=>{
    if(tmp.perSet){obj.perSet=tmp.perSet.slice();obj.sets=tmp.perSet.length;obj.min=Math.min(...tmp.perSet);obj.max=Math.max(...tmp.perSet)}
    else{obj.perSet=null;obj.sets=tmp.sets;obj.min=tmp.min;obj.max=tmp.max}
    onDone&&onDone();pop()},title});
}
const R=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
function setsHTML(L){
  const t=L.tmp;
  const head=`<div class="sh"><div class="c" data-a="dismiss">Cancel</div><div class="tt">${esc(L.title)}</div><div class="d" data-a="setsDone">Done</div></div>`;
  if(!t.perSet) return head+`<div class="wheels"><div class="band"></div>${wheelHTML('sets',R(1,8),'Sets')}<div class="x">×</div>${wheelHTML('min',R(1,30),'Min reps')}<div class="x">–</div>${wheelHTML('max',R(1,30),'Max reps')}</div>
    <div class="vary" data-a="setsCustom">Different reps each set? <span>Customize</span></div>`;
  return head+`<div class="sbody" style="flex:none;max-height:56vh"><div class="setl">${t.perSet.map((r,i)=>`<div class="sr"><span class="k">Set ${i+1}</span><span class="rv">${r}<small>reps</small></span>
    <div class="stp"><div data-a="psStep" data-i="${i}" data-d="-1">−</div><div data-a="psStep" data-i="${i}" data-d="1">+</div></div></div>`).join('')}
    <div class="addset"><span data-a="psAdd">+ Add Set</span>${t.perSet.length>1?'<span class="rm" data-a="psRm">Remove Last</span>':''}</div></div></div>
    <div class="vary" data-a="setsRange">Same reps every set? <span>Use a range</span></div>`;
}
function setsAfter(L){
  if(L.tmp.perSet)return;const t=L.tmp,w=k=>$(`[data-wheel="${k}"]`,L.el);
  bindWheel(w('sets'),R(1,8),()=>t.sets,v=>t.sets=v);
  bindWheel(w('min'),R(1,30),()=>t.min,v=>{t.min=v;if(t.max<v){t.max=v;w('max')._to(v)}});
  bindWheel(w('max'),R(1,30),()=>t.max,v=>{t.max=v;if(t.min>v){t.min=v;w('min')._to(v)}});
}
A.setsOpen=(d,L)=>{const it=L.draft.items[+d.i];openSets(it,LIB(it.exId).name,()=>render(L))};
A.setsDone=(d,L)=>L.done();
A.setsCustom=(d,L)=>{const t=L.tmp;t.perSet=Array.from({length:t.sets},()=>t.max);render(L)};
A.setsRange=(d,L)=>{const t=L.tmp;t.sets=t.perSet.length;t.min=Math.min(...t.perSet);t.max=Math.max(...t.perSet);t.perSet=null;render(L)};
A.psStep=(d,L)=>{const p=L.tmp.perSet;p[+d.i]=Math.max(1,Math.min(50,p[+d.i]+ +d.d));render(L)};
A.psAdd=(d,L)=>{const p=L.tmp.perSet;if(p.length<10)p.push(p[p.length-1]);render(L)};
A.psRm=(d,L)=>{L.tmp.perSet.pop();render(L)};

/* progression rule sheet */
A.ruleOpen=(d,L)=>{
  const it=L.draft.items[+d.i],ex=LIB(it.exId);
  const tmp={mode:it.rule?'custom':'default',min:it.min,max:it.max,addReps:it.rule?it.rule.addReps:1,addWeight:it.rule?it.rule.addWeight:EQ[ex.equip].inc,equip:it.rule&&it.rule.equip||ex.equip};
  push({type:'sheet',tmp,it,ex,edit:L,render:ruleHTML});
};
function ruleHTML(L){
  const t=L.tmp,ex=L.ex,it=L.it,bw=t.equip==='bodyweight',inc=t.mode==='custom'?t.addWeight:EQ[ex.equip].inc;
  const probe=Object.assign(clone(it),{min:t.min,max:t.max,rule:t.mode==='custom'?{addReps:t.addReps,addWeight:t.addWeight,equip:t.equip}:null});
  const tg=target(probe);
  const stp=(k,lb,val)=>`<div class="gr"><span>${lb}</span><span class="v2">${val}<div class="stp"><div data-a="ruleStep" data-k="${k}" data-d="-1">−</div><div data-a="ruleStep" data-k="${k}" data-d="1">+</div></div></span></div>`;
  const range=it.perSet?`<div class="grp"><div class="gr ro"><span>Reps per set</span><span>${it.perSet.join(' / ')}</span></div></div>`:
    `<div class="gl">Rep range</div><div class="grp">${stp('min','From',t.min)}${stp('max','To',t.max)}</div>`;
  const body=t.mode==='default'?`${range}<div class="gl">How it progresses</div><div class="grp">
      <div class="gr ro"><span>Each week</span><span>+1 rep</span></div>
      <div class="gr ro"><span>When every set hits ${it.perSet?'its goal':t.max}</span><span>${ex.equip==='bodyweight'?'Keep adding reps':'+'+inc+' lb'}</span></div>
      ${ex.equip==='bodyweight'?'':`<div class="gr ro"><span>Then reps go back to</span><span>${it.perSet?'start':t.min}</span></div>`}</div>
      <div class="hint">Default for ${EQ[ex.equip].label.toLowerCase()} exercises.</div>`
    :`${range}<div class="gl">Each week</div><div class="grp">${stp('addReps','Add reps',t.addReps)}</div>
      <div class="gl">When every set hits ${it.perSet?'its goal':t.max}</div><div class="grp">
      <div class="gr" data-a="ruleEquip"><span>Equipment</span><span class="v">${EQ[t.equip].label} ›</span></div>
      ${bw?'':stp('addWeight','Add weight',t.addWeight+' lb')}</div>`;
  return `<div class="sh"><div class="c" data-a="dismiss">Cancel</div><div class="tt">${esc(ex.name)}</div><div class="d" data-a="ruleDone">Done</div></div>
  <div class="sbody"><div class="seg"><div class="${t.mode==='default'?'on':''}" data-a="ruleMode" data-m="default">Default</div><div class="${t.mode==='custom'?'on':''}" data-a="ruleMode" data-m="custom">Custom</div></div>
  ${body}<div class="hint" style="margin-top:14px">Next goal: <b>${wX(tg.w)}${tg.reps.join(' · ')}</b>${tg.chip?` <span style="color:var(--acc)">(${tg.chip})</span>`:''}</div></div>`;
}
A.ruleMode=(d,L)=>{L.tmp.mode=d.m;render(L)};
A.ruleStep=(d,L)=>{const t=L.tmp,k=d.k,s=+d.d;
  if(k==='min'){t.min=Math.max(1,Math.min(t.max,t.min+s))}else if(k==='max'){t.max=Math.max(t.min,Math.min(50,t.max+s))}
  else if(k==='addReps'){t.addReps=Math.max(1,Math.min(5,t.addReps+s))}else if(k==='addWeight'){const V=[0,2.5,5,10,15,20,25,30,40,50];let i=V.indexOf(t.addWeight);if(i<0)i=2;t.addWeight=V[Math.max(0,Math.min(V.length-1,i+s))]}
  render(L)};
A.ruleEquip=(d,L)=>actionSheet('Equipment','Sets how much weight to add by default.',Object.keys(EQ).map(k=>({label:EQ[k].label+(k!=='bodyweight'?` (+${EQ[k].inc} lb)`:' (reps only)'),fn:()=>{L.tmp.equip=k;L.tmp.addWeight=EQ[k].inc;render(L)}})));
A.ruleDone=(d,L)=>{const t=L.tmp,it=L.it;if(!it.perSet){it.min=t.min;it.max=t.max}
  it.rule=t.mode==='custom'?{addReps:t.addReps,addWeight:t.addWeight,equip:t.equip}:null;pop()};
A.actPick=(d,L)=>{const o=L.options[+d.i];pop();o.fn&&setTimeout(o.fn,30)};

/* ---------- add exercise sheet ---------- */
const EQF=['Any','Dumbbell','Barbell','Machine','Free Weight'];
const eqMatch=(f,e)=>f==='Any'||(f==='Dumbbell'&&e==='dumbbell')||(f==='Barbell'&&e==='barbell')||(f==='Machine'&&(e==='machine'||e==='cable'))||(f==='Free Weight'&&(e==='dumbbell'||e==='barbell'));
A.addEx=(x,L)=>{
  const items=L.draft.items;
  push({type:'sheet',cls:'tall',edit:L,snap:clone(items),q:'',mus:ICON_MUSCLE[L.draft.icon]||'All',eq:'Any',
    cancel:S2=>{L.draft.items=S2.snap;pop()},render:addHTML});
};
function addHTML(L){
  return `<div class="sh"><div class="c" data-a="dismiss">Cancel</div><div class="tt">Add Exercise</div><div class="d" data-a="pop">Done</div></div>
  <div class="srch"><span>⌕</span><input data-in="q" type="search" placeholder="Search exercises" value="${esc(L.q)}" autocomplete="off"></div>
  <div class="chips">${['All',...muscleChips()].map(m=>`<span class="${L.mus===m?'on':''}" data-a="axMus" data-m="${m}">${m}</span>`).join('')}</div>
  <div class="chips2">${EQF.map(m=>`<span class="${L.eq===m?'on':''}" data-a="axEq" data-m="${m}">${m}</span>`).join('')}</div>
  <div class="sbody" id="axb">${addBody(L)}</div>`;
}
function addBody(L){
  const q=L.q.trim().toLowerCase(), sel=new Set(L.edit.draft.items.map(i=>i.exId));
  const list=allEx().filter(e=>muscleMatch(e,L.mus)&&eqMatch(L.eq,e.equip)&&(!q||e.name.toLowerCase().includes(q)||e.muscle.toLowerCase().includes(q)||exTags(e).some(t=>t.toLowerCase().includes(q))));
  const fav=list.filter(e=>S.favs.includes(e.id)), rest=list.filter(e=>!S.favs.includes(e.id));
  const custom=rest.filter(e=>e.custom), lib=rest.filter(e=>!e.custom);
  const common=lib.filter(e=>e.common), other=lib.filter(e=>!e.common).sort((a,b)=>MUSCLES.indexOf(a.muscle)-MUSCLES.indexOf(b.muscle));
  const row=(e,sub)=>`<div class="er" data-a="axProf" data-ex="${e.id}"><div class="im" ${exBg(e)}></div><div class="nm">${esc(e.name)}<small>${esc(sub(e))}</small></div>
    <div class="adw" data-a="axTog" data-ex="${e.id}"><div class="ad ${sel.has(e.id)?'on':''}">${sel.has(e.id)?'✓':'+'}</div></div></div>`;
  const s1=e=>EQ[e.equip].label+' · '+e.muscle, s2=e=>e.muscle+(e.also&&e.also.length?' · '+e.also.join(', '):'');
  const sec=(t,arr,sub)=>arr.length?`<div class="gl">${t}</div><div class="el">${arr.map(e=>row(e,sub)).join('')}</div>`:'';
  const html=sec('★ Favorites',fav,s1)+sec('My Exercises',custom,s1)+sec('Most Common',common,s1)+sec('Barbell',other.filter(e=>e.equip==='barbell'),s2)+
    sec('Dumbbell',other.filter(e=>e.equip==='dumbbell'),s2)+sec('Machine & Cable',other.filter(e=>e.equip==='machine'||e.equip==='cable'),s2)+sec('Bodyweight',other.filter(e=>e.equip==='bodyweight'),s2);
  return (html||`<div class="emptyl">No matches${q?` for “${esc(L.q)}”`:''}.</div>`)+`<div class="cust" data-a="custNew">+ Create Custom Exercise</div><div style="height:20px"></div>`;
}
A.axMus=(d,L)=>{L.mus=d.m;render(L)};
A.axEq=(d,L)=>{L.eq=d.m;render(L)};
function toggleIn(draft,id){const i=draft.items.findIndex(x=>x.exId===id);if(i>=0)draft.items.splice(i,1);else draft.items.push(item(id));return i<0}
A.axTog=(d,L)=>{toggleIn(L.edit.draft,d.ex);render(L);render(L.edit)};
A.axProf=(d,L)=>openProfile(d.ex,L,'Add Exercise');

/* ---------- exercise profile ---------- */
function openProfile(id,addL,backLabel){push({type:'push',lcls:'prof',exId:id,addL,backLabel,render:profHTML})}
function profHTML(L){
  const e=LIB(L.exId), fav=S.favs.includes(e.id), bw=e.equip==='bodyweight';
  const hist=[];S.sessions.forEach(s=>{const x=s.ex.find(y=>y.exId===e.id);if(x&&x.sets.length)hist.push({date:s.date,sets:x.sets})});
  let best=null;hist.forEach(h=>h.sets.forEach(st=>{const sc=bw?st.r:st.w*(1+st.r/30);if(!best||sc>best.sc)best={sc,w:st.w,r:st.r}}));
  const added=L.addL&&L.addL.edit.draft.items.some(i=>i.exId===e.id);
  const histRows=hist.length?hist.slice(0,10).map(h=>`<div class="ex"><div class="t"><div class="n">${fmtDate(h.date)}</div></div><div class="m">${wX(h.sets[0].w)}${h.sets.map(s=>s.r).join(' · ')}</div></div>`).join(''):
    '<div class="emptyl">No history yet</div>';
  const bestTxt=best?(bw?`${best.r}<small> reps</small>`:`${best.w}<small> lb</small> × ${best.r}`):'—';
  if(WIDE)return `<div class="nav"><div class="b" data-a="back"><span>‹</span>${esc(L.backLabel)}</div><div class="star ${fav?'':'off'}" data-a="fav">${fav?'★':'☆'}</div></div>
  <div class="pgrid"><div class="pl"><div class="pimg" ${exBg(e)}>${demoBtn(e,'-w')}</div><div class="pt">${esc(e.name)}</div>
  ${best?`<div class="cards"><div class="cd"><div class="l">Best Set</div><div class="v">${bestTxt}</div></div></div>`:''}</div>
  <div class="pr scroll"><div class="sect">History</div><div class="list hist">${histRows}</div></div></div>
  ${L.addL?`<div class="bottombar"><div class="start ${added?'ghost':''}" data-a="profAdd">${added?'✓ Added to Workout':'+ Add to Workout'}</div></div>`:''}`;
  return `<div class="nav"><div class="b" data-a="back"><span>‹</span>${esc(L.backLabel)}</div><div class="star ${fav?'':'off'}" data-a="fav">${fav?'★':'☆'}</div></div>
  <div class="scroll"><div class="pimg" ${exBg(e)}>${demoBtn(e)}</div><div class="pt">${esc(e.name)}</div>
  ${best?`<div class="cards"><div class="cd"><div class="l">Best Set</div><div class="v">${bw?`${best.r}<small> reps</small>`:`${best.w}<small> lb</small> × ${best.r}`}</div></div></div>`:''}
  <div class="sect" style="margin-top:22px">History</div>
  <div class="list hist">${hist.length?hist.slice(0,10).map(h=>`<div class="ex"><div class="t"><div class="n">${fmtDate(h.date)}</div></div><div class="m">${wX(h.sets[0].w)}${h.sets.map(s=>s.r).join(' · ')}</div></div>`).join(''):
    '<div class="emptyl">No history yet</div>'}</div>
  <div class="spacer"></div></div>
  ${L.addL?`<div class="bottombar"><div class="start ${added?'ghost':''}" data-a="profAdd">${added?'✓ Added to Workout':'+ Add to Workout'}</div></div>`:''}`;
}
A.demoPlay=(d,L,t,ev)=>demoToggle(t,ev);
A.fav=(d,L)=>{const i=S.favs.indexOf(L.exId);if(i>=0)S.favs.splice(i,1);else S.favs.push(L.exId);save();render(L);toast(i>=0?'Removed from Favorites':'Added to <b>Favorites</b>')};
A.profAdd=(d,L)=>{const on=toggleIn(L.addL.edit.draft,L.exId);render(L);if(on)setTimeout(()=>pop(),280)};

/* ---------- custom exercise ---------- */
const ALSO=['Chest','Triceps','Front Delts','Rear Delts','Back','Biceps','Forearms','Shoulders','Quads','Hamstrings','Glutes','Calves','Core','Obliques'];
A.custNew=(d,L)=>push({type:'sheet',cls:'tall',addL:L,tmp:{name:'',equip:L.eq==='Barbell'?'barbell':L.eq==='Machine'?'machine':'dumbbell',muscle:L.mus==='All'?'Chest':L.mus,also:[],sets:3,min:8,max:10,perSet:null,photo:null},render:custHTML,
  after:C=>{const f=$('input[type=file]',C.el);f&&f.addEventListener('change',()=>photoPick(f,C))}});
function custHTML(L){
  const t=L.tmp,bw=t.equip==='bodyweight';
  return `<div class="sh"><div class="c" data-a="dismiss">Cancel</div><div class="tt">New Exercise</div><div class="d ${t.name.trim()?'':'off'}" data-a="custSave">Save</div></div>
  <div class="sbody"><div class="ph2" ${bg(t.photo||ASSET+'img/ex/default.png')}><input type="file" accept="image/*"></div>
  <div class="nf"><input data-in="cname" value="${esc(t.name)}" placeholder="Exercise Name" maxlength="32"></div>
  <div class="gl">Details</div><div class="grp">
   <div class="gr" data-a="custEq"><span>Equipment</span><span class="v">${EQ[t.equip].label} ›</span></div>
   <div class="gr" data-a="custMus"><span>Main Muscle</span><span class="v">${t.muscle} ›</span></div>
   <div class="gr" data-a="custAlso"><span>Also Works</span><span class="v">${t.also.length?esc(t.also.join(', ')):'None'} ›</span></div></div>
  <div class="gl">Default</div><div class="grp"><div class="gr" data-a="custSets"><span>Sets &amp; Reps</span><span class="v">${pillTxt(t)} ›</span></div></div>
  <div class="hint">${bw?'Bodyweight exercises add a rep each week.':`Adds a rep each week, then +${EQ[t.equip].inc} lb once every set hits the top of the range.`}</div></div>`;
}
function photoPick(f,L){const file=f.files&&f.files[0];if(!file)return;const img=new Image(),url=URL.createObjectURL(file);
  img.onload=()=>{const c=document.createElement('canvas'),z=300;c.width=c.height=z;const s=Math.min(img.width,img.height);
    c.getContext('2d').drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,z,z);L.tmp.photo=c.toDataURL('image/jpeg',.82);URL.revokeObjectURL(url);render(L)};img.src=url}
A.custEq=(d,L)=>actionSheet('Equipment',null,Object.keys(EQ).map(k=>({label:EQ[k].label,fn:()=>{L.tmp.equip=k;render(L)}})));
A.custMus=(d,L)=>actionSheet('Main Muscle',null,MUSCLES.map(m=>({label:m,fn:()=>{L.tmp.muscle=m;render(L)}})));
A.custAlso=(d,L)=>push({type:'sheet',sel:L.tmp.also.slice(),cust:L,render:S2=>`<div class="sh"><div class="c" data-a="dismiss">Cancel</div><div class="tt">Also Works</div><div class="d" data-a="alsoDone">Done</div></div>
  <div class="sbody" style="max-height:60vh"><div class="grp" style="margin-top:16px">${ALSO.filter(m=>m!==L.tmp.muscle).map(m=>`<div class="gr" data-a="alsoTog" data-m="${m}"><span>${m}</span>${S2.sel.includes(m)?'<span class="tk">✓</span>':''}</div>`).join('')}</div></div>`});
A.alsoTog=(d,L)=>{const i=L.sel.indexOf(d.m);i>=0?L.sel.splice(i,1):L.sel.push(d.m);render(L)};
A.alsoDone=(d,L)=>{L.cust.tmp.also=L.sel;pop()};
A.custSets=(d,L)=>openSets(L.tmp,'Default Sets & Reps',()=>render(L));
A.custSave=(d,L)=>{const t=L.tmp;if(!t.name.trim())return;const id='c-'+uid();
  S.custom[id]={id,name:t.name.trim(),equip:t.equip,muscle:t.muscle,also:t.also,img:null,photo:t.photo,common:false,custom:true,min:t.min,max:t.max,
    startW:{barbell:45,dumbbell:20,machine:50,cable:30,bodyweight:0}[t.equip]};
  const it=item(id,t.sets,t.min,t.max);if(t.perSet)it.perSet=t.perSet.slice();
  L.addL.edit.draft.items.push(it);save();pop();toast('Added <b>'+esc(t.name.trim())+'</b>')};

/* ---------- live workout ---------- */
A.start=(d,L)=>{
  const w=S.workouts[d.id||L.wid];
  if(S.live&&S.live.wid===w.id)return openLive();
  const go=()=>{S.live={wid:w.id,start:Date.now(),cur:0,rest:null,ex:w.items.map(it=>{const t=target(it),lp=lastPerf(it.exId);
    return {exId:it.exId,last:lp?`${wX(lp.sets[0].w)}${lp.sets.map(s=>s.r).join(' · ')}`:null,
      sets:t.reps.map((r,i)=>({w:t.w,r,tw:t.w,tr:r,wUp:t.wUp,dr:t.fresh||t.wUp?0:r-t.last[i],done:false}))}})};save();openLive()};
  if(S.live)actionSheet('Another workout is in progress',`${S.workouts[S.live.wid]?S.workouts[S.live.wid].name:'A workout'} is still running.`,[
    {label:'Resume It',cls:'bold',fn:()=>openLive()},{label:'Discard It & Start This One',cls:'red',fn:()=>{S.live=null;go()}}]);
  else go();
};
function openLive(instant){push({type:'full',render:liveHTML},instant)}
const allDone=lv=>lv.ex.every(e=>e.sets.every(s=>s.done));
function liveHTML(L){
  if(L&&L.log)return logHTML(L);
  const lv=S.live;if(!lv)return '';const w=S.workouts[lv.wid]||{name:'Workout'};
  const n=lv.ex.length, c=lv.ex[lv.cur], ex=LIB(c.exId), bw=ex.equip==='bodyweight', fin=allDone(lv);
  const firstOpen=c.sets.findIndex(s=>!s.done);
  const sets=c.sets.map((s,i)=>{
    let badge='';
    if(s.done){const dw=s.w-s.tw,dr=s.r-s.tr;if(dw)badge+=`<span class="${dw>0?'up':'dn2'}">${dw>0?'↑':'↓'}${Math.abs(dw)} lb</span>`;if(dr)badge+=`<span class="${dr>0?'up':'dn2'}">${dr>0?'↑':'↓'}${Math.abs(dr)}</span>`}
    else if(s.dr>0)badge=`<span class="up">+${s.dr}</span>`;
    const wTxt=bw?'Body':`${s.w} <small>lb</small>`, rCls=!s.done&&(s.dr>0||s.wUp)?'acc':'', wCls=!s.done&&s.wUp&&!bw?'acc':'';
    return `<div class="st ${s.done?'dn':''} ${i===firstOpen?'on':''}"><span class="k">Set ${i+1}</span>
      <span class="val" data-a="setEdit" data-i="${i}">${bw?'':`<span class="${wCls}">${wTxt}</span> × `}<span class="${rCls}">${s.r}</span>${badge}</span>
      <div class="ckw" data-a="setTog" data-i="${i}"><div class="ck ${s.done?'y':i===firstOpen?'go':''}">${s.done?'✓':''}</div></div></div>`}).join('');
  const sub=e=>{const dn=e.sets.every(s=>s.done),cnt=e.sets.filter(s=>s.done).length;return `${dn?'Done · ':cnt?cnt+' of '+e.sets.length+' sets · ':''}${wX(e.sets[0].tw)}${e.sets.map(s=>s.tr).join(' · ')}`};
  const doneEx=lv.ex.filter(e=>e.sets.every(s=>s.done)).length;
  const wn=fin?'All exercises done':`Exercise ${lv.cur+1} of ${n}${doneEx?` · ${doneEx} done`:''}`;
  const curHead=`<div class="ch"><div class="ic" ${exBg(ex)}></div><div class="t"><div class="n">${esc(ex.name)}</div><div class="m">${c.last?'Last time '+c.last:'First time — go by feel'}</div></div></div>`;
  const rest=`<div class="rest ${lv.rest?'on':''}" id="rest"><div class="bar" id="rbar"></div><div class="rl">Rest<b id="rt">${lv.rest?fmtClock(lv.rest.end-Date.now()+999):'0:00'}</b></div><div class="sk" data-a="restSkip">Skip</div></div>`;
  if(WIDE){
    const side=lv.ex.map((e,i)=>{const x=LIB(e.exId),dn=e.sets.every(s=>s.done);
      return `<div class="w sw ${i===lv.cur?'sel':''} ${dn?'fin':''}" data-a="liveSwitch" data-i="${i}"><div class="ic" ${exBg(x)}></div><div class="t"><div class="n">${esc(x.name)}</div><div class="m">${sub(e)}</div></div>${dn?'<div class="chk">✓</div>':''}</div>`}).join('');
    return `<div class="shell"><div class="side scroll"><div class="elab">Elapsed</div><div class="clock" id="clk">${fmtClock(Date.now()-lv.start)}</div><div class="wn">${wn}</div><div class="swl">${side}</div></div>
    <div class="main"><div class="tbar"><div class="tm">${esc(w.name)}</div><div class="endb" data-a="liveEnd">End</div></div>
    <div class="scroll"><div class="pane"><div class="cur">${curHead}${sets}</div>${fin?`<div class="start fin" data-a="liveFinish">Finish Workout</div>`:''}</div></div>${rest}</div></div>`;
  }
  const others=lv.ex.map((e,i)=>{if(i===lv.cur)return '';const x=LIB(e.exId),dn=e.sets.every(s=>s.done);
    return `<div class="row2 ${dn?'fin':''}" data-a="liveSwitch" data-i="${i}"><div class="ic" ${exBg(x)}></div><div class="t"><div class="n">${esc(x.name)}</div>
    <div class="m">${sub(e)}</div></div>${dn?'<div class="chk">✓</div>':'<span style="color:#48484a;font-size:20px">›</span>'}</div>`}).join('');
  return `<div class="tb"><div class="tm">${esc(w.name)}</div><div class="endb" data-a="liveEnd">End</div></div>
  <div class="scroll"><div class="elab">Elapsed</div><div class="clock" id="clk">${fmtClock(Date.now()-lv.start)}</div>
  <div class="wn">${wn}</div>
  <div class="cur">${curHead}${sets}</div>
  ${others}
  ${fin?`<div class="bottombar" style="position:relative;background:none;padding-top:8px"><div class="start" data-a="liveFinish">Finish Workout</div></div>`:''}
  <div class="spacer"></div></div>${rest}`;
}

/* ---------- view / edit a logged workout ---------- */
A.viewLog=(d,L)=>{const ses=latestSession(d.id||L.wid);if(ses)push({type:'full',log:logFromSession(ses),when:whenLabel(ses.date),wid:ses.wid,render:liveHTML})};
A.logCancel=()=>pop();
A.logDone=(d,L)=>{applyLog(L.log);pop()};
function logHTML(L){
  const lg=L.log,w=S.workouts[L.wid]||{name:'Workout'},c=lg.ex[lg.cur],ex=LIB(c.exId),bw=ex.equip==='bodyweight';
  const firstOpen=c.sets.findIndex(s=>!s.done);
  const sets=c.sets.map((s,i)=>`<div class="st ${s.done?'dn':''} ${i===firstOpen?'on':''}"><span class="k">Set ${i+1}</span>
    <span class="val" data-a="setEdit" data-i="${i}">${bw?'':`${s.w} <small>lb</small> × `}${s.r||'<span class="acc">—</span>'}</span>
    <div class="ckw" data-a="setTog" data-i="${i}"><div class="ck ${s.done?'y':i===firstOpen?'go':''}">${s.done?'✓':''}</div></div></div>`).join('');
  const sub=e=>`${wX(e.sets[0].w)}${e.sets.map(s=>s.r||'—').join(' · ')}`;
  const curHead=`<div class="ch"><div class="ic" ${exBg(ex)}></div><div class="t"><div class="n">${esc(ex.name)}</div></div></div>`;
  const bar=`<div class="@B@ lg"><div class="fade" data-a="logCancel">Cancel</div><div class="tm">${esc(w.name)}</div><div class="fade logd" data-a="logDone">Done</div></div>`;
  const row=(e,i)=>{const x=LIB(e.exId);return `<div class="row2" data-a="liveSwitch" data-i="${i}"><div class="ic" ${exBg(x)}></div><div class="t"><div class="n">${esc(x.name)}</div><div class="m">${sub(e)}</div></div><span style="color:#48484a;font-size:20px">›</span></div>`};
  const lab=`<div class="elab lg">${esc(L.when)}</div>`;
  if(WIDE){
    const side=lg.ex.map((e,i)=>{const x=LIB(e.exId);return `<div class="w sw ${i===lg.cur?'sel':''}" data-a="liveSwitch" data-i="${i}"><div class="ic" ${exBg(x)}></div><div class="t"><div class="n">${esc(x.name)}</div><div class="m">${sub(e)}</div></div></div>`}).join('');
    return `<div class="shell"><div class="side scroll">${lab}<div class="swl">${side}</div></div>
    <div class="main">${bar.replace('@B@','tbar')}<div class="scroll"><div class="pane"><div class="cur">${curHead}${sets}</div></div></div></div></div>`;
  }
  return bar.replace('@B@','tb')+`<div class="scroll">${lab}<div class="cur">${curHead}${sets}</div>${lg.ex.map((e,i)=>i===lg.cur?'':row(e,i)).join('')}<div class="spacer"></div></div>`;
}
function afterLog(lv,setNowDone){
  const w=S.workouts[lv.wid],c=lv.ex[lv.cur];
  if(setNowDone&&w&&w.rest>0&&!allDone(lv))lv.rest={end:Date.now()+w.rest*1000,total:w.rest*1000};
  if(allDone(lv))lv.rest=null;
  if(setNowDone&&c.sets.every(s=>s.done)){const nx=lv.ex.findIndex((e,i)=>i!==lv.cur&&e.sets.some(s=>!s.done));
    if(nx>=0)setTimeout(()=>{if(S.live===lv&&lv.ex[lv.cur]===c){lv.cur=nx;save();const L=stack.find(x=>x.type==='full'&&!x.log);L&&render(L)}},650)}
  save();
}
A.setTog=(d,L)=>{if(L.log){const s=L.log.ex[L.log.cur].sets[+d.i];s.done=!s.done;return render(L)}const lv=S.live,s=lv.ex[lv.cur].sets[+d.i];s.done=!s.done;if(!s.done&&lv.rest)lv.rest=null;afterLog(lv,s.done);render(L)};
A.liveSwitch=(d,L)=>{if(L.log){L.log.cur=+d.i;render(L);const sc=$('.scroll',L.el);sc&&sc.scrollTo({top:0,behavior:'smooth'});return}S.live.cur=+d.i;save();render(L);const sc=$('.scroll',L.el);sc&&sc.scrollTo({top:0,behavior:'smooth'})};
A.restSkip=(d,L)=>{S.live.rest=null;save();tick()};
A.setEdit=(d,L)=>{const lv=L.log||S.live,c=lv.ex[lv.cur],s=c.sets[+d.i],ex=LIB(c.exId);
  push({type:'sheet',live:L,idx:+d.i,ex,tmp:{w:s.w,r:s.r},s,render:setEdHTML})};
function setEdHTML(L){
  const t=L.tmp,s=L.s,bw=L.ex.equip==='bodyweight';
  const was=(v,tv,u)=>L.live.log?'':v===tv?'<div class="was same">Same as goal</div>':`<div class="was">${v>tv?'↑':'↓'} ${Math.abs(v-tv)}${u} from goal</div>`;
  const box=(k,lb,num,w)=>`<div class="bx"><div class="l">${lb}</div><div class="num">${num}</div><div class="pm"><div data-a="lvStep" data-k="${k}" data-d="-1">−</div><div data-a="lvStep" data-k="${k}" data-d="1">+</div></div>${w}</div>`;
  return `<div class="sh"><div class="c" data-a="dismiss">Cancel</div><div class="tt">${esc(L.ex.name)} · Set ${L.idx+1}</div><div style="min-width:60px"></div></div>
  <div class="big2">${bw?'':box('w','Weight',`${t.w}<small> lb</small>`,was(t.w,s.tw,' lb'))}${box('r','Reps',t.r,was(t.r,s.tr,t.r-s.tr===1||s.tr-t.r===1?' rep':' reps'))}</div>
  <div class="log" data-a="lvLog">${s.done?'Save Set':'✓ Log Set'}</div>`;
}
A.lvStep=(d,L)=>{const t=L.tmp,st=L.ex.equip==='machine'?10:5;if(d.k==='w')t.w=Math.max(0,t.w+ +d.d*st);else t.r=Math.max(0,Math.min(99,t.r+ +d.d));render(L)};
A.lvLog=(d,L)=>{const s=L.s,was=s.done;s.w=L.tmp.w;s.r=L.tmp.r;s.done=true;pop();if(L.live.log){render(L.live);return}afterLog(S.live,!was);const F=L.live;F&&render(F)};
A.liveEnd=()=>{const lv=S.live,tot=lv.ex.reduce((a,e)=>a+e.sets.length,0),dn=lv.ex.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0);
  actionSheet('End workout?',`${dn} of ${tot} sets logged · ${fmtClock(Date.now()-lv.start)}`,[
    {label:'Finish & Save',cls:'bold'+(dn?'':' dis'),fn:finishLive},{label:'Discard Workout',cls:'red',fn:()=>{S.live=null;save();pop();toast('Workout discarded')}}])};
A.liveFinish=()=>finishLive();
function finishLive(){
  const lv=S.live;if(!lv)return;const w=S.workouts[lv.wid];
  const ses={id:uid(),wid:lv.wid,date:Date.now(),dur:Date.now()-lv.start,ex:lv.ex.map(e=>({exId:e.exId,sets:e.sets.filter(s=>s.done).map(s=>({w:s.w,r:s.r}))})).filter(e=>e.sets.length)};
  S.sessions.unshift(ses);S.live=null;save();
  const pi=S.plans.findIndex(p=>p.workouts.includes(lv.wid));if(pi>=0)S.activePlan=S.plans[pi].id;
  popTo(stack[0]);toast(`Saved <b>${esc(w?w.name:'Workout')}</b> · ${Math.max(1,Math.round(ses.dur/60e3))} min`);
}
function tick(){
  const lv=S&&S.live;if(!lv)return;const F=stack.find(x=>x.type==='full'&&!x.log);if(!F||!F.el)return;
  const clk=$('#clk',F.el);if(clk)clk.textContent=fmtClock(Date.now()-lv.start);
  const r=$('#rest',F.el);if(!r)return;
  if(lv.rest&&Date.now()>=lv.rest.end){lv.rest=null;save();try{navigator.vibrate&&navigator.vibrate(200)}catch(_){}}
  r.classList.toggle('on',!!lv.rest);
  if(lv.rest){const left=lv.rest.end-Date.now();$('#rt',F.el).textContent=fmtClock(left+999);$('#rbar',F.el).style.width=(100*left/lv.rest.total)+'%'}
}
setInterval(tick,250);

/* ---------- new plan & builder ---------- */
A.planNew=()=>{pop();setTimeout(()=>push({type:'sheet',cls:'tall',pd:{name:'',workouts:[]},render:npHTML,
  after:L=>bindReorder($('#pwl',L.el),'.ex2[data-idx]',(f,t)=>{move(L.pd.workouts,f,t);render(L)})}),200)};
function npHTML(L){
  const p=L.pd;
  return `<div class="sh"><div class="c" data-a="dismiss">Cancel</div><div class="tt">New Plan</div><div class="d ${p.name.trim()&&p.workouts.length?'':'off'}" data-a="npSave">Save</div></div>
  <div class="sbody"><div class="nf"><input data-in="pname" value="${esc(p.name)}" placeholder="Plan Name" maxlength="28"></div>
  <div class="gl" style="margin-top:20px">Workouts</div>
  <div class="grp"><div id="pwl">${p.workouts.map((w,i)=>`<div class="ex2" data-idx="${i}"><div class="minus" data-a="npDel" data-i="${i}">–</div><div class="im" ${bg(iconImg(w.icon))}></div>
    <div class="nm">${esc(w.name)}<small>${w.items.length} exercise${w.items.length===1?'':'s'}</small></div><div class="grip" data-grip>≡</div></div>`).join('')}</div>
    <div class="add" data-a="npAdd" style="background:var(--pill)"><span class="plus">+</span>Add Workout</div></div>
  <div class="hint">Do them in any order during the week. Drag ≡ to reorder.</div>
  <div class="gen" data-a="buildOpen">Not sure where to start? <span>Build one for me</span></div></div>`;
}
A.npDel=(d,L)=>{L.pd.workouts.splice(+d.i,1);render(L)};
A.npAdd=(d,L)=>{const all=Object.values(S.workouts);
  actionSheet('Add Workout',null,[{label:'New Empty Workout',cls:'bold',fn:()=>{L.pd.workouts.push(mkWorkout('Workout '+(L.pd.workouts.length+1),'chest',[]));render(L)}},
    ...all.map(w=>({label:'Copy “'+w.name+'”',fn:()=>{const c=clone(w);c.id=uid();L.pd.workouts.push(c);render(L)}}))])};
A.npSave=(d,L)=>{const p=L.pd;if(!p.name.trim()||!p.workouts.length)return;p.workouts.forEach(w=>S.workouts[w.id]=w);
  const np={id:uid(),name:p.name.trim(),workouts:p.workouts.map(w=>w.id)};S.plans.push(np);S.activePlan=np.id;save();pop();toast('Created <b>'+esc(np.name)+'</b>')};
A.buildOpen=(d,L)=>push({type:'sheet',cls:'tall',np:L,b:{days:4,goal:'Muscle',equip:'Full Gym',time:'60m'},render:buildHTML});
const BOPT={days:[2,3,4,5,6],goal:['Strength','Muscle','Fitness'],equip:['Full Gym','Dumbbells','Body Only'],time:['30m','45m','60m','90m']};
function buildHTML(L){
  const seg=(k,q)=>`<div class="q">${q}</div><div class="seg y">${BOPT[k].map(v=>`<div class="${L.b[k]==v?'on':''}" data-a="bSel" data-k="${k}" data-v="${v}">${v}</div>`).join('')}</div>`;
  return `<div class="sh"><div class="c" data-a="pop">‹ Back</div><div class="tt">Build a Plan</div><div style="min-width:60px"></div></div>
  <div class="sbody"><div class="intro">Answer four quick questions and we'll set up the workouts. You can change anything after.</div>
  ${seg('days','Days per week')}${seg('goal','Main goal')}${seg('equip','Equipment')}${seg('time','Time per workout')}
  <div class="start" data-a="buildGo">Build Plan</div></div>`;
}
A.bSel=(d,L)=>{L.b[d.k]=d.k==='days'?+d.v:d.v;render(L)};
const SPLITS={
 2:[['Upper Body','chest',['Chest','Back','Shoulders','Biceps','Triceps','Chest']],['Lower Body','quads',['Legs','Legs','Core','Legs','Core','Legs']]],
 3:[['Push','chest',['Chest','Shoulders','Triceps','Chest','Shoulders','Triceps']],['Pull','back',['Back','Biceps','Back','Shoulders','Biceps','Back']],['Legs','quads',['Legs','Legs','Core','Legs','Legs','Core']]],
 4:[['Chest & Triceps','chest',['Chest','Chest','Triceps','Chest','Triceps','Chest']],['Back & Biceps','back',['Back','Back','Biceps','Back','Biceps','Back']],['Legs','quads',['Legs','Legs','Legs','Legs','Core','Legs']],['Shoulders & Core','shoulders',['Shoulders','Shoulders','Core','Shoulders','Core','Shoulders']]],
 5:[['Chest','chest',['Chest','Chest','Chest','Triceps','Chest','Chest']],['Back','back',['Back','Back','Back','Biceps','Back','Back']],['Legs','quads',['Legs','Legs','Legs','Legs','Legs','Core']],['Shoulders & Core','shoulders',['Shoulders','Shoulders','Shoulders','Core','Core','Shoulders']],['Arms','bicep',['Biceps','Triceps','Biceps','Triceps','Biceps','Triceps']]],
 6:[['Push A','chest',['Chest','Shoulders','Triceps','Chest','Triceps','Shoulders']],['Pull A','back',['Back','Biceps','Back','Shoulders','Biceps','Back']],['Legs A','quads',['Legs','Legs','Core','Legs','Legs','Core']],
    ['Push B','shoulders',['Shoulders','Chest','Triceps','Chest','Shoulders','Triceps']],['Pull B','rear-delts',['Back','Back','Biceps','Shoulders','Biceps','Back']],['Legs B','hamstrings',['Legs','Legs','Core','Legs','Core','Legs']]]};
function buildPlan(b){
  const okEq={'Full Gym':()=>true,'Dumbbells':e=>e==='dumbbell'||e==='bodyweight','Body Only':e=>e==='bodyweight'}[b.equip];
  const n={'30m':3,'45m':4,'60m':5,'90m':6}[b.time], shift=b.days===6;
  const pref=e=>(e.common?0:2)+(b.goal==='Strength'&&e.equip==='barbell'?-1:0)+(b.goal==='Fitness'&&(e.equip==='cable'||e.equip==='machine'||e.equip==='bodyweight')?-1:0);
  return SPLITS[b.days].map(([name,icon,pattern],wi)=>{
    const used=new Set(),items=[];
    for(const m of pattern){if(items.length>=n)break;
      let pool=Object.values(LIBB).filter(e=>e.muscle===m&&okEq(e.equip)&&!used.has(e.id)).sort((a,c)=>pref(a)-pref(c));
      if(shift&&wi>=3&&pool.length>1)pool.push(pool.shift());
      const e=pool[0];if(!e)continue;used.add(e.id);
      let mn=e.min,mx=e.max;if(b.goal==='Strength'){[mn,mx]=e.equip==='barbell'?[4,6]:[6,8]}else if(b.goal==='Fitness'){[mn,mx]=[12,15]}
      if(e.equip==='bodyweight'&&b.goal!=='Fitness'){mn=Math.max(mn,e.min);mx=Math.max(mx,e.max)}
      items.push(item(e.id,b.goal==='Strength'&&e.equip==='barbell'?4:3,mn,mx));
    }
    return mkWorkout(name,icon,items,b.goal==='Strength'?180:b.goal==='Fitness'?60:120);
  });
}
A.buildGo=(d,L)=>{const p=L.np.pd;p.workouts=buildPlan(L.b);if(!p.name.trim())p.name=`${L.b.days}-Day ${L.b.goal}`;pop();toast('Built <b>'+p.workouts.length+' workouts</b> — review & save')};

/* ---------- events & boot ---------- */
app.addEventListener('click',e=>{
  const t=e.target.closest('[data-a]');if(!t)return;
  if(Date.now()<busyUntil&&!['setTog','lvStep','psStep','ruleStep'].includes(t.dataset.a))return;
  const L=layerOf(t),fn=A[t.dataset.a];
  if(fn){e.preventDefault();fn(t.dataset,L,t,e)}else console.warn('no action',t.dataset.a);
});
app.addEventListener('input',e=>{
  const t=e.target,k=t.dataset&&t.dataset.in;if(!k)return;const L=layerOf(t);
  if(k==='wname')L.draft.name=t.value;
  else if(k==='q'){L.q=t.value;$('#axb',L.el).innerHTML=addBody(L)}
  else if(k==='cname'){L.tmp.name=t.value;$('.sh .d',L.el).classList.toggle('off',!t.value.trim())}
  else if(k==='pname'){L.pd.name=t.value;$('.sh .d',L.el).classList.toggle('off',!(t.value.trim()&&L.pd.workouts.length))}
});
app.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT')e.target.blur()});
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const t=topL();if(t&&t.type!=='full'&&stack.length>1)dismiss(t)});

document.addEventListener('gesturestart',e=>e.preventDefault());
document.addEventListener('visibilitychange',()=>{if(!document.hidden){refreshAll();tick()}});

S=load()||seed();save();
push({type:'screen',render:planHTML},true);
if(S.live)openLive(true);
