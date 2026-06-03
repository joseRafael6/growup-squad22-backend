export interface Company {
  id: string;
  name: string;
  topic?: string;
  questionSource: 'platform' | 'company' | 'both';
  inviteCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyAdmin {
  id: string;
  userId: string;
  companyId: string;
  createdAt: Date;
}
