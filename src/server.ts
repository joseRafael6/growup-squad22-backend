// =============================================================================
// server.ts
// -----------------------------------------------------------------------------
// RESPONSABILIDADE: Ponto de entrada da aplicação.
//
// Este arquivo é o único responsável por iniciar o servidor HTTP.
// Ele importa a instância configurada do Fastify (app.ts) e manda ouvir
// na porta definida.
//
// Por que separar do app.ts?
// Manter o servidor separado da configuração do app permite que os testes
// importem o `app` diretamente, sem precisar subir um servidor de verdade.
// =============================================================================

import { app } from "./app";

// Inicia o servidor na porta definida na variável de ambiente PORT,
// ou 3333 como fallback caso ela não esteja definida.
//
// host "0.0.0.0" faz o servidor aceitar conexões de qualquer interface
// de rede — essencial para funcionar dentro de containers Docker.
app
  .listen({ port: Number(process.env.PORT) || 3333, host: "0.0.0.0" })
  .then(() => {
    console.log(`🚀 Server running on port ${process.env.PORT || 3333}`);
  });
