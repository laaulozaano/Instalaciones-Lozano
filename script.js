(function(){
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO='IntersectionObserver' in window;

  /* Estado abierto/cerrado */
  var now=new Date(), d=now.getDay(), h=now.getHours();
  var open=d>=1&&d<=5&&h>=8&&h<19;
  var st=document.getElementById('status');
  document.getElementById('status-text').textContent=open?'Abierto ahora. Disponible hoy':'Fuera de horario. Urgencias 24 h';
  if(!open)st.classList.add('closed');

  /* Cabecera, cable y barra móvil al hacer scroll */
  var header=document.getElementById('top'), wire=document.getElementById('wire'), mbar=document.getElementById('mbar');
  var ticking=false;
  function onScroll(){
    var y=window.scrollY, max=document.documentElement.scrollHeight-window.innerHeight;
    header.classList.toggle('scrolled',y>20);
    mbar.classList.toggle('show',y>window.innerHeight*.6);
    wire.style.setProperty('--p',max>0?Math.min(1,y/max):0);
    ticking=false;
  }
  window.addEventListener('scroll',function(){if(!ticking){requestAnimationFrame(onScroll);ticking=true}},{passive:true});
  onScroll();

  /* Chispas */
  var cv=document.getElementById('sparks'), cx=cv.getContext('2d'), parts=[], running=false, dpr=Math.min(2,window.devicePixelRatio||1);
  function size(){cv.width=innerWidth*dpr;cv.height=innerHeight*dpr}
  size();window.addEventListener('resize',size);
  function burst(x,y,n,power){
    if(reduce)return;
    for(var i=0;i<n;i++){
      var a=Math.random()*Math.PI*2, s=(Math.random()*.8+.2)*power;
      parts.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-power*.35,life:1,d:Math.random()*.02+.016,w:Math.random()*2+1});
    }
    if(!running){running=true;requestAnimationFrame(tick)}
  }
  function tick(){
    cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,innerWidth,innerHeight);
    cx.globalCompositeOperation='lighter';cx.lineCap='round';
    parts=parts.filter(function(p){
      p.vy+=.2;p.vx*=.98;p.x+=p.vx;p.y+=p.vy;p.life-=p.d;
      if(p.life<=0)return false;
      cx.strokeStyle='rgba(255,'+(190+Math.floor(65*p.life))+','+Math.floor(140*p.life)+','+p.life+')';
      cx.lineWidth=p.w;cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(p.x-p.vx*2.2,p.y-p.vy*2.2);cx.stroke();
      return true;
    });
    if(parts.length)requestAnimationFrame(tick);else{running=false;cx.clearRect(0,0,innerWidth,innerHeight)}
  }
  function center(el){var r=el.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]}

  /* Linterna del apagón */
  var bo=document.getElementById('blackout');
  function torch(x,y){bo.style.setProperty('--mx',x+'px');bo.style.setProperty('--my',y+'px')}
  window.addEventListener('pointermove',function(e){torch(e.clientX,e.clientY)},{passive:true});
  window.addEventListener('pointerdown',function(e){torch(e.clientX,e.clientY)},{passive:true});

  /* Cuadro eléctrico */
  var hero=document.getElementById('hero');
  var levers=document.querySelectorAll('#cuadro .lever');
  var estado=document.getElementById('estado'), corto=document.getElementById('estado-corto');
  function allOn(){return Array.prototype.every.call(levers,function(l){return l.getAttribute('aria-pressed')==='true'})}
  function update(){
    var on=allOn();
    corto.textContent=on?'Todo en marcha':'Ha saltado un automático';
    estado.textContent=on?'Así tiene que estar. Si te salta a menudo, algo falla y conviene revisarlo. Y si te atreves, baja el general.':'Si vuelve a saltar en cuanto lo subes, no insistas. Hay algo que revisar.';
    var genOn=levers[0].getAttribute('aria-pressed')==='true';
    if(!genOn&&!document.body.classList.contains('dark')){var c0=center(levers[0]);torch(c0[0],c0[1])}
    document.body.classList.toggle('dark',!genOn);
    if(on&&!hero.classList.contains('lit')&&!hero.classList.contains('powering')){
      if(reduce){hero.classList.add('lit')}
      else{
        hero.classList.add('powering');
        setTimeout(function(){hero.classList.remove('powering');if(allOn()){hero.classList.add('lit');var b=center(document.querySelector('.bulb .glass'));setTimeout(function(){burst(b[0],b[1],60,9)},500)}},450);
      }
    }else if(!on){hero.classList.remove('lit','powering')}
  }
  levers.forEach(function(l){l.addEventListener('click',function(){
    var up=l.getAttribute('aria-pressed')!=='true';
    l.setAttribute('aria-pressed',up?'true':'false');
    if(up){var c=center(l);burst(c[0],c[1],16,4)}
    update();
  })});

  /* Inclinación 3D del cuadro con el ratón */
  var cuadro=document.getElementById('cuadro'), stage=document.querySelector('.stage');
  if(!reduce){
    stage.addEventListener('pointermove',function(e){
      if(e.pointerType!=='mouse')return;
      var r=stage.getBoundingClientRect();
      var x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      cuadro.style.setProperty('--ry',(x*22)+'deg');
      cuadro.style.setProperty('--rx',(-y*16)+'deg');
      cuadro.style.setProperty('--glare',(120+x*80)+'deg');
    });
    stage.addEventListener('pointerleave',function(){
      ['--rx','--ry','--glare'].forEach(function(p){cuadro.style.removeProperty(p)});
    });
  }

  /* Foco que sigue al ratón en servicios */
  document.querySelectorAll('.service').forEach(function(c){
    c.addEventListener('pointermove',function(e){
      var r=c.getBoundingClientRect(), px=(e.clientX-r.left)/r.width-.5, py=(e.clientY-r.top)/r.height-.5;
      c.style.setProperty('--x',(e.clientX-r.left)+'px');
      c.style.setProperty('--y',(e.clientY-r.top)+'px');
      if(!reduce&&e.pointerType==='mouse'){c.style.setProperty('--ty',(px*14)+'deg');c.style.setProperty('--tx',(-py*14)+'deg')}
    });
    c.addEventListener('pointerleave',function(){c.style.removeProperty('--tx');c.style.removeProperty('--ty')});
  });

  /* Contadores */
  function count(el){
    var to=parseFloat(el.dataset.count), dec=parseInt(el.dataset.decimals||0,10);
    var pre=el.dataset.prefix||'', suf=el.dataset.suffix||'';
    var fmt=function(v){return pre+v.toLocaleString('es-ES',{minimumFractionDigits:dec,maximumFractionDigits:dec})+suf};
    if(reduce){el.textContent=fmt(to);return}
    var t0=null, dur=1600;
    function step(t){
      if(!t0)t0=t;
      var p=Math.min(1,(t-t0)/dur), e=1-Math.pow(1-p,4);
      el.textContent=fmt(dec?to*e:Math.round(to*e));
      if(p<1)requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters=document.querySelectorAll('[data-count]');
  /* Pasos */
  var steps=document.querySelector('.steps');
  if(reduce||!hasIO){
    counters.forEach(count);steps.classList.add('on');
  }else{
    var io=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting)return;
      if(e.target===steps)steps.classList.add('on');else count(e.target);
      io.unobserve(e.target);
    })},{threshold:.4});
    counters.forEach(function(c){io.observe(c)});io.observe(steps);
  }

  /* Marquesina: duplicar lista para bucle continuo */
  var track=document.getElementById('track');
  track.appendChild(track.firstElementChild.cloneNode(true));

  /* Antes / después */
  var ba=document.getElementById('ba');
  ba.querySelector('input').addEventListener('input',function(e){ba.style.setProperty('--pos',e.target.value+'%')});

  /* Formulario */
  var chips=document.querySelectorAll('#chips button'), tipo='Urgencia';
  chips.forEach(function(b){b.addEventListener('click',function(){
    chips.forEach(function(x){x.setAttribute('aria-pressed','false')});
    b.setAttribute('aria-pressed','true');tipo=b.textContent;
  })});
  document.getElementById('form').addEventListener('submit',function(e){
    e.preventDefault();
    var f=e.target, btn=document.getElementById('send');
    var txt='Hola, soy '+f.nombre.value+' ('+f.tel.value+'). Te escribo por: '+tipo+'. '+f.msg.value;
    btn.textContent='Abriendo WhatsApp…';
    window.open('https://wa.me/34600000000?text='+encodeURIComponent(txt),'_blank','noopener');
    setTimeout(function(){btn.textContent='Enviar por WhatsApp'},2500);
  });
})();