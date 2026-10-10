(()=>{
const $=s=>document.querySelector(s);
const vp=$('#vp'),track=$('#track'),steps=[...document.querySelectorAll('.stp')];
const boxes=[...document.querySelectorAll('.pinbox')],pins=$('#pins'),msg=$('#msg');
const nick=$('#nick'),nmsg=$('#nmsg'),grid=$('#grid'),joinGo=$('#joinGo');
let cur=0,pick=null;

/* slide between steps */
function go(n,focus=true){
  cur=n;
  track.style.transform=`translateX(-${n*100}%)`;
  steps.forEach((s,i)=>s.inert=i!==n);
  vp.style.height=steps[n].offsetHeight+'px';
  if(focus)setTimeout(()=>{const f=steps[n].querySelector('[data-f]');f&&f.focus({preventScroll:true})},450);
}
const ro=new ResizeObserver(()=>{vp.style.height=steps[cur].offsetHeight+'px'});
steps.forEach(s=>ro.observe(s));
go(0,false);
document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>go(+b.dataset.back));

/* step 1: PIN */
const sync=()=>boxes.forEach(x=>x.classList.toggle('fill',!!x.value));
function clearErr(){msg.textContent='';msg.className='msg';pins.classList.remove('bad')}
function err(t){
  msg.textContent=t;msg.className='msg err';pins.classList.add('bad');
  pins.classList.remove('shake');void pins.offsetWidth;pins.classList.add('shake');
}
pins.addEventListener('animationend',()=>pins.classList.remove('shake'));
function submitPin(){
  const pin=boxes.map(b=>b.value).join('');
  if(pin.length<6)return err('Enter all 6 digits.');
  if(pin[0]==='2')return showState('full');
  if(pin[0]==='3')return showState('started');
  if(pin[0]!=='1')return err("Hmm, we can't find that game");
  clearErr();go(1);
}
const ST={full:['🪑','This game is full','Every seat is taken. Ask your teacher to make room, or try a different PIN.'],
 started:['🏁','Game already started','The race is already under way! Ask your teacher for the next game.']};
function showState(k){const [e,t,p]=ST[k],el=$('#stState');
  el.className='stp state '+k;$('#stIc').textContent=e;$('#stT').textContent=t;$('#stP').textContent=p;go(4)}
$('#stBack').onclick=()=>{boxes.forEach(b=>b.value='');sync();clearErr();go(0)};
boxes.forEach((b,i)=>{
  b.addEventListener('input',()=>{
    const d=b.value.replace(/\D/g,'');
    b.value=d.slice(-1);sync();clearErr();
    if(d&&i<5)boxes[i+1].focus();
  });
  b.addEventListener('keydown',e=>{
    if(e.key==='Backspace'&&!b.value&&i>0){e.preventDefault();boxes[i-1].value='';boxes[i-1].focus();sync()}
    else if(e.key==='ArrowLeft'&&i>0)boxes[i-1].focus();
    else if(e.key==='ArrowRight'&&i<5)boxes[i+1].focus();
    else if(e.key==='Enter')submitPin();
  });
  b.addEventListener('paste',e=>{
    e.preventDefault();
    const d=(e.clipboardData.getData('text')||'').replace(/\D/g,'').slice(0,6);
    [...d].forEach((c,k)=>boxes[k].value=c);
    sync();clearErr();boxes[Math.min(d.length,5)].focus();
  });
  b.addEventListener('focus',()=>b.select());
});
$('#enter').onclick=submitPin;

/* step 2: nickname */
function submitNick(){
  if(!nick.value.trim()){nmsg.textContent='Pick a nickname first.';nmsg.className='msg err';nick.focus();return}
  nmsg.textContent='';nmsg.className='msg';go(2);
}
nick.addEventListener('input',()=>{nmsg.textContent='';nmsg.className='msg'});
nick.addEventListener('keydown',e=>{if(e.key==='Enter')submitNick()});
$('#nickGo').onclick=submitNick;

/* step 3: Blitzers */
const B=[['🐸','Hoppy','Common'],['🐼','Pandy','Common'],['🐧','Waddle','Common'],['🐰','Bun','Common'],
  ['🦊','Foxy','Rare'],['🐙','Inky','Rare'],['🐨','Koko','Rare'],
  ['🦈','Chomp','Epic'],['🦖','Rexi','Epic'],['🦉','Hoot','Epic'],
  ['🦄','Sparkle','Legendary'],['🐲','Ember','Legendary']];
window.BLITZERS=B;
const unpick=()=>grid.querySelectorAll('.bl.on').forEach(x=>{x.classList.remove('on');x.setAttribute('aria-checked','false')});
B.forEach(([e,n,r],i)=>{
  const t=document.createElement('button');
  t.type='button';t.className='bl '+r.toLowerCase();
  t.setAttribute('role','radio');t.setAttribute('aria-checked','false');t.setAttribute('aria-label',`${n}, ${r}`);
  t.innerHTML=`<span class="e">${e}</span><span class="rt">${r}</span>`;
  if(!i)t.dataset.f='';
  t.onclick=()=>{
    unpick();t.classList.add('on');t.setAttribute('aria-checked','true');
    pick=B[i];joinGo.disabled=false;$('#chosen').textContent=`${n} · ${r}`;
  };
  grid.append(t);
});
joinGo.onclick=()=>{
  if(!pick)return;
  $('#wAv').textContent=pick[0];$('#wName').textContent=nick.value.trim();go(3);
};

/* step 4: leave */
$('#leave').onclick=()=>{
  boxes.forEach(b=>b.value='');sync();clearErr();
  nick.value='';unpick();pick=null;joinGo.disabled=true;$('#chosen').textContent='';
  go(0);
};
})();
