import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import {
  User,
  UserPublic,
  UsersDb,
  RegisterRequest,
  LoginRequest,
  UpdateUserRequest,
  AuthResponse,
} from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'mybasket-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';
const SALT_ROUNDS = 10;

// Simple JSON file database
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'users.json');

function readDb(): UsersDb {
  try {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    }
  } catch { /* ignore parse errors */ }
  return { users: [] };
}

function writeDb(data: UsersDb): void {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

export class UserService {
  private toPublicUser(user: User): UserPublic {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const db = readDb();

    const existingUser = db.users.find(
      (u) => u.username === data.username || u.email === data.email
    );
    if (existingUser) {
      if (existingUser.username === data.username) {
        throw new Error('Username already exists');
      }
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    const now = new Date().toISOString();

    const user: User = {
      id: uuidv4(),
      username: data.username,
      password: hashedPassword,
      name: data.name,
      email: data.email,
      createdAt: now,
      updatedAt: now,
    };

    db.users.push(user);
    writeDb(db);

    const token = this.generateToken(user);
    return { user: this.toPublicUser(user), token };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const db = readDb();

    const user = db.users.find((u) => u.username === data.username);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid username or password');
    }

    const token = this.generateToken(user);
    return { user: this.toPublicUser(user), token };
  }

  getUser(userId: string): UserPublic | null {
    const db = readDb();
    const user = db.users.find((u) => u.id === userId);
    return user ? this.toPublicUser(user) : null;
  }

  async updateUser(userId: string, data: UpdateUserRequest): Promise<UserPublic | null> {
    const db = readDb();
    const userIndex = db.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) return null;

    const user = db.users[userIndex];

    if (data.name) user.name = data.name;
    if (data.email) {
      const emailTaken = db.users.find(
        (u) => u.email === data.email && u.id !== userId
      );
      if (emailTaken) throw new Error('Email already registered');
      user.email = data.email;
    }
    if (data.password) {
      user.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    }
    user.updatedAt = new Date().toISOString();

    db.users[userIndex] = user;
    writeDb(db);

    return this.toPublicUser(user);
  }

  deleteUser(userId: string): boolean {
    const db = readDb();
    const initialLength = db.users.length;
    db.users = db.users.filter((u) => u.id !== userId);
    if (db.users.length === initialLength) return false;
    writeDb(db);
    return true;
  }

  static verifyToken(token: string): { userId: string; username: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        username: string;
      };
      return decoded;
    } catch {
      return null;
    }
  }
}
