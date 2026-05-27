import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

const DATA_DIR = join(process.cwd(), "data");
const USERS_FILE = join(DATA_DIR, "users.json");

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  // Optional fields for password reset flow
  resetTokenHash?: string;
  resetTokenExpiresAt?: string; // ISO string
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
}

function readUsers(): StoredUser[] {
  if (!existsSync(USERS_FILE)) {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(USERS_FILE, "[]");
    return [];
  }
  return JSON.parse(readFileSync(USERS_FILE, "utf-8")) as StoredUser[];
}

function writeUsers(users: StoredUser[]): void {
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function findUserByEmail(email: string): StoredUser | undefined {
  return readUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
}

export function findUserById(id: string): StoredUser | undefined {
  return readUsers().find((u) => u.id === id);
}

export function createUser(
  email: string,
  name: string,
  passwordHash: string
): StoredUser {
  const users = readUsers();
  const user: StoredUser = {
    id: randomUUID(),
    email: email.toLowerCase().trim(),
    name: name.trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
    // reset fields start undefined
  };
  users.push(user);
  writeUsers(users);
  return user;
}

/**
 * Updates a user record with new data. Used for password reset updates.
 */
export function updateUser(updated: StoredUser): void {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === updated.id);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updated };
    writeUsers(users);
  }
}

export function toPublicUser(user: StoredUser): PublicUser {
  return { id: user.id, email: user.email, name: user.name };
}
