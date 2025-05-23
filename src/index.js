import 'dotenv/config'; // Carrega variáveis de ambiente do .env
import TelegramBot from 'node-telegram-bot-api';
import { getHistoryBlaze } from './blazeApi.js';
import { analyzeSequence } from './analyzeSequence.js';
import { saveSequences } from './db.js';
// Importa a nova função flexível e remove a antiga se não for mais usada diretamente aqui
import { findFlexibleMatchingSequence } from './matchingSequence.js'; 
import { calculateFrequencies, analyzeCurrentStreak } from './statistics.js'; // Importa as novas funções
import emitter from './websocket.js';
import c from 'chalk';

// --- Configurações --- 
const FREQUENCY_WINDOW_SIZE = 100; // Janela para cálculo de frequência (últimos 100 resultados)
const MIN_PATTERN_MATCH_LENGTH = 3; // Define o tamanho mínimo de padrão para enviar notificação (ex: 3 ou 4)
// ---------------------

// Configuração do Bot do Telegram
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token || !chatId) {
  console.error(c.red('Erro: Variáveis de ambiente TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID não definidas.'));
  console.log(c.yellow('Crie um arquivo .env na raiz do projeto e adicione as variáveis. Veja .env.example.'));
  process.exit(1); // Encerra o script se as variáveis não estiverem definidas
}

const bot = new TelegramBot(token);

console.log(c.blue('Bot do Telegram inicializado com lógica aprimorada. Aguardando eventos...'));

const rounds = {}; // Armazena a previsão para cada rodada ativa

const colorsNumbered = {
  ['0']: '⚪️ Branco',
  ['1']: '🔴 Vermelho',
  ['2']: '⚫️ Preto',
};

const colorsNumberedInverted = {
  'white': '0',
  'red': '1',
  'black': '2',
};

// --- Listener para Nova Rodada --- 
emitter.on('newRoll', async (data) => {
  try {
    const history = await getHistoryBlaze();
    // Precisa de pelo menos o tamanho mínimo de padrão para tentar encontrar correspondência
    if (!history || history.length < MIN_PATTERN_MATCH_LENGTH) { 
        console.log(c.yellow(`Histórico insuficiente (${history?.length || 0}) para análise de padrão mínimo (${MIN_PATTERN_MATCH_LENGTH}).`));
        return;
    }

    const lastResults = history.slice(-4); // Pega até os últimos 4 para análise completa

    // Salva novas sequências encontradas no histórico completo (baseado em 5 elementos)
    const sequencesResults = analyzeSequence(history);
    const allSequences = saveSequences(sequencesResults);

    // --- Lógica de Previsão Aprimorada ---
    // 1. Tenta encontrar correspondência flexível (4, 3 ou 2)
    const patternMatch = findFlexibleMatchingSequence(lastResults, allSequences);

    // Calcula estatísticas adicionais independentemente de encontrar padrão
    const frequencies = calculateFrequencies(history, FREQUENCY_WINDOW_SIZE);
    const currentStreak = analyzeCurrentStreak(history);

    // Prepara informações adicionais para a mensagem
    const freqMsg = `Frequência (últimos ${frequencies.total}): ${colorsNumbered['1']} ${frequencies.percentages['1']}% | ${colorsNumbered['2']} ${frequencies.percentages['2']}% | ${colorsNumbered['0']} ${frequencies.percentages['0']}%`;
    const streakMsg = currentStreak.length > 1 ? `Sequência Atual: ${colorsNumbered[currentStreak.color]} x${currentStreak.length}` : 'Sem sequência atual (maior que 1)';

    console.log(c.magenta(freqMsg));
    console.log(c.magenta(streakMsg));

    // 2. Decide se envia notificação baseado no padrão encontrado
    if (patternMatch && patternMatch.length >= MIN_PATTERN_MATCH_LENGTH) {
      const { prediction: predictedColorIndex, length: matchLength } = patternMatch;
      const relevantLastResults = lastResults.slice(-matchLength); // Pega os últimos N resultados que formaram o padrão
      const parsedLastResults = relevantLastResults.map((color) => colorsNumbered[color]);
      const prediction = colorsNumbered[predictedColorIndex];

      console.log(`ÚLTIMOS ${matchLength} RESULTADOS: ${c.cyan(parsedLastResults.join(' '))}`);
      console.log(`PADRÃO (MATCH ${matchLength}) ENCONTRADO -> PREVISÃO: ${c.green(prediction)}`);

      // Envia a previsão para o Telegram com informações adicionais
      const message = 
`🚨 *Possível Entrada Identificada (Padrão ${matchLength})* 🚨

Últimos ${matchLength}: ${parsedLastResults.join(' ')}
🎯 Previsão (Padrão ${matchLength}): *${prediction}*

📊 ${freqMsg}
📈 ${streakMsg}`;

      try {
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        console.log(c.blue(`Mensagem de previsão (baseada em padrão ${matchLength}) enviada para o Telegram.`));
      } catch (telegramError) {
        console.error(c.red('Erro ao enviar mensagem de previsão para o Telegram:'), telegramError.message || telegramError);
      }

      // Armazena a previsão e o tipo/tamanho do match para a rodada atual
      rounds[data.id] = { prediction: predictedColorIndex, type: `pattern-${matchLength}` };
    } else {
        if (patternMatch) {
            console.log(c.yellow(`Padrão encontrado (Match ${patternMatch.length}), mas abaixo do mínimo (${MIN_PATTERN_MATCH_LENGTH}) para notificar.`));
        } else {
            console.log(c.yellow('Nenhum padrão correspondente encontrado.'));
        }
        // Poderíamos adicionar lógica aqui para prever baseado SÓ em frequência/streak se quiséssemos, mas por enquanto só notificamos por padrão
    }

  } catch (error) {
    console.error(c.red('Erro no manipulador newRoll:'), error);
  }
});

// --- Listener para Rodada Completa --- 
emitter.on('rollComplete', async (data) => {
  const roundInfo = rounds[data.id];
  // Só processa se tínhamos uma previsão para esta rodada
  if (!roundInfo) return;

  const actualColorName = data.color; // 'red', 'black', 'white'
  if (!actualColorName || colorsNumberedInverted[actualColorName.toLowerCase()] === undefined) {
      console.error(c.red('Erro: Cor inválida ou indefinida recebida em rollComplete:'), actualColorName, data);
      delete rounds[data.id];
      return;
  }
  const actualColorIndex = colorsNumberedInverted[actualColorName.toLowerCase()];
  const predictedColorIndex = roundInfo.prediction;

  const actualResultFormatted = colorsNumbered[actualColorIndex];
  const expectedResultFormatted = colorsNumbered[predictedColorIndex];

  let resultMessage = '';
  let consoleMsg = '';

  // Usa o tipo de previsão armazenado (ex: 'pattern-4', 'pattern-3')
  const predictionType = roundInfo.type || 'padrão'; 

  if (String(actualColorIndex) === String(predictedColorIndex)) {
    consoleMsg = `${c.green('DEU BOM (GREEN):')} Resultado: ${c.cyan(actualResultFormatted)} | Previsão (${predictionType}): ${c.cyan(expectedResultFormatted)}`;
    resultMessage = `✅ *GREEN!* ✅\n\nResultado: ${actualResultFormatted}\nPrevisão (${predictionType}): ${expectedResultFormatted}`;
  } else {
    consoleMsg = `${c.red('DEU RUIM (RED):')} Resultado: ${c.cyan(actualResultFormatted)} | Previsão (${predictionType}): ${c.cyan(expectedResultFormatted)}`;
    resultMessage = `❌ *RED!* ❌\n\nResultado: ${actualResultFormatted}\nPrevisão (${predictionType}): ${expectedResultFormatted}`;
  }

  console.log(consoleMsg + '\n');

  // Envia o resultado para o Telegram
  try {
    await bot.sendMessage(chatId, resultMessage, { parse_mode: 'Markdown' });
    console.log(c.blue('Mensagem de resultado enviada para o Telegram.'));
  } catch (telegramError) {
    console.error(c.red('Erro ao enviar mensagem de resultado para o Telegram:'), telegramError.message || telegramError);
  }

  // Limpa a previsão para esta rodada
  delete rounds[data.id];
});

// --- Tratamento de Erros Gerais --- 
emitter.on('error', (error) => {
  console.error(c.red('Erro no EventEmitter (WebSocket?):'), error);
});

process.on('uncaughtException', (error) => {
  console.error(c.red('Erro não capturado:'), error);
  // Considerar notificar via Telegram sobre falha crítica
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(c.red('Rejeição não tratada:'), promise, 'razão:', reason);
  // Considerar notificar via Telegram sobre falha crítica
});

