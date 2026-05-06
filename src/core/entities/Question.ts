export interface Alternative {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  weight: number;
  timeLimitSeconds: number;
  alternatives: Alternative[];
}