import { sql, getConnection } from '@/lib/db';
import type { AppUser } from '@/context/app-context';
import crypto from 'crypto';
import { addErrorLog } from './audit';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex').toUpperCase();
}

export async function getUsers(): Promise<AppUser[]> {
  try {
    const pool = await getConnection();
    const result = await pool.request().execute('usp_GetUsers');
    const users = result.recordset.map(user => ({
      ...user,
      forcePasswordChange: !!user.forcePasswordChange
    }));
    return users;
  } catch (error) {
    await addErrorLog('getUsers', error);
    console.error('Failed to fetch users:', error);
    throw error;
  }
}

export async function loginUser(email: string, password: string): Promise<AppUser | null> {
  try {
    const pool = await getConnection();
    const hashedPassword = hashPassword(password);

    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, hashedPassword)
      .execute('usp_LoginUser');
    
    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      return { ...user, forcePasswordChange: !!user.forcePasswordChange };
    }
    return null;
  } catch (error) {
    await addErrorLog('loginUser', error, `Email: ${email}`);
    console.error('Login failed with database error:', error);
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
      .execute('usp_AddUser');
    
    const newUser = { ...userData, id: newId, forcePasswordChange: true };
    return newUser;
  } catch (error: any) {
    await addErrorLog('addUser', error, JSON.stringify(userData));
    console.error('Failed to add user:', error);
    if (error.number === 2627) { // Unique constraint violation
      throw new Error('A user with this email, username, or employee ID already exists.');
    }
    throw new Error('Failed to add user due to a database error.');
  }
}

export async function updateUser(id: string, updates: Partial<Omit<AppUser, 'id'>>): Promise<AppUser> {
  try {
    const pool = await getConnection();

    // Fetch the current user data to merge with updates
    const userResult = await pool.request()
        .input('id', sql.NVarChar, id)
        .execute('usp_GetUserById');

    if (userResult.recordset.length === 0) {
        throw new Error('User to update not found.');
    }
    const currentUser = userResult.recordset[0];

    // Merge updates with current data
    const mergedUser = { ...currentUser, ...updates };

    let passwordToUpdate = currentUser.password;
    let forceChange = currentUser.forcePasswordChange;

    // If a new password is provided, hash it and update the forcePasswordChange flag
    if (updates.password) {
        passwordToUpdate = hashPassword(updates.password);
        forceChange = false;
    }

    // Call the update stored procedure with the full user object
    const result = await pool.request()
        .input('id', sql.NVarChar, id)
        .input('username', sql.NVarChar, mergedUser.username)
        .input('email', sql.NVarChar, mergedUser.email)
        .input('role', sql.NVarChar, mergedUser.role)
        .input('password', sql.NVarChar, passwordToUpdate)
        .input('phoneNumber', sql.NVarChar, mergedUser.phoneNumber || null)
        .input('employeeId', sql.NVarChar, mergedUser.employeeId || null)
        .input('forcePasswordChange', sql.Bit, forceChange)
        .execute('usp_UpdateUser');

    const updatedUser = result.recordset[0];
    return { ...updatedUser, forcePasswordChange: !!updatedUser.forcePasswordChange };

  } catch (error) {
    await addErrorLog('updateUser', error, `UserId: ${id}, Updates: ${JSON.stringify(updates)}`);
    console.error(`Failed to update user ${id}:`, error);
    throw new Error('Failed to update user due to a database error.');
  }
}

export async function deleteUser(id: string): Promise<{ success: boolean }> {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.NVarChar, id)
      .execute('usp_DeleteUser');
    return { success: true };
  } catch (error) {
    await addErrorLog('deleteUser', error, `UserId: ${id}`);
    console.error(`Failed to delete user ${id}:`, error);
    throw new Error('Failed to delete user due to a database error.');
  }
}
