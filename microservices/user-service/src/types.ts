export interface User {
  id: string;
  username: string;
  password: string; // hashed
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPublic {
  id: string;
  username: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  name: string;
  email: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
}

export interface AuthResponse {
  user: UserPublic;
  token: string;
}

export interface UsersDb {
  users: User[];
}
