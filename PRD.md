# PRD - Bolao Copa do Mundo FIFA 2026

## Product Requirements Document
**Projeto:** Bolao Copa do Mundo FIFA 2026  
**Versao:** 1.1 (Alinhado)  
**Data:** 2026-05-18  
**Status:** Aprovado - Pronto para desenvolvimento  
**Dominio:** bolao.bubhug.com  
**Infra:** Hostinger VPS KVM 2 (2 vCPU, 8GB RAM) + Ubuntu + Docker

---

## Decisoes Alinhadas

| # | Decisao | Escolha |
|---|---------|---------|
| P1 | Banco de dados | PostgreSQL no VPS (Docker container) |
| P2 | Autenticacao | Email + senha + Google OAuth |
| P3 | Modelo de bolao | Bolao unico (admin e o dono, todos participam do mesmo) |
| P4 | Probabilidades | Automaticas via API de odds de casas de apostas |
| P5 | Notificacoes | Apenas no sistema (toast/banner in-app) |
| P6 | Mata-mata | Nao incluir (removido do escopo) |
| P7 | Comprovante PIX | Sem upload; investigar verificacao automatica via API bancaria |
| P8 | Dominio | bolao.bubhug.com |
| P9 | VPS | KVM 2 (2 vCPU, 8GB RAM) |
| P10 | Perguntas bonus | Incluir no MVP |
| P11 | Tema visual | Cores oficiais FIFA 2026 em tema escuro |
| P12 | Idioma do codigo | Ingles (variaveis, funcoes); PT-BR apenas na UI |

---

## 1. Visao Geral do Produto

Sistema web responsivo (mobile-first) para gerenciamento de bolao da Copa do Mundo FIFA 2026. O sistema permite que usuarios se cadastrem, paguem via PIX, facam palpites nos jogos da Copa e acompanhem seus pontos em um ranking com sistema de divisoes. O administrador (dono do bolao) aprova manualmente os pagamentos e gerencia o sistema.

### 1.1 Problema que Resolve
Organizar boloes de Copa do Mundo de forma digital, eliminando planilhas manuais, garantindo transparencia nos pontos e automatizando a atualizacao de resultados dos jogos.

### 1.2 Publico-Alvo
- Grupos de amigos, familia e colegas de trabalho que querem participar de um bolao da Copa 2026
- Faixa etaria: 18+ (devido ao componente financeiro)
- Perfil tecnico: usuarios comuns de smartphone (interface simples e intuitiva)

---

## 2. Objetivos do Produto

| Objetivo | Metrica de Sucesso |
|----------|-------------------|
| Cadastro e pagamento simples | Usuario completa cadastro + pagamento em menos de 3 minutos |
| Palpites rapidos | Fazer palpite em um jogo em menos de 10 segundos |
| Atualizacao automatica de resultados | Resultados atualizados em ate 5 minutos apos o fim do jogo |
| Engajamento | Usuarios acessam o sistema pelo menos 1x por dia durante a Copa |

---

## 3. Funcionalidades Principais

### 3.1 Autenticacao e Cadastro

**F01 - Cadastro de Usuario**
- Cadastro com email e senha OU via Google OAuth
- Campos: nome completo, email, senha, telefone (opcional)
- Validacao de email unico
- Avatar gerado automaticamente (iniciais do nome) ou foto do Google

**F02 - Login**
- Login com email e senha
- Login com Google (OAuth 2.0)
- Opcao "Lembrar-me"
- Recuperacao de senha por email

**F03 - Perfil do Usuario**
- Edicao de nome e avatar
- Visualizacao de estatisticas pessoais

### 3.2 Pagamento e Entrada no Bolao

**F04 - Pagamento via PIX**
- Exibicao de QR Code PIX estatico (mesmo para todos os usuarios)
- QR Code configuravel pelo administrador (chave PIX do admin)
- Valor do bolao exibido claramente na tela
- Instrucao para o usuario: "Faca o PIX e aguarde aprovacao"
- Copia e cola da chave PIX disponivel
- Sem upload de comprovante — o usuario apenas confirma que fez o PIX
- **[INVESTIGAR]** Verificacao automatica via API do banco (EFI/Gerencianet, Mercado Pago, etc.)
  - Se viavel: webhook recebe confirmacao do PIX e aprova automaticamente
  - Se inviavel: aprovacao manual pelo admin (fallback)

**F05 - Aprovacao de Pagamento**
- **Modo principal (se API bancaria viavel):** Aprovacao automatica via webhook PIX
- **Modo fallback (manual):** Admin aprova manualmente
- Painel administrativo lista todos os pagamentos pendentes
- Admin visualiza: nome do usuario, data do cadastro, valor esperado
- Botoes: Aprovar / Rejeitar com motivo opcional
- Ao aprovar, usuario e vinculado ao bolao automaticamente
- Notificacao in-app ao usuario sobre aprovacao/rejeicao (toast/banner)

### 3.3 Jogos da Copa do Mundo

**F06 - Tabela de Jogos**
- Lista completa de todos os jogos da Copa 2026 (104 jogos)
- Agrupamento por fase: Fase de Grupos, Oitavas, Quartas, Semi, Final
- Para cada jogo: bandeiras dos paises, nomes em portugues BR, data, horario (fuso local do usuario), estadio, cidade
- Filtros: por grupo, por fase, por data, por selecao
- Status visual: Agendado, Ao Vivo, Encerrado

**F07 - Atualizacao Automatica de Dados**
- Sincronizacao automatica de tabela de jogos (times, datas, horarios)
- Atualizacao de resultados (placares) o mais rapido possivel
- Fonte de dados: API gratuita ou combinacao de fontes (ver Secao 8)
- Bandeiras dos paises via CDN (flagcdn.com)
- Nomes dos times traduzidos para portugues BR

**F08 - Jogos Ao Vivo**
- Indicador visual de jogo ao vivo (badge pulsante)
- Placar atualizado durante o jogo
- Minuto do jogo

### 3.4 Palpites

**F09 - Fazer Palpite**
- Interface intuitiva com +/- para cada time (igual ao app de referencia)
- Palpite = placar (ex: Brasil 2 x 0 Haiti)
- Permitido alterar palpite ate 10 minutos antes do inicio do jogo
- Contador regressivo visivel mostrando tempo restante para palpitar
- Confirmacao visual ao salvar palpite

**F10 - Bloqueio de Palpites**
- Palpites bloqueiam automaticamente 10 minutos antes do inicio
- Apos bloqueio: todos os palpites de todos os participantes ficam visiveis
- Listagem publica mostra: nome do participante, palpite, avatar
- Ordenacao por nome

**F11 - Perguntas Bonus**
- Incluido no MVP
- Administrador pode criar perguntas associadas a jogos ou fases
- Exemplos: "Quem fara o primeiro gol?", "Quantos escanteios no jogo?", "Artilheiro da Copa?"
- Respostas seguem a mesma regra de bloqueio (10min antes do jogo relacionado)
- Perguntas gerais (sem jogo) podem ter prazo customizado
- Pontuacao configuravel pelo admin

### 3.5 Sistema de Pontuacao

**F12 - Pontuacao Baseada em Probabilidades (Sistema Equilibrado)**
O sistema principal e baseado em probabilidades, tornando mais justo:

- **Pontos Base**: Calculados inversamente as probabilidades
  - Quanto maior a probabilidade de um resultado, MENOS pontos base ele da
  - Quanto menor a probabilidade (zebra), MAIS pontos base
  - As probabilidades sao buscadas automaticamente de APIs de odds (casas de apostas)
  - O admin pode ajustar manualmente se necessario
  - Formula: Pontos base = funcao inversa da probabilidade do resultado que ocorreu

- **Bonus (somam aos pontos base)**:
  | Bonus | Condicao | Pontos |
  |-------|----------|--------|
  | Placar Exato | Acertou o placar completo | +5 |
  | Placar Vencedor | Acertou os gols do time vencedor | +3 |
  | Diferenca de Gols | Acertou a diferenca de gols | +2 |
  | Placar Perdedor | Acertou os gols do time perdedor | +1 |
  | Goleada (extra) | Acertou que seria goleada (3+ gols de diferenca) | +1 |

**F13 - Sistemas de Pontuacao Alternativos**
O admin pode escolher entre 4 sistemas:
1. **Equilibrado** (padrao): Baseado em probabilidades + bonus (descrito acima)
2. **Simples**: Pontos fixos (ex: 10 exato, 5 vencedor, 0 errou)
3. **Super Simples**: Apenas acertou/errou vencedor
4. **Personalizado**: Admin define todas as regras

**F14 - Simulador de Pontos**
- Ferramenta para o usuario testar cenarios
- Define: Resultado Real + Probabilidades + Palpite
- Mostra: detalhamento dos pontos (base + cada bonus)
- Total de pontos que receberia

### 3.6 Ranking e Divisoes

**F15 - Ranking Geral**
- Lista todos os participantes ordenados por pontos
- Exibe: posicao, avatar, nome, pontos totais, divisao
- Filtro de busca por nome
- Destaque visual para top 3 (ouro, prata, bronze)
- Indicador de subida/descida de posicao

**F16 - Sistema de Divisoes**
Baseado no numero de participantes:
| Participantes | Divisoes |
|---------------|----------|
| Ate 7 | 1 divisao (Serie Unica) |
| 8 a 14 | 2 divisoes (Serie A - Profissionais, Serie B - Semiprofissionais) |
| 15 a 23 | 3 divisoes (Serie C - Amadores) |
| 24 a 49 | 4 divisoes (Serie D - Juvenis) |
| 50+ | 5 divisoes (Serie E - Lanternas) |

- Divisoes tem tamanhos iguais
- Subida e descida de divisao ocorre ao final de cada rodada/fase
- Quem faz mais pontos sobe, quem faz menos desce

**F17 - Ranking por Divisao**
- Filtro para ver ranking de cada divisao separadamente
- Indicador visual de zona de acesso (subida) e zona de rebaixamento (descida)

### 3.7 Administracao

**F19 - Painel Administrativo**
- Dashboard com metricas: total de participantes, pagamentos pendentes, proximos jogos
- Gestao de participantes: listar, aprovar pagamentos, remover
- Gestao de jogos: editar resultados manualmente se necessario
- Configurar probabilidades dos jogos (override manual das odds automaticas)
- Criar/editar perguntas bonus
- Configurar sistema de pontuacao
- Configurar chave PIX e valor do bolao

**F20 - Configuracoes do Bolao**
- Nome do bolao
- Valor de entrada
- Chave PIX (QR Code)
- Sistema de pontuacao escolhido
- Tolerancia de bloqueio (padrao: 10 min)
- Habilitar/desabilitar perguntas bonus
- Habilitar/desabilitar divisoes

---

## 4. Paginas do Sistema

### 4.1 Paginas Publicas
| Pagina | Descricao |
|--------|-----------|
| Landing Page | Apresentacao do bolao, como funciona, CTA para cadastro |
| Login | Email + senha |
| Cadastro | Formulario de registro |
| Recuperar Senha | Envio de email de recuperacao |

### 4.2 Paginas do Participante (Autenticado)
| Pagina | Descricao |
|--------|-----------|
| Dashboard | Visao geral: proximos jogos, posicao no ranking, ultimos resultados |
| Pagamento PIX | QR Code + instrucoes + status do pagamento |
| Jogos | Lista de todos os jogos com filtros |
| Palpites | Fazer/editar palpites nos proximos jogos |
| Palpites Publicos | Ver palpites de todos (apos bloqueio) |
| Ranking | Ranking geral com divisoes e filtros |
| Simulador | Simulador de pontos |
| Perguntas | Responder perguntas bonus |
| Perfil | Editar dados pessoais |
| Como Funciona | Explicacao do sistema de pontos, regras, FAQ |

### 4.3 Paginas do Admin
| Pagina | Descricao |
|--------|-----------|
| Admin Dashboard | Metricas e acoes rapidas |
| Aprovar Pagamentos | Lista de pagamentos pendentes |
| Gerenciar Jogos | Editar jogos/resultados manualmente |
| Configurar Probabilidades | Visualizar odds automaticas + override manual |
| Perguntas Bonus | Criar/editar perguntas |
| Configuracoes | Configuracoes gerais do bolao |

---

## 5. Requisitos Nao-Funcionais

### 5.1 Performance
- Tempo de carregamento inicial: < 3 segundos
- Atualizacao de placar ao vivo: < 30 segundos de atraso
- Suportar ate 200 usuarios simultaneos sem degradacao

### 5.2 Seguranca
- HTTPS obrigatorio
- Autenticacao JWT com refresh tokens
- Row Level Security (RLS) no banco de dados
- Sanitizacao de inputs
- Rate limiting nas APIs
- Protecao contra CSRF

### 5.3 Usabilidade
- Mobile-first (maioria dos acessos sera por celular)
- Interface em Portugues do Brasil
- Acessivel (contraste adequado, fontes legiveis)
- Feedback visual para todas as acoes do usuario

### 5.4 Disponibilidade
- Uptime alvo: 99.5%
- Backup diario do banco de dados
- Monitoramento de saude do servidor

### 5.5 Identidade Visual
- Paleta de cores inspirada na Copa do Mundo FIFA 2026
- Cores principais:
  - Verde: #3CAC3B (Average Green)
  - Azul: #2A398D (Hermes Blue)
  - Vermelho: #E61D25 (Torch Red)
  - Cinza claro: #D1D4D1
  - Cinza escuro: #474A4A
  - Dourado: #C9A84C (para trofeu/destaques)
- Tema escuro como padrao (similar ao app de referencia)
- Background principal: gradiente escuro (#0a1628 para #0d2137)
- Cards com fundo semi-transparente e borda sutil
- Tipografia moderna e legivel

---

## 6. Regras de Negocio

### RN01 - Bloqueio de Palpites
- Todo palpite deve ser registrado ate **10 minutos antes** do horario oficial de inicio do jogo
- Apos o bloqueio, nenhuma alteracao e permitida
- Apos o bloqueio, os palpites de todos os participantes ficam visiveis publicamente

### RN02 - Pagamento
- O QR Code PIX e estatico e igual para todos
- O pagamento cai direto na conta do administrador, sem intermediarios
- A aprovacao e 100% manual pelo administrador
- Sem pagamento aprovado, o usuario nao visualiza jogos nem faz palpites

### RN03 - Pontuacao
- Pontos sao calculados automaticamente quando o resultado de um jogo e registrado
- O calculo e irreversivel, a menos que o admin corrija o resultado do jogo
- No sistema equilibrado, as probabilidades sao buscadas automaticamente via API de odds
- O admin pode fazer override manual das probabilidades ANTES do jogo comecar

### RN04 - Divisoes
- As divisoes sao recalculadas periodicamente (a cada fase ou rodada completa)
- A divisao de cada participante e baseada exclusivamente na pontuacao

### RN05 - Participacao
- Sistema de bolao unico (todos participam do mesmo bolao)
- A entrada no bolao requer pagamento aprovado (manual ou automatico via webhook)

### RN06 - Jogos
- Jogos sao sincronizados automaticamente a partir da API de dados
- O admin pode corrigir resultados manualmente se necessario
- Todos os horarios sao exibidos no fuso horario do usuario

---

## 7. Fluxos Principais

### Fluxo 1: Novo Usuario
```
Acessa o site → Cadastro → Tela de Pagamento PIX → Faz PIX → Aguarda aprovacao → Admin aprova → Acesso ao bolao
```

### Fluxo 2: Fazer Palpite
```
Dashboard → Proximos Jogos → Seleciona jogo → Define placar → Salva palpite → Confirmacao visual
```

### Fluxo 3: Apos Inicio do Jogo
```
10min antes: palpites bloqueiam → Palpites de todos ficam visiveis → Jogo acontece → Resultado entra no sistema → Pontos calculados → Ranking atualizado
```

### Fluxo 4: Admin Aprova Pagamento
```
Admin Dashboard → Pagamentos Pendentes → Visualiza usuario → Aprova → Usuario vinculado ao bolao → Notificacao enviada
```

---

## 8. Estrategia de Dados da Copa (APIs)

### 8.1 Opcoes Avaliadas

| Fonte | Tipo | Custo | Tempo Real | Observacoes |
|-------|------|-------|------------|-------------|
| openfootball/worldcup.json | JSON estatico (GitHub) | Gratis | Nao | Dados historicos, sem live. Bom para tabela inicial |
| API-Football (api-football.com) | REST API | Gratis ate 100 req/dia | Sim | Plano gratis limitado, mas viavel com cache |
| football-data.org | REST API | Gratis (10 req/min) | Sim | API bem documentada, plano gratuito generoso |
| TheSportsDB | REST API | Gratis (Patreon opcional) | Parcial | Bom para dados de times/bandeiras |
| wc2026api.com | REST API | Gratis + Pro | Sim | Especifica para Copa 2026 |
| Web scraping (FIFA.com / ge.globo.com) | Scraping | Gratis | Parcial | Fragil, pode quebrar |

### 8.2 Estrategia Recomendada (Multi-fonte)
1. **Tabela inicial de jogos**: openfootball/worldcup.json (gratis, completo)
2. **Atualizacao de resultados**: football-data.org ou API-Football free tier com cache agressivo
3. **Bandeiras e logos**: flagcdn.com (CDN gratuito)
4. **Nomes em PT-BR**: Mapeamento local (JSON com traducoes)
5. **Fallback**: Scraping do ge.globo.com como ultimo recurso

### 8.3 Estrategia de Cache
- Cache de resultados por 2 minutos durante jogos ao vivo
- Cache de tabela de jogos por 1 hora (fora de horario de jogos)
- Cache de dados estaticos (bandeiras, nomes) por 24 horas
- Job CRON para sincronizar resultados a cada 2-5 minutos durante jogos

---

## 9. Infraestrutura

### 9.1 Hospedagem
- **Servidor**: Hostinger VPS KVM 2 (2 vCPU, 8GB RAM) com Ubuntu
- **Containerizacao**: Docker + Docker Compose
- **Dominio**: bolao.bubhug.com
- **SSL**: Automatico via Caddy (Let's Encrypt)

### 9.2 Containers Docker
1. **App** (Next.js) - frontend + API routes
2. **Banco de Dados** (PostgreSQL) - dados do sistema
3. **Reverse Proxy** (Nginx/Caddy) - SSL, cache, proxy
4. **CRON Jobs** (Node.js worker) - sincronizacao de dados

### 9.3 Banco de Dados
- PostgreSQL 16
- Backups automaticos diarios
- Migrations versionadas

---

## 10. Fora do Escopo (v1)

- Chat entre participantes
- Notificacoes push / email
- App nativo (iOS/Android)
- Multiplos boloes simultaneos
- Integracao com WhatsApp
- Sistema de premios automatico
- Mata-mata entre participantes

---

## 11. Riscos e Mitigacoes

| Risco | Impacto | Mitigacao |
|-------|---------|----------|
| API gratuita sai do ar | Resultados nao atualizam | Multi-fonte + input manual do admin |
| Limite de requests da API | Dados desatualizados | Cache agressivo + CRON inteligente |
| VPS Hostinger instavel | Sistema fora do ar | Docker restart policies + monitoramento |
| Muitos usuarios simultaneos | Lentidao | SSR + cache + otimizacao de queries |
| Copa muda horarios/jogos | Dados desatualizados | Sync automatico + edicao manual |

---

## 12. Cronograma Sugerido

A Copa do Mundo 2026 comeca em **11 de junho de 2026**. Temos ~24 dias.

| Fase | Duracao | Entrega |
|------|---------|---------|
| Fase 1: Fundacao (Infra + Auth + DB) | 3 dias | Setup Docker, banco, auth, deploy basico |
| Fase 2: Core (Jogos + Palpites) | 5 dias | Tabela de jogos, palpites, bloqueio |
| Fase 3: Pontuacao + Ranking | 3 dias | Calculo de pontos, ranking, divisoes |
| Fase 4: Admin + Pagamento | 3 dias | Painel admin, PIX, aprovacao |
| Fase 5: Polish + Extras | 3 dias | Simulador, mata-mata, visual |
| Fase 6: Testes + Deploy | 3 dias | Testes, otimizacao, deploy producao |
| Buffer | 4 dias | Margem para imprevistos |

---
