export interface User {
  id: string;
  email: string;
  name?: string;
  clerkId?: string;  // ✅ Adicionar clerkId
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findByClerkId(clerkId: string): Promise<User | null>;  // ✅ Adicionar
  update(id: string, data: { email?: string; name?: string; clerkId?: string }): Promise<User>;  // ✅ Adicionar
  create(data: { email: string; name?: string; clerkId: string }): Promise<User>;  // ✅ Adicionar clerkId
}