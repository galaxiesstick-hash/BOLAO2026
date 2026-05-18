# SPEC - Especificacao Tecnica

## Bolao Copa do Mundo FIFA 2026
**Versao:** 1.1 (Alinhado)  
**Data:** 2026-05-18  
**Dominio:** bolao.bubhug.com  
**Idioma do codigo:** Ingles (variaveis, funcoes, banco) | PT-BR (UI apenas)

---

## 1. Stack Tecnologico

| Camada | Tecnologia | Versao | Justificativa |
|--------|-----------|--------|---------------|
| Framework | Next.js (App Router) | 15+ | SSR, API Routes, Server Components, excelente DX |
| Linguagem | TypeScript | 5.x | Tipagem forte, menos bugs |
| UI | React | 19.x | Componentizacao, ecossistema |
| Estilizacao | Tailwind CSS | 4.x | Utility-first, rapido para prototipar |
| Banco de Dados | PostgreSQL | 16 | Robusto, JSONB, full-text search |
| ORM | Prisma | 6.x | Type-safe queries, migrations automaticas |
| Autenticacao | NextAuth.js (Auth.js) | 5.x | Suporte a credentials + Google OAuth, JWT, sessao |
| Estado | Zustand | 5.x | Leve, sem boilerplate |
| Validacao | Zod | 3.x | Schema validation, type inference |
| HTTP Client | fetch nativo + SWR | - | Cache, revalidacao, stale-while-revalidate |
| QR Code | qrcode.react | - | Geracao de QR Code PIX no frontend |
| Icones | Lucide React | - | Icones consistentes e leves |
| Containerizacao | Docker + Docker Compose | - | Deploy consistente |
| Reverse Proxy | Caddy | 2.x | HTTPS automatico, config simples |
| CRON | node-cron ou cron nativo Linux | - | Jobs de sincronizacao |
| Testes | Vitest + Testing Library | - | Rapido, compativel com Vite |

---

## 2. Arquitetura do Sistema

```
                    [Internet]
                        |
                    [Caddy - HTTPS]
                        |
                [Next.js App Container]
               /         |          \
         [SSR Pages]  [API Routes]  [Static Assets]
              |           |
         [Prisma ORM]    |
              |           |
        [PostgreSQL Container]
              
        [CRON Worker Container]
              |
        [APIs Externas: football-data.org, flagcdn.com, Odds API]
```

### 2.1 Containers Docker

```yaml
# docker-compose.yml (estrutura)
services:
  app:        # Next.js (porta 3000)
  db:         # PostgreSQL (porta 5432)
  caddy:      # Reverse proxy (portas 80, 443)
  cron:       # Worker para sincronizacao
```

### 2.2 Estrutura de Diretorios

```
fifa2026-bolao/
├── docker/
│   ├── Dockerfile              # Multi-stage build Next.js
│   ├── Dockerfile.cron         # Worker CRON
│   └── Caddyfile               # Configuracao Caddy
├── docker-compose.yml
├── docker-compose.prod.yml
│
├── prisma/
│   ├── schema.prisma           # Schema do banco
│   └── seed.ts                 # Seed com dados iniciais (jogos Copa 2026)
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/           # Rotas publicas
│   │   │   ├── page.tsx                # Landing page
│   │   │   ├── login/page.tsx          # Login
│   │   │   ├── cadastro/page.tsx       # Registro
│   │   │   └── recuperar-senha/page.tsx
│   │   │
│   │   ├── (app)/              # Rotas autenticadas
│   │   │   ├── layout.tsx              # Layout com nav
│   │   │   ├── dashboard/page.tsx      # Dashboard principal
│   │   │   ├── pagamento/page.tsx      # Tela PIX
│   │   │   ├── jogos/
│   │   │   │   ├── page.tsx            # Lista de jogos
│   │   │   │   └── [id]/page.tsx       # Detalhes do jogo + palpites publicos
│   │   │   ├── palpites/
│   │   │   │   └── page.tsx            # Fazer/editar palpites
│   │   │   ├── ranking/
│   │   │   │   └── page.tsx            # Ranking com divisoes
│   │   │   ├── simulador/
│   │   │   │   └── page.tsx            # Simulador de pontos
│   │   │   ├── perguntas/
│   │   │   │   └── page.tsx            # Perguntas bonus
│   │   │   ├── como-funciona/
│   │   │   │   └── page.tsx            # Regras e FAQ
│   │   │   └── perfil/
│   │   │       └── page.tsx            # Perfil do usuario
│   │   │
│   │   ├── (admin)/            # Rotas do admin
│   │   │   ├── layout.tsx              # Layout admin
│   │   │   ├── admin/page.tsx          # Dashboard admin
│   │   │   ├── admin/pagamentos/page.tsx
│   │   │   ├── admin/jogos/page.tsx
│   │   │   ├── admin/probabilidades/page.tsx  # Odds automaticas + override
│   │   │   ├── admin/perguntas/page.tsx
│   │   │   └── admin/configuracoes/page.tsx
│   │   │
│   │   ├── api/                # API Routes
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── jogos/
│   │   │   │   ├── route.ts           # GET jogos, POST sincronizar
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts       # GET/PUT jogo especifico
│   │   │   │       └── resultado/route.ts  # POST resultado
│   │   │   ├── palpites/
│   │   │   │   ├── route.ts           # GET/POST palpites
│   │   │   │   └── publicos/route.ts  # GET palpites publicos (pos-bloqueio)
│   │   │   ├── ranking/
│   │   │   │   └── route.ts           # GET ranking
│   │   │   ├── pagamentos/
│   │   │   │   ├── route.ts           # GET pendentes
│   │   │   │   └── [id]/aprovar/route.ts  # POST aprovar
│   │   │   ├── perguntas/
│   │   │   │   └── route.ts           # CRUD perguntas
│   │   │   ├── simulador/
│   │   │   │   └── route.ts           # POST calcular simulacao
│   │   │   ├── admin/
│   │   │   │   ├── configuracoes/route.ts
│   │   │   │   └── probabilidades/route.ts
│   │   │   └── cron/
│   │   │       ├── sync-jogos/route.ts     # Endpoint para CRON
│   │   │       └── calcular-pontos/route.ts
│   │   │
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Estilos globais + tema
│   │
│   ├── components/
│   │   ├── ui/                 # Componentes base reutilizaveis
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── ScoreInput.tsx      # Componente +/- para placar
│   │   │
│   │   ├── jogos/
│   │   │   ├── JogoCard.tsx        # Card de um jogo
│   │   │   ├── JogosList.tsx       # Lista de jogos
│   │   │   ├── JogoAoVivo.tsx      # Badge ao vivo
│   │   │   └── Bandeira.tsx        # Componente de bandeira do pais
│   │   │
│   │   ├── palpites/
│   │   │   ├── PalpiteForm.tsx     # Formulario de palpite
│   │   │   ├── PalpiteCard.tsx     # Card de palpite
│   │   │   ├── PalpitesPublicos.tsx # Lista de palpites publicos
│   │   │   └── CountdownTimer.tsx  # Timer regressivo
│   │   │
│   │   ├── ranking/
│   │   │   ├── RankingTable.tsx    # Tabela de ranking
│   │   │   ├── DivisaoSelector.tsx # Seletor de divisao
│   │   │   ├── PosicaoIndicator.tsx # Subida/descida
│   │   │   └── TopTres.tsx         # Destaque top 3
│   │   │
│   │   ├── simulador/
│   │   │   ├── SimuladorForm.tsx   # Formulario do simulador
│   │   │   └── ResultadoSimulacao.tsx # Resultado detalhado
│   │   │
│   │   ├── admin/
│   │   │   ├── PagamentoPendente.tsx
│   │   │   ├── ProbabilidadeEditor.tsx
│   │   │   └── PerguntaEditor.tsx
│   │   │
│   │   └── layout/
│   │       ├── Navbar.tsx
│   │       ├── BottomNav.tsx       # Navegacao mobile
│   │       ├── Sidebar.tsx         # Navegacao desktop (opcional)
│   │       └── Footer.tsx
│   │
│   ├── lib/
│   │   ├── db.ts               # Prisma client instance
│   │   ├── auth.ts             # NextAuth config (credentials + Google)
│   │   ├── utils.ts            # Utility functions
│   │   ├── scoring.ts          # Points calculation logic
│   │   ├── divisions.ts        # Division calculation logic
│   │   ├── pix.ts              # PIX payload generation
│   │   ├── teams.ts            # Team mapping (PT-BR names, flags)
│   │   ├── validations.ts      # Zod schemas
│   │   └── constants.ts        # System constants
│   │
│   ├── hooks/
│   │   ├── useAuth.ts          # Auth hook
│   │   ├── useMatches.ts       # SWR hook for matches
│   │   ├── usePredictions.ts   # Hook for predictions
│   │   ├── useRanking.ts       # Hook for ranking
│   │   ├── useCountdown.ts     # Countdown timer hook
│   │   ├── useNotifications.ts # In-app notifications hook
│   │   └── useAdmin.ts         # Admin check hook
│   │
│   ├── stores/
│   │   ├── useAppStore.ts      # Global store (Zustand)
│   │   └── usePredictionStore.ts # Prediction editing store
│   │
│   ├── services/
│   │   ├── footballApi.ts      # Football data API client
│   │   ├── oddsApi.ts          # Odds/probabilities API client
│   │   ├── syncService.ts      # Sync orchestration logic
│   │   └── scoringService.ts   # Server-side points calculation
│   │
│   └── types/
│       ├── index.ts            # Global types
│       ├── match.ts            # Match types
│       ├── prediction.ts       # Prediction types
│       └── ranking.ts          # Ranking types
│
├── public/
│   ├── bandeiras/              # Bandeiras em SVG (fallback local)
│   ├── icons/                  # Icones PWA
│   └── images/                 # Imagens estaticas
│
├── scripts/
│   ├── seed-jogos.ts           # Script para popular jogos da Copa 2026
│   ├── sync-resultados.ts      # Script CRON de sincronizacao
│   └── calcular-pontos.ts      # Script CRON de calculo
│
├── .env.example
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── CLAUDE.md                   # Instrucoes para Claude Code
```

---

## 3. Schema do Banco de Dados (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== ENUMS ====================

enum PaymentStatus {
  PENDING
  APPROVED
  REJECTED
}

enum MatchStatus {
  SCHEDULED
  LIVE
  FINISHED
  POSTPONED
  CANCELLED
}

enum MatchPhase {
  GROUPS
  ROUND_OF_32
  ROUND_OF_16
  QUARTER_FINALS
  SEMI_FINALS
  THIRD_PLACE
  FINAL
}

enum ScoringSystem {
  BALANCED       // Based on odds/probabilities
  SIMPLE         // Fixed points (10/5/0)
  SUPER_SIMPLE   // Win/loss only (1/0)
  CUSTOM
}

enum UserRole {
  PARTICIPANT
  ADMIN
}

enum QuestionType {
  FREE_TEXT
  MULTIPLE_CHOICE
  NUMBER
}

// ==================== MODELS ====================

model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  password      String?  // null when using Google OAuth
  phone         String?
  avatarUrl     String?  @map("avatar_url")
  role          UserRole @default(PARTICIPANT)
  googleId      String?  @unique @map("google_id")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  payment       Payment?
  predictions   Prediction[]
  answers       Answer[]
  score         UserScore?

  @@map("users")
}

model PoolConfig {
  id                  String   @id @default(cuid())
  name                String   @default("Bolao Copa 2026")
  description         String?
  entryFee            Decimal  @map("entry_fee") @db.Decimal(10, 2)
  pixKey              String   @map("pix_key")
  pixKeyType          String   @map("pix_key_type") // cpf, email, phone, random
  beneficiaryName     String   @map("beneficiary_name")
  scoringSystem       ScoringSystem @default(BALANCED) @map("scoring_system")
  lockMinutesBefore   Int      @default(10) @map("lock_minutes_before")
  enableQuestions     Boolean  @default(true) @map("enable_questions")
  enableDivisions     Boolean  @default(true) @map("enable_divisions")
  enableAutoOdds      Boolean  @default(true) @map("enable_auto_odds")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  @@map("pool_config")
}

model Payment {
  id            String   @id @default(cuid())
  userId        String   @unique @map("user_id")
  status        PaymentStatus @default(PENDING)
  amount        Decimal? @db.Decimal(10, 2)
  pixTxId       String?  @map("pix_tx_id") // Transaction ID for auto-verification
  rejectionReason String? @map("rejection_reason")
  approvedBy    String?  @map("approved_by")
  approvedAt    DateTime? @map("approved_at")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("payments")
}

model Match {
  id              String   @id @default(cuid())
  externalId      String?  @unique @map("external_id") // ID from football API
  phase           MatchPhase
  group           String?  // A, B, C... (null for knockout)
  matchday        Int?     // 1, 2, 3 for group stage
  kickoff         DateTime // Match start time (UTC)
  venue           String?
  city            String?

  // Home team
  homeTeamCode    String   @map("home_team_code")  // ISO code
  homeTeamName    String   @map("home_team_name")  // PT-BR name
  homeTeamFlag    String   @map("home_team_flag")  // Flag URL

  // Away team
  awayTeamCode    String   @map("away_team_code")
  awayTeamName    String   @map("away_team_name")
  awayTeamFlag    String   @map("away_team_flag")

  // Result
  homeGoals       Int?     @map("home_goals")
  awayGoals       Int?     @map("away_goals")
  status          MatchStatus @default(SCHEDULED)
  minute          String?  // "45+2", "HT", etc.

  // Odds/Probabilities (for balanced scoring)
  homeWinProb     Decimal? @map("home_win_prob") @db.Decimal(5, 2)
  drawProb        Decimal? @map("draw_prob") @db.Decimal(5, 2)
  awayWinProb     Decimal? @map("away_win_prob") @db.Decimal(5, 2)
  oddsSource      String?  @map("odds_source") // "api", "manual"
  oddsUpdatedAt   DateTime? @map("odds_updated_at")

  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  // Relations
  predictions     Prediction[]
  questions       Question[]

  @@index([kickoff])
  @@index([status])
  @@index([phase])
  @@map("matches")
}

model Prediction {
  id            String   @id @default(cuid())
  userId        String   @map("user_id")
  matchId       String   @map("match_id")
  homeGoals     Int      @map("home_goals")
  awayGoals     Int      @map("away_goals")
  basePoints    Int?     @map("base_points")
  bonusPoints   Int?     @map("bonus_points")
  totalPoints   Int?     @map("total_points")
  breakdown     Json?    // { exactScore: true, winnerScore: false, ... }
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  match         Match    @relation(fields: [matchId], references: [id], onDelete: Cascade)

  @@unique([userId, matchId])
  @@index([matchId])
  @@map("predictions")
}

model UserScore {
  id              String   @id @default(cuid())
  userId          String   @unique @map("user_id")
  totalPoints     Int      @default(0) @map("total_points")
  overallRank     Int?     @map("overall_rank")
  division        String?  // "Serie A", "Serie B", etc.
  divisionRank    Int?     @map("division_rank")
  matchesBet      Int      @default(0) @map("matches_bet")
  exactScores     Int      @default(0) @map("exact_scores")
  correctWinners  Int      @default(0) @map("correct_winners")
  updatedAt       DateTime @updatedAt @map("updated_at")

  // Relations
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([totalPoints(sort: Desc)])
  @@map("user_scores")
}

model Question {
  id              String   @id @default(cuid())
  matchId         String?  @map("match_id") // null = general question
  text            String
  type            QuestionType
  options         Json?    // ["Option A", "Option B"] for multiple choice
  correctAnswer   String?  @map("correct_answer")
  pointsValue     Int      @default(3) @map("points_value")
  deadline        DateTime? // Custom deadline for general questions
  active          Boolean  @default(true)
  createdAt       DateTime @default(now()) @map("created_at")

  // Relations
  match           Match?   @relation(fields: [matchId], references: [id], onDelete: SetNull)
  answers         Answer[]

  @@map("questions")
}

model Answer {
  id            String   @id @default(cuid())
  userId        String   @map("user_id")
  questionId    String   @map("question_id")
  answer        String
  correct       Boolean?
  points        Int?     @default(0)
  createdAt     DateTime @default(now()) @map("created_at")

  // Relations
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  question      Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([userId, questionId])
  @@map("answers")
}

model SyncLog {
  id              String   @id @default(cuid())
  type            String   // "matches", "results", "odds"
  status          String   // "success", "error"
  source          String   // "football-data.org", "api-football", "odds-api"
  details         Json?
  matchesAffected Int      @default(0) @map("matches_affected")
  createdAt       DateTime @default(now()) @map("created_at")

  @@map("sync_logs")
}

model Notification {
  id            String   @id @default(cuid())
  userId        String   @map("user_id")
  title         String
  message       String
  type          String   // "payment_approved", "payment_rejected", "points_calculated"
  read          Boolean  @default(false)
  createdAt     DateTime @default(now()) @map("created_at")

  @@index([userId, read])
  @@map("notifications")
}
```

---

## 4. API Routes

### 4.1 Autenticacao

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| POST | /api/auth/register | Cadastrar usuario | Nao |
| POST | /api/auth/[...nextauth] | Login/Logout (NextAuth) | Nao |
| GET | /api/auth/session | Sessao atual | Sim |

### 4.2 Jogos

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| GET | /api/jogos | Listar jogos (com filtros) | Sim |
| GET | /api/jogos/[id] | Detalhes de um jogo | Sim |
| PUT | /api/jogos/[id] | Editar jogo (admin) | Admin |
| POST | /api/jogos/[id]/resultado | Registrar resultado (admin) | Admin |

### 4.3 Palpites

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| GET | /api/palpites | Meus palpites | Sim |
| POST | /api/palpites | Criar/atualizar palpite (upsert) | Sim |
| GET | /api/palpites/publicos?jogoId=X | Palpites de todos (pos-bloqueio) | Sim |

### 4.4 Ranking

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| GET | /api/ranking | Ranking geral | Sim |
| GET | /api/ranking?divisao=X | Ranking por divisao | Sim |
| GET | /api/ranking?busca=nome | Buscar no ranking | Sim |

### 4.5 Pagamentos

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| GET | /api/pagamentos/meu | Status do meu pagamento | Sim |
| GET | /api/pagamentos/pendentes | Listar pendentes (admin) | Admin |
| POST | /api/pagamentos/[id]/aprovar | Aprovar pagamento | Admin |
| POST | /api/pagamentos/[id]/rejeitar | Rejeitar pagamento | Admin |

### 4.6 Admin

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| GET | /api/admin/configuracoes | Configuracoes atuais | Admin |
| PUT | /api/admin/configuracoes | Atualizar configuracoes | Admin |
| PUT | /api/admin/probabilidades/[jogoId] | Definir probabilidades | Admin |
| POST | /api/admin/perguntas | Criar pergunta | Admin |
| PUT | /api/admin/perguntas/[id] | Editar pergunta | Admin |
| DELETE | /api/admin/perguntas/[id] | Remover pergunta | Admin |

### 4.7 CRON (Internal)

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| POST | /api/cron/sync-matches | Sync matches from external API | CRON_SECRET |
| POST | /api/cron/sync-odds | Sync odds from betting APIs | CRON_SECRET |
| POST | /api/cron/calculate-points | Calculate points after match | CRON_SECRET |

### 4.8 Simulator

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| POST | /api/simulator | Simulate scoring | Sim |

### 4.9 Notifications

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| GET | /api/notifications | Get user notifications | Sim |
| PATCH | /api/notifications/[id]/read | Mark as read | Sim |
| PATCH | /api/notifications/read-all | Mark all as read | Sim |

### 4.10 Questions (Bonus)

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| GET | /api/questions | List active questions | Sim |
| POST | /api/questions/[id]/answer | Submit answer | Sim |
| POST | /api/admin/questions | Create question | Admin |
| PUT | /api/admin/questions/[id] | Edit question | Admin |
| DELETE | /api/admin/questions/[id] | Delete question | Admin |
| POST | /api/admin/questions/[id]/resolve | Set correct answer + award points | Admin |

---

## 5. Logica de Pontuacao

### 5.1 Sistema Equilibrado (Padrao)

```typescript
// src/lib/scoring.ts

interface ScoringResult {
  basePoints: number;
  bonus: {
    exactScore: boolean;      // +5
    winnerScore: boolean;     // +3
    goalDifference: boolean;  // +2
    loserScore: boolean;      // +1
    blowout: boolean;         // +1
  };
  bonusPoints: number;
  totalPoints: number;
}

/**
 * Calculates base points inversely proportional to probability.
 * Odds are fetched automatically from betting APIs.
 * 
 * Formula:
 * - The outcome that occurred has probability P%
 * - Base points = round(100 / P)
 * - Clamped: min 3, max 25
 * 
 * Example (from reference app):
 * - Brazil 80%, Draw 15%, Haiti 5%
 * - If Brazil wins: 6 base pts
 * - If draw: 13 base pts
 * - If Haiti wins: 17 base pts
 */
function calculateBasePoints(probability: number): number {
  const points = Math.round(100 / probability);
  return Math.max(3, Math.min(25, points));
}

/**
 * Calculates bonus based on prediction vs actual result comparison.
 * Bonus only applies when the correct outcome (winner/draw) is predicted.
 */
function calculateBonus(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): BonusResult {
  const bonus = {
    exactScore: false,    // +5
    winnerScore: false,   // +3
    goalDifference: false, // +2
    loserScore: false,    // +1
    blowout: false,       // +1
  };

  // Exact score: got both scores right
  if (predHome === actualHome && predAway === actualAway) {
    bonus.exactScore = true;
  }

  // Determine winner
  const actualWinner = actualHome > actualAway ? 'home'
    : actualHome < actualAway ? 'away' : 'draw';
  const predWinner = predHome > predAway ? 'home'
    : predHome < predAway ? 'away' : 'draw';

  // Only calculate other bonuses if correct outcome predicted
  if (actualWinner === predWinner) {
    // Winner score: got the winning team's goals right
    if (actualWinner === 'home' && predHome === actualHome) {
      bonus.winnerScore = true;
    } else if (actualWinner === 'away' && predAway === actualAway) {
      bonus.winnerScore = true;
    } else if (actualWinner === 'draw' && predHome === actualHome) {
      bonus.winnerScore = true;
    }

    // Goal difference
    const actualDiff = actualHome - actualAway;
    const predDiff = predHome - predAway;
    if (actualDiff === predDiff) {
      bonus.goalDifference = true;
    }

    // Loser score: got the losing team's goals right
    if (actualWinner === 'home' && predAway === actualAway) {
      bonus.loserScore = true;
    } else if (actualWinner === 'away' && predHome === actualHome) {
      bonus.loserScore = true;
    }

    // Blowout: 3+ goal difference
    const isActualBlowout = Math.abs(actualHome - actualAway) >= 3;
    const isPredBlowout = Math.abs(predHome - predAway) >= 3;
    if (isActualBlowout && isPredBlowout) {
      bonus.blowout = true;
    }
  }

  return bonus;
}
```

### 5.2 Sistema Simples

```
- Placar exato: 10 pontos
- Acertou vencedor: 5 pontos
- Errou tudo: 0 pontos
```

### 5.3 Sistema Super Simples

```
- Acertou vencedor (ou empate): 1 ponto
- Errou: 0 pontos
```

---

## 6. Logica de Divisoes

```typescript
// src/lib/divisions.ts

interface Division {
  name: string;       // Internal name
  displayName: string; // PT-BR display name
  size: number;
}

function calculateDivisions(totalParticipants: number): Division[] {
  if (totalParticipants <= 7) {
    return [{ name: 'single', displayName: 'Serie Unica', size: totalParticipants }];
  }
  
  let numDivisions: number;
  if (totalParticipants <= 14) numDivisions = 2;
  else if (totalParticipants <= 23) numDivisions = 3;
  else if (totalParticipants <= 49) numDivisions = 4;
  else numDivisions = 5;

  const perDivision = Math.floor(totalParticipants / numDivisions);
  const remainder = totalParticipants % numDivisions;

  const divisions = [
    { name: 'serie_a', displayName: 'Serie A - Profissionais' },
    { name: 'serie_b', displayName: 'Serie B - Semiprofissionais' },
    { name: 'serie_c', displayName: 'Serie C - Amadores' },
    { name: 'serie_d', displayName: 'Serie D - Juvenis' },
    { name: 'serie_e', displayName: 'Serie E - Lanternas' },
  ];

  return Array.from({ length: numDivisions }, (_, i) => ({
    ...divisions[i],
    size: perDivision + (i < remainder ? 1 : 0),
  }));
}
```

---

## 7. Sincronizacao de Dados (CRON)

### 7.1 Jobs Agendados

| Job | Frequencia | Horario | Descricao |
|-----|-----------|---------|-----------|
| sync-schedule | 1x/dia | 04:00 | Updates match schedule (new matches, postponements) |
| sync-results | Every 3 min | During matches | Updates live scores |
| sync-odds | 2x/dia | 08:00, 20:00 | Fetches odds from betting APIs for upcoming matches |
| calculate-points | After match ends | Automatic | Calculates points for all predictions |
| update-ranking | After calculate-points | Automatic | Recalculates ranking and divisions |

### 7.2 Fluxo de Sincronizacao

```
CRON dispara → API Route /api/cron/sync-jogos
  → Verifica se ha jogos acontecendo agora
  → Se sim: busca resultados na API externa (football-data.org)
  → Atualiza placar no banco
  → Se jogo encerrou: dispara calculo de pontos
    → Calcula pontos de cada palpite
    → Atualiza pontuacao total de cada usuario
    → Recalcula ranking e divisoes
```

### 7.3 Estrategia Multi-Fonte

```typescript
// Match data - provider chain:
// 1. football-data.org (free, 10 req/min)
// 2. API-Football free tier (100 req/day, backup)
// 3. openfootball JSON (static data, fallback)
// 4. Admin manual input (last resort)

// Odds data - provider chain:
// 1. The Odds API (free tier: 500 req/month) — real betting odds
// 2. API-Football odds endpoint (included in free tier)
// 3. Admin manual override
```

---

## 8. Mapeamento de Times (PT-BR)

```typescript
// src/lib/teams.ts

interface TeamInfo {
  name: string;         // PT-BR display name
  flagCode: string;     // ISO code for flagcdn.com
  group?: string;       // Group letter (populated after draw)
}

export const WORLD_CUP_2026_TEAMS: Record<string, TeamInfo> = {
  'BRA': { name: 'Brasil', flagCode: 'br' },
  'MEX': { name: 'Mexico', flagCode: 'mx' },
  'USA': { name: 'Estados Unidos', flagCode: 'us' },
  'CAN': { name: 'Canada', flagCode: 'ca' },
  'ARG': { name: 'Argentina', flagCode: 'ar' },
  'FRA': { name: 'Franca', flagCode: 'fr' },
  'GER': { name: 'Alemanha', flagCode: 'de' },
  'ENG': { name: 'Inglaterra', flagCode: 'gb-eng' },
  'ESP': { name: 'Espanha', flagCode: 'es' },
  'POR': { name: 'Portugal', flagCode: 'pt' },
  'ITA': { name: 'Italia', flagCode: 'it' },
  'NED': { name: 'Holanda', flagCode: 'nl' },
  'BEL': { name: 'Belgica', flagCode: 'be' },
  'CRO': { name: 'Croacia', flagCode: 'hr' },
  'JPN': { name: 'Japao', flagCode: 'jp' },
  'KOR': { name: 'Coreia do Sul', flagCode: 'kr' },
  'AUS': { name: 'Australia', flagCode: 'au' },
  'MAR': { name: 'Marrocos', flagCode: 'ma' },
  'SEN': { name: 'Senegal', flagCode: 'sn' },
  'GHA': { name: 'Gana', flagCode: 'gh' },
  'CMR': { name: 'Camaroes', flagCode: 'cm' },
  'NGR': { name: 'Nigeria', flagCode: 'ng' },
  'URU': { name: 'Uruguai', flagCode: 'uy' },
  'COL': { name: 'Colombia', flagCode: 'co' },
  'ECU': { name: 'Equador', flagCode: 'ec' },
  'PAR': { name: 'Paraguai', flagCode: 'py' },
  'CHI': { name: 'Chile', flagCode: 'cl' },
  'PER': { name: 'Peru', flagCode: 'pe' },
  'SUI': { name: 'Suica', flagCode: 'ch' },
  'DEN': { name: 'Dinamarca', flagCode: 'dk' },
  'SWE': { name: 'Suecia', flagCode: 'se' },
  'POL': { name: 'Polonia', flagCode: 'pl' },
  'SRB': { name: 'Servia', flagCode: 'rs' },
  'WAL': { name: 'Pais de Gales', flagCode: 'gb-wls' },
  'SCO': { name: 'Escocia', flagCode: 'gb-sct' },
  'TUN': { name: 'Tunisia', flagCode: 'tn' },
  'EGY': { name: 'Egito', flagCode: 'eg' },
  'IRN': { name: 'Ira', flagCode: 'ir' },
  'KSA': { name: 'Arabia Saudita', flagCode: 'sa' },
  'QAT': { name: 'Catar', flagCode: 'qa' },
  'CRC': { name: 'Costa Rica', flagCode: 'cr' },
  'HON': { name: 'Honduras', flagCode: 'hn' },
  'JAM': { name: 'Jamaica', flagCode: 'jm' },
  'PAN': { name: 'Panama', flagCode: 'pa' },
  'NZL': { name: 'Nova Zelandia', flagCode: 'nz' },
  'BOL': { name: 'Bolivia', flagCode: 'bo' },
  'VEN': { name: 'Venezuela', flagCode: 've' },
  'TRI': { name: 'Trinidad e Tobago', flagCode: 'tt' },
  // ... all 48 teams (to be confirmed after final qualifiers)
  // Flag URL pattern: https://flagcdn.com/w80/{flagCode}.png
};

export function getFlagUrl(flagCode: string, width = 80): string {
  return `https://flagcdn.com/w${width}/${flagCode}.png`;
}
```

---

## 9. Docker & Deploy

### 9.1 Dockerfile (Next.js)

```dockerfile
# Multi-stage build
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["node", "server.js"]
```

### 9.2 docker-compose.prod.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    restart: always
    environment:
      - DATABASE_URL=postgresql://bolao:${DB_PASSWORD}@db:5432/bolao_copa2026
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - CRON_SECRET=${CRON_SECRET}
      - FOOTBALL_API_KEY=${FOOTBALL_API_KEY}
    depends_on:
      db:
        condition: service_healthy
    networks:
      - bolao-net

  db:
    image: postgres:16-alpine
    restart: always
    environment:
      - POSTGRES_DB=bolao_copa2026
      - POSTGRES_USER=bolao
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bolao -d bolao_copa2026"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - bolao-net

  caddy:
    image: caddy:2-alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - app
    networks:
      - bolao-net

  cron:
    build:
      context: .
      dockerfile: docker/Dockerfile.cron
    restart: always
    environment:
      - APP_URL=http://app:3000
      - CRON_SECRET=${CRON_SECRET}
    depends_on:
      - app
    networks:
      - bolao-net

volumes:
  postgres_data:
  caddy_data:
  caddy_config:

networks:
  bolao-net:
    driver: bridge
```

### 9.3 Caddyfile

```
bolao.bubhug.com {
    reverse_proxy app:3000
    encode gzip
    
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
    }
}
```

---

## 10. Variaveis de Ambiente

```env
# .env.example

# Database
DATABASE_URL="postgresql://bolao:secure_password@db:5432/bolao_copa2026"
DB_PASSWORD="secure_password"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://bolao.bubhug.com"

# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# CRON
CRON_SECRET="secret-key-for-cron-jobs"

# Football Data APIs
FOOTBALL_DATA_API_KEY=""  # football-data.org (free)
API_FOOTBALL_KEY=""       # api-football.com (backup)

# Odds API
ODDS_API_KEY=""           # the-odds-api.com (free tier: 500 req/month)

# PIX Auto-verification (optional — investigate feasibility)
# PIX_PSP_CLIENT_ID=""
# PIX_PSP_CLIENT_SECRET=""
# PIX_PSP_WEBHOOK_SECRET=""

# Domain
DOMAIN="bolao.bubhug.com"
```

---

## 11. Seguranca

### 11.1 Autenticacao
- Senhas hasheadas com bcrypt (salt rounds: 12)
- JWT com expiracao de 7 dias
- Refresh token com rotacao
- Middleware de autenticacao em todas as rotas protegidas

### 11.2 Autorizacao
- Middleware de admin para rotas /api/admin/*
- Verificacao de pagamento aprovado antes de permitir acoes no bolao
- CRON_SECRET para proteger endpoints de sincronizacao

### 11.3 Validacao
- Zod schemas em todos os inputs de API
- Sanitizacao de strings (XSS prevention)
- Rate limiting: 100 req/min por IP

### 11.4 Banco de Dados
- Prepared statements via Prisma (SQL injection prevention)
- Conexoes via pool (max 20)
- Backups automaticos diarios

---

## 12. Middleware e Guards

```typescript
// Middleware Next.js (middleware.ts)
// - Redireciona usuarios nao autenticados para /login
// - Redireciona usuarios sem pagamento aprovado para /pagamento
// - Verifica role admin para rotas /admin/*
// - Permite rotas publicas: /, /login, /cadastro, /recuperar-senha, /api/auth/*
```

### Fluxo de acesso:
```
Usuario nao logado → /login
Usuario logado, pagamento pendente → /pagamento
Usuario logado, pagamento aprovado → /dashboard (acesso total)
Admin → /admin/* (acesso a tudo)
```

---

## 13. Performance e Cache

### 13.1 Server Components
- Paginas que nao precisam de interatividade sao Server Components
- Dados buscados no servidor, sem waterfall de requisicoes

### 13.2 SWR (Stale-While-Revalidate)
- Jogos: revalidate a cada 60s (fora de jogos) / 10s (durante jogos)
- Ranking: revalidate a cada 30s
- Palpites proprios: revalidate on focus

### 13.3 Cache de API Externa
- Resultados em cache no banco (evita requisicoes repetidas)
- TTL de 2 min para dados ao vivo
- TTL de 1h para dados estaticos (tabela, times)

---

## 14. Testes

### 14.1 Testes Unitarios (Vitest)
- Logica de pontuacao (todos os cenarios)
- Logica de divisoes
- Validacoes Zod
- Utilitarios

### 14.2 Testes de Integracao
- API Routes (com banco de teste)
- Fluxo de autenticacao
- Fluxo de palpite (criar, bloquear, calcular)

### 14.3 Testes E2E (Opcional)
- Playwright para fluxos criticos
- Cadastro → Pagamento → Palpite → Ver ranking

---

## 15. CLAUDE.md (Instrucoes para Claude Code)

```markdown
# Bolao Copa do Mundo FIFA 2026

## Stack
- Next.js 15+ (App Router), TypeScript, Tailwind CSS 4
- PostgreSQL 16 + Prisma ORM
- NextAuth.js 5 (credentials + Google OAuth)
- Docker + Docker Compose on Hostinger VPS KVM 2 (2 vCPU, 8GB RAM)
- Domain: bolao.bubhug.com

## Commands
- `npm run dev` — development server
- `npm run build` — production build
- `npx prisma migrate dev` — run migrations
- `npx prisma studio` — database UI
- `docker compose up -d` — start containers

## Conventions
- Code in English (variables, functions, types, database columns)
- UI text in Brazilian Portuguese (PT-BR) only
- Mobile-first (test at 375px)
- Server Components by default, "use client" only when needed
- API Routes in /api with Zod validation
- File names in kebab-case
- Components in PascalCase
- Dark theme mandatory (FIFA 2026 official colors)
- Single pool model (one pool, one admin, all users participate)

## Important Rules
- Predictions lock 10min before match kickoff
- Payment via static PIX QR code (no payment gateway)
- Admin approves payments manually (auto-verification via webhook as stretch goal)
- Balanced scoring system is the default (odds-based)
- Odds fetched automatically from betting APIs
- Never expose CRON_SECRET or credentials
- No mata-mata / knockout between participants (out of scope)
```

---
