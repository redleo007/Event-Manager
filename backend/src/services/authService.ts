import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getSupabaseClient } from '../utils/supabase';
import { AuthClaims, UserRole, UserStatus } from '../middleware/auth';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  approved_at?: string | null;
  approved_by?: string | null;
}

export type PublicUser = Omit<User, 'password_hash'>;

const USERS_TABLE = 'users';
const PASSWORD_ROUNDS = 12;

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Add it to your environment configuration.');
  }
  return secret;
};

const toPublicUser = (user: User): PublicUser => {
  const { password_hash, ...rest } = user;
  return rest;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, PASSWORD_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (user: User): string => {
  const payload: AuthClaims = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    approved_at: user.approved_at,
    approved_by: user.approved_by,
  };

  return jwt.sign(payload, getJwtSecret(), { expiresIn: '12h' });
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select('*')
    .eq('email', normalizeEmail(email))
    .single();

  if (error) {
    const isNoRows = error.code === 'PGRST116' || error.message?.toLowerCase().includes('no rows');
    if (!isNoRows) {
      throw new Error(`Failed to lookup user: ${error.message}`);
    }
    return null;
  }

  return (data as User) || null;
};

export const createUser = async (input: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}): Promise<User> => {
  const supabase = getSupabaseClient();
  const email = normalizeEmail(input.email);
  const role: UserRole = input.role === 'admin' ? 'admin' : 'user';
  const status: UserStatus = role === 'admin' ? 'pending' : 'approved';

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error('A user with this email already exists');
  }

  const password_hash = await hashPassword(input.password);

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .insert([
      {
        name: input.name.trim(),
        email,
        password_hash,
        role,
        status,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return data as User;
};

export const verifyCredentials = async (email: string, password: string): Promise<User> => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  return user;
};

export const getUserById = async (id: string): Promise<User | null> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    const isNoRows = error.code === 'PGRST116' || error.message?.toLowerCase().includes('no rows');
    if (!isNoRows) {
      throw new Error(`Failed to load user: ${error.message}`);
    }
    return null;
  }

  return (data as User) || null;
};

export const approveAdmin = async (userId: string, approverId: string): Promise<User> => {
  const supabase = getSupabaseClient();
  const pendingUser = await getUserById(userId);

  if (!pendingUser) {
    throw new Error('User not found');
  }

  if (pendingUser.role !== 'admin') {
    throw new Error('Only admin accounts require approval');
  }

  if (pendingUser.status === 'approved') {
    return pendingUser;
  }

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: approverId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to approve admin: ${error.message}`);
  }

  return data as User;
};

export const listPendingAdmins = async (): Promise<PublicUser[]> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select('*')
    .eq('role', 'admin')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to load pending admins: ${error.message}`);
  }

  const users = (data as User[]) || [];
  return users.map(toPublicUser);
};

export const toSafeUser = (user: User): PublicUser => toPublicUser(user);