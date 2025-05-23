# Bot Blaze Aprimorado com Notificações no Telegram

Este projeto monitora os resultados do jogo Double da Blaze, aplica análises aprimoradas e envia notificações para um bot do Telegram quando identifica possíveis padrões, além de confirmar os resultados.

**Novidades da Versão:**

*   **Análise de Frequência:** Calcula e exibe a frequência das cores nos últimos resultados.
*   **Análise de Streaks:** Identifica e informa a sequência atual de cores repetidas.
*   **Padrões Flexíveis:** Busca por correspondências não apenas dos últimos 4 resultados, mas também dos últimos 3 e 2, aumentando as chances de identificar padrões históricos.
*   **Mensagens Detalhadas:** As notificações no Telegram agora incluem informações sobre frequência, streaks e o tamanho do padrão identificado (Match 4, 3 ou 2).

## Pré-requisitos

Antes de começar, certifique-se de ter o Node.js instalado em sua máquina. Você pode baixá-lo em [https://nodejs.org/](https://nodejs.org/). É recomendado usar a versão LTS mais recente.

## Instalação

1.  **Descompacte o Projeto:** Extraia o arquivo `.zip` que você recebeu para uma pasta de sua preferência no seu computador.

2.  **Acesse a Pasta do Projeto:** Abra o terminal ou prompt de comando e navegue até a pasta onde você extraiu os arquivos do projeto.

    ```bash
    cd caminho/para/a/pasta/blaze-telegram-bot
    ```

3.  **Crie o Arquivo de Configuração (.env):** O projeto utiliza variáveis de ambiente para o token do bot e o ID do chat. Copie o arquivo `.env.example` e renomeie a cópia para `.env`.

    *   Linux/macOS: `cp .env.example .env`
    *   Windows (CMD): `copy .env.example .env`
    *   Windows (PowerShell): `Copy-Item .env.example .env`

4.  **Configure as Variáveis de Ambiente:** Abra o arquivo `.env` com um editor de texto e insira suas credenciais:

    ```dotenv
    TELEGRAM_BOT_TOKEN=SEU_TOKEN_AQUI
    TELEGRAM_CHAT_ID=SEU_CHAT_ID_AQUI
    ```
    **Importante:** Mantenha seu token seguro!

5.  **Instale as Dependências:** No terminal, dentro da pasta do projeto, execute:

    ```bash
    npm install
    ```

## Configurações Adicionais (Opcional)

Dentro do arquivo `src/index.js`, no início, você pode ajustar duas constantes:

*   `FREQUENCY_WINDOW_SIZE`: Define quantos dos últimos resultados serão considerados para calcular a frequência das cores (padrão: 100).
*   `MIN_PATTERN_MATCH_LENGTH`: Define o tamanho mínimo da sequência de padrão (match) necessária para que o bot envie uma notificação de previsão (padrão: 3). Se um padrão de 2 for encontrado, ele será registrado no console, mas não enviará mensagem ao Telegram, a menos que você mude este valor para 2.

## Execução

Após a instalação e configuração, inicie o bot com o comando:

```bash
npm start
```

O bot começará a monitorar a Blaze. Você verá logs no console e receberá notificações no Telegram.

*   **Mensagens de Previsão:** Quando um padrão (com tamanho igual ou maior que `MIN_PATTERN_MATCH_LENGTH`) for encontrado, você receberá uma mensagem como:
    ```
    🚨 *Possível Entrada Identificada (Padrão 3)* 🚨

    Últimos 3: 🔴 Vermelho ⚫️ Preto 🔴 Vermelho
    🎯 Previsão (Padrão 3): *⚫️ Preto*

    📊 Frequência (últimos 100): 🔴 Vermelho 48.00% | ⚫️ Preto 49.00% | ⚪️ Branco 3.00%
    📈 Sequência Atual: 🔴 Vermelho x1
    ```
*   **Mensagens de Resultado:** Após a rodada prevista, você receberá:
    ```
    ✅ *GREEN!* ✅

    Resultado: ⚫️ Preto
    Previsão (pattern-3): ⚫️ Preto
    ```
    ou
    ```
    ❌ *RED!* ❌

    Resultado: 🔴 Vermelho
    Previsão (pattern-3): ⚫️ Preto
    ```

Para parar o bot, volte ao terminal e pressione `Ctrl + C`.

## Lógica de Análise Aprimorada

O bot agora utiliza uma combinação de análises:

1.  **Análise de Frequência:** Calcula a porcentagem de cada cor nos últimos `FREQUENCY_WINDOW_SIZE` resultados. Isso é exibido nas mensagens de previsão para dar um contexto estatístico recente.
2.  **Análise de Streaks:** Verifica qual a cor do último resultado e quantos resultados consecutivos iguais a ele ocorreram. Isso também é exibido nas mensagens de previsão.
3.  **Padrões Flexíveis:**
    *   O bot busca no histórico (`assets/sequences.json`) se os **últimos 4** resultados já ocorreram antes. Se sim, prevê o 5º resultado daquela sequência histórica (Match 4).
    *   Se não encontrar um Match 4, ele busca se os **últimos 3** resultados correspondem aos resultados 2, 3 e 4 de alguma sequência histórica. Se sim, prevê o 5º resultado daquela sequência (Match 3).
    *   Se não encontrar Match 4 ou 3, ele busca se os **últimos 2** resultados correspondem aos resultados 3 e 4 de alguma sequência histórica. Se sim, prevê o 5º resultado (Match 2).
    *   A notificação só é enviada se o tamanho do match for igual ou superior a `MIN_PATTERN_MATCH_LENGTH`.

**Importante:** Lembre-se que jogos de azar são inerentemente aleatórios. Essas análises buscam identificar padrões históricos ou tendências recentes, mas não garantem resultados futuros.

## Estrutura do Projeto

*   `src/`: Contém o código-fonte.
    *   `index.js`: Lógica principal, WebSocket, Telegram, integração das análises.
    *   `blazeApi.js`: Interação com API HTTP da Blaze.
    *   `websocket.js`: Conexão WebSocket com a Blaze.
    *   `analyzeSequence.js`: Identifica sequências de 5 resultados no histórico.
    *   `matchingSequence.js`: Contém a lógica para busca de padrões flexíveis (`findFlexibleMatchingSequence`).
    *   `statistics.js`: Contém as funções para cálculo de frequência e análise de streaks.
    *   `db.js`: Salva e carrega sequências do arquivo JSON.
*   `assets/`: Arquivos de dados.
    *   `sequences.json`: Armazena os padrões históricos identificados.
*   `.env`: Suas credenciais (criado por você).
*   `.env.example`: Exemplo para o arquivo `.env`.
*   `package.json`: Dependências e scripts.
*   `package-lock.json`: Versões exatas das dependências.
*   `README.md`: Este arquivo.

Se tiver dúvidas, revise os passos ou entre em contato.
