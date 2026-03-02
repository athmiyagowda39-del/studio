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

  // Detect if server is an IP address to handle tedious TLS restrictions
  const server = process.env.DB_SERVER || '';
  const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(server);

  const config: sql.config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: server,
    database: process.env.DB_DATABASE,
    options: {
      // Disable encryption for direct IP connections to avoid TLS ServerName restriction
      // Enable it for hostnames (standard for Azure/Cloud)
      encrypt: isIP ? false : (process.env.DB_ENCRYPT !== 'false'),
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
    console.log(`Attempting to connect to database server: ${config.server} (Encrypt: ${config.options?.encrypt})`);
    pool = await new sql.ConnectionPool(config).connect();
    
    pool.on('error', err => {
        console.error('SQL Pool Error:', err);
        pool = null;
    });

    return pool;
  } catch (err: any) {
    console.error('DATABASE CONNECTION FAILED:', err.message);
    pool = null; 
    throw new Error(`Could not connect to the database. Ensure DB_SERVER, DB_USER, DB_PASSWORD, and DB_DATABASE are correct and firewall is open. Original error: ${err.message}`);
  }
}

export { sql };
