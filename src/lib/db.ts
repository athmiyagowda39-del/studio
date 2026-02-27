import sql from 'mssql';

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || '',
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true, // Always true for hosted SQL (Azure, AWS, Google Cloud SQL)
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    connectTimeout: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getConnection() {
  if (pool && pool.connected) {
    return pool;
  }

  // Debugging check for environment variables
  const missingVars = [];
  if (!process.env.DB_SERVER) missingVars.push('DB_SERVER');
  if (!process.env.DB_USER) missingVars.push('DB_USER');
  if (!process.env.DB_PASSWORD) missingVars.push('DB_PASSWORD');
  if (!process.env.DB_DATABASE) missingVars.push('DB_DATABASE');

  if (missingVars.length > 0) {
    console.error(`DATABASE CONFIGURATION ERROR: Missing variables: ${missingVars.join(', ')}`);
    throw new Error(`Database configuration incomplete. Missing: ${missingVars.join(', ')}`);
  }

  try {
    console.log(`Attempting to connect to database: ${config.server}`);
    pool = await new sql.ConnectionPool(config).connect();
    
    pool.on('error', err => {
        console.error('SQL Pool Error:', err);
        pool = null;
    });

    return pool;
  } catch (err: any) {
    console.error('DATABASE CONNECTION FAILED:', err.message);
    pool = null; 
    throw new Error(`Could not connect to the database: ${err.message}`);
  }
}

export { sql };
