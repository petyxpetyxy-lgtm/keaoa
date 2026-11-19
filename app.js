/* ================= снег ================= */
const snow = document.getElementById('snow');
const sctx = snow.getContext('2d');
let flakes = [];

function resizeSnow() { snow.width = innerWidth; snow.height = innerHeight; }
resizeSnow();

function makeFlakes() {
  flakes = Array.from({ length: Math.round(innerWidth / 9) }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    r: Math.random() * 2 + .5,
    vy: Math.random() * 1 + .35,
    drift: Math.random() * Math.PI * 2,
    o: Math.random() * .5 + .3
  }));
}
makeFlakes();

function drawSnow(t) {
  sctx.clearRect(0, 0, snow.width, snow.height);
  for (const f of flakes) {
    f.y += f.vy;
    f.x += Math.sin(t / 1400 + f.drift) * .4;
    if (f.y > snow.height + 4) { f.y = -4; f.x = Math.random() * snow.width; }
    if (f.x > snow.width + 4) f.x = -4;
    if (f.x < -4) f.x = snow.width + 4;
    sctx.beginPath();
    sctx.arc(f.x, f.y, f.r, 0, 7);
    sctx.fillStyle = `rgba(255,255,255,${f.o})`;
    sctx.fill();
  }
  requestAnimationFrame(drawSnow);
}
requestAnimationFrame(drawSnow);

/* ================= звук попадания «плюх» ================= */
let actx = null;
function squish() {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const dur = .2, sr = actx.sampleRate;
    const buf = actx.createBuffer(1, sr * dur, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const t = i / d.length;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 3);
    }
    const src = actx.createBufferSource();
    src.buffer = buf;
    const lp = actx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2200, actx.currentTime);
    lp.frequency.exponentialRampToValueAtTime(250, actx.currentTime + dur);
    const g = actx.createGain();
    g.gain.setValueAtTime(.45, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, actx.currentTime + dur);
    src.connect(lp); lp.connect(g); g.connect(actx.destination);
    src.start();
  } catch (e) { /* без звука — не беда */ }
}

/* ================= элементы ================= */
const frame = document.getElementById('frame');
const flyLayer = document.getElementById('flyLayer');
const splatLayer = document.getElementById('splatLayer');
const counterBox = document.getElementById('counter');
const counterEl = counterBox.querySelector('b');

let uid = 0;
let hits = 0;

/* глянцевый помидор как в видео */
function makeTomato() {
  const el = document.createElement('div');
  el.className = 'tomato';
  const id = 'tg' + (++uid);
  el.innerHTML = `
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
      <radialGradient id="${id}" cx=".34" cy=".28" r=".8">
        <stop offset="0" stop-color="#ff9aa6"/>
        <stop offset=".4" stop-color="#f2455c"/>
        <stop offset="1" stop-color="#a8102f"/>
      </radialGradient>
    </defs>
    <ellipse cx="50" cy="58" rx="38" ry="35" fill="url(#${id})"/>
    <ellipse cx="37" cy="43" rx="12" ry="7.5" fill="#fff" opacity=".5" transform="rotate(-22 37 43)"/>
    <path d="M50 10 L52.5 17.7 L60.4 16 L55 22 L60.4 28 L52.5 26.3 L50 34 L47.5 26.3 L39.6 28 L45 22 L39.6 16 L47.5 17.7 Z" fill="#2f9e44"/>
    <path d="M50 13 Q52 4 47 2" stroke="#2b7d43" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  </svg>`;
  return el;
}

/* неровная клякса (случайная форма каждый раз) */
function blobPath(R, n, jitter) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    const r = R * (1 - Math.random() * jitter);
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  let d = `M${m0[0].toFixed(1)},${m0[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    d += `Q${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)} ${m[0].toFixed(1)},${m[1].toFixed(1)}`;
  }
  return d + 'Z';
}

function makeSplat() {
  const R = 27 + Math.random() * 17;
  const n = 9 + ((Math.random() * 5) | 0);
  const id = 'sg' + (++uid);

  // брызги вокруг
  let drops = '';
  const dn = 3 + ((Math.random() * 4) | 0);
  for (let i = 0; i < dn; i++) {
    const a = Math.random() * Math.PI * 2;
    const dist = R * (1.05 + Math.random() * .55);
    drops += `<circle cx="${(Math.cos(a) * dist).toFixed(1)}" cy="${(Math.sin(a) * dist).toFixed(1)}" r="${(2 + Math.random() * 4.5).toFixed(1)}" fill="#d9263c"/>`;
  }

  // семечки и зелёные кусочки
  let seeds = '';
  const sn = 2 + ((Math.random() * 3) | 0);
  for (let i = 0; i < sn; i++) {
    const a = Math.random() * Math.PI * 2;
    const dist = Math.random() * R * .6;
    const cx = (Math.cos(a) * dist).toFixed(1);
    const cy = (Math.sin(a) * dist).toFixed(1);
    seeds += `<ellipse cx="${cx}" cy="${cy}" rx="2.7" ry="1.7" fill="#ffe9a3" transform="rotate(${(Math.random() * 180) | 0} ${cx} ${cy})"/>`;
  }
  for (let i = 0; i < 2; i++) {
    const a = Math.random() * Math.PI * 2;
    const dist = Math.random() * R * .7;
    seeds += `<circle cx="${(Math.cos(a) * dist).toFixed(1)}" cy="${(Math.sin(a) * dist).toFixed(1)}" r="${(1.6 + Math.random() * 2).toFixed(1)}" fill="#4f9d4a" opacity=".9"/>`;
  }

  const box = R * 3.6;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `${-box / 2} ${-box / 2} ${box} ${box}`);
  svg.innerHTML = `
    <defs>
      <radialGradient id="${id}" cx=".35" cy=".3" r=".85">
        <stop offset="0" stop-color="#ff6b7e"/>
        <stop offset=".6" stop-color="#e63946"/>
        <stop offset="1" stop-color="#b71c2c"/>
      </radialGradient>
    </defs>
    <path d="${blobPath(R, n, .45)}" fill="url(#${id})"/>
    ${drops}${seeds}`;
  return svg;
}

/* ================= бросок помидора ================= */
function throwTomato(tx, ty) {
  const el = makeTomato();
  flyLayer.appendChild(el);

  const size = 96;
  const startX = tx + (Math.random() * 2 - 1) * 260;
  const startY = innerHeight + 130;
  const cx = (startX + tx) / 2 + (Math.random() * 2 - 1) * 170;
  const cy = (startY + ty) / 2 - 90 - Math.random() * 110;

  const dur = 520 + Math.random() * 150;
  const rot0 = Math.random() * 360;
  const rot1 = rot0 + (Math.random() * 2 - 1) * 540;
  const t0 = performance.now();

  function step(now) {
    let t = (now - t0) / dur;
    if (t > 1) t = 1;
    const e = t * t;               // разгон — летит быстрее к цели
    const it = 1 - e;
    const x = it * it * startX + 2 * it * e * cx + e * e * tx;
    const y = it * it * startY + 2 * it * e * cy + e * e * ty;
    const sc = .25 + .95 * e;      // приближается — растёт
    const rot = rot0 + (rot1 - rot0) * e;
    el.style.transform =
      `translate3d(${(x - size / 2).toFixed(1)}px, ${(y - size / 2).toFixed(1)}px, 0) rotate(${rot.toFixed(1)}deg) scale(${sc.toFixed(3)})`;
    if (t < 1) requestAnimationFrame(step);
    else { el.remove(); impact(tx, ty); }
  }
  requestAnimationFrame(step);
}

/* ================= попадание ================= */
function impact(vx, vy) {
  squish();

  // клякса на фото (прилипает к нему даже при скролле)
  const rect = frame.getBoundingClientRect();
  const sx = vx - rect.left;
  const sy = vy - rect.top;

  const el = document.createElement('div');
  el.className = 'splat';
  el.style.left = sx.toFixed(1) + 'px';
  el.style.top = sy.toFixed(1) + 'px';
  el.style.setProperty('--rot', (Math.random() * 72 - 36).toFixed(1) + 'deg');
  el.style.setProperty('--scl', (.75 + Math.random() * .55).toFixed(2));
  el.appendChild(makeSplat());
  splatLayer.appendChild(el);

  // держится15 секунд и плавно исчезает
  setTimeout(() => {
    el.classList.add('fade');
    setTimeout(() => el.remove(), 1400);
  }, 15000);

  // не даём накопиться бесконечно
  while (splatLayer.children.length > 25) splatLayer.firstElementChild.remove();

  // счётчик
  hits++;
  counterEl.textContent = hits;
  counterBox.classList.remove('bump');
  void counterBox.offsetWidth;
  counterBox.classList.add('bump');

  // кадр встряхнуло
  frame.classList.remove('hit');
  void frame.offsetWidth;
  frame.classList.add('hit');
}

/* клик по фото — бросаем */
frame.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  throwTomato(e.clientX, e.clientY);
});

addEventListener('resize', () => { resizeSnow(); makeFlakes(); });
