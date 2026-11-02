const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const out = document.getElementById('term-out');
  const input = document.getElementById('term-in');
  const responses = {
    help: "commands: about, events, join, whoami, sudo",
    about: "we're a student computer club. build nights, talks, a CTF team. that's it.",
    events: "next up: build night, thursday 7pm, room 214.",
    join: "no application needed — just show up, or use the form below.",
    whoami: "a curious person who typed a command into a website. respect.",
    sudo: "nice try. you get member access, not root access."
  };
  function addLine(text, isCmd){
    const d = document.createElement('div');
    d.className = 'line';
    if(isCmd){
      d.innerHTML = '<span style="color:var(--mint)">guest@club:~$</span> ' + text;
    } else {
      d.textContent = text;
    }
    out.appendChild(d);
    out.scrollTop = out.scrollHeight;
  }
  input.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){
      const val = input.value.trim();
      if(!val) return;
      addLine(val, true);
      const key = val.toLowerCase();
      addLine(responses[key] || `command not found: ${val} — type help`);
      input.value = '';
    }
  });

  /* 3D Tilt and Mouse Tracker Effect */
  document.querySelectorAll('.interactive-hover').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      if(calm) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;
      
      el.style.setProperty('--mouse-x', x + 'px');
      el.style.setProperty('--mouse-y', y + 'px');
      el.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateZ(6px)';
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    });
  });
  /* Typewriter */
  const tw = document.getElementById('type-eyebrow');
  if(tw && !calm){
    const phrases = ['creativity meets talent','ideas become projects','beginners build real things','code meets curiosity'];
    let p = 0, c = 0, del = false;
    (function tick(){
      const s = phrases[p];
      c += del ? -1 : 1;
      tw.textContent = s.slice(0, c);
      let d = del ? 35 : 75;
      if(!del && c === s.length){ del = true; d = 2000; }
      else if(del && c === 0){ del = false; p = (p + 1) % phrases.length; d = 400; }
      setTimeout(tick, d);
    })();
  }

  /* Scroll reveal with stagger */
  document.querySelectorAll('.about-grid,.bento,.ev-grid,.git-log,.foot-cols').forEach(g =>
    [...g.children].forEach((c, i) => c.style.setProperty('--d', (i * 0.12) + 's')));
  const targets = document.querySelectorAll('.section-head,.about-card,.bento-item,.terminal-wrap,#join > p,#join > .btn-primary,[data-r]');
  if(calm || !('IntersectionObserver' in window)){
    targets.forEach(t => t.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries, o) => entries.forEach(e => {
      if(e.isIntersecting){ e.target.classList.add('in'); o.unobserve(e.target); }
    }), {threshold: 0.15});
    targets.forEach(t => io.observe(t));
  }
  /* Interactive grid background */
  (() => {
    const cv = document.getElementById('bg-grid');
    if(!cv) return;
    const g = cv.getContext('2d');
    const GAP = 42, R = 190, TAIL = 8;
    const COLORS = ['63,176,102','185,131,226','87,203,127'];
    let W, H, cols, rows, px, py, raf = 0, last = 0, time = 0, spawnT = 0;
    let tx = 0, ty = 0, mx = 0, my = 0, act = 0, actTarget = 0, lastMove = -1e9, inside = false;
    const ripples = [], pulses = [];

    function resize(){
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / GAP) + 3; rows = Math.ceil(H / GAP) + 3;
      px = new Float32Array(cols * rows); py = new Float32Array(cols * rows);
      if(!mx && !my){ mx = tx = W / 2; my = ty = H / 2; }
      if(calm) render(0);
    }

    function update(dt){
      time += dt;
      const active = inside && performance.now() - lastMove < 4000;
      if(active){ actTarget = 1; }
      else {                       // idle: a light roams the grid by itself (also on phones)
        tx = W * (.5 + .36 * Math.sin(time * .23));
        ty = H * (.5 + .30 * Math.sin(time * .31 + 1));
        actTarget = .55;
      }
      mx += (tx - mx) * .1; my += (ty - my) * .1;
      act += (actTarget - act) * .05;

      for(let i = ripples.length - 1; i >= 0; i--){
        const r = ripples[i]; r.age += dt; r.r = r.age * 400; r.a = 1 - r.age / 1.7;
        if(r.a <= 0) ripples.splice(i, 1);
      }
      spawnT -= dt;
      if(spawnT <= 0 && pulses.length < (W < 700 ? 3 : 7)){
        const horiz = Math.random() < .5, len = horiz ? cols : rows, dir = Math.random() < .5 ? 1 : -1;
        pulses.push({horiz, line: 1 + Math.floor(Math.random() * ((horiz ? rows : cols) - 2)),
          pos: dir > 0 ? 0 : len - 1, dir, speed: 4 + Math.random() * 5,
          c: COLORS[Math.floor(Math.random() * 3)]});
        spawnT = .5 + Math.random() * .6;
      }
      for(let i = pulses.length - 1; i >= 0; i--){
        const p = pulses[i]; p.pos += p.dir * p.speed * dt;
        const len = p.horiz ? cols : rows;
        if(p.pos < -TAIL || p.pos > len - 1 + TAIL) pulses.splice(i, 1);
      }
    }

    function layout(){
      for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
        const bx = (i - 1) * GAP, by = (j - 1) * GAP, k = j * cols + i;
        let ox = Math.sin(time * .8 + by * .012) * 1.6, oy = Math.cos(time * .7 + bx * .011) * 1.6;
        let dx = bx - mx, dy = by - my, d = Math.hypot(dx, dy) || 1;
        if(d < R){ const f = (1 - d / R) ** 2 * act * 18; ox -= dx / d * f; oy -= dy / d * f; }   // grid bulges toward the cursor
        for(const r of ripples){
          const rx = bx - r.x, ry = by - r.y, rd = Math.hypot(rx, ry) || 1, de = rd - r.r;
          if(Math.abs(de) < 70){ const w = Math.cos(de / 70 * Math.PI / 2); const a = r.a * w * w * 22; ox += rx / rd * a; oy += ry / rd * a; }
        }
        px[k] = bx + ox; py[k] = by + oy;
      }
    }

    function at(horiz, line, f){            // position along a grid line, f = fractional node index
      const len = horiz ? cols : rows; f = Math.max(0, Math.min(len - 1, f));
      const a = Math.floor(f), b = Math.min(a + 1, len - 1), t = f - a;
      const ka = horiz ? line * cols + a : a * cols + line, kb = horiz ? line * cols + b : b * cols + line;
      return [px[ka] + (px[kb] - px[ka]) * t, py[ka] + (py[kb] - py[ka]) * t];
    }

    function render(dt){
      g.clearRect(0, 0, W, H);
      layout();
      g.lineWidth = 1; g.strokeStyle = 'rgba(185,131,226,.10)'; g.beginPath();
      for(let j = 0; j < rows; j++){ g.moveTo(px[j * cols], py[j * cols]); for(let i = 1; i < cols; i++) g.lineTo(px[j * cols + i], py[j * cols + i]); }
      for(let i = 0; i < cols; i++){ g.moveTo(px[i], py[i]); for(let j = 1; j < rows; j++) g.lineTo(px[j * cols + i], py[j * cols + i]); }
      g.stroke();
      if(calm) return;

      // cursor glow on nearby grid segments + nodes
      for(let j = 0; j < rows - 1; j++) for(let i = 0; i < cols - 1; i++){
        const k = j * cols + i;
        for(const n of [k + 1, k + cols]){
          const d = Math.hypot((px[k] + px[n]) / 2 - mx, (py[k] + py[n]) / 2 - my);
          if(d < R){ const f = 1 - d / R;
            g.strokeStyle = (f > .45 ? 'rgba(63,176,102,' : 'rgba(185,131,226,') + (f * .75 * act).toFixed(3) + ')';
            g.lineWidth = 1 + f * 1.2; g.beginPath(); g.moveTo(px[k], py[k]); g.lineTo(px[n], py[n]); g.stroke(); }
        }
        const dn = Math.hypot(px[k] - mx, py[k] - my);
        if(dn < R * .7){ const f = 1 - dn / (R * .7); g.fillStyle = 'rgba(243,241,234,' + (f * .8 * act).toFixed(3) + ')';
          g.beginPath(); g.arc(px[k], py[k], .8 + f * 1.8, 0, 6.283); g.fill(); }
      }

      // data packets travelling along the lines
      g.lineCap = 'round';
      for(const p of pulses){
        for(let s = 0; s < TAIL; s++){
          const a = at(p.horiz, p.line, p.pos - p.dir * s * .6), b = at(p.horiz, p.line, p.pos - p.dir * (s + 1) * .6);
          g.strokeStyle = 'rgba(' + p.c + ',' + (.9 * (1 - s / TAIL)).toFixed(3) + ')';
          g.lineWidth = 2.2 * (1 - s / (TAIL * 1.4));
          g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
        }
        const h = at(p.horiz, p.line, p.pos); g.fillStyle = 'rgba(243,241,234,.95)';
        g.beginPath(); g.arc(h[0], h[1], 2, 0, 6.283); g.fill();
      }
      g.lineCap = 'butt';
    }

    function frame(now){
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000 || 0, .05); last = now;
      update(dt); render(dt);
    }
    function start(){ if(!raf && !calm){ last = performance.now(); raf = requestAnimationFrame(frame); } }
    function stop(){ cancelAnimationFrame(raf); raf = 0; }

    addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());   // pause when tab hidden
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; lastMove = performance.now(); inside = true; });
    document.documentElement.addEventListener('mouseleave', () => { inside = false; });
    addEventListener('pointerdown', e => {                                                      // click / tap ripple
      if(calm) return; lastMove = performance.now(); inside = true; tx = e.clientX; ty = e.clientY;
      ripples.push({x: e.clientX, y: e.clientY, age: 0, r: 0, a: 1}); if(ripples.length > 5) ripples.shift();
    });
    resize(); start();
  })();
  /* Mobile menu */
  (() => {
    const b = document.getElementById('menuBtn'), m = document.getElementById('mobileMenu');
    if(!b || !m) return;
    const set = o => { m.classList.toggle('open', o); b.setAttribute('aria-expanded', o); b.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); };
    b.addEventListener('click', () => set(!m.classList.contains('open')));
    m.querySelectorAll('a').forEach(a => a.addEventListener('click', () => set(false)));
    addEventListener('keydown', e => { if(e.key === 'Escape') set(false); });
  })();
  /* Modal, collapse, countdown, executives flow */
  (() => {
    const $ = id => document.getElementById(id), md = $('modal');
    let opener = null;
    const close = () => { md.hidden = true; opener && opener.focus(); };
    const open = el => { opener = el; $('mTag').textContent = el.dataset.tag; $('mTitle').textContent = el.dataset.title; $('mText').textContent = el.dataset.text; $('mMeta').textContent = el.dataset.meta || ''; md.hidden = false; md.querySelector('.m-x').focus(); };
    document.querySelectorAll('[data-modal]').forEach(el => {
      el.addEventListener('click', () => open(el));
      el.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(el); } });
    });
    md.addEventListener('click', e => { if(e.target === md || e.target.closest('.m-x')) close(); });
    addEventListener('keydown', e => { if(e.key === 'Escape' && !md.hidden) close(); });

    const body = $('evBody'), more = $('evMore'); let ex = false;
    const fit = () => { body.style.maxHeight = ex ? body.scrollHeight + 'px' : Math.round(body.scrollHeight * .42) + 'px'; };
    more.addEventListener('click', () => { ex = !ex; body.classList.toggle('shut', !ex); more.setAttribute('aria-expanded', ex); more.firstElementChild.textContent = ex ? 'Show less' : 'See full details'; fit(); });
    body.classList.add('shut'); fit(); addEventListener('load', fit); addEventListener('resize', fit);

    const cd = document.querySelector('.countdown'), t = new Date(cd.dataset.date).getTime();
    const pad = n => String(n).padStart(2, '0');
    const tick = () => { let d = Math.max(0, t - Date.now()); const v = [Math.floor(d / 864e5), Math.floor(d % 864e5 / 36e5), Math.floor(d % 36e5 / 6e4), Math.floor(d % 6e4 / 1e3)];
      ['cdD','cdH','cdM','cdS'].forEach((id, i) => $(id).textContent = pad(v[i])); };
    tick(); setInterval(tick, 1000);

    const cards = [...document.querySelectorAll('.badge')], n = cards.length; let cur = 0;
    const show = () => cards.forEach((c, i) => { let o = i - cur; if(o > n / 2) o -= n; if(o < -n / 2) o += n;
      c.style.setProperty('--o', o); c.style.setProperty('--a', Math.abs(o)); c.classList.toggle('far', Math.abs(o) > 2); });
    const go = d => { cur = (cur + d + n) % n; show(); };
    $('fNext').addEventListener('click', () => go(1)); $('fPrev').addEventListener('click', () => go(-1));
    cards.forEach((c, i) => c.addEventListener('click', () => { cur = i; show(); }));
    show();
  })();

/* Matrix rings: inner ring decrypts into the club name, a scanner sweeps both rings */
(function(){
  const rings=[...document.querySelectorAll('.ring[data-n]')]; if(!rings.length) return;
  const set='ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789:.=*+-<>|';
  const rnd=()=>set[Math.floor(Math.random()*set.length)];
  const msg='GREENHERALD::COMPUTER::CLUB::BUILD::SHIP:://';
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const st=rings.map((r,idx)=>({r,n:+r.dataset.n,idx,el:[],base:[],cls:[],target:idx===0}));
  function build(){
    st.forEach(o=>{
      const R=o.r.offsetWidth/2; o.r.textContent=''; o.el=[]; o.base=[]; o.cls=[];
      for(let i=0;i<o.n;i++){
        const c=document.createElement('span'); c.className='ch'; c.textContent=rnd();
        c.style.transform='translate(-50%,-50%) rotate('+(i*360/o.n)+'deg) translateY('+(-R)+'px)';
        o.r.appendChild(c); o.el.push(c); o.base.push(''); o.cls.push('ch');
      }
    });
  }
  build(); addEventListener('resize',build);
  const word=n=>{let t='';while(t.length<n)t+=msg;return t.slice(0,n);};
  if(reduce){const o=st[0],w=word(o.n);o.el.forEach((c,i)=>{c.textContent=w[i];c.className='ch lock';});return;}
  setInterval(()=>{
    if(document.hidden) return;
    const t=performance.now();
    st.forEach(o=>{
      const n=o.n, w=word(n), cyc=t%9000;
      const locked=!o.target?0:(cyc<3500?0:(cyc<5500?Math.floor((cyc-3500)/2000*n):n));
      let head=Math.floor((t%4000)/4000*n); if(o.idx===1) head=n-1-head;
      for(let i=0;i<n;i++){
        const c=o.el[i], isLock=i<locked;
        if(isLock){ if(c.textContent!==w[i]) c.textContent=w[i]; }
        else if(Math.random()<.22){ c.textContent=rnd(); const x=Math.random(); o.base[i]=x<.12?'hot':(x<.4?'dim':''); }
        const d=o.idx===0?(head-i+n)%n:(i-head+n)%n;
        const cls='ch'+(isLock?' lock':(d<6?' scan':(o.base[i]?' '+o.base[i]:'')));
        if(cls!==o.cls[i]){c.className=cls;o.cls[i]=cls;}
      }
    });
  },80);
})();

/* Interactive nav: decrypt-on-hover, scroll-spy, magnetic buttons */
(function(){
  const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const links=[...document.querySelectorAll('.nav-links a')];
  // 1. decrypt text on hover
  const glyphs='01<>/{}[]#$*+=';
  if(fine&&!reduce) links.forEach(a=>{
    const orig=a.textContent; let timer;
    a.addEventListener('mouseenter',()=>{
      if(!a.style.width){const r=a.getBoundingClientRect(); a.style.width=r.width+'px'; a.style.height=r.height+'px';}
      a.style.textAlign='left'; a.classList.add('pix'); clearInterval(timer);
      let f=0; timer=setInterval(()=>{
        f++; const lock=Math.floor(f/2);
        a.textContent=[...orig].map((ch,i)=>i<lock?ch:glyphs[Math.floor(Math.random()*glyphs.length)]).join('');
        if(lock>=orig.length){clearInterval(timer);a.textContent=orig;}
      },40);
    });
    a.addEventListener('mouseleave',()=>{clearInterval(timer);a.textContent=orig;a.classList.remove('pix');a.style.width='';a.style.height='';});
  });
  // 2. scroll-spy: highlight the section you're in
  const map=new Map(links.map(a=>[a.getAttribute('href').slice(1),a]));
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting) return;
    links.forEach(a=>a.classList.remove('active'));
    const a=map.get(e.target.id); if(a&&e.target.id!=='top') a.classList.add('active');
  }),{rootMargin:'-45% 0px -50% 0px'});
  map.forEach((a,id)=>{const el=document.getElementById(id); if(el) io.observe(el);});
  // 3. magnetic buttons (stable: hit-testing uses the button's un-shifted position, motion is smoothed with rAF)
  if(fine&&!reduce){
    const btns=[...document.querySelectorAll('.nbtn,.cta-outline')].map(el=>({el,x:0,y:0,tx:0,ty:0}));
    let mx=-9999,my=-9999,raf=0;
    const tick=()=>{
      let moving=false;
      btns.forEach(b=>{
        const r=b.el.getBoundingClientRect();
        const l=r.left-b.x, t=r.top-b.y, w=r.width, h=r.height;       // rect without the current shift
        const inside=mx>l-8&&mx<l+w+8&&my>t-8&&my<t+h+8;
        b.tx=inside?Math.max(-8,Math.min(8,(mx-l-w/2)*.2)):0;
        b.ty=inside?Math.max(-6,Math.min(6,(my-t-h/2)*.25)):0;
        b.x+=(b.tx-b.x)*.18; b.y+=(b.ty-b.y)*.18;
        if(Math.abs(b.tx-b.x)<.05&&Math.abs(b.ty-b.y)<.05){b.x=b.tx;b.y=b.ty;} else moving=true;
        b.el.style.translate=(b.x||b.y)?b.x.toFixed(2)+'px '+b.y.toFixed(2)+'px':'';
      });
      raf=moving?requestAnimationFrame(tick):0;
    };
    addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;if(!raf)raf=requestAnimationFrame(tick);},{passive:true});
    document.addEventListener('pointerleave',()=>{mx=my=-9999;if(!raf)raf=requestAnimationFrame(tick);});
  }
})();
