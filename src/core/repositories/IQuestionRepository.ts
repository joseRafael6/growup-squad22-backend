import { Question } from '../entities/Question';

export interface CreateQuestionDTO {
  text: string;
  weight: number;
  timeLimitSeconds: number;
  quizId: string;
  source?: string;
  category?: string;
  companyId?: string;
  alternatives: { text: string; isCorrect: boolean }[];
}

export interface QuestionFilters {
  // Para banco global: filtra por categoria
  category?: string;
  // Limita quantidade de perguntas retornadas
  limit?: number;
  // IDs específicos de perguntas (para quiz da empresa)
  questionIds?: string[];
}

export interface IQuestionRepository {
  findByQuizId(quizId: string): Promise<Question[]>;
  // Busca perguntas do banco global com filtros opcionais
  findGlobal(filters?: QuestionFilters): Promise<Question[]>;
  // Busca perguntas de uma empresa específica
  findByCompany(companyId: string): Promise<Question[]>;
  // Busca perguntas por IDs (para quiz personalizado)
  findByIds(ids: string[]): Promise<Question[]>;
  findAll(): Promise<Question[]>;
  create(data: CreateQuestionDTO): Promise<Question>;
  delete(id: string): Promise<void>;
}
