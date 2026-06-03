# 🥋 BlackBelt IT — Backend

> Plataforma gamificada de quizzes técnicos para eventos e treinamentos corporativos.
> Projeto desenvolvido durante a **Residência em Software & IA — GrowUp | Squad 22**.

---

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

- Node.js **v20+**
- npm ou yarn
- Conta no [Supabase](https://supabase.com) (tier gratuito)
- Conta no [Clerk](https://clerk.com) (plano gratuito)

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

Copie o arquivo de exemplo e preencha com suas credenciais:
```bash
cp .env.example .env
```

```env
# Supabase — connection pooling (para a aplicação)
DATABASE_URL="postgresql://usuario:senha@host:6543/postgres?pgbouncer=true"

# Supabase — conexão direta (para migrations)
DIRECT_URL="postgresql://usuario:senha@host:5432/postgres"

# Clerk — Autenticação
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk — Webhook
CLERK_WEBHOOK_SECRET=whsec_...

# JWT
JWT_SECRET=seu_secret_super_seguro

# Servidor
PORT=3000
NODE_ENV=development
```

**4. Execute as migrations do banco de dados**
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

## 📡 Endpoints da API

### Usuários
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `POST` | `/users/sync` | Sincroniza usuário autenticado via Clerk | JWT |

### Quiz
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `GET` | `/questions` | Retorna perguntas embaralhadas | JWT |
| `POST` | `/answers` | Submete uma resposta e calcula pontuação | JWT |
| `GET` | `/ranking` | Retorna o Top 10 do ranking global | JWT |

### Admin
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `POST` | `/admin/questions` | Cria uma nova pergunta | JWT + Admin Role |
| `PUT` | `/admin/questions/:id` | Edita uma pergunta | JWT + Admin Role |
| `DELETE` | `/admin/questions/:id` | Remove uma pergunta | JWT + Admin Role |

### Webhooks
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/webhooks/clerk` | Recebe eventos do Clerk (criação de usuário) |

---

## 🧮 Lógica de Pontuação

A pontuação é calculada com base no **peso da questão** e no **tempo de resposta**:

```
Pontos = Peso da Questão × Multiplicador de Tempo
```

- Respostas mais rápidas geram um multiplicador maior.
- Respostas enviadas após o tempo limite são invalidadas.
- Em caso de empate no ranking, o critério de desempate é o **menor tempo total**.

---

## 🔐 Segurança

- Autenticação via **JWT do Clerk** em todas as rotas de jogador.
- Rotas `/admin/*` exigem `Role: Admin` no metadata do usuário no Clerk.
- **Rate limiting:** 40 requisições por minuto por usuário (`429 Too Many Requests`).
- E-mails duplicados são rejeitados com `409 Conflict`.
- Tentativas de acesso não autorizado a rotas admin retornam `403 Forbidden`.

---

## 🔄 Fluxo de uma Requisição

```
1. Usuário clica em uma alternativa → Frontend envia POST /answers
2. Middleware valida o Bearer Token do Clerk
3. Controller extrai option_id e response_time_ms do body
4. Use Case verifica se a alternativa está correta no banco
5. Calcula: Pontos = PesoQuestão × MultiplicadorTempo
6. Repositório faz INSERT na tabela de respostas e UPDATE no score da sessão
7. API retorna 201 Created com JSON confirmando pontuação
```

---

## ⚠️ Tratamento de Erros

| Código | Situação |
|---|---|
| `401` | Token JWT inválido ou ausente |
| `403` | Usuário sem permissão de Admin |
| `409` | E-mail já cadastrado |
| `429` | Rate limit excedido |
| `503` | Banco de dados indisponível |

Todas as respostas de erro seguem o padrão:
```json
{
  "status": "error",
  "message": "Descrição do erro"
}
```

---

## 👥 Equipe — Squad 22

Projeto desenvolvido com 13 membros divididos em grupos temáticos durante a **Residência em Software & IA — GrowUp**.

---

## 📄 Licença

ISC — veja o arquivo [LICENSE](./LICENSE) para mais detalhes.
