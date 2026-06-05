## 📌 Sobre o Projeto

O **BlackBelt IT** é uma API backend para uma plataforma de quizzes gamificados voltada para eventos de tecnologia (como o RecnPlay) e treinamentos internos. O sistema permite que participantes respondam perguntas técnicas, recebam pontuações em tempo real e disputem um ranking global — sem necessidade de cadastro com senha.

**Problema resolvido:** Empresas enfrentam baixa adesão em treinamentos internos e dificuldade em medir o conhecimento real dos colaboradores. O BlackBelt IT engaja os participantes via gamificação (ranking, quizzes com tempo) e gera dados acionáveis para gestores.

---

## 🚀 Stack de Tecnologia

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js v20+ |
| Linguagem | TypeScript |
| Framework HTTP | Fastify |
| Banco de Dados | PostgreSQL via Supabase |
| ORM | Prisma |
| Autenticação | Clerk (Magic Link / OTP) |
| Rate Limiting | @fastify/rate-limit |

---

## 🏗️ Arquitetura

O projeto adota **Clean Architecture** com princípios **S.O.L.I.D.**, separando as regras de negócio da infraestrutura técnica:

```
src/
├── core/                        # Regras de negócio (independentes de framework)
│   ├── entities/                # Entidades do domínio (Question, QuizSession)
│   ├── repositories/            # Interfaces dos repositórios (contratos)
│   └── use-case/                # Casos de uso da aplicação
│       ├── GetQuestionsUseCase.ts
│       ├── SubmitAnswerUseCase.ts
│       ├── GetRankingUseCase.ts
│       ├── AdminQuestionUseCase.ts
│       └── sync-user.usecase.ts
│
├── infra/                       # Detalhes de implementação
│   ├── database/                # Implementações dos repositórios (Prisma/Supabase)
│   └── http/
│       ├── controllers/         # Controllers das rotas
│       ├── middlewares/         # Auth (Clerk JWT) e Admin guard
│       ├── routes/              # Definição das rotas
│       └── view-models/         # DTOs de resposta (Ranking, Question)
│
├── shared/
│   ├── errors/                  # AppError customizado
│   └── utils/                   # Utilitários (scoreCalculator)
│
├── app.ts                       # Configuração do Fastify e plugins
├── server.ts                    # Inicialização do servidor
└── main.ts                      # Entry point
```

**Por que essa estrutura funciona?**
- **Independência de framework:** trocar Fastify por Express exige alterações apenas em `infra/http`, sem tocar nas regras de negócio.
- **Testabilidade:** os Use Cases podem ser testados com repositórios em memória (mocks), sem banco real.
- **Segurança centralizada:** as verificações de permissão ficam nos middlewares e Use Cases, não espalhadas pelas rotas.

---

## ⚙️ Pré-requisitos

- **Node.js v20+** — [nodejs.org](https://nodejs.org)
- **npm** (vem junto com o Node)
- Conta no **[Supabase](https://supabase.com)** (banco de dados, gratuito)
- Conta no **[Clerk](https://clerk.com)** (autenticação, gratuito)
- Um cliente HTTP para testar a API:
  - **Thunder Client** (extensão do VS Code, mais simples)
  - **Insomnia** — [insomnia.rest](https://insomnia.rest)
  - **curl** (terminal, sem instalação extra)

---

## 🔧 Instalação e Configuração

**1. Clone o repositório**
```bash
git clone https://github.com/joseRafael6/growup-squad22-backend.git
cd growup-squad22-backend
```

**2. Instale as dependências**
```bash
npm install
```

**3. Configure as variáveis de ambiente**

Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

Abra o `.env` e preencha com suas credenciais:

```env
# Supabase — pegue em: Project Settings > Database > Connection string
DATABASE_URL="postgresql://postgres.SEU_ID:SUA_SENHA@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.SEU_ID:SUA_SENHA@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Clerk — pegue em: Dashboard do seu app > API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# JWT — pode colocar qualquer string longa e segura
JWT_SECRET=minha_chave_super_secreta_123456

# Servidor
PORT=3000
NODE_ENV=development
```

> 💡 **Supabase:** acesse seu projeto → Settings → Database → Connection string. Use "Connection pooling" para `DATABASE_URL` e "Direct connection" para `DIRECT_URL`.

> 💡 **Clerk:** acesse o dashboard → seu app → API Keys.

**4. Crie as tabelas no banco**
```bash
npm run db:migrate
```

**5. Gere o Prisma Client**
```bash
npm run db:generate
```

---

## ▶️ Executando o Projeto

**Modo desenvolvimento (hot reload):**
```bash
npm run dev
```

Se tudo estiver certo, você verá no terminal:

```
🚀 Servidor rodando em http://localhost:3000

📋 Rotas disponíveis:
   - POST /api/webhooks/clerk (webhook)
   - GET  /api/health
   - POST /api/users/sync
   - GET  /questions
   - POST /answers
   - GET  /ranking
```

**Build e produção:**
```bash
npm run build
npm start
```

**Visualizar o banco de dados (Prisma Studio):**
```bash
npm run db:studio
```

---

## 🧪 Tutorial de Uso da API

A ordem correta de uso é:

```
[Health check] → [Sync usuário] → [Buscar perguntas] → [Responder perguntas] → [Ver ranking]
```

---

### 7.1 Verificar se o servidor está no ar

**`GET /api/health`**

Nenhum parâmetro necessário.

```bash
curl http://localhost:3000/api/health
```

**Resposta esperada (`200 OK`):**
```json
{
  "status": "OK",
  "timestamp": "2025-06-03T12:00:00.000Z"
}
```

---

### 7.2 Sincronizar um usuário

**`POST /api/users/sync`**

Registra um novo participante no sistema. O `clerkId` é o identificador único gerado pelo Clerk após o login.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "participante@email.com",
  "name": "João Silva",
  "clerkId": "user_2abc123def456"
}
```

```bash
curl -X POST http://localhost:3000/api/users/sync \
  -H "Content-Type: application/json" \
  -d '{
    "email": "participante@email.com",
    "name": "João Silva",
    "clerkId": "user_2abc123def456"
  }'
```

**Resposta — usuário criado (`201 Created`):**
```json
{
  "user": {
    "id": "clp_xyz789",
    "email": "participante@email.com",
    "name": "João Silva"
  }
}
```

**Erros possíveis:**

| Código | Mensagem | Causa |
|---|---|---|
| `400` | `Email é obrigatório` | Campo `email` ausente ou vazio |
| `400` | `Formato de email inválido` | Email mal formatado (ex: `abc@x`) |
| `400` | `clerkId é obrigatório` | Campo `clerkId` ausente ou vazio |
| `409` | `Este e-mail já está cadastrado` | Email duplicado |

---

### 7.3 Buscar as perguntas do quiz

**`GET /questions?userId=...&quizId=...`**

Retorna as perguntas em **ordem embaralhada** e cria uma sessão para o participante.

> ⚠️ Requer `Authorization: Bearer SEU_TOKEN_JWT_DO_CLERK`

| Parâmetro | Obrigatório | Descrição |
|---|---|---|
| `userId` | ✅ | ID do usuário (Clerk ID) |
| `quizId` | ✅ | ID do quiz que será respondido |

```bash
curl "http://localhost:3000/questions?userId=user_2abc123&quizId=quiz_001" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

**Resposta esperada (`200 OK`):**
```json
{
  "sessionId": "sess_abc123xyz",
  "questions": [
    {
      "id": "q_001",
      "text": "O que é Clean Architecture?",
      "weight": 10,
      "timeLimitSeconds": 30,
      "options": [
        { "id": "opt_A", "text": "Um padrão de banco de dados" },
        { "id": "opt_B", "text": "Uma abordagem de organização de código por responsabilidades" },
        { "id": "opt_C", "text": "Um framework JavaScript" },
        { "id": "opt_D", "text": "Um tipo de teste automatizado" }
      ]
    }
  ]
}
```

> 📝 **Guarde o `sessionId`** — você vai precisar dele para responder as perguntas.

**Erros possíveis:**

| Código | Mensagem | Causa |
|---|---|---|
| `400` | `userId e quizId são obrigatórios` | Parâmetros ausentes na query |
| `401` | `Token ausente` | Header Authorization não enviado |
| `401` | `Token inválido` | Token expirado ou incorreto |

---

### 7.4 Responder uma pergunta

**`POST /answers`**

Envia a resposta de uma pergunta. A API calcula a pontuação com base na alternativa escolhida e no tempo de resposta.

> ⚠️ Requer Bearer Token.

**Body:**
```json
{
  "sessionId": "sess_abc123xyz",
  "questionId": "q_001",
  "optionId": "opt_B",
  "responseTimeMs": 8500
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `sessionId` | string | ID da sessão retornado em `/questions` |
| `questionId` | string | ID da pergunta respondida |
| `optionId` | string | ID da alternativa escolhida |
| `responseTimeMs` | number | Tempo de resposta em milissegundos |

```bash
curl -X POST http://localhost:3000/answers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "sessionId": "sess_abc123xyz",
    "questionId": "q_001",
    "optionId": "opt_B",
    "responseTimeMs": 8500
  }'
```

**Resposta — correta (`201 Created`):**
```json
{
  "correct": true,
  "pointsEarned": 12,
  "totalScore": 12
}
```

**Resposta — errada (`201 Created`):**
```json
{
  "correct": false,
  "pointsEarned": 0,
  "totalScore": 0
}
```

> 🔁 **Repita este passo para cada pergunta**, sempre usando o mesmo `sessionId`.

---

### 7.5 Ver o ranking

**`GET /ranking?quizId=...&userId=...`**

Retorna o Top 10 do ranking global e a posição do usuário atual.

> ⚠️ Requer Bearer Token.

```bash
curl "http://localhost:3000/ranking?quizId=quiz_001&userId=user_2abc123" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

**Resposta esperada (`200 OK`):**
```json
{
  "top10": [
    { "position": 1, "name": "Maria Oliveira", "score": 95, "totalTimeMs": 42000 },
    { "position": 2, "name": "João Silva",     "score": 87, "totalTimeMs": 38500 },
    { "position": 3, "name": "Ana Costa",      "score": 87, "totalTimeMs": 51200 }
  ],
  "myRank": {
    "position": 2,
    "name": "João Silva",
    "score": 87,
    "totalTimeMs": 38500
  }
}
```

> 📌 Em caso de **empate em pontuação**, quem respondeu mais rápido (menor `totalTimeMs`) fica em posição mais alta.

---

### 7.6 Rotas de Admin — Gerenciar perguntas

Estas rotas exigem `role: admin` no token do Clerk.

**Criar uma pergunta — `POST /admin/questions`**

```bash
curl -X POST http://localhost:3000/admin/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -d '{
    "text": "O que é SOLID?",
    "weight": 15,
    "timeLimitSeconds": 30,
    "options": [
      { "text": "Um banco de dados",                    "isCorrect": false },
      { "text": "Cinco princípios de design de código", "isCorrect": true  },
      { "text": "Um framework backend",                 "isCorrect": false },
      { "text": "Uma linguagem de programação",         "isCorrect": false }
    ]
  }'
```

**Editar uma pergunta — `PUT /admin/questions/:id`**

```bash
curl -X PUT http://localhost:3000/admin/questions/q_001 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -d '{ "text": "Texto atualizado", "weight": 20 }'
```

**Deletar uma pergunta — `DELETE /admin/questions/:id`**

```bash
curl -X DELETE http://localhost:3000/admin/questions/q_001 \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"
```

Resposta: `204 No Content` (sem body).

---

## 📡 Referência de Endpoints

### Usuários
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `GET` | `/api/health` | Health check | Não |
| `POST` | `/api/users/sync` | Sincroniza usuário via Clerk | Não |

### Quiz
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `GET` | `/questions` | Retorna perguntas embaralhadas | JWT |
| `POST` | `/answers` | Submete uma resposta | JWT |
| `GET` | `/ranking` | Retorna o Top 10 | JWT |

### Admin
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `POST` | `/admin/questions` | Cria uma pergunta | JWT + Admin |
| `PUT` | `/admin/questions/:id` | Edita uma pergunta | JWT + Admin |
| `DELETE` | `/admin/questions/:id` | Remove uma pergunta | JWT + Admin |

### Webhooks
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/webhooks/clerk` | Recebe eventos do Clerk |

---

## 🧮 Lógica de Pontuação

```
Pontos = Peso da Questão × Multiplicador de Tempo
```

O multiplicador varia de `0.2` (lento) a `1.5` (muito rápido):

```
multiplicador = max(0.2,  1.5 - (tempo_resposta / tempo_limite))
```

**Exemplos** — pergunta com peso `10` e tempo limite de `30s`:

| Tempo de resposta | Multiplicador | Pontos |
|---|---|---|
| 5s (muito rápido) | 1.33 | **13 pts** |
| 15s (médio) | 1.0 | **10 pts** |
| 25s (lento) | 0.67 | **7 pts** |
| 35s (fora do prazo) | ❌ | **0 pts** |

---

## 🔐 Segurança

- Autenticação via **JWT do Clerk** em todas as rotas de jogador.
- Rotas `/admin/*` exigem `Role: Admin` no metadata do Clerk.
- **Rate limiting:** 40 requisições por minuto por usuário.
- E-mails duplicados são rejeitados com `409 Conflict`.
- Acessos não autorizados a rotas admin retornam `403 Forbidden`.

---

## ⚠️ Tratamento de Erros

| Código | Significado | O que fazer |
|---|---|---|
| `400` | Dados inválidos ou faltando | Revise os campos obrigatórios |
| `401` | Token JWT ausente ou inválido | Adicione o header `Authorization: Bearer ...` |
| `403` | Sem permissão de admin | Use uma conta com role admin |
| `409` | E-mail já cadastrado | Use um e-mail diferente |
| `429` | Muitas requisições (40/min) | Aguarde e tente novamente |
| `500` | Erro interno | Verifique os logs com `npm run dev` |
| `503` | Banco indisponível | Verifique o Supabase |

Todas as respostas de erro seguem o padrão:
```json
{
  "status": "error",
  "message": "Descrição do erro"
}
```

---

## 👥 Equipe — Squad 22

Projeto desenvolvido com 13 membros durante a **Residência em Software & IA — GrowUp**.

---

## 📄 Licença

ISC — veja o arquivo [LICENSE](./LICENSE) para mais detalhes.
