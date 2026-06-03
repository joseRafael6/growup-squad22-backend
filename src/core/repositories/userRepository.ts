export interface User {
  id: string;
  email: string;
  name?: string;
  clerkId?: string;
  companyName?: string;
  sector?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findByClerkId(clerkId: string): Promise<User | null>;
  update(id: string, data: {
    email?: string;
    name?: string;
    clerkId?: string;
    companyName?: string;
    sector?: string;
  }): Promise<User>;
  create(data: {
    email: string;
    name?: string;
    clerkId: string;
    companyName?: string;
    sector?: string;
  }): Promise<User>;
}
