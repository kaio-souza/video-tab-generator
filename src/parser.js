// Tablatura padronizada em ASCII.
//
// Formato:
//   - uma linha por corda, na ordem do instrumento, começando com o nome da corda e '|';
//   - cada compasso tem exatamente 16 posições (4/4 em semicolcheias), fechado por '|';
//   - um sistema tem todas as cordas, uma por linha; sistemas são separados por uma
//     linha em branco e tocados em sequência;
//   - posições: traste de 0 a 24 (pode ter dois dígitos) ou '-' para silêncio;
//     técnicas: x (abafado), h, p, /, \, ~, b, r.

export const SLOTS_PER_BEAT = 4; // semicolcheias
export const SLOTS_PER_BAR = 16; // 4/4
export const MAX_FRET = 24;

const LABEL_LINE = /^\s*([A-Za-z])\s*\|(.*)$/;
const ALLOWED_CHAR = /[0-9xhpbr\/\\~-]/;
const DIGITS = /^\d+$/;

/** Gera um modelo vazio: uma linha por corda, com `bars` compassos. */
export function makeTemplate(labels, bars) {
  const bar = '-'.repeat(SLOTS_PER_BAR) + '|';
  return labels.map((label) => `${label}|${bar.repeat(bars)}`).join('\n');
}

// Percorre um compasso e chama emit(pos, texto, largura) para cada posição com conteúdo.
// Dígitos consecutivos formam um traste (12 ocupa duas posições).
function scanPart(part, emit) {
  let i = 0;
  while (i < part.length) {
    const ch = part[i];
    if (/\d/.test(ch)) {
      let j = i;
      while (j < part.length && /\d/.test(part[j])) j++;
      emit(i, part.slice(i, j), j - i);
      i = j;
    } else {
      if (ch !== '-') emit(i, ch, 1);
      i++;
    }
  }
}

// Valida um sistema (bloco de linhas consecutivas) e adiciona seus eventos.
// Retorna a posição de tempo em que o próximo sistema começa.
function addSystem(block, offset, labels, events, errors) {
  const first = block[0].no;
  const last = block[block.length - 1].no;
  const seq = block.map((l) => l.label);
  const orderOk = seq.length === labels.length && seq.every((l, i) => l === labels[i]);
  if (!orderOk) {
    errors.push(
      `Linhas ${first}–${last}: as cordas devem ser ${labels.join(' ')}, uma por linha, nessa ordem.`,
    );
  }

  let bars = 0;
  block.forEach((line, li) => {
    const { no, label, content } = line;
    // Pela posição da linha no sistema: assim rótulos repetidos (ex.: Drop D, "e B G D A D")
    // caem na corda certa. Se a ordem estiver errada, usa o primeiro rótulo igual.
    const si = labels[li] === label ? li : labels.indexOf(label);
    if (si < 0) {
      errors.push(`Linha ${no}: a corda "${label}" não existe neste instrumento.`);
      return;
    }

    if (!content.endsWith('|')) {
      errors.push(`Linha ${no}: a linha deve terminar com "|".`);
    }
    const body = content.endsWith('|') ? content.slice(0, -1) : content;
    const parts = body.split('|');

    if (bars === 0) bars = parts.length;
    else if (parts.length !== bars) {
      errors.push(`Linha ${no}: ${parts.length} compasso(s), esperado ${bars}.`);
    }

    const bad = [...body].find((ch) => ch !== '|' && !ALLOWED_CHAR.test(ch));
    if (bad) errors.push(`Linha ${no}: caractere "${bad}" não permitido.`);

    parts.forEach((part, bi) => {
      if (part.length !== SLOTS_PER_BAR) {
        errors.push(
          `Linha ${no}, compasso ${bi + 1}: ${part.length} posições, esperado ${SLOTS_PER_BAR}.`,
        );
      }
    });

    parts.forEach((part, bi) => {
      scanPart(part, (pos, value, width) => {
        if (!ALLOWED_CHAR.test(value[0])) return;
        if (DIGITS.test(value) && Number(value) > MAX_FRET) {
          errors.push(`Linha ${no}: traste ${value} acima de ${MAX_FRET}.`);
          return;
        }
        const col = offset + bi * SLOTS_PER_BAR + pos;
        events.push({
          key: `${si}@${col}`, // identifica a nota para o ajuste manual (corda@posição)
          string: si,
          col,
          width,
          text: value,
        });
      });
    });
  });

  return offset + bars * SLOTS_PER_BAR;
}

/**
 * Analisa a tablatura e devolve a linha do tempo e a lista de erros.
 * Mesmo com erros, a linha do tempo contém as notas válidas, para a prévia continuar.
 *
 * @param {string} text     tablatura em ASCII
 * @param {number} bpm      batidas por minuto
 * @param {string[]} labels rótulos das cordas, de cima para baixo
 * @returns {{timeline: object, errors: string[]}}
 */
export function analyzeTab(text, bpm, labels) {
  const slotDur = 60 / bpm / SLOTS_PER_BEAT;
  const events = [];
  const errors = [];
  let offset = 0;
  let block = [];

  const flush = () => {
    if (block.length) {
      offset = addSystem(block, offset, labels, events, errors);
      block = [];
    }
  };

  text.split(/\r?\n/).forEach((raw, idx) => {
    const no = idx + 1;
    if (raw.trim() === '') {
      flush();
      return;
    }
    const m = raw.match(LABEL_LINE);
    if (!m) {
      flush();
      errors.push(`Linha ${no}: deve começar com o nome de uma corda seguido de "|".`);
      return;
    }
    block.push({ no, label: m[1], content: m[2] });
  });
  flush();

  return {
    timeline: {
      strings: labels,
      events,
      columns: offset,
      slotDur,
      duration: offset * slotDur,
    },
    errors,
  };
}
