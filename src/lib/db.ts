import sql from 'mssql';

let pool: sql.ConnectionPool | null = null;

export async function getConnection() {
  if (pool && pool.connected) {
    return pool;
  }

  const missingVars = [];
  if (!process.env.DB_SERVER) missingVars.push('DB_SERVER');
  if (!process.env.DB_USER) missingVars.push('DB_USER');
  if (!process.env.DB_PASSWORD) missingVars.push('DB_PASSWORD');
  if (!process.env.DB_DATABASE) missingVars.push('DB_DATABASE');

  if (missingVars.length > 0) {
    const errorMsg = `DATABASE CONFIGURATION ERROR: Missing variables: ${missingVars.join(', ')}. Ensure these are set in your environment or App Hosting secrets.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const config: sql.config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || '',
    database: process.env.DB_DATABASE,
    options: {
      encrypt: true,
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
      connectTimeout: 30000,
    },
  };

  try {
    console.log(`Attempting to connect to database server: ${config.server}`);
    pool = await new sql.ConnectionPool(config).connect();
    
    pool.on('error', err => {
        console.error('SQL Pool Error:', err);
        pool = null;
    });

    return pool;
  } catch (err: any) {
    console.error('DATABASE CONNECTION FAILED:', err.message);
    pool = null; 
    throw new Error(`Could not connect to the database. Connection string might be incorrect or firewall is blocking the request. Original error: ${err.message}`);
  }
}

export { sql };
