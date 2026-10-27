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
['db-bench','DB Bench Press','dumbbell','Chest',['Triceps'],'db-bench',0,8,10,55],
['db-fly','DB Fly','dumbbell','Chest',['Front Delts'],'db-fly',0,10,12,25],
['cable-crossover','Cable Crossover','cable','Chest',['Front Delts'],'cable-crossover',1,12,15,30],
['chest-press','Machine Chest Press','machine','Chest',['Triceps'],'chest-press',1,10,12,120],
['pec-deck','Pec Deck','machine','Chest',[],'pec-deck',0,12,15,100],
['push-up','Push-Up','bodyweight','Chest',['Triceps','Core'],'push-up',1,12,20,0],
['dips','Dips','bodyweight','Triceps',['Chest'],'dips',1,10,12,0],
['pushdown','Pushdown','cable','Triceps',[],'pushdown',1,10,12,40],
['close-grip-bench','Close-Grip Bench','barbell','Triceps',['Chest'],'close-grip-bench',0,6,8,115],
['skull-crusher','Skull Crusher','barbell','Triceps',[],'skull-crusher',0,8,10,60],
['oh-ext','Overhead DB Extension','dumbbell','Triceps',[],'oh-ext',0,10,12,40],
['diamond-push-up','Diamond Push-Up','bodyweight','Triceps',['Chest'],'diamond-push-up',0,10,15,0],
['deadlift','Deadlift','barbell','Back',['Hamstrings','Glutes'],'deadlift',1,4,6,225],
['barbell-row','Barbell Row','barbell','Back',['Biceps'],'barbell-row',1,6,8,135],
['pull-up','Pull-Up','bodyweight','Back',['Biceps'],'pull-up',1,6,10,0],
['lat-pulldown','Lat Pulldown','machine','Back',['Biceps'],'lat-pulldown',1,8,10,120],
['seated-row','Seated Cable Row','cable','Back',['Biceps'],'seated-row',1,10,12,120],
['db-row','One-Arm DB Row','dumbbell','Back',['Biceps'],'db-row',0,8,10,60],
['inverted-row','Inverted Row','bodyweight','Back',['Biceps'],'inverted-row',0,8,12,0],
['barbell-curl','Barbell Curl','barbell','Biceps',['Forearms'],'barbell-curl',1,8,10,65],
['db-curl','DB Curl','dumbbell','Biceps',[],'db-curl',1,10,12,25],
['hammer-curl','Hammer Curl','dumbbell','Biceps',['Forearms'],'hammer-curl',1,10,12,25],
['cable-curl','Cable Curl','cable','Biceps',[],'cable-curl',0,12,15,40],
['chin-up','Chin-Up','bodyweight','Biceps',['Back'],'chin-up',0,6,10,0],
['ohp','Overhead Press','barbell','Shoulders',['Triceps'],'ohp',1,5,8,95],
['db-shoulder-press','DB Shoulder Press','dumbbell','Shoulders',['Triceps'],'db-shoulder-press',1,8,10,40],
['lateral-raise','Lateral Raise','dumbbell','Shoulders',[],'lateral-raise',1,12,15,15],
['face-pull','Face Pull','cable','Shoulders',['Rear Delts'],'face-pull',1,12,15,40],
['rear-delt-fly','Rear Delt Machine','machine','Shoulders',['Rear Delts'],'rear-delt-fly',0,12,15,70],
['pike-push-up','Pike Push-Up','bodyweight','Shoulders',['Triceps'],'pike-push-up',0,8,12,0],
['squat','Back Squat','barbell','Legs',['Glutes'],'squat',1,5,8,185],
['rdl','Romanian Deadlift','barbell','Legs',['Hamstrings','Glutes'],'rdl',1,8,10,135],
['leg-press','Leg Press','machine','Legs',['Glutes'],'leg-press',1,10,12,270],
['leg-extension','Leg Extension','machine','Legs',[],'leg-extension',0,12,15,90],
['leg-curl','Leg Curl','machine','Legs',['Hamstrings'],'leg-curl',1,10,12,70],
['goblet-squat','Goblet Squat','dumbbell','Legs',['Glutes'],'goblet-squat',0,10,12,50],
['walking-lunge','Walking Lunge','dumbbell','Legs',['Glutes'],'walking-lunge',0,10,12,30],
['db-rdl','DB Romanian Deadlift','dumbbell','Legs',['Hamstrings'],'db-rdl',0,10,12,40],
['calf-raise','Calf Raise','machine','Legs',['Calves'],'calf-raise',0,12,15,120],
['bw-squat','Air Squat','bodyweight','Legs',[],'bw-squat',0,15,25,0],
['reverse-lunge','Reverse Lunge','bodyweight','Legs',['Glutes'],'reverse-lunge',0,10,15,0],
['glute-bridge','Glute Bridge','bodyweight','Legs',['Glutes'],'glute-bridge',0,12,20,0],
['hanging-leg-raise','Hanging Leg Raise','bodyweight','Core',[],'hanging-leg-raise',1,10,15,0],
['cable-crunch','Cable Crunch','cable','Core',[],'cable-crunch',1,12,15,50],
['crunch','Crunch','bodyweight','Core',[],'crunch',0,15,25,0],
['ab-wheel','Ab Wheel Rollout','bodyweight','Core',[],'ab-wheel',0,8,12,0],
['russian-twist','Russian Twist','dumbbell','Core',['Obliques'],'russian-twist',0,15,20,15],
// full library additions (from fitness-exercises.txt)
['decline-bench-press','Decline Bench Press','barbell','Chest',['Triceps','Front Delts'],'decline-bench-press',0,6,8,135],
['incline-db-fly','Incline DB Fly','dumbbell','Chest',['Front Delts'],'incline-db-fly',0,10,12,20],
['db-pullover','DB Pullover','dumbbell','Chest',['Back','Triceps'],'db-pullover',0,10,12,40],
['incline-machine-press','Incline Machine Press','machine','Chest',['Front Delts','Triceps'],'incline-machine-press',0,10,12,100],
['smith-machine-bench-press','Smith Machine Bench Press','machine','Chest',['Triceps','Front Delts'],'smith-machine-bench-press',0,8,10,115],
['smith-machine-incline-press','Smith Machine Incline Press','machine','Chest',['Front Delts','Triceps'],'smith-machine-incline-press',0,8,10,95],
['low-to-high-cable-fly','Low-to-High Cable Fly','cable','Chest',['Front Delts'],'low-to-high-cable-fly',0,12,15,20],
['decline-push-up','Decline Push-Up','bodyweight','Chest',['Triceps','Front Delts'],'decline-push-up',0,10,15,0],
['incline-push-up','Incline Push-Up','bodyweight','Chest',['Triceps','Core'],'incline-push-up',0,12,20,0],
['pendlay-row','Pendlay Row','barbell','Back',['Biceps','Rear Delts'],'pendlay-row',0,5,8,135],
['t-bar-row','T-Bar Row','barbell','Back',['Biceps','Rear Delts'],'t-bar-row',0,8,10,90],
['rack-pull','Rack Pull','barbell','Back',['Traps','Glutes'],'rack-pull',0,4,6,225],
['chest-supported-db-row','Chest-Supported DB Row','dumbbell','Back',['Biceps','Rear Delts'],'chest-supported-db-row',0,8,12,40],
['machine-row','Machine Row','machine','Back',['Biceps','Rear Delts'],'machine-row',0,10,12,100],
['close-grip-lat-pulldown','Close-Grip Lat Pulldown','machine','Back',['Biceps'],'close-grip-lat-pulldown',0,8,12,110],
['assisted-pull-up','Assisted Pull-Up','machine','Back',['Biceps'],'assisted-pull-up',0,8,12,60],
['straight-arm-pulldown','Straight-Arm Pulldown','cable','Back',['Core'],'straight-arm-pulldown',0,12,15,40],
['single-arm-cable-row','Single-Arm Cable Row','cable','Back',['Biceps'],'single-arm-cable-row',0,10,12,50],
['back-extension','Back Extension','bodyweight','Back',['Glutes','Hamstrings'],'back-extension',0,12,15,0],
['push-press','Push Press','barbell','Shoulders',['Triceps','Quads'],'push-press',0,4,6,115],
['upright-row','Upright Row','barbell','Shoulders',['Traps','Biceps'],'upright-row',0,8,12,65],
['arnold-press','Arnold Press','dumbbell','Shoulders',['Triceps'],'arnold-press',0,8,12,35],
['front-raise','Front Raise','dumbbell','Shoulders',['Chest'],'front-raise',0,10,15,15],
['db-rear-delt-fly','DB Rear Delt Fly','dumbbell','Shoulders',['Traps'],'db-rear-delt-fly',0,12,15,15],
['machine-shoulder-press','Machine Shoulder Press','machine','Shoulders',['Triceps'],'machine-shoulder-press',0,8,12,80],
['cable-lateral-raise','Cable Lateral Raise','cable','Shoulders',['Traps'],'cable-lateral-raise',0,12,15,15],
['cable-rear-delt-fly','Cable Rear Delt Fly','cable','Shoulders',['Traps'],'cable-rear-delt-fly',0,12,15,15],
['smith-machine-shoulder-press','Smith Machine Shoulder Press','machine','Shoulders',['Triceps'],'smith-machine-shoulder-press',0,8,10,75],
['kettlebell-press','Kettlebell Press','dumbbell','Shoulders',['Triceps','Core'],'kettlebell-press',0,8,10,35],
['barbell-shrug','Barbell Shrug','barbell','Back',['Traps','Forearms'],'barbell-shrug',0,8,12,185],
['db-shrug','DB Shrug','dumbbell','Back',['Traps','Forearms'],'db-shrug',0,10,15,60],
['machine-shrug','Machine Shrug','machine','Back',['Traps','Forearms'],'machine-shrug',0,10,15,150],
['ez-bar-curl','EZ-Bar Curl','barbell','Biceps',['Forearms'],'ez-bar-curl',0,8,12,60],
['preacher-curl','Preacher Curl','barbell','Biceps',['Forearms'],'preacher-curl',0,8,12,55],
['incline-db-curl','Incline DB Curl','dumbbell','Biceps',['Forearms'],'incline-db-curl',0,10,12,20],
['concentration-curl','Concentration Curl','dumbbell','Biceps',['Forearms'],'concentration-curl',0,10,12,20],
['machine-preacher-curl','Machine Preacher Curl','machine','Biceps',['Forearms'],'machine-preacher-curl',0,10,12,50],
['cable-hammer-curl','Cable Hammer Curl','cable','Biceps',['Forearms'],'cable-hammer-curl',0,10,15,40],
['overhead-cable-extension','Overhead Cable Extension','cable','Triceps',[],'overhead-cable-extension',0,10,15,40],
['db-skull-crusher','DB Skull Crusher','dumbbell','Triceps',[],'db-skull-crusher',0,8,12,25],
['db-kickback','DB Kickback','dumbbell','Triceps',['Rear Delts'],'db-kickback',0,12,15,15],
['machine-dip','Machine Dip','machine','Triceps',['Chest','Front Delts'],'machine-dip',0,8,12,120],
['bench-dip','Bench Dip','bodyweight','Triceps',['Chest','Front Delts'],'bench-dip',0,10,15,0],
['wrist-curl','Wrist Curl','barbell','Biceps',['Forearms'],'wrist-curl',0,12,20,45],
['reverse-wrist-curl','Reverse Wrist Curl','barbell','Biceps',['Forearms'],'reverse-wrist-curl',0,12,20,30],
['reverse-curl','Reverse Curl','barbell','Biceps',['Forearms','Biceps'],'reverse-curl',0,10,12,45],
['db-wrist-curl','DB Wrist Curl','dumbbell','Biceps',['Forearms'],'db-wrist-curl',0,12,20,20],
['farmers-carry','Farmer\'s Carry','dumbbell','Biceps',['Forearms','Traps','Core'],'farmers-carry',0,30,60,50],
['dead-hang','Dead Hang','bodyweight','Biceps',['Forearms','Back'],'dead-hang',0,20,60,0],
['front-squat','Front Squat','barbell','Legs',['Quads','Glutes','Core'],'front-squat',0,5,8,135],
['bulgarian-split-squat','Bulgarian Split Squat','dumbbell','Legs',['Quads','Glutes','Hamstrings'],'bulgarian-split-squat',0,8,12,30],
['db-step-up','DB Step-Up','dumbbell','Legs',['Quads','Glutes'],'db-step-up',0,8,12,25],
['hack-squat','Hack Squat','machine','Legs',['Quads','Glutes'],'hack-squat',0,8,12,180],
['smith-machine-squat','Smith Machine Squat','machine','Legs',['Quads','Glutes'],'smith-machine-squat',0,8,12,135],
['split-squat','Split Squat','bodyweight','Legs',['Quads','Glutes'],'split-squat',0,10,15,0],
['wall-sit','Wall Sit','bodyweight','Legs',['Quads','Glutes'],'wall-sit',0,30,60,0],
['stiff-leg-deadlift','Stiff-Leg Deadlift','barbell','Legs',['Hamstrings','Glutes','Back'],'stiff-leg-deadlift',0,8,10,135],
['good-morning','Good Morning','barbell','Legs',['Hamstrings','Glutes','Back'],'good-morning',0,8,12,95],
['seated-leg-curl','Seated Leg Curl','machine','Legs',['Hamstrings','Calves'],'seated-leg-curl',0,10,15,70],
['lying-leg-curl','Lying Leg Curl','machine','Legs',['Hamstrings','Calves'],'lying-leg-curl',0,10,15,60],
['nordic-hamstring-curl','Nordic Hamstring Curl','bodyweight','Legs',['Hamstrings','Glutes'],'nordic-hamstring-curl',0,5,10,0],
['barbell-hip-thrust','Barbell Hip Thrust','barbell','Legs',['Glutes','Hamstrings'],'barbell-hip-thrust',0,8,12,185],
['sumo-deadlift','Sumo Deadlift','barbell','Legs',['Glutes','Quads','Hamstrings','Back'],'sumo-deadlift',0,4,6,225],
['hip-thrust-machine','Hip Thrust Machine','machine','Legs',['Glutes','Hamstrings'],'hip-thrust-machine',0,10,15,140],
['hip-abduction-machine','Hip Abduction Machine','machine','Legs',['Glutes'],'hip-abduction-machine',0,12,20,90],
['glute-kickback-machine','Glute Kickback Machine','machine','Legs',['Glutes','Hamstrings'],'glute-kickback-machine',0,12,15,60],
['cable-kickback','Cable Kickback','cable','Legs',['Glutes','Hamstrings'],'cable-kickback',0,12,15,20],
['cable-pull-through','Cable Pull-Through','cable','Legs',['Glutes','Hamstrings'],'cable-pull-through',0,12,15,50],
['single-leg-glute-bridge','Single-Leg Glute Bridge','bodyweight','Legs',['Glutes','Hamstrings'],'single-leg-glute-bridge',0,10,15,0],
['kettlebell-swing','Kettlebell Swing','dumbbell','Legs',['Glutes','Hamstrings','Core'],'kettlebell-swing',0,15,20,35],
['seated-calf-raise','Seated Calf Raise','machine','Legs',['Calves'],'seated-calf-raise',0,12,20,90],
['leg-press-calf-raise','Leg Press Calf Raise','machine','Legs',['Calves'],'leg-press-calf-raise',0,12,20,180],
['db-calf-raise','DB Calf Raise','dumbbell','Legs',['Calves'],'db-calf-raise',0,12,20,40],
['smith-machine-calf-raise','Smith Machine Calf Raise','machine','Legs',['Calves'],'smith-machine-calf-raise',0,12,20,135],
['single-leg-calf-raise','Single-Leg Calf Raise','bodyweight','Legs',['Calves'],'single-leg-calf-raise',0,12,20,0],
['barbell-rollout','Barbell Rollout','barbell','Core',['Shoulders'],null,0,8,12,45],
['db-side-bend','DB Side Bend','dumbbell','Core',['Obliques'],null,0,12,15,35],
['machine-crunch','Machine Crunch','machine','Core',[],null,0,12,15,70],
['cable-woodchop','Cable Woodchop','cable','Core',['Obliques','Shoulders'],null,0,10,15,30],
['pallof-press','Pallof Press','cable','Core',['Obliques','Shoulders'],null,0,10,12,30],
['plank','Plank','bodyweight','Core',['Shoulders','Glutes'],'plank',0,30,60,0],
['side-plank','Side Plank','bodyweight','Core',['Obliques'],null,0,20,45,0],
['hanging-knee-raise','Hanging Knee Raise','bodyweight','Core',[],null,0,10,15,0],
['bicycle-crunch','Bicycle Crunch','bodyweight','Core',['Obliques'],null,0,15,25,0],
['reverse-crunch','Reverse Crunch','bodyweight','Core',[],null,0,12,20,0],
['sit-up','Sit-Up','bodyweight','Core',['Hip Flexors'],null,0,12,20,0],
['decline-sit-up','Decline Sit-Up','bodyweight','Core',['Hip Flexors'],null,0,10,15,0],
['lying-leg-raise','Lying Leg Raise','bodyweight','Core',['Hip Flexors'],null,0,12,20,0],
['dead-bug','Dead Bug','bodyweight','Core',[],null,0,10,15,0],
['mountain-climber','Mountain Climber','bodyweight','Core',['Shoulders','Quads'],null,0,20,40,0],
['v-up','V-Up','bodyweight','Core',['Hip Flexors'],null,0,10,15,0],
['bird-dog','Bird Dog','bodyweight','Core',['Glutes','Back'],null,0,10,12,0],
];
const LIBB={};BUILTIN.forEach(a=>LIBB[a[0]]={id:a[0],name:a[1],equip:a[2],muscle:a[3],also:a[4],img:a[5],common:!!a[6],min:a[7],max:a[8],startW:a[9]});

/* ---------- state ---------- */
let S;
const LIB=id=>LIBB[id]||(S.custom&&S.custom[id])||{id,name:'Exercise',equip:'dumbbell',muscle:'Chest',also:[],min:8,max:10,startW:20};
const allEx=()=>[...Object.values(LIBB),...Object.values(S.custom||{})];
const exImg=e=>e.photo||(ASSET+'img/ex/'+(e.img||(e.custom?'default':'generic'))+'.png?v=3');
const exBg=e=>`style="background-image:url('${exImg(e)}')${e.photo?';background-size:cover':e.img?';background-color:transparent;background-size:contain':';background-color:#28282a'}"`;
const iconImg=ic=>ASSET+'img/icons/'+ic+'.png?v=3';
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
