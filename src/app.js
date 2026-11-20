import { analyzeTab, makeTemplate, SLOTS_PER_BAR } from './parser.js';
import { drawFrame, SLOT_PX, textOn } from './render.js';
import { exportVideo } from './export.js';
import { INSTRUMENTS, BACKGROUNDS, DEFAULT_ACCENT, parseLabels } from './instruments.js';

const KEY = 'video-tab-generator:v4';

// Exemplo de baixo no formato padrão (2 compassos)
function bassSample() {
  const empty = '-'.repeat(SLOTS_PER_BAR);
  const rows = {
    G: [empty, empty],
    D: [empty, empty],
    A: ['--2--2--3--2--0-', '--0--0--2--3--2-'],
    E: [empty, empty],
  };
  return INSTRUMENTS.bass4.labels
    .map((l) => `${l}|${rows[l].map((b) => `${b}|`).join('')}`)
    .join('\n');
}

const $ = (id) => document.getElementById(id);
const el = {
  tab: $('tab'),
  instrument: $('instrument'),
  labels: $('labels'),
  labelsField: $('labels-field'),
  accent: $('accent'),
  background: $('background'),
  bpm: $('bpm'),
  bars: $('bars'),
  template: $('template'),
  errors: $('errors'),
  offset: $('offset'),
  tap: $('tap'),
  mark: $('mark'),
  nudgeBack: $('nudge-back'),
  nudgeFwd: $('nudge-fwd'),
  resetNudges: $('reset-nudges'),
  file: $('audio-file'),
  player: $('player'),
  canvas: $('stage'),
  play: $('play'),
  exportBtn: $('export'),
  status: $('status'),
};

const ctx = el.canvas.getContext('2d');

let timeline = null;
let errors = [];
let tabs = {}; // tablatura guardada por instrumento
let nudgesByInstrument = {}; // ajuste manual de cada nota, em segundos: { bass4: { "2@16": 0.03 } }
let boxes = []; // áreas das notas na última prévia desenhada
let drag = null;
let audioCtx = null;
let dest = null;
let objectUrl = null;
let taps = [];

const num = (input, fallback) => {
  const v = parseFloat(input.value);
  return Number.isFinite(v) ? v : fallback;
};
const msg = (text) => {
  el.status.textContent = text;
};
const audioOffset = () => num(el.offset, 0);
const barsCount = () => Math.min(32, Math.max(1, Math.round(num(el.bars, 4))));

function labelsFor(id) {
  const preset = INSTRUMENTS[id];
  if (preset && preset.labels) return preset.labels;
  const custom = parseLabels(el.labels.value);
  return custom.length ? custom : INSTRUMENTS.bass4.labels;
}
const currentLabels = () => labelsFor(el.instrument.value);

// Ajustes do instrumento atual (cada instrumento tem a própria tablatura, então os próprios ajustes)
function currentNudges() {
  const id = el.instrument.value;
  return (nudgesByInstrument[id] ??= {});
}

// Versões antigas guardavam um mapa único com chaves "G@16" (rótulo@posição).
// Converte para "corda@posição" dentro do instrumento que estava selecionado.
function migrateNudges(saved, instrument, labels) {
  if (!saved) return {};
  const values = Object.values(saved);
  const isOld = values.length > 0 && values.every((v) => typeof v === 'number');
  if (!isOld) return saved;
  const converted = {};
  for (const [key, value] of Object.entries(saved)) {
    const [label, col] = key.split('@');
    const si = labels.indexOf(label);
    if (si >= 0) converted[`${si}@${col}`] = value;
  }
  return { [instrument]: converted };
}

function applyAccent() {
  const root = document.documentElement.style;
  root.setProperty('--accent', el.accent.value);
  root.setProperty('--on-accent', textOn(el.accent.value)); // texto legível sobre o destaque
}

function backgroundColor() {
  return BACKGROUNDS[el.background.value]?.color ?? BACKGROUNDS.noite.color;
}

function save() {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        tabs,
        nudges: nudgesByInstrument,
        instrument: el.instrument.value,
        labels: el.labels.value,
        accent: el.accent.value,
        background: el.background.value,
        bpm: el.bpm.value,
        bars: el.bars.value,
        offset: el.offset.value,
      }),
    );
  } catch {
    // armazenamento indisponível (aba privada, por exemplo): segue sem salvar
  }
}

function load() {
  let s = null;
  try {
    s = JSON.parse(localStorage.getItem(KEY));
  } catch {
    s = null;
  }
  tabs = s?.tabs ?? { bass4: bassSample() };
  el.instrument.value = s?.instrument ?? 'bass4';
  if (!el.instrument.value) el.instrument.value = 'bass4'; // instrumento salvo que não existe mais
  el.labels.value = s?.labels ?? 'G D A E';
  el.accent.value = s?.accent ?? DEFAULT_ACCENT;
  el.background.value = s?.background ?? 'noite';
  if (!el.background.value) el.background.value = 'noite';
  el.bpm.value = s?.bpm ?? '120';
  el.bars.value = s?.bars ?? '4';
  el.offset.value = s?.offset ?? '0';
  el.labelsField.hidden = el.instrument.value !== 'custom';
  nudgesByInstrument = migrateNudges(s?.nudges, el.instrument.value, currentLabels());
  el.tab.value = tabs[el.instrument.value] ?? makeTemplate(currentLabels(), barsCount());
  applyAccent();
}

function renderErrors() {
  el.errors.innerHTML = '';
  for (const text of errors) {
    const li = document.createElement('li');
    li.textContent = text;
    el.errors.append(li);
  }
  el.errors.hidden = errors.length === 0;
}

function rebuild() {
  tabs[el.instrument.value] = el.tab.value;
  const bpm = num(el.bpm, 0);
  if (bpm > 0) {
    const result = analyzeTab(el.tab.value, bpm, currentLabels());
    timeline = result.timeline;
    errors = result.errors;
  } else {
    timeline = null;
    errors = ['O BPM precisa ser maior que zero.'];
  }
  renderErrors();
  save();
}

// Web Audio precisa ser criado a partir de um clique do usuário
function ensureAudioGraph() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    const source = audioCtx.createMediaElementSource(el.player);
    source.connect(audioCtx.destination); // ouvir na prévia
    dest = audioCtx.createMediaStreamDestination(); // alimentar a gravação
    source.connect(dest);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

const sceneAt = (t) => ({
  labels: currentLabels(),
  timeline,
  t,
  accent: el.accent.value,
  background: backgroundColor(),
  nudges: currentNudges(),
});

// Desenha o quadro para um tempo do áudio (usado pela prévia e pela gravação)
function drawAt(audioTime) {
  boxes = drawFrame(ctx, sceneAt(audioTime - audioOffset()));
  return boxes;
}

function loop() {
  drawAt(el.player.currentTime);
  requestAnimationFrame(loop);
}

function nudge(delta) {
  el.offset.value = (audioOffset() + delta).toFixed(2);
  save();
}

// Arrastar notas na prévia

function canvasPoint(e) {
  const r = el.canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) * el.canvas.width) / r.width,
    y: ((e.clientY - r.top) * el.canvas.height) / r.height,
  };
}

function hitTest(p) {
  for (let i = boxes.length - 1; i >= 0; i--) {
    const b = boxes[i];
    if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return b;
  }
  return null;
}

el.canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const hit = hitTest(p);
  if (!hit) return;
  drag = { key: hit.key, startX: p.x, startNudge: currentNudges()[hit.key] ?? 0 };
  el.canvas.setPointerCapture(e.pointerId);
  el.canvas.style.cursor = 'grabbing';
  e.preventDefault();
});

el.canvas.addEventListener('pointermove', (e) => {
  const p = canvasPoint(e);
  if (!drag) {
    el.canvas.style.cursor = hitTest(p) ? 'grab' : 'default';
    return;
  }
  const slotDur = timeline ? timeline.slotDur : 0.125;
  const dx = p.x - drag.startX; // pixels no canvas (1280 de largura)
  const seconds = drag.startNudge + (dx / SLOT_PX) * slotDur;
  currentNudges()[drag.key] = Math.round(seconds * 1000) / 1000; // arredonda para milissegundos
});

function endDrag() {
  if (!drag) return;
  drag = null;
  el.canvas.style.cursor = 'default';
  save();
}
el.canvas.addEventListener('pointerup', endDrag);
el.canvas.addEventListener('pointercancel', endDrag);

// Eventos

el.tab.addEventListener('input', rebuild);
el.bpm.addEventListener('input', rebuild);
el.offset.addEventListener('change', save);
el.bars.addEventListener('change', save);

el.instrument.addEventListener('change', () => {
  el.labelsField.hidden = el.instrument.value !== 'custom';
  el.tab.value = tabs[el.instrument.value] ?? makeTemplate(currentLabels(), barsCount());
  rebuild();
});
el.labels.addEventListener('input', rebuild);
el.accent.addEventListener('input', () => {
  applyAccent();
  save();
});
el.background.addEventListener('change', save);

el.template.addEventListener('click', () => {
  if (el.tab.value.trim() && !confirm('Substituir a tablatura atual por um modelo vazio?')) return;
  el.tab.value = makeTemplate(currentLabels(), barsCount());
  rebuild();
});

el.resetNudges.addEventListener('click', () => {
  if (!Object.keys(currentNudges()).length) return;
  if (!confirm('Zerar o ajuste manual de todas as notas deste instrumento?')) return;
  nudgesByInstrument[el.instrument.value] = {};
  save();
  msg('Ajustes de notas zerados.');
});

el.file.addEventListener('change', () => {
  const file = el.file.files[0];
  if (!file) return;
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(file);
  el.player.src = objectUrl;
  msg(`Áudio carregado: ${file.name}`);
});

el.play.addEventListener('click', () => {
  if (!el.player.src) {
    msg('Carregue um áudio primeiro.');
    return;
  }
  ensureAudioGraph();
  if (el.player.paused) el.player.play();
  else el.player.pause();
});

el.mark.addEventListener('click', () => {
  if (!el.player.src) {
    msg('Carregue um áudio primeiro.');
    return;
  }
  el.offset.value = el.player.currentTime.toFixed(2);
  save();
  msg(`Início da tab definido em ${el.offset.value} s.`);
});

el.nudgeBack.addEventListener('click', () => nudge(-0.1));
el.nudgeFwd.addEventListener('click', () => nudge(0.1));

el.tap.addEventListener('click', () => {
  const now = performance.now();
  if (taps.length && now - taps[taps.length - 1] > 2000) taps = [];
  taps.push(now);
  taps = taps.slice(-8);
  if (taps.length >= 2) {
    let sum = 0;
    for (let i = 1; i < taps.length; i++) sum += taps[i] - taps[i - 1];
    const avg = sum / (taps.length - 1);
    // Mesmos limites do campo de BPM
    el.bpm.value = String(Math.min(300, Math.max(20, Math.round(60000 / avg))));
    rebuild();
  }
});

el.exportBtn.addEventListener('click', async () => {
  if (!el.player.src) {
    msg('Carregue um áudio primeiro.');
    return;
  }
  if (errors.length) {
    msg('Corrija os erros da tablatura antes de exportar.');
    return;
  }
  if (!timeline || !timeline.events.length) {
    msg('Digite uma tablatura.');
    return;
  }
  ensureAudioGraph();
  const offset = audioOffset();
  el.exportBtn.disabled = true;
  try {
    await exportVideo({
      canvas: el.canvas,
      audio: el.player,
      dest,
      start: Math.max(0, offset - 1),
      end: offset + timeline.duration + 1,
      drawAt,
      onStatus: msg,
    });
    msg('Vídeo exportado.');
  } catch (err) {
    msg(`Erro: ${err.message}`);
  } finally {
    el.exportBtn.disabled = false;
  }
});

function fillSelects() {
  el.instrument.innerHTML = Object.entries(INSTRUMENTS)
    .map(([id, it]) => `<option value="${id}">${it.name}</option>`)
    .join('');
  el.background.innerHTML = Object.entries(BACKGROUNDS)
    .map(([id, bg]) => `<option value="${id}">${bg.name}</option>`)
    .join('');
}

// Início
fillSelects();
load();
rebuild();
loop();
