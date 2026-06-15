# Changelog — Bolão Lamparão Copa 2026

Registro das alterações do sistema para comunicação periódica aos participantes.

## Como funciona
- Toda alteração nova é adicionada em **🆕 Não enviado**, no topo.
- Quando o changelog for enviado aos participantes (a pedido), as entradas de "Não enviado"
  são movidas para **📨 Enviado**, sob um cabeçalho com a data do envio.
- Assim, cada envio leva **somente o que ainda não foi comunicado**.
- Datas no formato AAAA-MM-DD.

---

## 🆕 Não enviado

### Notificações (sino)
- O **sininho** agora **abre e fecha na própria tela** ao tocar, num painel sobre a página — sem mais sair para uma página separada. Toque de novo (ou fora do painel) para fechar. Os ícones por tipo ficaram mais claros (resultado 🏆, ranking ⭐, pagamento 💳, conquista 🏅) e há um atalho **"Ver todas"** para o histórico completo.

### Ranking
- **Setas de variação de posição:** no ranking **Geral**, cada participante agora mostra se **subiu (▲ verde)**, **caiu (▼ vermelho)** ou **manteve (–)** a posição, com o número de posições, em relação ao **início do dia**. Durante os jogos ao vivo as setas se mexem junto, dá pra acompanhar a disputa em tempo real.

### Perfil
- **Tipos de palpite no perfil:** o perfil (seu e o dos outros participantes) agora mostra a **distribuição dos palpites finalizados por tipo** — **Cravados** (placar exato), **Quase** (vencedor + gols do vencedor), **Saldo** (vencedor + diferença de gols), **Parcial** (só o vencedor), **Esmolas** (+1 de consolação) e **Erros**. Fica **recolhido por padrão** (botão "Mostrar") para não poluir a página.
- **Correção nos "Acertos":** as **Esmolas não contam mais como acerto** na estatística de "Acertos" do perfil (antes, em alguns casos, estavam sendo somadas indevidamente). O número de Acertos agora reflete só os acertos de verdade — e a Esmola continua sem entrar na sequência de acertos das conquistas.

### Perguntas
- Na aba **Encerradas**, as perguntas agora aparecem da **mais recente para a mais antiga** (a que encerrou por último vem primeiro), igual à aba "Finalizados" dos Jogos.

### Notificações
- **Notificação no celular (push):** dá pra ativar em **Configurações → Notificações no celular**. A partir daí, o lembrete de palpite (30 min antes do jogo) chega **direto no aparelho**, além do e-mail. No iPhone, é preciso **adicionar o app à tela inicial** primeiro.
- **Notificações configuráveis (agora funcionam de verdade):** em Configurações você liga/desliga cada tipo — **Próximos jogos**, **Resultados de palpites** (quando o jogo termina), **Mudanças no ranking** (quando sobe/cai 3+ posições) e **Não perturbe** (sem push das 22h às 7h). Conquistas e pagamento confirmado também passam a chegar no celular.
  - 📌 **Nota para o envio:** ao mandar este informativo, incluir:
    1. Instrução pedindo para a galera **ativar as notificações** (Configurações → Notificações no celular → Ativar).
    2. Aviso aos usuários de **iPhone**: precisam **instalar o app na tela inicial** antes para o push funcionar.
    3. Avisar que agora dá pra **escolher quais notificações receber** (Próximos jogos, Resultados de palpites, Mudanças no ranking) e ativar o **"Não perturbe"** (sem push das 22h às 7h) em Configurações → Notificações.
    4. ⚠️ **Importante:** quem **já tinha ativado** o push antes precisa **Desativar e Ativar novamente** (uma correção no envio fez as inscrições antigas serem perdidas — só voltam a valer reativando).

### Ranking
- **Pontos ao vivo:** durante os jogos em andamento, a pontuação provisória já entra no **total do ranking e no perfil** (com selo "ao vivo"), então dá para acompanhar a disputa mexer em tempo real. (Valor parcial — pode mudar até o fim do jogo.)
- **Ranking por período:** novas abas **Geral / Hoje / Semana** mostram quem pontuou mais no período (somando jogos, perguntas e conquistas).
- A pontuação antes chamada "meio-acerto" agora se chama **"Esmola"** (acertou o nº de gols de um time mas errou o vencedor: +1 ponto de consolação, que não conta como acerto).
- O **Pote do Bolão** agora mostra o **valor real arrecadado** (saldo da conta, já líquido das taxas do PIX), e **atualiza sozinho** conforme novos pagamentos entram. O 1º lugar exibe o valor do pote menos os R$31 do vice.

### Navegação e busca
- Na página de **Jogos**, a aba **"Finalizados"** ficou entre as primeiras, para acesso mais rápido.
- **Busca por digitação** na página de **Jogos** (encontrar um jogo específico para palpitar sem rolar a tela).
- **Busca por digitação** na página de **Perguntas** (encontrar uma pergunta específica para responder).
- **Ranking** com novos nomes das divisões: **"Ponto pra Cabrunco"**, **"Num faz mal a ninguém"** e **"Zona da Vergonha"**.

### Perguntas vinculadas a jogos
- Perguntas agora podem ser **vinculadas a um jogo**: o prazo de resposta fecha **junto com o palpite** do jogo (10 minutos antes do apito inicial).
- Perguntas **sem jogo** passam a ter **prazo de encerramento obrigatório** — nenhuma pergunta fica aberta para sempre.
- Na **página de Perguntas**, as perguntas **perto de vencer e ainda não respondidas** ficam destacadas ("⏳ Vence em breve") e aparecem no topo, para priorizar a resposta.
- No **Dashboard**, agora há um **alerta de perguntas pendentes** — toque para ir direto às perguntas em aberto.
- Na **lista de Jogos**, ao lado do botão "Palpitar" aparece **"Responder pergunta"** (ou "Editar pergunta", se já respondeu) quando o jogo tem pergunta vinculada.
- No **detalhe do jogo** há uma nova aba **"Perguntas"**: você responde/edita antes do bloqueio e, **depois do bloqueio, vê as respostas de todos os participantes** (igual à aba Bolão dos palpites).

---

## 📨 Enviado

### 2026-06-07 — Novidades e ajustes (WhatsApp + e-mail)
- **Séries A, B e C**: o ranking passou a ser dividido em 3 séries pela posição, com subida/descida automática conforme a pontuação.
- **Jogo ao vivo na tela inicial**: o card do jogo ao vivo virou clicável e leva aos palpites de todos os participantes em tempo real.
- **Probabilidades ao palpitar**: ao fazer/editar um palpite, as probabilidades da partida aparecem como após o bloqueio.
- **Perfil pelo ranking**: dá para clicar no próprio nome (e no dos outros) no ranking para ver o perfil.
- **Meio-acerto**: acertar o nº de gols de um time errando o vencedor vale +1 ponto, mas passou a aparecer como "MEIO-ACERTO" (cinza) e **não conta como acerto** — quebra a sequência de acertos.
- **Correções de acesso**: login com Google e por senha e recuperação de senha estabilizados.
