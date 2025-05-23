/**
 * Calcula a frequência de cada cor em uma janela específica do histórico.
 * @param {Array<number>} history Array de números representando o histórico de cores (0: Branco, 1: Vermelho, 2: Preto).
 * @param {number} windowSize O número de resultados mais recentes a serem considerados.
 * @returns {object} Um objeto contendo a contagem e a porcentagem de cada cor na janela especificada.
 * Exemplo de retorno: { counts: { '0': 5, '1': 45, '2': 50 }, percentages: { '0': '5.00', '1': '45.00', '2': '50.00' }, total: 100 }
 */
export function calculateFrequencies(history, windowSize) {
  if (!history || history.length === 0) {
    return { counts: { '0': 0, '1': 0, '2': 0 }, percentages: { '0': '0.00', '1': '0.00', '2': '0.00' }, total: 0 };
  }

  const relevantHistory = history.slice(-windowSize);
  const total = relevantHistory.length;
  const counts = { '0': 0, '1': 0, '2': 0 };

  for (const color of relevantHistory) {
    if (counts[color] !== undefined) {
      counts[color]++;
    }
  }

  const percentages = {
    '0': total > 0 ? ((counts['0'] / total) * 100).toFixed(2) : '0.00',
    '1': total > 0 ? ((counts['1'] / total) * 100).toFixed(2) : '0.00',
    '2': total > 0 ? ((counts['2'] / total) * 100).toFixed(2) : '0.00',
  };

  return { counts, percentages, total };
}

/**
 * Analisa as sequências (streaks) atuais no final do histórico.
 * @param {Array<number>} history Array de números representando o histórico de cores.
 * @returns {object} Um objeto contendo a cor e o comprimento da sequência atual.
 * Exemplo: { color: 1, length: 3 } para uma sequência de 3 vermelhos no final.
 */
export function analyzeCurrentStreak(history) {
  if (!history || history.length === 0) {
    return { color: null, length: 0 };
  }

  const lastColor = history[history.length - 1];
  let streakLength = 0;

  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i] === lastColor) {
      streakLength++;
    } else {
      break;
    }
  }

  return { color: lastColor, length: streakLength };
}

