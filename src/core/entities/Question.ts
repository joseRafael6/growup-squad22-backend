export interface Alternative {
  id: string; // Identificador único da alternativa
  text: string; // Texto que aparece pro usuário  
  isCorrect: boolean; // SÓ O BACKEND SABE se é correta
}

export interface Question {
  id: string;                   // ID da pergunta
  text: string;                 // Enunciado da pergunta
  weight: number;               // Peso: questão difícil vale mais pontos
  timeLimitSeconds: number;     // Tempo máximo pra resposta rápida
  alternatives: Alternative[];  // Array de alternativas
}