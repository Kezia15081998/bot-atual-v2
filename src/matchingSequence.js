/**
 * Encontra uma sequência correspondente no histórico, priorizando correspondências mais longas.
 * Verifica correspondências para os últimos 4, 3 e 2 resultados.
 * @param {Array<number>} lastResults Os últimos resultados observados (idealmente 4).
 * @param {Array<object>} sequences Array de objetos de sequência armazenados (cada um com { sequence: [num, num, num, num, num] }).
 * @returns {object|null} Um objeto { prediction: number, length: number } se uma correspondência for encontrada (length indica o tamanho da correspondência: 4, 3 ou 2), ou null se nenhuma correspondência for encontrada.
 */
export function findFlexibleMatchingSequence(lastResults, sequences) {
  if (!lastResults || lastResults.length < 2 || !sequences || sequences.length === 0) {
    return null;
  }

  let bestMatch = null;

  // 1. Tenta encontrar correspondência exata dos últimos 4
  if (lastResults.length >= 4) {
    const currentSequence4 = lastResults.slice(-4);
    for (const { sequence } of sequences) {
      if (sequence.length >= 5) {
        const storedSequence4 = sequence.slice(0, 4);
        if (storedSequence4.join(",") === currentSequence4.join(",")) {
          // Encontrou correspondência de 4, retorna imediatamente (prioridade máxima)
          return { prediction: sequence[4], length: 4 };
        }
      }
    }
  }

  // 2. Se não encontrou 4, tenta encontrar correspondência dos últimos 3
  if (lastResults.length >= 3) {
    const currentSequence3 = lastResults.slice(-3);
    for (const { sequence } of sequences) {
      // Compara os últimos 3 da sequência atual com os 3 (pos 1 a 3) da sequência armazenada
      if (sequence.length >= 5) { 
        const storedSequence3 = sequence.slice(1, 4);
        if (storedSequence3.join(",") === currentSequence3.join(",")) {
          // Encontrou correspondência de 3. Guarda como melhor até agora e continua procurando por 4 (embora já tenhamos falhado)
          // Na verdade, como já falhamos em 4, este é o melhor possível até agora.
          bestMatch = { prediction: sequence[4], length: 3 };
          // Poderíamos parar aqui se quiséssemos priorizar a primeira correspondência de 3 encontrada.
          // Por enquanto, vamos apenas guardar e continuar (caso outra sequência de 3 leve a uma previsão diferente? Não, a lógica é pegar a previsão da sequência encontrada)
          // Vamos retornar a primeira correspondência de 3 encontrada.
          return bestMatch;
        }
      }
    }
  }

  // 3. Se não encontrou 4 ou 3, tenta encontrar correspondência dos últimos 2
  if (lastResults.length >= 2) {
    const currentSequence2 = lastResults.slice(-2);
    for (const { sequence } of sequences) {
      // Compara os últimos 2 da sequência atual com os 2 (pos 2 a 3) da sequência armazenada
      if (sequence.length >= 5) {
        const storedSequence2 = sequence.slice(2, 4);
        if (storedSequence2.join(",") === currentSequence2.join(",")) {
           // Encontrou correspondência de 2. Retorna.
           return { prediction: sequence[4], length: 2 };
        }
      }
    }
  }

  // Se chegou até aqui, nenhuma correspondência foi encontrada
  return null;
}

// Mantém a função original caso seja necessária para comparação ou fallback
export function findMatchingSequence(colors, sequences) {
	for (const { sequence } of sequences) {
		const currentSequence = sequence.slice(0, 4);

		if (currentSequence.join(",") === colors.join(",")) {
			return sequence[4]; // Retorna apenas o índice da cor prevista
		}
	}

	return null; // Retorna null em vez de false para consistência
}

