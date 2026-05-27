// app.ts
// Mantido para compatibilidade, mas a aplicação principal usa main.ts.
// Este arquivo pode ser usado para testes unitários de rotas sem subir o servidor.

import Fastify from "fastify";
import { userRoutes } from "./infra/http/routes/user.routes";

export const app = Fastify({ logger: true });

app.register(userRoutes, { prefix: "/api" });
