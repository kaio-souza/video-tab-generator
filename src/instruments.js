// Instrumentos e temas disponíveis. Os rótulos vão de cima para baixo no desenho.
// Rótulos são sensíveis a maiúsculas: 'e' (1ª corda da guitarra) é diferente de 'E' (6ª).

export const INSTRUMENTS = {
  bass4: { name: 'Baixo (4 cordas)', labels: ['G', 'D', 'A', 'E'] },
  guitar6: { name: 'Guitarra (6 cordas)', labels: ['e', 'B', 'G', 'D', 'A', 'E'] },
  custom: { name: 'Personalizado', labels: null },
};

export const BACKGROUNDS = {
  noite: { name: 'Noite', color: '#0d0f14' },
  grafite: { name: 'Grafite', color: '#1b1e27' },
  marinho: { name: 'Azul-marinho', color: '#0b1a2e' },
  roxo: { name: 'Roxo', color: '#1a0f2e' },
};

export const DEFAULT_ACCENT = '#4ee1b0';

/** Lê uma lista de rótulos digitada pelo usuário ("E A D G B e"). */
export function parseLabels(text) {
  return text
    .split(/[\s,]+/)
    .filter((s) => /^[A-Za-z]$/.test(s));
}
