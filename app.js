const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const SH=['▲','◆','●','■'],SHN=['Red triangle','Blue diamond','Yellow circle','Green square'];
const mk=o=>({text:'',img:'',type:'quiz',time:20,pts:'std',ans:['','','',''],ok:[false,false,false,false],...o});
let Q=[
  mk({text:'What is the capital of France?',ans:['Paris','Lyon','Marseille','Nice'],ok:[true,false,false,false]}),
  mk({text:'The Great Wall of China is visible from space.',type:'tf',time:10,ans:['True','False','',''],ok:[false,true,false,false]}),
  mk({text:'Which planet is known as the Red Planet?',time:30,pts:'dbl',ans:['Mars','Venus','Jupiter','Saturn'],ok:[true,false,false,false]})
];
let cur=Q[0],drag=null,tt;

function toast(t,err){
  const el=$('#toast');el.textContent=t;el.className='toast show'+(err?' err':'');
  clearTimeout(tt);tt=setTimeout(()=>el.className='toast',2600);
}
function renderAll(){renderList();renderEditor();renderSettings()}
function selectQ(q){cur=q;renderAll();setTab('edit')}

/* validation: friendly inline hints */
function issues(q){
  const n=q.type==='tf'?2:4,out=[];
  if(!q.text.trim())out.push('Add your question text so players know what to answer 🙂');
  if(q.ans.slice(0,n).filter(a=>a.trim()).length<2)out.push('Give players at least 2 answers to choose from.');
  else if(q.type!=='poll'&&!q.ok.slice(0,n).some((o,k)=>o&&q.ans[k].trim()))out.push('Tap the ✓ circle on the correct answer.');
  return out;
}
function updateHint(){const h=issues(cur)[0],el=$('#hint');el.hidden=!h;el.textContent=h||''}
function refresh(){renderList();updateHint()}
function dup(q){
  const c={...q,ans:[...q.ans],ok:[...q.ok]};
  Q.splice(Q.indexOf(q)+1,0,c);selectQ(c);
}

/* left: thumbnails + drag reorder */
function renderList(){
  const list=$('#list');list.innerHTML='';
  $('#count').textContent=`${Q.length} question${Q.length>1?'s':''}`;
  Q.forEach((q,i)=>{
    const li=document.createElement('li');
    li.className='th'+(q===cur?' on':'');li.draggable=true;li.tabIndex=0;
    const nd=q.type==='tf'?2:4;
    li.innerHTML=`${issues(q).length?'<span class="warn" role="img" aria-label="Needs attention"></span>':''}<span class="grip" title="Drag to reorder" aria-hidden="true">⋮⋮</span><span class="n">${i+1}</span><div class="pv"><b></b><span class="dots">${[...Array(nd)].map((_,k)=>`<i class="d${k}"></i>`).join('')}</span></div><button class="dup" type="button" aria-label="Duplicate question ${i+1}">⧉</button><button class="x" type="button" aria-label="Delete question ${i+1}">✕</button>`;
    li.querySelector('b').textContent=q.text||'Untitled question';
    li.onclick=()=>selectQ(q);
    li.onkeydown=e=>{if(e.target===li&&(e.key==='Enter'||e.key===' ')){e.preventDefault();selectQ(q)}};
    li.querySelector('.x').onclick=e=>{e.stopPropagation();del(q)};
    li.querySelector('.dup').onclick=e=>{e.stopPropagation();dup(q)};
    li.ondragstart=e=>{drag=q;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','q');li.classList.add('drag')};
    li.ondragend=()=>{drag=null;li.classList.remove('drag')};
    li.ondragover=e=>{if(!drag)return;e.preventDefault();li.classList.add('over')};
    li.ondragleave=()=>li.classList.remove('over');
    li.ondrop=e=>{
      e.preventDefault();
      if(!drag||drag===q){li.classList.remove('over');return}
      const from=Q.indexOf(drag),to=Q.indexOf(q);
      Q.splice(to,0,Q.splice(from,1)[0]);drag=null;renderAll();
    };
    list.append(li);
  });
}
function del(q){
  if(Q.length===1)return toast('A quiz needs at least one question',true);
  const i=Q.indexOf(q);Q.splice(i,1);
  if(cur===q)cur=Q[Math.min(i,Q.length-1)];
  renderAll();
}
$('#add').onclick=()=>{
  const q=mk();Q.push(q);selectQ(q);
  $('#list').scrollTop=$('#list').scrollHeight;$('#qtext').focus();
};

/* centre: editor */
function setImg(f){
  if(!f||!f.type.startsWith('image/'))return;
  const r=new FileReader();r.onload=()=>{cur.img=r.result;renderEditor()};r.readAsDataURL(f);
}
$('#file').onchange=e=>{setImg(e.target.files[0]);e.target.value=''};
const drop=$('#drop');
drop.ondragover=e=>{e.preventDefault();drop.classList.add('hot')};
drop.ondragleave=()=>drop.classList.remove('hot');
drop.ondrop=e=>{e.preventDefault();drop.classList.remove('hot');setImg(e.dataTransfer.files[0])};
$('#rm').onclick=()=>{cur.img='';renderEditor()};
$('#qtext').oninput=e=>{cur.text=e.target.value;$('#cnt').textContent=cur.text.length+'/120';refresh()};
$('#title').onkeydown=e=>{if(e.key==='Enter')e.target.blur()};

function syncOk(){
  $$('#answers .ans').forEach((d,j)=>{
    d.classList.toggle('right',!!cur.ok[j]);
    d.querySelector('.tog').setAttribute('aria-pressed',!!cur.ok[j]);
  });
}
function renderEditor(){
  const q=cur;
  $('#qhead').textContent=`Question ${Q.indexOf(q)+1} of ${Q.length}`;
  $('#qtext').value=q.text;$('#cnt').textContent=q.text.length+'/120';
  $('#prev').src=q.img||'';$('#prev').hidden=!q.img;$('#ph').hidden=!!q.img;$('#rm').hidden=!q.img;
  const wrap=$('#answers');wrap.innerHTML='';
  wrap.className='answers'+(q.type==='tf'?' two':'');
  const n=q.type==='tf'?2:4;
  for(let k=0;k<n;k++){
    const d=document.createElement('div');
    d.className='ans a'+k;
    d.innerHTML=`<span class="sh" aria-hidden="true">${SH[k]}</span><input maxlength="75" placeholder="Answer ${k+1}" aria-label="Answer ${k+1}, ${SHN[k]}"><button type="button" class="tog" aria-label="Mark answer ${k+1} as correct">✓</button>`;
    const inp=d.querySelector('input');inp.value=q.ans[k];
    if(q.type==='tf')inp.readOnly=true;
    inp.oninput=()=>{q.ans[k]=inp.value;refresh()};
    const t=d.querySelector('.tog');t.hidden=q.type==='poll';
    t.onclick=()=>{
      if(q.type==='tf')q.ok=[false,false,false,false];
      q.ok[k]=!q.ok[k];syncOk();refresh();
    };
    wrap.append(d);
  }
  syncOk();updateHint();
}

/* right: settings */
function renderSettings(){
  const q=cur;
  $$('[data-type]').forEach(b=>{const on=b.dataset.type===q.type;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});
  $$('[data-time]').forEach(b=>{const on=+b.dataset.time===q.time;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});
  $$('[data-pts]').forEach(b=>{const on=b.dataset.pts===q.pts&&q.type!=='poll';b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);b.disabled=q.type==='poll'});
  $('#ptsNote').hidden=q.type!=='poll';
}
function setType(t){
  const q=cur,old=q.type;if(t===old)return;
  if(t==='tf'){q.ans=['True','False','',''];q.ok=[false,false,false,false]}
  else if(old==='tf'){q.ans=['','','',''];q.ok=[false,false,false,false]}
  q.type=t;renderAll();
}
$$('[data-type]').forEach(b=>b.onclick=()=>setType(b.dataset.type));
$$('[data-time]').forEach(b=>b.onclick=()=>{cur.time=+b.dataset.time;renderSettings()});
$$('[data-pts]').forEach(b=>b.onclick=()=>{cur.pts=b.dataset.pts;renderSettings()});

/* save (demo validation) */
$('#save').onclick=()=>{
  const bad=Q.find(q=>issues(q).length);
  if(bad){
    selectQ(bad);
    const h=$('#hint');h.classList.remove('shake');void h.offsetWidth;h.classList.add('shake');
    return;
  }
  saveQuiz();
  toast(`Saved “${$('#title').value.trim()||'Untitled quiz'}” · ${Q.length} question${Q.length>1?'s':''} ✅`);
};

/* sample quiz: same object format as hand-made questions */
const qz=(text,time,pts,ans,c)=>mk({text,time,pts,ans,ok:ans.map((_,i)=>i===c)});
const tf=(text,time,pts,c)=>mk({text,type:'tf',time,pts,ans:['True','False','',''],ok:[c===0,c===1,false,false]});
const spaceQuiz=()=>[
  qz('Which planet is closest to the Sun?',10,'std',['Venus','Mercury','Earth','Mars'],1),
  tf('The Sun is a star.',10,'std',0),
  qz('What is the name of our galaxy?',20,'std',['Andromeda','Whirlpool','Milky Way','Sombrero'],2),
  tf('Venus is the hottest planet in our solar system.',10,'std',0),
  qz('Who was the first person to walk on the Moon?',20,'std',['Buzz Aldrin','Yuri Gagarin','John Glenn','Neil Armstrong'],3),
  qz('Which planet is famous for its Great Red Spot?',20,'std',['Jupiter','Saturn','Mars','Neptune'],0),
  tf('A day on Venus is longer than a year on Venus.',20,'dbl',0),
  qz('About how long does sunlight take to reach Earth?',30,'dbl',['8 seconds','8 hours','8 minutes','8 days'],2)
];
$('#sample').onclick=()=>{
  Q=spaceQuiz();cur=Q[0];$('#title').value='Space Explorers';
  $('#list').scrollTop=0;renderAll();toast('Loaded 8 space questions 🚀');
};

renderAll();

/* ===== Game state: 'editor' | 'lobby' | 'question' ===== */
const ROUTES=['home','editor','quizzes','lobby'];
let gameState='home',origin='home',joinTimer=null,players=[];
const NAMES=['WaffleKing','NinjaNoodle','SirBouncealot','PixelPanda','TacoTornado','CosmicCrumpet','GigaGoose','BananaBlitz','ZippyZebra','LlamaDrama','TurboToast','Quizzard','MajorMango','SneakySock','DizzyDino','PickleRick','CaptainCrunch','FuzzyFalcon'];
const pav=i=>(i<7?i:i+1)%12;
function avatar(i){const [e,,r]=BLITZERS[i%12];return `<span class="av av-${r.toLowerCase()}" aria-hidden="true">${e}</span>`}
function setState(next,fromRoute){clearTimeout(flow);window.scrollTo({top:0,behavior:'instant'});gameState=next;document.body.dataset.state=next;
 if(next==='lobby')enterLobby();else{clearInterval(joinTimer);joinTimer=null}
 if(next==='quizzes')renderQuizzes();
 if(next==='question')startQuestion();else stopQuestion();if(next==='final')showFinal();else clearFinal();
 if(!fromRoute&&ROUTES.includes(next)){const h=next==='home'?'#/':'#/'+next;if(location.hash!==h)history.pushState(null,'',h)}
 const hd=document.querySelector(`[data-screen="${next}"] :is(h1,h2)`);if(hd){hd.tabIndex=-1;hd.focus({preventScroll:true})}}
function enterLobby(){
 players=[];$('#players').innerHTML='';$('#pcnt').textContent='0';
 const p=String(Math.floor(Math.random()*900000)+100000);$('#pin').textContent=p.slice(0,3)+' '+p.slice(3);
 let q='';for(let y=0;y<21;y++)for(let x=0;x<21;x++){const f=(x<7&&y<7)||(x>13&&y<7)||(x<7&&y>13);
  const on=f?(Math.max(Math.abs(x%14-3),Math.abs(y%14-3))!==2&&(x%14<7&&y%14<7?true:true)&&!(Math.max(Math.abs((x>13?x-14:x)-3),Math.abs((y>13?y-14:y)-3))===2)):Math.random()>.5;
  if(on)q+=`<rect x="${x}" y="${y}" width="1" height="1" fill="#1B1035"/>`}
 $('#qr').innerHTML=q;updateStart();
 const pool=[...NAMES].sort(()=>Math.random()-.5);
 const join=()=>{if(!pool.length)return clearInterval(joinTimer);
  const name=pool.pop(),i=players.length;players.push(name);
  const d=document.createElement('div');d.className='pl';d.innerHTML=avatar(pav(i))+`<span>${name}</span>`;$('#players').appendChild(d);
  const c=$('#pcnt');c.textContent=players.length;c.classList.remove('bump');void c.offsetWidth;c.classList.add('bump');updateStart()};
 joinTimer=setInterval(join,1000+Math.random()*1000);setTimeout(join,500)}
function updateStart(){const n=players.length,b=$('#start');b.disabled=n<3;
 $('#cntlbl').textContent=n===1?'player joined':'players joined';
 $('#lhint').textContent=n<3?`Need ${3-n} more player${3-n===1?'':'s'} to start`:'Ready when you are!'}
$('#host').onclick=()=>{
  const bad=Q.find(q=>issues(q).length);
  if(bad){selectQ(bad);const h=$('#hint');h.classList.remove('shake');void h.offsetWidth;h.classList.add('shake');toast('Finish this question before hosting',true);return}
  origin='editor';setState('lobby')};
$('#start').onclick=()=>{if(players.length>=3)startGame()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!['editor','home','quizzes'].includes(gameState))setState(origin)});

/* ===== Question round ===== */
let paused=false,pauseAt=0,sched=[],myT,quiz=[],round=0,board=[],flow,rq,phase='idle',picks,myPick,raf,timeouts=[],t0,dur;
function stopQuestion(){cancelAnimationFrame(raf);phase='idle';paused=false;$('#pz').classList.remove('show');syncCtl()}
function pickQuiz(){return Q.length&&Q.every(q=>q.text.trim()&&!issues(q).length)?Q:spaceQuiz()}
function startGame(){round=0;quiz=pickQuiz();board=[{name:'You',av:7},...players.map((n,i)=>({name:n,av:pav(i)}))].map((e,i)=>({...e,i,score:0,streak:0,correct:0,best:0,fast:0,hist:[]}));setState('question')}
function startQuestion(){
 stopQuestion();rq=quiz[round];
 const idx=[...Array(4).keys()].filter(k=>rq.ans[k].trim());rq.idx=idx;
 const right=idx.filter(k=>rq.ok[k]);
 picks=[];myPick=null;phase='answering';dur=rq.time;
 $('#qtext2').textContent=rq.text;$('#ptxt').textContent=`Question ${round+1} of ${quiz.length}`;$('#pbar').style.width=(round+1)/quiz.length*100+'%';$('#ring').className='ring';$('#fg').style.strokeDashoffset=0;$('#secs').textContent=dur;
 $('#tiles').innerHTML=idx.map((k,j)=>`<button type="button" class="atile a${k}" data-k="${k}" aria-label="${SHN[k]}: ${esc(rq.ans[k])}"><span class="tsh" aria-hidden="true">${SH[k]}</span><span class="tx">${esc(rq.ans[k])}</span><span class="key">${k+1}</span></button>`).join('');
 $('#tiles').dataset.n=idx.length;
 $$('#tiles .atile').forEach(b=>b.onclick=()=>answer(+b.dataset.k));
 $('#chart').classList.remove('show');$('#bars').innerHTML='';
 setAnswers();
 sched=players.map(n=>({n,k:(right.length&&Math.random()<.55)?right[Math.floor(Math.random()*right.length)]:idx[Math.floor(Math.random()*idx.length)],t:.9+Math.random()*dur*.85})).sort((a,b)=>a.t-b.t);
 t0=performance.now();raf=requestAnimationFrame(frame);syncCtl()}
const total=()=>players.length+1;
function setAnswers(){const c=picks.length+(myPick!==null?1:0);$('#acnt').textContent=c;$('#atot').textContent='of '+total()+' answered'}
function frame(now){if(phase!=='answering'||paused)return;
 const el=(now-t0)/1000,left=Math.max(0,dur-el);
 while(sched.length&&sched[0].t<=el){picks.push(sched.shift());setAnswers()}
 $('#fg').style.strokeDashoffset=282.74*(1-left/dur);
 $('#secs').textContent=Math.ceil(left);
 $('#ring').classList.toggle('low',left<=5);
 if(left<=0||(myPick!==null&&picks.length>=players.length))return reveal();
 raf=requestAnimationFrame(frame)}
function answer(k){if(phase!=='answering'||paused||myPick!==null||!rq.idx.includes(k))return;
 myPick=k;myT=(performance.now()-t0)/1000;$$('#tiles .atile').forEach(b=>{b.disabled=true;if(+b.dataset.k===k)b.classList.add('picked')});
 setAnswers();if(picks.length>=players.length)reveal()}
function reveal(){if(phase!=='answering')return;phase='revealed';cancelAnimationFrame(raf);paused=false;$('#pz').classList.remove('show');$('#ring').classList.remove('low');$('#ring').classList.add('done');sched=[];
 const counts={};rq.idx.forEach(k=>counts[k]=0);picks.forEach(p=>counts[p.k]++);if(myPick!==null)counts[myPick]++;
 const max=Math.max(1,...Object.values(counts));
 $$('#tiles .atile').forEach(b=>{b.disabled=true;const k=+b.dataset.k;
  if(rq.ok[k]){b.classList.add('right');b.classList.remove('fade')}else if(rq.type!=='poll')b.classList.add('fade')});
 const palette=['#F43F5E,#BE123C','#3B82F6,#1D4ED8','#FACC15,#CA8A04','#22C55E,#15803D'];
 $('#bars').innerHTML=rq.idx.map(k=>{const [c,d]=palette[k].split(',');
  return `<div class="bcol${rq.ok[k]||rq.type==='poll'?'':' fade'}" style="--c:${c};--d:${d}" role="img" aria-label="${SHN[k]}: ${counts[k]} answer${counts[k]===1?'':'s'}${rq.ok[k]?', correct':''}"><b>${counts[k]}${rq.ok[k]?' ✓':''}</b><div class="bar" data-h="${Math.max(3,counts[k]/max*100)}"></div><div class="blab" aria-hidden="true">${SH[k]}</div></div>`}).join('');
 $('#chart').classList.add('show');
 requestAnimationFrame(()=>requestAnimationFrame(()=>$$('.bar').forEach(b=>b.style.height=b.dataset.h+'%')));
 $('#cnote').textContent=rq.type==='poll'?(myPick===null?"Time's up — no vote!":'Thanks for voting! 🗳️'):myPick===null?"Time's up — you didn't answer!":rq.ok[myPick]?'You got it right! 🎉':'Not this time — better luck next one!';scoreRound();flow=setTimeout(showFeedback,3200);syncCtl()}
document.addEventListener('keydown',e=>{if(gameState==='question'&&/^[1-4]$/.test(e.key))answer(+e.key-1)});

/* ===== Scoring, feedback, leaderboard ===== */
const RH=76;
function scoreRound(){
 const rights=rq.idx.filter(k=>rq.ok[k]);
 board.forEach(e=>{e.prev=e.score;e.gain=0;e.bonus=0;if(rq.type==='poll'){e.ok=null;e.hist[round]=null;return}
  const p=e.name==='You'?(myPick===null?null:{k:myPick,t:myT}):picks.find(x=>x.n===e.name);
  if(p&&rq.ok[p.k]){e.streak++;e.bonus=e.streak>=3?Math.min(500,(e.streak-2)*100):0;e.gain=Math.round(1000*(1-(p.t/dur)/2))*(rq.pts==='dbl'?2:1)+e.bonus;e.score+=e.gain;e.ok=true;e.correct++;e.best=Math.max(e.best,e.streak);if(p.t<=dur*.25)e.fast++}
  else{e.streak=0;e.ok=false}
  e.hist[round]=e.ok?1:0})}
function showFeedback(){
 const me=board[0],ans=rq.idx.filter(k=>rq.ok[k]).map(k=>rq.ans[k]).join(' / ');
 setState('feedback');const fb=$('#fb');const poll=rq.type==='poll';fb.className='fb '+(me.ok||poll?'ok':'no');
 if(poll){$('#fbh').textContent=myPick===null?'No vote this time':'Vote locked in! 🗳️';$('#fbp').textContent='';$('#fbs').textContent='Polls don’t award points'}
 else if(me.ok){$('#fbh').textContent='Correct!';$('#fbp').textContent='+'+me.gain;
  $('#fbs').textContent=me.streak>=3?`🔥 ${me.streak} in a row! +${me.bonus} streak bonus`:me.streak===2?'2 in a row — one more for a 🔥 streak!':''}
 else{$('#fbh').textContent=(myPick===null?"Time's up, it was ":'Not quite, it was ')+ans;$('#fbp').textContent='';
  $('#fbs').textContent=myPick===null?"No worries — it goes fast! You've got the next one 💪":"Good try — you'll get the next one! 💜"}
 fb.onclick=showBoard;flow=setTimeout(showBoard,2800)}
function placeRows(key){
 const order=[...board].sort((a,b)=>b[key]-a[key]||a.i-b.i);
 order.forEach((e,r)=>{const row=$(`#lb [data-i="${e.i}"]`);row.style.transform=`translateY(${Math.min(r,5)*RH}px)`;row.style.opacity=r<5?1:0;row.style.zIndex=20-r;row.querySelector('.rk').textContent=r+1})}
function showBoard(){
 setState('leaderboard');const last=round>=quiz.length-1,box=$('#lb');
 $('#lbt').textContent='Leaderboard';$('#next').textContent=last?'Final results 🏆':'Next question ▶';
 box.style.height=5*RH-10+'px';
 box.innerHTML=board.map(e=>`<div class="row init${e.name==='You'?' me':''}" data-i="${e.i}"><span class="rk"></span>${avatar(e.av)}<span class="nm">${e.name}${e.name==='You'?' (you)':''}</span><span class="gain">${e.gain?'+'+e.gain:''}</span><b class="sc">${e.prev}</b></div>`).join('');
 placeRows('prev');void box.offsetWidth;$$('#lb .row').forEach(r=>r.classList.remove('init'));
 flow=setTimeout(()=>{placeRows('score');const t=performance.now();
  (function f(n){const p=Math.min(1,(n-t)/900);board.forEach(e=>{const el=$(`#lb [data-i="${e.i}"] .sc`);if(el)el.textContent=Math.round(e.prev+(e.score-e.prev)*p)});if(p<1&&gameState==='leaderboard')requestAnimationFrame(f)})(t);
 },900)}
$('#next').onclick=()=>{if(round>=quiz.length-1)setState('final');else{round++;setState('question')}};

/* ===== Host controls + final ===== */
function syncCtl(){const p=$('#pause');if(!p)return;p.disabled=!(gameState==='question'&&phase==='answering');p.textContent=paused?'▶ Resume':'⏸ Pause'}
function togglePause(){if(gameState!=='question'||phase!=='answering')return;
 if(paused){paused=false;t0+=performance.now()-pauseAt;$('#pz').classList.remove('show');raf=requestAnimationFrame(frame)}
 else{paused=true;pauseAt=performance.now();cancelAnimationFrame(raf);$('#pz').classList.add('show')}syncCtl()}
function skip(){if(gameState==='question')phase==='answering'?reveal():showFeedback();else if(gameState==='feedback')showBoard()}
$('#pause').onclick=togglePause;$('#skip').onclick=skip;
let finT=[],confRaf=0,parts=[];
function clearFinal(){finT.forEach(clearTimeout);finT=[];cancelAnimationFrame(confRaf);confRaf=0;parts=[];const c=$('#conf');if(c)c.getContext('2d').clearRect(0,0,c.width,c.height)}
function confetti(cx,cy,n){
 if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
 const c=$('#conf'),x=c.getContext('2d'),d=devicePixelRatio||1,cols=['#7C3AED','#A3E635','#8B5CF6','#C4B5FD','#ffffff','#65A30D'];
 c.width=innerWidth*d;c.height=innerHeight*d;x.setTransform(d,0,0,d,0,0);
 for(let i=0;i<n;i++){const a=-Math.PI/2+(Math.random()-.5)*2,v=9+Math.random()*13;
  parts.push({x:cx,y:cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,w:6+Math.random()*7,h:4+Math.random()*6,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:cols[i%cols.length]})}
 if(confRaf)return;
 (function loop(){x.clearRect(0,0,innerWidth,innerHeight);
  parts=parts.filter(p=>p.y<innerHeight+30);
  parts.forEach(p=>{p.vy+=.35;p.vx*=.99;p.vy*=.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;
   x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.w/2,-p.h/2,p.w,p.h);x.restore()});
  confRaf=parts.length?requestAnimationFrame(loop):0})()}
function showFinal(){
 clearFinal();
 const top=[...board].sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,3);
 $('#pod').classList.remove('lit');fillResult();
 $('#slots').innerHTML=top.map((e,k)=>`<div class="slot r${k+1}" data-r="${k+1}"><div class="who">${k===0?'<span class="crown" aria-hidden="true">👑</span>':''}${avatar(e.av)}<span class="nm">${e.name}${e.name==='You'?' (you)':''}</span><span class="pts">0</span></div><div class="blk">${k+1}</div></div>`).join('');
 const say=(t,roll)=>{const d=$('#drum');d.textContent=t;d.classList.toggle('roll',!!roll)};
 const up=k=>{const el=$(`.slot.r${k}`);el.classList.add('in');const pts=el.querySelector('.pts'),to=top[k-1].score,t0=performance.now();
  (function f(n){const p=Math.min(1,(n-t0)/900);pts.textContent=Math.round(to*p);if(p<1&&gameState==='final')requestAnimationFrame(f)})(t0)};
 const at=(ms,fn)=>finT.push(setTimeout(fn,ms));
 say('🥁 Drumroll…',true);
 at(1800,()=>{say('🥁 Third place…',false);up(3)});
 at(1900,()=>say('🥁 Who’s second?',true));
 at(3900,()=>{say('🥁 Second place…',false);up(2)});
 at(4000,()=>say('🥁 And the winner is…',true));
 at(6600,()=>{up(1);say(`🎉 ${top[0].name} wins!`,false);$('#pod').classList.add('lit');
  const r=$('.slot.r1 .who .av').getBoundingClientRect();confetti(r.left+r.width/2,r.top+r.height/2,170);
  finT.push(setTimeout(()=>{const r2=$('.slot.r1 .who .av').getBoundingClientRect();confetti(r2.left+r2.width/2,r2.top+r2.height/2,90)},450))})}
$('#again').onclick=()=>players.length?startGame():setState('lobby');
$('#newquiz').onclick=()=>{if(quiz===Q)saveQuiz();setState('quizzes')};

/* ===== Your result, badges, full board, share ===== */
let shareText='';
function fillResult(){
 const ranked=[...board].sort((a,b)=>b.score-a.score||a.i-b.i),me=board[0],rank=ranked.indexOf(me)+1,n=board.length;
 const sn=quiz.filter(q=>q.type!=='poll').length,acc=sn?Math.round(me.correct/sn*100):0;
 $('#after').classList.remove('show');buildReport();
 $('#rcav').innerHTML=avatar(me.av);$('#rcsub').textContent=`${me.correct} of ${sn} correct`;
 $('#s-rank').textContent=`#${rank}`;$('#s-score').textContent=me.score.toLocaleString();$('#s-acc').textContent=acc+'%';$('#s-str').textContent=me.best?'🔥 '+me.best:'0';
 const pool=[
  [me.fast>=2,'⚡','Speed Demon','Lightning-fast answers'],
  [acc>=75,'🎯','Sharpshooter','75%+ accuracy'],
  [me.best>=3,'🔥','On Fire','3+ answers in a row'],
  [rank===1&&me.score>0,'🏆','Champion','Top of the board'],
  [rank<=3&&me.score>0,'🚀','Podium Finish','Made the top 3'],
  [me.correct>0,'🧠','Brainiac','Knew your stuff'],
  [true,'🎮','Good Sport','Played every round'],
  [true,'🙌','Showed Up','Joined the fun']];
 const earned=pool.filter(b=>b[0]).slice(0,3);
 $('#bdg').innerHTML=earned.map(b=>`<div class="bd"><div class="bi"><div class="bf"><i>${b[1]}</i><b>${b[2]}</b><small>${b[3]}</small></div><div class="bk" aria-hidden="true">?</div></div></div>`).join('');
 $('#fl').innerHTML=ranked.map((e,r)=>`<li class="frow${e===me?' me':''}"><span class="rk">${['🥇','🥈','🥉'][r]||r+1}</span>${avatar(e.av)}<span class="nm">${e.name}${e===me?' (you)':''}<small>${e.correct}/${sn} correct${e.best>=3?' · 🔥 '+e.best+' streak':''}</small></span><b class="sc">${e.score.toLocaleString()}</b></li>`).join('');
 shareText=`🏆 I finished #${rank} of ${n} on BrainBlitz! ${me.score.toLocaleString()} pts · ${acc}% accuracy · best streak ${me.best} ⚡ Can you beat me?`;
 finT.push(setTimeout(()=>$('#after').classList.add('show'),7600));
 $$('#bdg .bd').forEach((b,k)=>finT.push(setTimeout(()=>b.classList.add('on'),8300+k*650)))}
$('#share').onclick=async()=>{
 try{if(navigator.share){await navigator.share({title:'BrainBlitz result',text:shareText});return}}catch(e){if(e.name==='AbortError')return}
 try{await navigator.clipboard.writeText(shareText);toast('Result copied to clipboard 📋')}catch(e){toast('Copy failed — long-press to copy: '+shareText)}};


/* ===== Host report ===== */
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let repData=null;
function showTab(rep){$('.fnl').classList.toggle('rep',rep);
 $('#tabRes').classList.toggle('on',!rep);$('#tabRep').classList.toggle('on',rep);
 $('#tabRes').setAttribute('aria-selected',!rep);$('#tabRep').setAttribute('aria-selected',rep);
 if(rep)requestAnimationFrame(()=>requestAnimationFrame(()=>$$('.qr-bar u').forEach(u=>u.style.width=u.dataset.w+'%')))}
$('#tabRes').onclick=()=>showTab(false);$('#tabRep').onclick=()=>showTab(true);
function buildReport(){
 const N=board.length,qn=quiz.filter(q=>q.type!=='poll').length,pct=(a,b)=>b?Math.round(a/b*100):0;
 const ranked=[...board].sort((a,b)=>b.score-a.score||a.i-b.i);
 const players=ranked.map((e,r)=>({rank:r+1,name:e.name==='You'?'You (host demo)':e.name,av:e.av,score:e.score,correct:e.correct,acc:pct(e.correct,qn),best:e.best,hist:e.hist}));
 const qs=quiz.map((q,k)=>({n:k+1,text:q.text,acc:pct(board.filter(e=>e.hist[k]).length,N),right:board.filter(e=>e.hist[k]).length})).filter(q=>quiz[q.n-1].type!=='poll');
 const hardest=qs.length?qs.reduce((m,q)=>q.acc<m.acc?q:m,qs[0]):null;
 const avgScore=Math.round(board.reduce((a,e)=>a+e.score,0)/N),avgAcc=Math.round(players.reduce((a,p)=>a+p.acc,0)/N);
 repData={players,qs,N};
 $('#rsum').innerHTML=`<div><b>${N}</b><small>Players</small></div><div><b>${avgScore.toLocaleString()}</b><small>Avg score</small></div><div><b>${avgAcc}%</b><small>Avg accuracy</small></div>`;
 $('#rqs').innerHTML=!qs.length?'<p class="mq-empty">This quiz only had polls, so there is nothing to score.</p>':qs.map(q=>{const cls=q.acc>=70?'':q.acc>=40?' mid':' low',hard=q===hardest;
  return `<div class="qr-card${cls}${hard?' hard':''}"><div class="qr-top"><span class="n">${q.n}</span><p>${esc(q.text)}<small>${q.right} of ${N} correct · ${q.acc>=70?'Easy':q.acc>=40?'Medium':'Hard'}</small></p>${hard?'<span class="qr-tag">🔥 Hardest</span>':''}</div><div class="qr-bar"><i><u data-w="${q.acc}"></u></i><b>${q.acc}%</b></div></div>`}).join('');
 const need=qn?players.filter(p=>p.acc<50):[];
 $('#help').innerHTML=need.length?need.map(p=>`<li>${avatar(p.av)}<span>${esc(p.name)}</span><b>${p.acc}%</b></li>`).join(''):'<li class="help-none">🎉 Everyone scored 50% or higher. Nobody needs extra help!</li>';
 showTab(false)}
function csvCell(v){v=String(v);if(/^[=+\-@\t\r]/.test(v))v="'"+v;return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
$('#csv').onclick=()=>{
 if(!repData)return;
 const head=['Rank','Player','Score','Correct','Accuracy %','Best streak',...repData.qs.map(q=>'Q'+q.n)];
 const rows=repData.players.map(p=>[p.rank,p.name,p.score,p.correct,p.acc,p.best,...p.hist.map((h,k)=>quiz[k].type==='poll'?'Poll':h?'Correct':'Wrong')]);
 const csv='\ufeff'+[head,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=($('#title').value.trim()||'brainblitz').replace(/[^\w-]+/g,'_')+'_results.csv';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 toast('Results downloaded 📥')};

/* ===== My Quizzes ===== */
let saved=[],curId=null;
function saveQuiz(){
 const title=$('#title').value.trim()||'Untitled quiz';if(!curId)curId=Date.now();
 const s={id:curId,title,qs:JSON.parse(JSON.stringify(Q))},i=saved.findIndex(x=>x.id===curId);
 if(i<0)saved.unshift(s);else saved[i]=s}
function loadQuiz(s){Q=JSON.parse(JSON.stringify(s.qs));cur=Q[0];curId=s.id;$('#title').value=s.title;renderAll()}
function renderQuizzes(){
 const l=$('#mql');
 l.innerHTML=saved.length?saved.map(s=>`<li class="frow" data-id="${s.id}"><span class="rk">📝</span><span class="nm">${esc(s.title)}<small>${s.qs.length} question${s.qs.length>1?'s':''}</small></span><span class="mqb"><button class="btn ghost" data-a="edit" type="button">Edit</button><button class="btn lime" data-a="host" type="button">Host</button></span></li>`).join(''):`<li class="mq-empty big"><svg viewBox="0 0 260 190" aria-hidden="true"><ellipse cx="130" cy="172" rx="86" ry="10" fill="rgba(0,0,0,.25)"/><g transform="rotate(-8 130 90)"><rect x="62" y="22" width="136" height="140" rx="20" fill="#fff"/><rect x="62" y="22" width="136" height="140" rx="20" fill="none" stroke="#C4B5FD" stroke-width="3"/><rect x="82" y="44" width="96" height="14" rx="7" fill="#EDE9FE"/><circle cx="90" cy="86" r="9" fill="#F43F5E"/><rect x="106" y="80" width="72" height="12" rx="6" fill="#ECE6FA"/><circle cx="90" cy="116" r="9" fill="#3B82F6"/><rect x="106" y="110" width="58" height="12" rx="6" fill="#ECE6FA"/><circle cx="90" cy="146" r="9" fill="#22C55E"/><rect x="106" y="140" width="66" height="12" rx="6" fill="#ECE6FA"/></g><g><circle cx="196" cy="40" r="26" fill="#7C3AED"/><path d="M200 24l-16 20h11l-4 16 16-21h-11z" fill="#A3E635"/></g><path d="M40 52l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#A3E635"/><path d="M226 120l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#C4B5FD"/><circle cx="48" cy="130" r="5" fill="#FACC15"/></svg><h3>No quizzes yet</h3><p>Build a quiz in a few minutes and host it live for your class.</p><button class="btn lime lg" data-a="new" type="button">Create your first quiz</button></li>`}
$('#mql').onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;
 if(b.dataset.a==='new')return $('#mqNew').click();
 const s=saved.find(x=>x.id==b.closest('li').dataset.id);if(!s)return;loadQuiz(s);
 if(b.dataset.a==='edit')setState('editor');else{origin='quizzes';setState('lobby')}};
$('#mqNew').onclick=()=>{Q=[mk()];cur=Q[0];curId=null;$('#title').value='';renderAll();setState('editor')};
$('#mqHome').onclick=()=>setState('home');$('#myq').onclick=()=>setState('quizzes');

/* ===== Trending skeleton + connection banner ===== */
setTimeout(()=>{const r=$('#rail');r.classList.remove('is-loading');r.setAttribute('aria-busy','false')},1600);
let reT;const rc=$('#recon');
function reconnecting(){clearTimeout(reT);rc.classList.remove('ok');$('#reconT').textContent='Reconnecting…';$('#reconS').textContent='Hang tight, your spot is saved';rc.classList.add('show')}
function reconnected(){if(!rc.classList.contains('show'))return;rc.classList.add('ok');$('#reconT').textContent='Back in the game!';$('#reconS').textContent='';reT=setTimeout(()=>rc.classList.remove('show','ok'),1800)}
addEventListener('offline',reconnecting);addEventListener('online',reconnected);
window.simulateReconnect=()=>{reconnecting();setTimeout(reconnected,3500)};

/* ===== Home <-> app navigation ===== */
const hostFromHome=e=>{e.preventDefault();origin='home';setState('editor')};
['#hostNav','#hostHero'].forEach(s=>$(s).onclick=hostFromHome);
['#createNav','#createHero'].forEach(s=>$(s).onclick=e=>{e.preventDefault();origin='home';setState('editor')});
$$('[data-home]').forEach(a=>a.onclick=e=>{e.preventDefault();setState('home')});
$('#lexit').onclick=()=>setState(origin);$('#tohome').onclick=()=>setState('home');


/* ===== Menus, editor tabs, theme, labels, routing ===== */
function setTab(t){$('.app').dataset.tab=t;$$('#etabs [data-tab]').forEach(b=>{const on=b.dataset.tab===t;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)})}
$$('#etabs [data-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
function menu(btn,box){btn.onclick=()=>{const o=box.classList.toggle('open');btn.setAttribute('aria-expanded',o);btn.setAttribute('aria-label',(o?'Close':'Open')+' menu')}}
menu($('#navBtn'),$('.nav'));menu($('#edBtn'),$('.top'));
const closeMenu=(box,btn)=>()=>{if(box.classList.contains('open'))btn.click()};
$$('#navLinks a').forEach(a=>a.addEventListener('click',closeMenu($('.nav'),$('#navBtn'))));
['#sample','#myq'].forEach(s=>$(s).addEventListener('click',closeMenu($('.top'),$('#edBtn'))));
$$('.qc:not(.sk) .btn').forEach(b=>b.setAttribute('aria-label','Play '+b.closest('.qc').querySelector('h3').textContent));
function applyTheme(t,save){document.documentElement.dataset.theme=t;const b=$('#theme');b.firstElementChild.textContent=t==='light'?'☀️':'🌙';b.setAttribute('aria-label',t==='light'?'Switch to dark mode':'Switch to light mode');if(save){try{localStorage.setItem('bb-theme',t)}catch(e){}}}
applyTheme(document.documentElement.dataset.theme||'dark');
$('#theme').onclick=()=>applyTheme(document.documentElement.dataset.theme==='light'?'dark':'light',true);
function route(){const t={'#/editor':'editor','#/quizzes':'quizzes','#/lobby':'lobby'}[location.hash]||'home';
 if(ROUTES.includes(gameState)&&t!==gameState){if(t==='lobby')origin='home';setState(t,true)}}
addEventListener('popstate',route);route();
