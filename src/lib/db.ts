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
    const errorMsg = `DATABASE CONFIGURATION ERROR: Missing variables: ${missingVars.join(', ')}.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const server = process.env.DB_SERVER || '';
  // Enhanced IP detection
  const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(server) || server === 'localhost' || server === '127.0.0.1';

  const config: sql.config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: server,
    database: process.env.DB_DATABASE,
    options: {
      // Direct IP connections usually don't support TLS ServerName validation
      encrypt: isIP ? false : true, 
      trustServerCertificate: true,
      connectTimeout: 30000,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };

  try {
    console.log(`Connecting to ${config.server} (Encrypt: ${config.options?.encrypt})`);
    pool = await new sql.ConnectionPool(config).connect();
    return pool;
  } catch (err: any) {
    console.error('DATABASE CONNECTION FAILED:', err.message);
    pool = null; 
    throw new Error(`Connection failed: ${err.message}`);
  }
}

export { sql };