'use server';

import sql from 'mssql';

const connectionString = process.env.DATABASE_URL;

let pool: sql.ConnectionPool | null = null;

async function getConnection() {
  if (pool) {
    return pool;
  }
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set.');
    throw new Error('Database connection string is missing.');
  }

  try {
    pool = await new sql.ConnectionPool(connectionString).connect();
    console.log('Successfully connected to SQL Server.');
    
    pool.on('error', err => {
        console.error('SQL Pool Error', err);
        pool = null; // Reset pool on error
    });

    return pool;
  } catch (err) {
    console.error('Database Connection Failed!', err);
    pool = null;
    throw new Error('Could not connect to the database.');
  }
}

export { sql, getConnection };
