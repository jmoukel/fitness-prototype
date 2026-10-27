'use strict';
/* Shared data model for the phone + watch prototypes — fake data only, nothing leaves the device. */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9);
const clone=o=>JSON.parse(JSON.stringify(o));
const DAY=864e5, KEY='fitproto.v1';
const ASSET=window.ASSET_BASE||'';

/* ---------- reference data ---------- */
const EQ={barbell:{label:'Barbell',inc:10},dumbbell:{label:'Dumbbell',inc:5},machine:{label:'Machine',inc:10},cable:{label:'Cable',inc:10},bodyweight:{label:'Bodyweight',inc:0}};
const MUSCLES=['Chest','Triceps','Back','Biceps','Shoulders','Legs','Core'];
const ICONS=[['chest','Chest'],['back','Back'],['traps','Traps'],['shoulders','Shoulders'],['rear-delts','Rear Delts'],['bicep','Biceps'],['tricep','Triceps'],['forearm','Forearms'],
['abs','Abs'],['obliques','Obliques'],['lower-back','Lower Back'],['glutes','Glutes'],['quads','Quads'],['hamstrings','Hamstrings'],['calves','Calves'],['adductors','Adductors'],
['abductors','Abductors'],['hip-flexors','Hip Flexors'],['serratus','Serratus'],['neck','Neck']];
const ICON_MUSCLE={chest:'Chest',back:'Back',traps:'Back',shoulders:'Shoulders','rear-delts':'Shoulders',bicep:'Biceps',tricep:'Triceps',forearm:'Biceps',abs:'Core',obliques:'Core','lower-back':'Back',
glutes:'Legs',quads:'Legs',hamstrings:'Legs',calves:'Legs',adductors:'Legs',abductors:'Legs','hip-flexors':'Core',serratus:'Core',neck:'Shoulders'};
// id, name, equip, muscle, also, img, common, min, max, start weight
const BUILTIN=[
['bench-press','Bench Press','barbell','Chest',['Triceps','Front Delts'],'bench-press',1,6,8,135],
['incline-bench','Incline Bench Press','barbell','Chest',['Front Delts','Triceps'],'incline-bench-press',0,6,8,115],
['incline-db','Incline DB Press','dumbbell','Chest',['Front Delts','Triceps'],'incline-db-press',1,8,10,50],
['db-bench','DB Bench Press','dumbbell','Chest',['Triceps'],null,0,8,10,55],
['db-fly','DB Fly','dumbbell','Chest',['Front Delts'],'db-fly',0,10,12,25],
['cable-crossover','Cable Crossover','cable','Chest',['Front Delts'],'cable-crossover',1,12,15,30],
['chest-press','Machine Chest Press','machine','Chest',['Triceps'],'chest-press',1,10,12,120],
['pec-deck','Pec Deck','machine','Chest',[],null,0,12,15,100],
['push-up','Push-Up','bodyweight','Chest',['Triceps','Core'],'push-up',1,12,20,0],
['dips','Dips','bodyweight','Triceps',['Chest'],null,1,10,12,0],
['pushdown','Pushdown','cable','Triceps',[],null,1,10,12,40],
['close-grip-bench','Close-Grip Bench','barbell','Triceps',['Chest'],null,0,6,8,115],
['skull-crusher','Skull Crusher','barbell','Triceps',[],null,0,8,10,60],
['oh-ext','Overhead DB Extension','dumbbell','Triceps',[],null,0,10,12,40],
['diamond-push-up','Diamond Push-Up','bodyweight','Triceps',['Chest'],null,0,10,15,0],
['deadlift','Deadlift','barbell','Back',['Hamstrings','Glutes'],null,1,4,6,225],
['barbell-row','Barbell Row','barbell','Back',['Biceps'],null,1,6,8,135],
['pull-up','Pull-Up','bodyweight','Back',['Biceps'],null,1,6,10,0],
['lat-pulldown','Lat Pulldown','machine','Back',['Biceps'],null,1,8,10,120],
['seated-row','Seated Cable Row','cable','Back',['Biceps'],null,1,10,12,120],
['db-row','One-Arm DB Row','dumbbell','Back',['Biceps'],null,0,8,10,60],
['inverted-row','Inverted Row','bodyweight','Back',['Biceps'],null,0,8,12,0],
['barbell-curl','Barbell Curl','barbell','Biceps',['Forearms'],null,1,8,10,65],
['db-curl','DB Curl','dumbbell','Biceps',[],null,1,10,12,25],
['hammer-curl','Hammer Curl','dumbbell','Biceps',['Forearms'],null,1,10,12,25],
['cable-curl','Cable Curl','cable','Biceps',[],null,0,12,15,40],
['chin-up','Chin-Up','bodyweight','Biceps',['Back'],null,0,6,10,0],
['ohp','Overhead Press','barbell','Shoulders',['Triceps'],null,1,5,8,95],
['db-shoulder-press','DB Shoulder Press','dumbbell','Shoulders',['Triceps'],null,1,8,10,40],
['lateral-raise','Lateral Raise','dumbbell','Shoulders',[],null,1,12,15,15],
['face-pull','Face Pull','cable','Shoulders',['Rear Delts'],null,1,12,15,40],
['rear-delt-fly','Rear Delt Machine','machine','Shoulders',['Rear Delts'],null,0,12,15,70],
['pike-push-up','Pike Push-Up','bodyweight','Shoulders',['Triceps'],null,0,8,12,0],
['squat','Back Squat','barbell','Legs',['Glutes'],null,1,5,8,185],
['rdl','Romanian Deadlift','barbell','Legs',['Hamstrings','Glutes'],null,1,8,10,135],
['leg-press','Leg Press','machine','Legs',['Glutes'],null,1,10,12,270],
['leg-extension','Leg Extension','machine','Legs',[],null,0,12,15,90],
['leg-curl','Leg Curl','machine','Legs',['Hamstrings'],null,1,10,12,70],
['goblet-squat','Goblet Squat','dumbbell','Legs',['Glutes'],null,0,10,12,50],
['walking-lunge','Walking Lunge','dumbbell','Legs',['Glutes'],null,0,10,12,30],
['db-rdl','DB Romanian Deadlift','dumbbell','Legs',['Hamstrings'],null,0,10,12,40],
['calf-raise','Calf Raise','machine','Legs',['Calves'],null,0,12,15,120],
['bw-squat','Air Squat','bodyweight','Legs',[],null,0,15,25,0],
['reverse-lunge','Reverse Lunge','bodyweight','Legs',['Glutes'],null,0,10,15,0],
['glute-bridge','Glute Bridge','bodyweight','Legs',['Glutes'],null,0,12,20,0],
['hanging-leg-raise','Hanging Leg Raise','bodyweight','Core',[],null,1,10,15,0],
['cable-crunch','Cable Crunch','cable','Core',[],null,1,12,15,50],
['crunch','Crunch','bodyweight','Core',[],null,0,15,25,0],
['ab-wheel','Ab Wheel Rollout','bodyweight','Core',[],null,0,8,12,0],
['russian-twist','Russian Twist','dumbbell','Core',['Obliques'],null,0,15,20,15],
];
const LIBB={};BUILTIN.forEach(a=>LIBB[a[0]]={id:a[0],name:a[1],equip:a[2],muscle:a[3],also:a[4],img:a[5],common:!!a[6],min:a[7],max:a[8],startW:a[9]});

/* ---------- state ---------- */
let S;
const LIB=id=>LIBB[id]||(S.custom&&S.custom[id])||{id,name:'Exercise',equip:'dumbbell',muscle:'Chest',also:[],min:8,max:10,startW:20};
const allEx=()=>[...Object.values(LIBB),...Object.values(S.custom||{})];
const exImg=e=>e.photo||(ASSET+'img/ex/'+(e.img||(e.custom?'default':'generic'))+'.png?v=2');
const exBg=e=>`style="background-image:url('${exImg(e)}')${e.photo?'':e.img?';background-color:transparent;background-size:contain':';background-color:#28282a'}"`;
const iconImg=ic=>ASSET+'img/icons/'+ic+'.png';
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){console.warn(e)}}
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&s.v===1)return s}catch(e){}return null}

const startOfDay=t=>{const d=new Date(t);d.setHours(0,0,0,0);return d.getTime()};
const weekStart=t=>{const d=new Date(startOfDay(t));const wd=(d.getDay()+6)%7;return d.getTime()-wd*DAY};
const isThisWeek=t=>t>=weekStart(Date.now());
function ago(t,long){const days=Math.round((startOfDay(Date.now())-startOfDay(t))/DAY);
  if(days<=0)return 'Today';if(days===1)return 'Yesterday';return long?days+' days ago':days+'d ago'}
const fmtDate=t=>new Date(t).toLocaleDateString('en-US',{month:'short',day:'numeric'});
const wLabel=w=>w>0?w+' lb':'Body';
const wX=w=>w>0?w+' lb × ':'';

function item(exId,sets,min,max){const e=LIB(exId);return {exId,sets:sets||3,min:min||e.min,max:max||e.max,perSet:null,rule:null}}
function mkWorkout(name,icon,items,rest){return {id:uid(),name,icon,rest:rest==null?180:rest,items}}

function reverseStep(w,reps,it,ex){
  const n=reps.length, r=reps.slice();
  for(let i=n-1;i>=0;i--){ if(r[i]>it.min&&(i===n-1||r[i]>r[i+1])){r[i]--;return [w,r]} }
  const inc=EQ[ex.equip].inc;
  if(ex.equip!=='bodyweight'&&w-inc>0) return [w-inc,r.map(()=>it.max)];
  return [w,r];
}
function seed(){
  const now=Date.now(), t0=startOfDay(now), H=36e5;
  const ws={};
  const W=(name,icon,list)=>{const w=mkWorkout(name,icon,list.map(x=>Object.assign(item(x[0],x[1],x[2],x[3]),{_last:x[4]})));ws[w.id]=w;return w};
  const chest=W('Chest & Triceps','chest',[['bench-press',3,6,8,[185,[8,8,7]]],['incline-db',3,8,10,[65,[10,10,10]]],['dips',3,10,12,[0,[12,11,10]]],['pushdown',3,10,12,[50,[12,12,12]]]]);
  const back=W('Back & Biceps','back',[['deadlift',3,4,6,[275,[5,5,4]]],['lat-pulldown',3,8,10,[140,[10,10,10]]],['barbell-row',3,6,8,[155,[7,7,6]]],['db-curl',3,10,12,[30,[11,10,10]]],['hammer-curl',3,10,12,[30,[12,12,12]]]]);
  const legs=W('Legs','quads',[['squat',3,5,8,[225,[6,6,5]]],['rdl',3,8,10,[185,[9,8,8]]],['leg-press',3,10,12,[360,[12,12,12]]],['leg-curl',3,10,12,[90,[11,11,10]]],['calf-raise',3,12,15,[150,[15,14,13]]]]);
  const sh=W('Shoulders & Core','shoulders',[['ohp',3,5,8,[115,[7,6,6]]],['lateral-raise',3,12,15,[20,[15,15,15]]],['face-pull',3,12,15,[50,[13,12,12]]],['hanging-leg-raise',3,10,15,[0,[12,11,10]]],['cable-crunch',3,12,15,[70,[14,13,12]]]]);
  const fb=W('Full Body DB','glutes',[['goblet-squat',3,10,12,[55,[11,10,10]]],['db-bench',3,8,10,[60,[10,9,9]]],['db-row',3,8,10,[65,[10,10,10]]],['db-shoulder-press',3,8,10,[40,[9,8,8]]]]);
  const bwk=W('Bodyweight','abs',[['push-up',3,12,20,[0,[20,18,15]]],['pull-up',3,6,10,[0,[9,8,7]]],['reverse-lunge',3,10,15,[0,[14,12,12]]],['crunch',3,15,25,[0,[22,20,18]]]]);
  const sessions=[];
  const hist=(w,daysAgo,hour,weeks)=>{
    const perf={};w.items.forEach(it=>perf[it.exId]=[it._last[0],it._last[1].slice()]);
    for(let k=0;k<weeks;k++){
      let date=t0-(daysAgo+7*k)*DAY+hour*H; if(date>now-20*60e3) date=now-3*H;
      sessions.push({id:uid(),wid:w.id,date,dur:(42+((k*7+daysAgo*3)%21))*60e3,
        ex:w.items.map(it=>({exId:it.exId,sets:perf[it.exId][1].map(r=>({w:perf[it.exId][0],r}))}))});
      w.items.forEach(it=>{perf[it.exId]=reverseStep(perf[it.exId][0],perf[it.exId][1],it,LIB(it.exId))});
    }
  };
  hist(back,0,7,6);hist(legs,2,18,6);hist(sh,6,7.5,6);hist(chest,8,18.5,6);hist(fb,10,8,3);hist(bwk,13,9,3);
  Object.values(ws).forEach(w=>w.items.forEach(it=>delete it._last));
  sessions.sort((a,b)=>b.date-a.date);
  return {v:1,plans:[{id:'p1',name:'Muscle Split',workouts:[chest.id,back.id,legs.id,sh.id]},{id:'p2',name:'Home / Travel',workouts:[fb.id,bwk.id]}],
    activePlan:'p1',workouts:ws,custom:{},favs:[],sessions,live:null};
}

/* ---------- progression ---------- */
function bounds(it){const n=it.perSet?it.perSet.length:it.sets;return Array.from({length:n},(_,i)=>it.perSet?[it.perSet[i],it.perSet[i]]:[it.min,it.max])}
const incFor=(it,ex)=>it.rule?it.rule.addWeight:EQ[ex.equip].inc;
const addRepsFor=it=>it.rule?it.rule.addReps:1;
function lastPerf(exId){for(const s of S.sessions){const e=s.ex.find(x=>x.exId===exId);if(e&&e.sets.length)return {date:s.date,sets:e.sets}}return null}
function target(it){
  const ex=LIB(it.exId), b=bounds(it), bw=ex.equip==='bodyweight', basis=lastPerf(it.exId);
  if(!basis) return {w:bw?0:ex.startW,reps:b.map(x=>x[0]),wUp:false,changed:b.map(()=>false),chip:null,fresh:true};
  const ls=basis.sets, lastW=ls[0].w, lr=b.map((_,i)=>(ls[i]||ls[ls.length-1]).r), inc=incFor(it,ex);
  if(!bw&&inc>0&&lr.every((r,i)=>r>=b[i][1])) return {w:lastW+inc,reps:b.map(x=>x[0]),wUp:true,changed:b.map(()=>true),chip:'+'+inc+' lb',last:lr};
  const reps=lr.map((r,i)=>bw?Math.max(r,b[i][0]):Math.min(Math.max(r,b[i][0]),b[i][1]));
  for(let k=0;k<addRepsFor(it);k++){let i=reps.findIndex((r,j)=>r<b[j][1]);
    if(i<0){if(!bw)break;i=reps.indexOf(Math.min(...reps))} reps[i]++}
  const added=reps.reduce((a,r,i)=>a+r-lr[i],0);
  return {w:lastW,reps,wUp:false,changed:reps.map((r,i)=>r!==lr[i]),chip:added>0?'+'+added+(added>1?' reps':' rep'):null,last:lr};
}
function tvHTML(t){
  if(t.fresh) return `<div class="tv pl">${wX(t.w)}${t.reps.join(' · ')}</div>`;
  const w=!(t.w>0)?'':(t.wUp?`<b>${wLabel(t.w)}</b> × `:wLabel(t.w)+' × ');
  const reps=t.wUp?`<b>${t.reps.join(' · ')}</b>`:t.reps.map((r,i)=>t.changed[i]?`<b>${r}</b>`:r).join(' · ');
  return `<div class="tv">${w}${reps}</div>`;
}
const pillTxt=it=>it.perSet?`${it.perSet.length} × ${it.perSet.join('/')}`:`${it.sets} × ${it.min===it.max?it.min:it.min+'–'+it.max}`;
const restTxt=s=>!s?'Off':(s%60?(s/60).toFixed(1).replace('.0',''):s/60)+' min';
const lastDone=wid=>{const s=S.sessions.find(x=>x.wid===wid);return s?s.date:null};
const curPlan=()=>S.plans.find(p=>p.id===S.activePlan)||S.plans[0];
const fmtClock=ms=>{const s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s/60)%60,x=s%60;return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0')};
