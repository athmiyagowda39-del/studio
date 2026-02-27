
import sql from 'mssql';

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || '',
  database: process.env.DB_DATABASE,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true' || true, // Default to true for hosted environments (like Azure/AWS)
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    connectTimeout: 30000, // 30 seconds timeout
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getConnection() {
  // If pool exists and is connected, return it.
  if (pool && pool.connected) {
    return pool;
  }

  // Check for missing essential configuration
  if (!process.env.DB_SERVER || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_DATABASE) {
      console.error('DATABASE CONFIGURATION ERROR: Missing environment variables.');
      console.error('Ensure DB_SERVER, DB_USER, DB_PASSWORD, and DB_DATABASE are set in your hosting secrets/environment.');
      throw new Error('Database configuration is incomplete.');
  }

  try {
    console.log(`Attempting to connect to database server: ${config.server}`);
    pool = await new sql.ConnectionPool(config).connect();
    
    pool.on('error', err => {
        console.error('SQL Pool Error:', err);
        pool = null; // Reset pool on error to force reconnection on next call
    });

    console.log('Database connected successfully.');
    return pool;
  } catch (err: any) {
    console.error('DATABASE CONNECTION FAILED!');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    
    // Help identify firewall issues
    if (err.code === 'ETIMEOUT') {
        console.error('Connection timed out. This often means the database server is behind a firewall and your hosting IP needs to be whitelisted.');
    }

    pool = null; 
    throw new Error('Could not connect to the database. Check server logs for details.');
  }
}

export { sql };
