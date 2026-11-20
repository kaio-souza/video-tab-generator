// Desenha um quadro da tablatura no canvas. O playhead fica fixo em um quarto da largura.

import { SLOTS_PER_BAR as BAR_SLOTS } from './parser.js';

export const WIDTH = 1280;
export const HEIGHT = 720;

const PLAYHEAD_X = WIDTH * 0.25;
export const SLOT_PX = 80;
const LEFT = 110; // espaço reservado aos rótulos das cordas
const FONT = '"SF Mono", ui-monospace, Menlo, Consolas, monospace';
const UI_FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Cor de texto legível sobre `hex`: escura em fundos claros, branca em fundos escuros. */
export function textOn(hex) {
  const { r, g, b } = hexToRgb(hex);
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  // Contraste com #0b0c10 (lum ≈ 0,004) contra contraste com branco (lum 1)
  return (lum + 0.05) / 0.054 >= 1.05 / (lum + 0.05) ? '#0b0c10' : '#ffffff';
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} scene
 * @param {string[]} scene.labels      cordas, de cima para baixo
 * @param {object|null} scene.timeline timeline de analyzeTab (null se o BPM for inválido)
 * @param {number} scene.t             tempo na tablatura, em segundos (pode ser negativo)
 * @param {string} scene.accent        cor de destaque (#rrggbb)
 * @param {string} scene.background    cor de fundo (#rrggbb)
 * @param {object} [scene.nudges]      ajuste manual por nota, em segundos ({ "2@16": 0.03 })
 * @returns {{key: string, x: number, y: number, w: number, h: number}[]} áreas das notas visíveis
 */
export function drawFrame(ctx, scene) {
  const { labels, timeline, t, accent, background, nudges = {} } = scene;
  const boxes = []; // áreas clicáveis das notas, para arrastar na prévia
  const n = labels.length;

  // Fundo com brilho suave no playhead
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const glow = ctx.createRadialGradient(PLAYHEAD_X, HEIGHT / 2, 40, PLAYHEAD_X, HEIGHT / 2, 800);
  glow.addColorStop(0, rgba(accent, 0.16));
  glow.addColorStop(1, rgba(accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (n === 0) return boxes;

  const gap = n > 1 ? Math.min(96, 440 / (n - 1)) : 0;
  const top = HEIGHT / 2 - ((n - 1) * gap) / 2 - 20;
  const ys = labels.map((_, i) => top + i * gap);
  const slotDur = timeline ? timeline.slotDur : 1;
  const cur = t / slotDur; // posição atual em slots

  // Cordas: linhas que somem nas pontas
  const lineGrad = ctx.createLinearGradient(0, 0, WIDTH, 0);
  lineGrad.addColorStop(0, 'rgba(255,255,255,0)');
  lineGrad.addColorStop(0.12, 'rgba(255,255,255,0.22)');
  lineGrad.addColorStop(0.88, 'rgba(255,255,255,0.22)');
  lineGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2;
  for (const y of ys) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }

  // Rótulos em círculos
  ctx.font = `600 24px ${UI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  labels.forEach((label, i) => {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.arc(60, ys[i], 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(label, 60, ys[i] + 1);
  });

  // Compassos e notas ficam só à direita dos rótulos, sem passar por cima deles
  ctx.save();
  ctx.beginPath();
  ctx.rect(LEFT, 0, WIDTH - LEFT, HEIGHT);
  ctx.clip();

  // Linhas de compasso, com o número de cada compasso no topo
  if (timeline) {
    const totalBars = Math.ceil(timeline.columns / BAR_SLOTS);
    for (let k = 0; k <= totalBars; k++) {
      // A divisão fica na borda entre duas posições (meio slot antes do centro da nota)
      const x = PLAYHEAD_X + (k * BAR_SLOTS - 0.5 - cur) * SLOT_PX;
      if (x < LEFT - 20 || x > WIDTH + 20) continue;
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, ys[0] - 40);
      ctx.lineTo(x, ys[n - 1] + 40);
      ctx.stroke();
      if (k < totalBars) {
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = `500 20px ${FONT}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(k + 1), x + 8, ys[0] - 46);
      }
    }
  }

  // Notas em chips
  if (timeline) {
    ctx.font = `600 36px ${FONT}`;
    ctx.textAlign = 'center';
    // Explícito: os números de compasso acima deixam a baseline em 'bottom',
    // o que jogava o número da nota para cima da corda.
    ctx.textBaseline = 'middle';
    for (const e of timeline.events) {
      const shift = (nudges[e.key] ?? 0) / slotDur; // ajuste manual, convertido em slots
      const start = e.col + shift;
      const centerCol = start + (e.width - 1) / 2;
      const x = PLAYHEAD_X + (centerCol - cur) * SLOT_PX;
      if (x < -120 || x > WIDTH + 120) continue;

      const y = ys[e.string];
      const active = cur >= start && cur < start + e.width;
      const past = cur >= start + e.width;
      const w = Math.max(ctx.measureText(e.text).width + 24, 48);
      const h = 52;

      ctx.save();
      ctx.globalAlpha = past ? 0.4 : 1;
      if (active) {
        ctx.shadowColor = accent;
        ctx.shadowBlur = 28;
        ctx.fillStyle = accent;
        roundRect(ctx, x - w / 2, y - h / 2, w, h, 14);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = textOn(accent);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        roundRect(ctx, x - w / 2, y - h / 2, w, h, 14);
        ctx.fill();
        ctx.fillStyle = '#f2f2f5';
      }
      ctx.fillText(e.text, x, y + 1);
      ctx.restore();
      if (x + w / 2 > LEFT) boxes.push({ key: e.key, x: x - w / 2, y: y - h / 2, w, h });
    }
  }
  ctx.restore();

  // Degradê nas bordas, para as notas entrarem e saírem suavemente
  const fadeL = ctx.createLinearGradient(LEFT, 0, LEFT + 140, 0);
  fadeL.addColorStop(0, background);
  fadeL.addColorStop(1, rgba(background, 0));
  ctx.fillStyle = fadeL;
  ctx.fillRect(LEFT, 0, 140, HEIGHT);
  const fadeR = ctx.createLinearGradient(WIDTH - 140, 0, WIDTH, 0);
  fadeR.addColorStop(0, rgba(background, 0));
  fadeR.addColorStop(1, background);
  ctx.fillStyle = fadeR;
  ctx.fillRect(WIDTH - 140, 0, 140, HEIGHT);

  // Playhead
  const top2 = ys[0] - 80;
  const bottom2 = ys[n - 1] + 80;
  const phGrad = ctx.createLinearGradient(0, top2, 0, bottom2);
  phGrad.addColorStop(0, rgba(accent, 0));
  phGrad.addColorStop(0.5, rgba(accent, 1));
  phGrad.addColorStop(1, rgba(accent, 0));
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 16;
  ctx.fillStyle = phGrad;
  ctx.fillRect(PLAYHEAD_X - 1.5, top2, 3, bottom2 - top2);
  ctx.restore();

  // Progresso da tablatura e tempo atual
  const trackX = LEFT;
  const trackW = WIDTH - LEFT - 60;
  const trackY = HEIGHT - 44;
  const total = timeline ? timeline.columns : 0;
  const progress = total > 0 ? Math.min(Math.max(cur / total, 0), 1) : 0;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  roundRect(ctx, trackX, trackY, trackW, 6, 3);
  ctx.fill();
  ctx.fillStyle = accent;
  roundRect(ctx, trackX, trackY, Math.max(trackW * progress, 0), 6, 3);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = `500 22px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${t.toFixed(2)} s`, trackX, trackY - 24);
  return boxes;
}
