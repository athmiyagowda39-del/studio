
'use server';

import { sql, getConnection } from '@/lib/db';
import type { AppUser } from '@/context/app-context';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function getUsers(): Promise<AppUser[]> {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT id, username, email, role, password, phoneNumber, employeeId, forcePasswordChange FROM Users');
    return result.recordset.map(user => ({
      ...user,
      forcePasswordChange: !!user.forcePasswordChange
    }));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return []; // Return empty array on error
  }
}

export async function loginUser(email: string, password: string): Promise<AppUser | null> {
  try {
    const pool = await getConnection();
    const hashedPassword = hashPassword(password);

    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, hashedPassword)
      .query('SELECT id, username, email, role, phoneNumber, employeeId, forcePasswordChange FROM Users WHERE email = @email AND password = @password');
    
    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      return { ...user, forcePasswordChange: !!user.forcePasswordChange };
    }
    return null;
  } catch (error) {
    console.error('Login failed:', error);
    throw new Error('A database error occurred during login.');
  }
}

export async function addUser(userData: Omit<AppUser, 'id' | 'password' | 'forcePasswordChange'>): Promise<AppUser> {
  try {
    const pool = await getConnection();
    const newId = `user-${Date.now()}`;
    const defaultPassword = 'Passw0rd';
    const hashedPassword = hashPassword(defaultPassword);

    await pool.request()
      .input('id', sql.NVarChar, newId)
      .input('username', sql.NVarChar, userData.username)
      .input('email', sql.NVarChar, userData.email)
      .input('role', sql.NVarChar, userData.role)
      .input('password', sql.NVarChar, hashedPassword)
      .input('phoneNumber', sql.NVarChar, userData.phoneNumber || null)
      .input('employeeId', sql.NVarChar, userData.employeeId || null)
      .input('forcePasswordChange', sql.Bit, true)
      .query('INSERT INTO Users (id, username, email, role, password, phoneNumber, employeeId, forcePasswordChange) VALUES (@id, @username, @email, @role, @password, @phoneNumber, @employeeId, @forcePasswordChange)');
    
    revalidatePath('/users');
    return { ...userData, id: newId, forcePasswordChange: true };
  } catch (error: any) {
    console.error('Failed to add user:', error);
    if (error.number === 2627) { // Unique constraint violation
      throw new Error('A user with this email, username, or employee ID already exists.');
    }
    throw new Error('Failed to add user due to a database error.');
  }
}

export async function updateUser(id: string, updates: Partial<Omit<AppUser, 'id'>>): Promise<AppUser> {
  const { username, email, role, password, phoneNumber, employeeId } = updates;
  
  const setClauses: string[] = [];
  if (username !== undefined) setClauses.push('username = @username');
  if (email !== undefined) setClauses.push('email = @email');
  if (role !== undefined) setClauses.push('role = @role');
  if (phoneNumber !== undefined) setClauses.push('phoneNumber = @phoneNumber');
  if (employeeId !== undefined) setClauses.push('employeeId = @employeeId');
  if (password !== undefined) {
    setClauses.push('password = @password');
    setClauses.push('forcePasswordChange = @forcePasswordChange');
  }

  if (setClauses.length === 0) {
    throw new Error('No updates provided.');
  }
  
  const queryString = `UPDATE Users SET ${setClauses.join(', ')} OUTPUT inserted.* WHERE id = @id`;

  try {
    const pool = await getConnection();
    const request = pool.request().input('id', sql.NVarChar, id);
    if (username !== undefined) request.input('username', sql.NVarChar, username);
    if (email !== undefined) request.input('email', sql.NVarChar, email);
    if (role !== undefined) request.input('role', sql.NVarChar, role);
    if (phoneNumber !== undefined) request.input('phoneNumber', sql.NVarChar, phoneNumber);
    if (employeeId !== undefined) request.input('employeeId', sql.NVarChar, employeeId);
    
    if (password !== undefined) {
      request.input('password', sql.NVarChar, hashPassword(password));
      request.input('forcePasswordChange', sql.Bit, false);
    }
    
    const result = await request.query(queryString);
    
    revalidatePath('/users');
    revalidatePath('/profile');

    const updatedUser = result.recordset[0];
    return { ...updatedUser, forcePasswordChange: !!updatedUser.forcePasswordChange };
  } catch (error) {
    console.error('Failed to update user:', error);
    throw new Error('Failed to update user due to a database error.');
  }
}

export async function deleteUser(id: string): Promise<{ success: boolean }> {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM Users WHERE id = @id');
    revalidatePath('/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw new Error('Failed to delete user due to a database error.');
  }
}
