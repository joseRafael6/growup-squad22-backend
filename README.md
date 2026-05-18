# growup-squad22-backend
Projeto BlackBelt IT - Plataforma gamificada
Node.js (v20+), TypeScript, Fastify, PostgreSQL (via Supabase), Prisma ORM e Clerk
Clean Architecture e S.O.L.I.D.

# 🧩 GrowUp Squad22 – Backend (BlackBelt IT)

Plataforma gamificada para captação de leads e engajamento em eventos.  
Backend desenvolvido em **Node.js + TypeScript + Fastify**, seguindo os princípios de **Clean Architecture** e **S.O.L.I.D.**

---

## 📦 Tecnologias

| Camada              | Tecnologia                                   |
| ------------------- | -------------------------------------------- |
| Runtime             | Node.js 20+                                  |
| Linguagem           | TypeScript 6                                 |
| Framework HTTP      | Fastify 5                                    |
| ORM (planejado)     | Prisma                                       |
| Banco de Dados      | PostgreSQL via Supabase (tier gratuito)      |
| Autenticação        | Clerk (Magic Link / OTP)                     |
| Testes              | Vitest (planejado)                           |

---

## 🧱 Arquitetura

O projeto segue a **Clean Architecture**, dividida em camadas independentes:
src/
├── core/ # Regras de negócio (domínio)
│ ├── entities/ # Entidades: Question, QuizSession
│ ├── repositories/ # Contratos (interfaces) dos repositórios
│ └── use-cases/ # Casos de uso (ações do sistema)
├── infra/ # Implementações concretas (detalhes técnicos)
│ ├── database/ # Repositórios em memória (mock)
│ │ └── repositories/
│ └── http/ # Camada de entrada (Fastify)
│ ├── controllers/ # Controladores das rotas
│ ├── routes/ # Definição das rotas
│ └── view-models/ # Formatação de respostas (DTOs)
├── shared/ # Código compartilhado
│ ├── errors/ # AppError customizado
│ └── utils/ # Funções utilitárias (ex: cálculo de score)
└── main.ts # Ponto de entrada da aplicação

## 🚀 Como rodar

### 1. Clonar e instalar dependências
```bash
git clone https://github.com/joseRafael6/growup-squad22-backend.git
cd growup-squad22-backend
npm install
2. Executar em modo desenvolvimento
bash
npm run dev
O servidor sobe em http://localhost:3333.

Scripts disponíveis:

npm run dev → executa com tsx e hot reload

npm run build → compila TypeScript para dist/

npm start → roda a versão compilada

📡 Endpoints da API
GET /questions
Inicia um novo quiz e retorna as perguntas embaralhadas.

Query parameters:

userId (obrigatório) – identificador do jogador

quizId (obrigatório) – identificador do quiz (padrão: "default-quiz")

Resposta (200):

json
{
  "sessionId": "uuid-da-sessao",
  "questions": [
    {
      "id": "q1",
      "text": "Qual é a principal causa de acidentes elétricos?",
      "weight": 10,
      "timeLimitSeconds": 30,
      "alternatives": [
        { "id": "a1", "text": "Falta de treinamento" },
        { "id": "a4", "text": "Contato com partes energizadas" }
      ]
    }
  ]
}
Nota: O campo isCorrect nunca é enviado para o front-end.

POST /answers
Envia uma resposta e retorna o resultado imediato.

Body (JSON):

json
{
  "sessionId": "uuid-da-sessao",
  "questionId": "q1",
  "optionId": "a4",
  "responseTimeMs": 8500
}
Resposta (201):

json
{
  "correct": true,
  "pointsEarned": 12,
  "totalScore": 12
}
Erros comuns:

400 – campos obrigatórios ausentes

404 – sessão ou questão inválida

409 – questão já respondida

400 – sessão finalizada

GET /ranking
Retorna o Top 10 global e a posição do jogador.

Query parameters:

quizId (obrigatório)

userId (obrigatório) – para identificar a posição do jogador

Resposta (200):

json
{
  "top10": [
    {
      "userId": "joao",
      "score": 48,
      "timeSeconds": "120.5",
      "position": 1
    }
  ],
  "myRank": {
    "userId": "fulano",
    "score": 32,
    "timeSeconds": "98.2",
    "position": 4
  }
}
Critério de ordenação:

Maior pontuação (decrescente)

Em caso de empate, menor tempo total (crescente)

🎮 Epic 02 – Engine do Quiz e Gamificação
Histórias de usuário:

US03: Como competidor, quero receber as perguntas embaralhadas.

US04: Como jogador, quero que minha pontuação seja calculada com base no tempo de resposta.

Casos de uso implementados:

GetQuestionsUseCase – cria sessão, embaralha e retorna perguntas

SubmitAnswerUseCase – valida resposta, calcula pontos e atualiza sessão

Fórmula de pontuação:

text
Pontos = peso da questão × multiplicador de tempo
multiplicador = max(0.2, 1.5 - (tempoResposta / tempoLimite))
Resposta instantânea → multiplicador ~1.5

Resposta no limite → multiplicador 0.5

Resposta muito lenta → multiplicador mínimo 0.2

🏆 Epic 03 – Resultados e Social
História de usuário:

US05: Como participante, quero ver minha pontuação e posição no ranking ao finalizar o quiz.

Caso de uso implementado:

GetRankingUseCase – filtra sessões concluídas, ordena por pontuação/tempo e retorna Top 10 + posição do usuário

📌 Status atual (MVP)
Endpoint GET /questions (quiz embaralhado)

Endpoint POST /answers (cálculo com peso e tempo)

Endpoint GET /ranking (top 10 + posição individual)

Autenticação real via Clerk (atualmente userId é enviado manualmente)

Persistência em PostgreSQL com Prisma

Painel administrativo (CRUD de perguntas)

Finalização automática da sessão ao responder última pergunta

🧪 Testes manuais
Fluxo completo
bash
# 1. Iniciar quiz
curl "http://localhost:3333/questions?userId=jogador1&quizId=default-quiz"

# 2. Responder primeira pergunta
curl -X POST http://localhost:3333/answers \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"SESS_ID","questionId":"q1","optionId":"a4","responseTimeMs":4500}'

# 3. (Repita para as demais perguntas...)

# 4. Consultar ranking
curl "http://localhost:3333/ranking?quizId=default-quiz&userId=jogador1"
⚠️ No MVP atual, as sessões não são marcadas automaticamente como completed.
Para testar o ranking, você pode adicionar algumas sessões completadas diretamente no repositório em memória ou implementar um endpoint de finalização.

🤝 Contribuindo
Crie uma branch a partir de main: git checkout -b feature/nova-funcionalidade

Mantenha a arquitetura limpa (novas funcionalidades devem ser implementadas como casos de uso)

Atualize este README se adicionar novos endpoints

Abra um Pull Request detalhando as mudanças

📄 Licença
Este projeto está sob a licença ISC. Consulte o arquivo LICENSE para mais informações.