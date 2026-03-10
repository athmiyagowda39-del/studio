import { sql, getConnection } from '@/lib/db';
import type { AppUser } from '@/context/app-context';
import crypto from 'crypto';
import { addErrorLog } from './audit';
import { sendEmail } from '@/lib/email';

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

    // Explicitly check for forcePasswordChange in updates (e.g. for reset)
    if (updates.forcePasswordChange !== undefined) {
        forceChange = updates.forcePasswordChange;
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

export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT id, username, email FROM Users WHERE email = @email');

    if (result.recordset.length === 0) {
      // Security: Don't reveal if email exists or not
      return { success: true, message: 'If an account exists with this email, a temporary password has been sent.' };
    }

    const user = result.recordset[0];
    const tempPassword = Math.random().toString(36).slice(-8).toUpperCase(); 
    
    // Update password and force change on next login
    await updateUser(user.id, { 
      password: tempPassword,
      forcePasswordChange: true 
    });

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background-color: #2563eb; color: #ffffff; width: 48px; height: 48px; line-height: 48px; border-radius: 10px; font-weight: bold; font-size: 20px;">PW</div>
          <h2 style="color: #111827; margin-top: 16px;">Password Reset Request</h2>
        </div>
        <p style="color: #374151; font-size: 16px;">Hello <b>${user.username}</b>,</p>
        <p style="color: #374151; font-size: 16px; line-height: 1.5;">We received a request to reset your password for the <b>PeopleWorks Sales Lead Tracker</b>. Below is your temporary password:</p>
        <div style="background: #f9fafb; border: 2px dashed #d1d5db; padding: 20px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #2563eb; margin: 24px 0;">
          ${tempPassword}
        </div>
        <p style="color: #374151; font-size: 16px; line-height: 1.5;"><b>Action Required:</b> Please log in using this temporary password. You will be prompted to create a new, secure password immediately after logging in.</p>
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">If you did not request this, please contact your administrator immediately.</p>
          <p style="font-size: 14px; color: #6b7280;">PeopleWorks Sales CRM Team</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Temporary Password - PeopleWorks Sales Lead Tracker',
      html: emailHtml,
    });

    return { success: true, message: 'A temporary password has been sent to your email.' };
  } catch (error) {
    await addErrorLog('requestPasswordReset', error, `Email: ${email}`);
    console.error('Password reset request failed:', error);
    throw new Error('An error occurred while processing your password reset request.');
  }
}
